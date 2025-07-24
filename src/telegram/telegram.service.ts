import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private chatId: string;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.getOrThrow<string>('TELEGRAM_CHAT_ID');
    this.bot = new TelegramBot(token);
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      this.logger.log('Message sent to Telegram successfully');
    } catch (error) {
      this.logger.error('Error sending message to Telegram:', error);
      throw error;
    }
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
⏰ <b>Status:</b> Active for more than 48 hours
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
