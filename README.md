🤖 Compound Telegram Bot Notifier
An automated bot for monitoring Compound proposals and sending notifications to Telegram groups with automatic GitHub issue creation.
📋 Description
The bot monitors the state of proposals in the Compound smart contract and performs the following actions:

🔔 Sends Telegram notifications when a proposal is active for more than 30 hours and hasn't reached the required quorum
📝 Creates GitHub issues for executed proposals (state === 7)
🗄️ Uses Redis to prevent duplicate notifications and issues
⏰ Runs on schedule (every 6 hours) or on-demand via CLI

🛠️ Tech Stack

NestJS - Main framework
ethers.js - Blockchain interaction
node-telegram-bot-api - Telegram integration
@octokit/rest - GitHub API
ioredis - Redis client
nest-commander - CLI commands
@nestjs/schedule - Cron jobs

🚀 Installation
Prerequisites

Node.js 18+
Redis server
Telegram bot token
GitHub personal access token

Clone and Install
bashgit clone <repository-url>
cd compound-telegram-bot-notifier
npm install
⚙️ Configuration
Create a .env file in the root directory:
env# Blockchain Network (Ankr RPC Provider)
ANKR_KEY=your_ankr_api_key_here

# Telegram Configuration

TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=-1001234567890

# GitHub Configuration

GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repository_name

# Redis Configuration

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_needed

# Proposal Monitoring

LAST_EXECUTED_PROPOSAL_ID=462
Getting Configuration Values
🔗 Ankr API Key

Go to Ankr.com
Sign up for a free account
Navigate to API & RPC → Create API Key
Select Ethereum Mainnet endpoint
Copy your API key

🤖 Telegram Bot Token & Chat ID

Create Bot:

Message @BotFather
Send /newbot and follow instructions
Copy the bot token

Get Chat ID:

Add bot to your group
Send any message in the group
Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
Find "chat":{"id": -1001234567890} in the response

🐙 GitHub Token

Go to GitHub → Settings → Developer settings → Personal access tokens
Click "Generate new token (classic)"
Select scopes: repo, write:discussion, notifications, user
Copy the token (starts with ghp\_)

📁 GitHub Owner & Repo

GITHUB_OWNER: Your GitHub username or organization name
GITHUB_REPO: Repository name where issues will be created

Example: For https://github.com/john_doe/proposal-tracker

GITHUB_OWNER=john_doe
GITHUB_REPO=proposal-tracker

📊 Last Executed Proposal ID

LAST_EXECUTED_PROPOSAL_ID: The ID of the last proposal that was already processed
Bot will start checking from LAST_EXECUTED_PROPOSAL_ID + 1
Example: If set to 462, bot will check proposals starting from 463
Update this value periodically to avoid re-processing old proposals

🏃‍♂️ Running the Application
Development Mode
bash# Start the application
npm run start

# Start with file watching

npm run start:dev
Production Mode
bash# Build the application
npm run build

# Start production server

npm run start:prod
CLI Commands
bash# Run proposal check manually
npm run cli:check

# Or after building

npm run build
node dist/src/cli.js proposal:check
📊 Features
Automated Monitoring
The bot automatically runs every 6 hours and checks:

Active Proposals (state === 1):

Calculates if proposal is active for 30+ hours
Checks if quorum is reached
Sends Telegram alert if votes are insufficient
Prevents duplicate notifications via Redis

Executed Proposals (state === 7):

Creates structured GitHub issues
Stores issue information in Redis
Prevents duplicate issue creation

Telegram Notifications
Example notification format:
🚨 Proposal Alert 🚨

📋 Proposal ID: 123
⏰ Status: Active for more than 30 hours
📊 Voting Status: Not enough votes

Current Votes:
✅ For: 450,000
❌ Against: 50,000
⚪ Abstain: 10,000

Required Quorum: 500,000
Missing: 50,000 votes

🔗 View Proposal
GitHub Issues
Automatically created issues include:

Proposal ID and execution details
Links to proposal
Structured template with checkboxes
Labels: proposal, executed, automated

🗂️ Project Structure
src/
├── contract/ # Smart contract interaction
│ ├── contract.module.ts  
│ └── contract.service.ts
├── github/ # GitHub API integration
│ ├── github.module.ts
│ └── github.service.ts
├── proposal/ # Proposal checking logic
│ ├── check-proposal.module.ts
│ └── check-proposal.service.ts
├── redis/ # Redis operations
│ ├── redis.module.ts
│ └── redis.service.ts
├── telegram/ # Telegram bot integration
│ ├── telegram.module.ts
│ └── telegram.service.ts
├── cron/ # Scheduled tasks
│ └── check-proposal.cron.ts
├── cli/ # CLI commands
│ └── check-proposal.command.ts
├── config/ # Configuration files
├── app.module.ts # Main application module
└── main.ts # Application entry point
🔧 Development
Code Formatting
bash# Format code
npm run format

# Lint code

npm run lint
Testing
bash# Run tests
npm test

# Run tests with coverage

npm run test:cov
📝 Logging
The application provides comprehensive logging:

✅ Successful operations
❌ Error handling
📊 Proposal state changes
🔄 Scheduled task execution
📡 API interactions

🔒 Security Considerations

Store sensitive tokens in environment variables
Never commit .env files to version control
Use Redis for state management to prevent race conditions
Implement proper error handling for API failures

🚨 Error Handling
The bot includes robust error handling:

Continues monitoring even if individual proposals fail
Logs detailed error information
Graceful degradation for network issues
Redis connection retry logic

📈 Monitoring & Maintenance
Health Checks

Monitor Redis connection status
Check Telegram bot connectivity
Verify GitHub API rate limits
Review proposal checking frequency

Scaling Considerations

Redis can be clustered for high availability
Multiple bot instances can share the same Redis
GitHub API has rate limits (5000 requests/hour)
Telegram bot API has message limits

🤝 Contributing

Fork the repository
Create a feature branch
Commit your changes
Push to the branch
Create a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🆘 Support
For issues and questions:

Check the logs for error details
Verify configuration in .env
Test API connections manually
Create an issue in the repository

🔧 Troubleshooting
Common Issues
Bot not receiving messages:

Check TELEGRAM_BOT_TOKEN is correct
Verify bot is added to the group
Confirm TELEGRAM_CHAT_ID format (negative for groups)

GitHub issues not created:

Verify GITHUB_TOKEN has correct permissions
Check repository exists and is accessible
Confirm GITHUB_OWNER and GITHUB_REPO are correct

Redis connection errors:

Ensure Redis server is running
Check REDIS_HOST, REDIS_PORT configuration
Verify network connectivity

Blockchain connection issues:

Check Ankr API key is valid and has sufficient credits
Verify ANKR_KEY configuration
Monitor Ankr service status
Check if you've exceeded API rate limits

Proposal range issues:

Verify LAST_EXECUTED_PROPOSAL_ID is set correctly
Check if there are new proposals after the last executed ID
Monitor proposal contract for the latest proposal count

Made with ❤️ for the Compound community
