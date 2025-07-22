import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.getOrThrow<string>('GITHUB_TOKEN');
    this.owner = this.configService.getOrThrow<string>('GITHUB_OWNER');
    this.repo = this.configService.getOrThrow<string>('GITHUB_REPO');

    this.octokit = new Octokit({
      auth: token,
    });
  }

  async createIssue(proposalId: number): Promise<number> {
    try {
      const title = `Proposal ${proposalId} Executed`;
      const body = `
## Proposal ${proposalId} has been executed

This issue was automatically created to track the execution of proposal ${proposalId}.

### Details
- **Proposal ID:** ${proposalId}
- **Status:** Executed

### Links
- [View Proposal](https://www.tally.xyz/gov/compound/proposal/${proposalId})

---
*This issue was created automatically by the proposal monitoring bot.*
      `.trim();

      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        labels: ['proposal', 'executed', 'automated'],
      });

      this.logger.log(
        `GitHub issue created: #${response.data.number} for proposal ${proposalId}`,
      );
      return response.data.number;
    } catch (error) {
      this.logger.error(
        `Error creating GitHub issue for proposal ${proposalId}:`,
        error,
      );
      throw error;
    }
  }
}
