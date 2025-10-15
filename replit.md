# ClipHub Discord Bot

## Overview
ClipHub Bot is a comprehensive Discord bot for managing clip campaigns and payouts. It helps server administrators manage content creators, track submissions, handle payouts, and moderate the community.

## Project Architecture

### Technology Stack
- **Runtime**: Node.js 20
- **Framework**: Discord.js v14
- **Database**: SQLite (better-sqlite3)
- **Scheduler**: node-cron (for weekly reports)
- **APIs**: YouTube Data API, TikTok (via RapidAPI)

### Project Structure
```
├── src/
│   ├── commands/          # Slash commands
│   │   ├── admin/        # Admin-only commands (39 commands)
│   │   └── user/         # User-accessible commands (22 commands)
│   ├── events/           # Discord event handlers
│   ├── handlers/         # Campaign and ticket handlers
│   ├── services/         # External API integrations
│   ├── utils/            # Utility functions
│   ├── database/         # Database initialization
│   └── index.js          # Main bot entry point
├── backups/              # Nuke operation backups
├── clipmaster.db         # SQLite database
└── deploy-commands.js    # Command deployment script
```

## Core Features

### Admin Commands (39)
- **Campaign Management**: addcampaign, endcampaign, campaigns
- **Clip Approval**: approveclip, rejectclip, flagclip
- **Payout Management**: approvepayout, rejectpayout, bonus
- **Moderation**: ban, kick, mute, timeout, warn, prune
- **Channel Management**: nuke, restorenuke, lock, unlock, slowmode
- **Utilities**: announce, poll, stats, exportdata

### User Commands (22)
- **Information**: help, botinfo, serverinfo, userinfo, channelinfo
- **Stats**: profile, mystats, leaderboard, rank
- **Campaigns**: campaigns, submit
- **Payouts**: setpayout, requestpayout
- **Invites**: invites, topinvites
- **Utilities**: ping, uptime, calculator, avatar, feedback

### Event Handlers
- Member join/leave/update logging
- Message edit/delete logging
- Interaction handling (slash commands)
- Auto-moderation with word filter
- Ticket system

### Special Features
- **Nuke System**: Backup and restore channels with full message history
- **Ticket System**: Support ticket creation and management
- **Campaign Tracking**: Track clip submissions and views
- **Payout System**: Manage creator payouts
- **Weekly Reports**: Automated reporting via cron jobs
- **Invite Tracking**: Monitor server growth

## Configuration

### Required Environment Variables

#### Discord Bot Settings (REQUIRED)
- `DISCORD_TOKEN` - Bot authentication token from Discord Developer Portal
- `CLIENT_ID` - Discord application client ID for OAuth
- `CLIENT_SECRET` - Discord application client secret for OAuth
- `GUILD_ID` - Discord server ID
- `DEVELOPER_ID` - Discord developer/admin user ID

#### Web Dashboard (REQUIRED for production)
- `SESSION_SECRET` - Secure session secret (generate random string)
- `NODE_ENV` - Set to 'production' for deployment

#### API Keys (Optional - for view tracking)
- `YOUTUBE_API_KEY` - YouTube Data API key for view tracking
- `RAPIDAPI_KEY` - RapidAPI key for TikTok view tracking

#### Discord Channel IDs (Optional - for logging)
- `WELCOME_CHANNEL` - Welcome messages channel
- `SUPPORT_CHANNEL` - Support ticket channel
- `ACTIVE_CAMPAIGNS_CHANNEL` - Campaign announcements
- `MEMBER_LOGS_CHANNEL` - Member activity logs
- `MESSAGE_LOGS_CHANNEL` - Message edit/delete logs
- `COMMAND_LOGS_CHANNEL` - Command usage logs
- `ERROR_LOGS_CHANNEL` - Error logs
- `TICKET_LOGS_CHANNEL` - Ticket activity logs
- `ANNOUNCEMENTS_CHANNEL` - Weekly reports
- `PAYOUT_LOGS_CHANNEL` - Payout approval/rejection logs

#### Discord Role IDs (Optional)
- `VERIFIED_CLIPPER_ROLE` - Verified clipper role
- `STAFF_ROLE` - Staff role for tickets
- `TICKET_CATEGORY` - Ticket category ID
- `NUKE_MASTER_ROLE_ID` - Nuke command permission

### Optional Settings
- `AUTOMOD_ENABLED` - Enable auto-moderation (true/false)
- `WORD_FILTER_ENABLED` - Enable word filter (true/false)
- `RATE_LIMIT_SECONDS` - Submission rate limit

## Database Schema
The bot uses SQLite with tables for:
- Users (profiles, stats, payouts)
- Campaigns (active/ended campaigns)
- Clips (submissions, views, approval status)
- Warnings (moderation history)
- Invites (tracking)
- Tickets (support system)

## Deployment

### Development (Replit)
The application runs automatically via the configured workflow:
```bash
node start.js
```
This starts both:
- Discord bot (src/index.js)
- Web dashboard (web/server.js on port 5000)

### Deploying Commands
To register slash commands with Discord (run once after adding new commands):
```bash
node deploy-commands.js
```

### Production Deployment
1. Set all required environment variables (see above)
2. Set `NODE_ENV=production` for secure cookies
3. Generate a secure `SESSION_SECRET`
4. Click "Deploy" in Replit - configured for VM (always-on)
5. Update Discord OAuth redirect URL to your production domain

## Recent Changes
- **2025-10-15**: Complete Replit environment setup
  - ✅ Installed all npm dependencies (discord.js, express, better-sqlite3, passport-discord, etc.)
  - ✅ Fixed web server for Replit proxy (trust proxy, secure cookies)
  - ✅ Added action buttons to payout verification and flag clip tickets
  - ✅ Updated interaction handler for approve/reject button flows
  - ✅ Created modern CSS styling with gold gradient theme
  - ✅ Created header and footer partials for consistent UI
  - ✅ Created unified startup script (start.js) for bot + web server
  - ✅ Configured workflow to run on port 5000
  - ✅ Set up deployment configuration for VM (always-on bot)
  - ✅ Added .gitignore for Node.js project
  - ✅ Fixed campaign join button (changed customId to match handler)
  - ✅ Updated /endcampaign to delete campaign message instead of editing it

## Maintenance Notes
- The bot automatically creates backups when using the nuke command
- Database is automatically initialized on startup
- Cron jobs run weekly reports
- All errors are logged to the designated error logs channel

## Website Features
The web dashboard includes:
- **Discord OAuth Login** - Secure authentication via Discord
- **User Dashboard** - View stats, earnings, and submissions
- **Campaign Browser** - Join active campaigns
- **Clip Submission** - Upload clips with analytics proof
- **Payout System** - Request and track payouts
- **Leaderboard** - Global creator rankings
- **Modern UI** - Responsive design with gold gradient theme

## Important Notes
- Welcome messages require `WELCOME_CHANNEL` environment variable
- Payout/flag clip tickets now have approve/reject action buttons
- Website uses Replit proxy - trust proxy is enabled
- Database auto-initializes on startup
- View tracking runs hourly via cron job
- All button interactions properly handled

## User Preferences
None specified yet.
