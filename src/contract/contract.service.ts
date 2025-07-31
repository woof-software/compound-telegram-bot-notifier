import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

import { proposalContractAddress } from './constants';
import ProposalABI from './abi/ProposalABI.json';
import { ConfigService } from '@nestjs/config';
import { NetworkConfig } from 'config/networks.config';
import { TelegramService } from 'telegram/telegram.service';
import { GithubService } from 'github/github.service';
import { RedisService } from 'redis/redis.service';
import { HOUR_IN_MS } from 'common/constants';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  private proposalContract: any;
  private provider: ethers.JsonRpcProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly githubService: GithubService,
    private readonly redisService: RedisService,
  ) {
    const networks = this.configService.getOrThrow<NetworkConfig[]>('networks');
    const mainnetConfig = networks.find((i) => i.network === 'mainnet');

    if (!mainnetConfig) throw new Error('Mainnet configuration not found');

    this.provider = new ethers.JsonRpcProvider(mainnetConfig.url);

    this.proposalContract = new ethers.Contract(
      proposalContractAddress,
      ProposalABI,
      this.provider,
    );
  }

  async getLastProposalCount(): Promise<number> {
    try {
      const count = await this.proposalContract.proposalCount();
      return Number(count);
    } catch (error) {
      this.logger.error('Error getting last proposal count', error);
      throw error;
    }
  }

  private async getProposalDeadline(proposalId: number): Promise<number> {
    try {
      const deadline = await this.proposalContract.proposalDeadline(proposalId);
      return Number(deadline);
    } catch (error) {
      this.logger.error('Error getting proposal deadline', error);
      throw error;
    }
  }

  private async getProposalSnapshot(proposalId: number): Promise<number> {
    try {
      const snapshot = await this.proposalContract.proposalSnapshot(proposalId);
      return Number(snapshot);
    } catch (error) {
      this.logger.error('Error getting proposal snapshot', error);
      throw error;
    }
  }

  private async getProposalEta(proposalId: number): Promise<number> {
    try {
      const eta = await this.proposalContract.proposalEta(proposalId);
      return Number(eta);
    } catch (error) {
      this.logger.error('Error getting proposal ETA', error);
      throw error;
    }
  }

  private async getProposalState(proposalId: number): Promise<number> {
    try {
      const state = await this.proposalContract.state(proposalId);
      return Number(state);
    } catch (error) {
      this.logger.error('Error getting proposal state', error);
      throw error;
    }
  }

  private async getProposalVotes(
    proposalId: number,
  ): Promise<{ forVotes: number; againstVotes: number; abstainVotes: number }> {
    try {
      const votes = await this.proposalContract.proposalVotes(proposalId);
      return {
        forVotes: Number(ethers.formatEther(votes.forVotes)),
        againstVotes: Number(ethers.formatEther(votes.againstVotes)),
        abstainVotes: Number(ethers.formatEther(votes.abstainVotes)),
      };
    } catch (error) {
      this.logger.error('Error getting proposal votes', error);
      throw error;
    }
  }

  private async getQuorum(voteStart: number): Promise<number> {
    try {
      const quorum = await this.proposalContract.quorum(voteStart);
      return Number(ethers.formatEther(quorum));
    } catch (error) {
      this.logger.error('Error getting quorum', error);
      throw error;
    }
  }

  private async getVotingDelay(): Promise<number> {
    try {
      const votingDelay = await this.proposalContract.votingDelay();
      return Number(votingDelay);
    } catch (error) {
      this.logger.error('Error getting voting delay', error);
      throw error;
    }
  }

  private async getVotingPeriod(): Promise<number> {
    try {
      const votingPeriod = await this.proposalContract.votingPeriod();
      return Number(votingPeriod);
    } catch (error) {
      this.logger.error('Error getting voting period', error);
      throw error;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getTimestamp(blockNumber: number): Promise<number> {
    const block = await this.provider.getBlock(blockNumber);
    if (!block) {
      throw new Error(`Block not found for block number ${blockNumber}`);
    }
    return block.timestamp * 1000;
  }

  async checkProposal(proposalId: number): Promise<void> {
    try {
      this.logger.log(`Checking proposal ${proposalId}...`);

      const state = await this.getProposalState(proposalId);

      if (state === 1) {
        const snapshot = await this.getProposalSnapshot(proposalId);
        const votes = await this.getProposalVotes(proposalId);
        const quorum = await this.getQuorum(snapshot);
        const isVotesEnough = votes.forVotes >= quorum;
        const startVotingTimestamp = await this.getTimestamp(snapshot);
        const startVotingDate = new Date(startVotingTimestamp).getTime();
        const dateNow = new Date().getTime();
        if (dateNow - startVotingDate >= HOUR_IN_MS * 30 && !isVotesEnough) {
          await this.telegramService.sendProposalAlert(
            proposalId,
            votes,
            quorum,
          );
          this.logger.log(
            `Telegram notification sent for proposal ${proposalId}`,
          );
        }
      }

      if (state === 7) {
        const issueNumber = await this.githubService.createIssue(proposalId);
        await this.redisService.setProcessedProposal(proposalId, issueNumber);
        this.logger.log(
          `GitHub issue #${issueNumber} created for executed proposal ${proposalId}`,
        );
      }

      return;
    } catch (error) {
      return this.logger.error(`Error checking proposal ${proposalId}`, error);
    }
  }
}
