import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisHost = this.configService.getOrThrow<string>('REDIS_HOST');
    const redisPort = this.configService.getOrThrow<number>('REDIS_PORT');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redis = new Redis(redisPort, redisHost, {
      password: redisPassword,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis connection is ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('Reconnecting to Redis...');
    });
  }

  async setProcessedProposal(
    proposalId: number,
    issueNumber: number,
  ): Promise<void> {
    const key = `proposal:processed:${proposalId}`;
    const value = JSON.stringify({
      proposalId,
      issueNumber,
      processedAt: new Date().toISOString(),
    });

    try {
      await this.redis.set(key, value);
      this.logger.log(
        `Stored processed proposal ${proposalId} with issue #${issueNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Error storing processed proposal ${proposalId}:`,
        error,
      );
      throw error;
    }
  }

  async isProposalProcessed(proposalId: number): Promise<boolean> {
    const key = `proposal:processed:${proposalId}`;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Error checking if proposal ${proposalId} is processed:`,
        error,
      );
      return false; // Default to false to avoid skipping proposals
    }
  }

  async getProcessedProposal(proposalId: number): Promise<{
    proposalId: number;
    issueNumber: number;
    processedAt: string;
  } | null> {
    const key = `proposal:processed:${proposalId}`;

    try {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      this.logger.error(
        `Error getting processed proposal ${proposalId}:`,
        error,
      );
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
