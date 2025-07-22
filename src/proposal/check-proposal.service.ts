import { Injectable, Logger } from '@nestjs/common';
import { ContractService } from 'contract/contract.service';
import { RedisService } from 'redis/redis.service';

@Injectable()
export class CheckProposalService {
  private readonly logger = new Logger(CheckProposalService.name);

  constructor(
    private readonly contractService: ContractService,
    private readonly redisService: RedisService,
  ) {}

  async check() {
    this.logger.log('⏰ Starting proposal check...');
    try {
      const lastExecutedProposalId = 461;
      const lastProposalId = await this.contractService.getLastProposalCount();
      for (
        let proposalId = lastExecutedProposalId + 1;
        proposalId <= lastProposalId;
        proposalId++
      ) {
        const isProposalProcessed = await this.redisService.isProposalProcessed(
          proposalId,
        );
        if (isProposalProcessed) continue;
        await this.contractService.checkProposal(proposalId);
      }
      this.logger.log('Check proposals completed.');
      return;
    } catch (error) {
      this.logger.error('An error occurred while checking proposals:', error);
      return;
    }
  }
}
