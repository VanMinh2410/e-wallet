import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from './common/redis/redis.module';
import { MailerModule } from './common/mailer/mailer.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { BankModule } from './modules/bank/bank.module';
import { QueueModule } from './modules/queue/queue.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI')
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    RedisModule,
    MailerModule,
    QueueModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    NotificationsModule,
    AdminModule,
    BankModule,
  ],
  controllers: [HealthController],
  providers: [
    ...(process.env.NODE_ENV === 'production'
      ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
      : []),
  ],
})
export class AppModule { }
