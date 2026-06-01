# 💾 Kỹ thuật: MongoDB Transaction

## Khi nào PHẢI dùng Transaction

- Ghi đồng thời vào ≥ 2 document
- Chuyển khoản (debit + credit)
- Nạp tiền (cập nhật balance + tạo record)
- Rút tiền (kiểm tra + cập nhật + tạo record)

## Yêu cầu hạ tầng

MongoDB PHẢI chạy với **Replica Set** (kể cả development):
```yaml
# docker-compose.yml
mongodb:
  image: mongo:7
  command: --replSet rs0
  
mongo-init:
  image: mongo:7
  command: mongosh --host mongodb --eval "rs.initiate()"
  restart: on-failure
```

## Pattern Chuẩn trong NestJS

```typescript
// wallets.service.ts
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class WalletsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async transfer(dto: TransferDto): Promise<TransactionDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();
    
    try {
      // 1. Lấy ví người gửi (trong session)
      const fromWallet = await this.walletModel
        .findById(dto.fromWalletId)
        .session(session);
      
      if (!fromWallet) throw new NotFoundException('Ví không tồn tại');
      if (fromWallet.balance < dto.amount) {
        throw new BadRequestException('Số dư không đủ');
      }
      
      // 2. Lấy ví người nhận (trong session)
      const toWallet = await this.walletModel
        .findById(dto.toWalletId)
        .session(session);
      
      if (!toWallet) throw new NotFoundException('Ví người nhận không tồn tại');
      
      // 3. Trừ tiền người gửi
      await this.walletModel.findByIdAndUpdate(
        dto.fromWalletId,
        { $inc: { balance: -dto.amount } },
        { session, new: true },
      );
      
      // 4. Cộng tiền người nhận
      await this.walletModel.findByIdAndUpdate(
        dto.toWalletId,
        { $inc: { balance: dto.amount } },
        { session },
      );
      
      // 5. Tạo transaction record
      const [transaction] = await this.transactionModel.create(
        [{
          fromWalletId: dto.fromWalletId,
          toWalletId: dto.toWalletId,
          amount: dto.amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          reference: dto.reference, // idempotency key
          description: dto.description,
        }],
        { session },
      );
      
      // 6. COMMIT transaction
      await session.commitTransaction();
      
      // 7. Emit socket event SAU KHI commit (không trong try block)
      // Xem: skills/technical/socket-io-realtime.md
      
      return transaction;
      
    } catch (error) {
      // Rollback toàn bộ thay đổi
      await session.abortTransaction();
      
      if (error instanceof HttpException) throw error;
      
      this.logger.error('Transfer failed:', error);
      throw new InternalServerErrorException('Giao dịch thất bại, vui lòng thử lại');
      
    } finally {
      // LUÔN đóng session dù thành công hay thất bại
      await session.endSession();
    }
  }
}
```

## Lỗi Thường gặp

### 1. Transaction trên non-replica-set
```
MongoServerError: Transaction numbers are only allowed on a replica member or mongos
```
**Giải pháp**: Khởi động MongoDB với `--replSet rs0` và init replica set.

### 2. Session timeout
```
MongoServerError: Transaction has been aborted
```
**Giải pháp**: Transaction timeout mặc định là 60s. Với long-running jobs, dùng BullMQ thay vì transaction.

### 3. WriteConflict
```
MongoServerError: Write conflict during plan execution
```
**Giải pháp**: Retry với exponential backoff:
```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.codeName === 'WriteConflict' && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}
```

## Testing Transaction

```typescript
// Dùng mongodb-memory-server với replica set
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  // Kết nối với URI của replSet
});

afterAll(async () => {
  await replSet.stop();
});
```
