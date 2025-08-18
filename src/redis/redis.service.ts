import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DAY_IN_MS, DAY_IN_SECONDS } from 'common/constants';
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

  private tgKey(chatId: string): string {
    return `tg:sent:${chatId}`;
  }

  async trackTelegramMessage(
    chatId: string,
    messageId: number,
    timestampMs = Date.now(),
    keyTtlSeconds = 14 * DAY_IN_SECONDS,
  ): Promise<void> {
    const key = this.tgKey(chatId);
    try {
      await this.redis.zadd(key, timestampMs, String(messageId));
      await this.redis.expire(key, keyTtlSeconds);
    } catch (error) {
      this.logger.error(
        `Error tracking message_id=${messageId} for chat=${chatId}:`,
        error,
      );
      throw error;
    }
  }

  async fetchOldTelegramMessageIds(
    chatId: string,
    olderThanMs = DAY_IN_MS,
    limit = 100,
  ): Promise<string[]> {
    const key = this.tgKey(chatId);
    const cutoffScore = Date.now() - olderThanMs;
    try {
      // ZRANGEBYSCORE key -inf cutoff LIMIT 0 limit
      const ids = await this.redis.zrangebyscore(
        key,
        0,
        cutoffScore,
        'LIMIT',
        0,
        limit,
      );
      return ids;
    } catch (error) {
      this.logger.error(
        `Error fetching old message ids for chat=${chatId}:`,
        error,
      );
      return [];
    }
  }

  async removeTelegramMessageIds(
    chatId: string,
    ids: string[],
  ): Promise<number> {
    if (!ids.length) return 0;
    const key = this.tgKey(chatId);
    try {
      const removed = await this.redis.zrem(key, ...ids);
      return removed;
    } catch (error) {
      this.logger.error(`Error removing ${ids.length} ids from ${key}:`, error);
      return 0;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
