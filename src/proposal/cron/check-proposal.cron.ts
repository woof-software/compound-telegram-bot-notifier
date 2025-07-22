import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckProposalService } from 'proposal/check-proposal.service';

@Injectable()
export class CheckProposalCron {
  private readonly logger = new Logger(CheckProposalCron.name);

  constructor(private readonly checkProposalService: CheckProposalService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkTask() {
    try {
      await this.checkProposalService.check();
      return;
    } catch (error) {
      this.logger.error('An error occurred while running check task:', error);
      return;
    }
  }
}
