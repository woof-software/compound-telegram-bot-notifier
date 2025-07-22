import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { TelegramModule } from 'telegram/telegram.module';
import { GithubModule } from 'github/github.module';
import { RedisModule } from 'redis/redis.module';

@Module({
  imports: [TelegramModule, GithubModule, RedisModule],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
