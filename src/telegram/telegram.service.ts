import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DAY_IN_MS } from 'common/constants';
import TelegramBot from 'node-telegram-bot-api';
import { RedisService } from 'redis/redis.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private chatId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.getOrThrow<string>('TELEGRAM_CHAT_ID');
    this.bot = new TelegramBot(token);
  }

  async sendMessage(message: string): Promise<void> {
    try {
      const res = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      await this.redisService.trackTelegramMessage(this.chatId, res.message_id);
      this.logger.log('Message sent to Telegram successfully');
    } catch (error) {
      this.logger.error('Error sending message to Telegram:', error);
      throw error;
    }
  }

  async cleanupOlderThan24h(): Promise<void> {
    const ids = await this.redisService.fetchOldTelegramMessageIds(
      this.chatId,
      DAY_IN_MS,
    );
    if (!ids.length) return;

    const processedIds: string[] = [];
    for (const id of ids) {
      try {
        await this.bot.deleteMessage(this.chatId, Number(id));
        processedIds.push(id);
      } catch (e) {
        this.logger.warn(
          `Failed to delete message ${id}: ${
            e instanceof Error ? e.message : e
          }`,
        );
      }
    }
    await this.redisService.removeTelegramMessageIds(this.chatId, processedIds);
  }

  async sendProposalAlert(
    proposalId: number,
    votes: {
      forVotes: number;
      againstVotes: number;
      abstainVotes: number;
    },
    quorum: number,
  ): Promise<void> {
    const message = `
⚠️ <b>Proposal Notification</b> ⚠️

📋 <b>Proposal ID:</b> ${proposalId}
⏰ <b>Status:</b> Active for more than 30 hours
📊 <b>Voting Status:</b> Not enough votes

<b>Current Votes:</b>
✅ For: ${this.formatNumber(Math.floor(votes.forVotes))}
❌ Against: ${this.formatNumber(Math.ceil(votes.againstVotes))}
⚪ Abstain: ${this.formatNumber(Math.ceil(votes.abstainVotes))}

<b>Required Quorum:</b> ${this.formatNumber(quorum)}
<b>Missing:</b> ${this.formatNumber(
      Math.ceil(Math.max(0, quorum - votes.forVotes)),
    )} votes

🔗 <a href="https://www.tally.xyz/gov/compound/proposal/${proposalId}">View Proposal</a>
    `.trim();

    await this.sendMessage(message);
  }

  private formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }
}
