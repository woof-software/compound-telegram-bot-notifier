import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from 'app.controller';
import networksConfig from 'config/networks.config';

import { ContractModule } from 'contract/contract.module';
import { GithubModule } from 'github/github.module';
import { ProposalModule } from 'proposal/check-proposal.module';
import { RedisModule } from 'redis/redis.module';
import { TelegramModule } from 'telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [networksConfig],
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ContractModule,
    ProposalModule,
    TelegramModule,
    GithubModule,
    RedisModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
