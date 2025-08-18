import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { RedisModule } from 'redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
