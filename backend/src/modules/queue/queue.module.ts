import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          const isTls = redisUrl.startsWith('rediss://');
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parsed.port ? Number(parsed.port) : 6379,
              username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
              password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
              db: parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.substring(1)) : undefined,
              maxRetriesPerRequest: null,
              ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
            },
          };
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: Number(configService.get<number>('REDIS_PORT') || 6379),
            password: configService.get<string>('REDIS_PASSWORD') || undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'topup' }, { name: 'withdraw' }, { name: 'notification' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
