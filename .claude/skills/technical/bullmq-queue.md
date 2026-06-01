# 📋 Kỹ thuật: BullMQ Queue

## Khi nào dùng BullMQ

- Nạp tiền qua cổng thanh toán (cần chờ callback)
- Rút tiền (cần verify + xử lý async)
- Gửi email/SMS thông báo
- Webhook retry (khi cổng thanh toán gọi lại)
- Long-running tasks (export report, reconciliation)

## Setup

```typescript
// queue/queue.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'topup',
      defaultJobOptions: {
        attempts: 3,               // Retry tối đa 3 lần
        backoff: {
          type: 'exponential',
          delay: 1000,             // 1s, 2s, 4s
        },
        removeOnComplete: 100,     // Giữ 100 job đã hoàn thành
        removeOnFail: 50,          // Giữ 50 job thất bại
      },
    }),
    BullModule.registerQueue({ name: 'withdraw' }),
    BullModule.registerQueue({ name: 'notification' }),
  ],
})
export class QueueModule {}
```

## Producer – Đẩy Job vào Queue

```typescript
// topup.service.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TopupService {
  constructor(
    @InjectQueue('topup') private readonly topupQueue: Queue,
  ) {}

  async initiateTopup(dto: TopupDto) {
    // 1. Tạo transaction PENDING trước
    const transaction = await this.transactionModel.create({
      walletId: dto.walletId,
      amount: dto.amount,
      type: 'TOPUP',
      status: 'PENDING',
      reference: dto.reference,
    });

    // 2. Đẩy job vào queue
    await this.topupQueue.add(
      'process-topup',
      {
        transactionId: transaction._id.toString(),
        walletId: dto.walletId,
        amount: dto.amount,
        paymentGatewayRef: dto.gatewayRef,
      },
      {
        jobId: dto.reference, // Idempotency – cùng reference → cùng job
        delay: 0,
      },
    );

    return transaction;
  }
}
```

## Consumer – Xử lý Job

```typescript
// processors/topup.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('topup')
export class TopupProcessor extends WorkerHost {
  private readonly logger = new Logger(TopupProcessor.name);

  async process(job: Job<TopupJobData>) {
    const { transactionId, walletId, amount } = job.data;
    
    this.logger.log(`Processing topup job: ${job.id}, txId: ${transactionId}`);
    
    const session = await this.connection.startSession();
    session.startTransaction();
    
    try {
      // 1. Verify payment với cổng thanh toán
      const isVerified = await this.paymentGateway.verify(job.data.paymentGatewayRef);
      if (!isVerified) {
        throw new Error('Payment verification failed');
      }
      
      // 2. Cập nhật balance trong transaction
      await this.walletModel.findByIdAndUpdate(
        walletId,
        { $inc: { balance: amount } },
        { session },
      );
      
      // 3. Cập nhật transaction status
      await this.transactionModel.findByIdAndUpdate(
        transactionId,
        { status: 'COMPLETED', completedAt: new Date() },
        { session },
      );
      
      await session.commitTransaction();
      
      // 4. Emit socket sau commit
      this.notificationGateway.emitToUser(job.data.userId, 'transaction_completed', {
        transactionId,
        type: 'CREDIT',
        amount,
      });
      
      this.logger.log(`Topup completed: ${transactionId}`);
      
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Topup failed: ${transactionId}`, error);
      
      // Cập nhật transaction status thất bại
      await this.transactionModel.findByIdAndUpdate(transactionId, {
        status: 'FAILED',
      });
      
      // Throw để BullMQ retry
      throw error;
      
    } finally {
      await session.endSession();
    }
  }
}
```

## Monitoring Queue

```typescript
// Xem queue stats
const waiting = await this.topupQueue.getWaiting();
const active = await this.topupQueue.getActive();
const failed = await this.topupQueue.getFailed();

// Alert khi queue lớn
if (waiting.length > 100) {
  this.logger.warn(`Topup queue backlog: ${waiting.length} jobs`);
}
```

## Dashboard (Bull Board)

```typescript
// main.ts – thêm Bull Board UI
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(topupQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```
