import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    BullModule.registerQueue({ name: 'topup' }, { name: 'withdraw' }, { name: 'notification' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
