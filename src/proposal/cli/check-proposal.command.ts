import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { CheckProposalService } from 'proposal/check-proposal.service';

@Command({ name: 'proposal:check', description: 'Check proposal status' })
export class CheckProposalCommand extends CommandRunner {
  private readonly logger = new Logger(CheckProposalCommand.name);

  constructor(private readonly checkProposalService: CheckProposalService) {
    super();
  }

  async run() {
    try {
      return this.checkProposalService.check();
    } catch (error) {
      this.logger.error(
        'An error occurred while running checkProposal command:',
        error,
      );
      return;
    }
  }
}
