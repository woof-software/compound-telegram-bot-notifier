import { Module } from '@nestjs/common';
import { ContractModule } from 'contract/contract.module';
import { CheckProposalCommand } from './cli/check-proposal.command';
import { CheckProposalCron } from './cron/check-proposal.cron';
import { CheckProposalService } from './check-proposal.service';
import { RedisModule } from 'redis/redis.module';

@Module({
  imports: [ContractModule, RedisModule],
  providers: [CheckProposalCommand, CheckProposalCron, CheckProposalService],
  exports: [CheckProposalService],
})
export class ProposalModule {}
