# Social Media MCP Integration Guide

## Overview

Your TradeHax system now includes comprehensive social media MCP (Model Context Protocol) integration, enabling unified cross-platform publishing and management across:

- **Discord** - Community server updates
- **Telegram** - Direct messaging and channels
- **Meta (Facebook)** - Page posting and engagement
- **Instagram** - Media and content sharing
- **Twitter/X** - Tweet publishing and engagement

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         Social Sync Orchestrator (Port 3000)                │
│    Unified cross-platform message publishing & routing      │
└──────────────┬──────────────────────────────────────────────┘
               │
     ┌─────────┼─────────┬─────────┬──────────┐
     │         │         │         │          │
     ▼         ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌───────┐
│Discord │ │Telegram│ │ Meta │ │Instagram│ │Twitter│
│ MCP    │ │  MCP   │ │ MCP  │ │  MCP   │ │ MCP   │
│3001    │ │ 3002   │ │ 3003 │ │ 3004   │ │ 3005  │
└────────┘ └────────┘ └──────┘ └────────┘ └───────┘
     │         │         │         │          │
     └─────────┴─────────┴─────────┴──────────┘
               │
        ┌──────▼──────┐
        │  Platforms  │
        │ (Discord,   │
        │ Telegram, etc)
        └─────────────┘
```

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy template and fill in credentials
cp .env.social.template .env.social

# Edit with your API credentials
# See "Getting API Credentials" section below
```

### 2. Install Dependencies

```bash
cd scripts/mcp-servers
npm install

# Or install for all (concurrently if available)
npm install concurrently
```

### 3. Start All Social Media MCP Servers

```bash
# Option 1: Run all servers concurrently
npm run all

# Option 2: Run individual servers
npm run discord  # Discord MCP on port 3001
npm run telegram # Telegram MCP on port 3002
npm run meta     # Meta MCP on port 3003
npm run instagram # Instagram MCP on port 3004
npm run twitter  # Twitter MCP on port 3005

# Option 3: Start via orchestrator
node ../../social-sync-orchestrator.js
```

### 4. Test Integration

```bash
# Health check
curl http://localhost:3000/health

# Get status
curl http://localhost:3000/status

# Get metrics
curl http://localhost:3000/metrics
```

## API Endpoints

### Social Sync Orchestrator (Port 3000)

#### Health Check
```bash
GET /health
# Response: { status: 'ready', service: 'social-sync-orchestrator' }
```

#### Get Status
```bash
GET /status
# Response: Detailed status of all 5 MCP servers
```

#### Get Metrics
```bash
GET /metrics
# Response: Analytics from all platforms
```

#### Publish to All Platforms
```bash
POST /publish
Content-Type: application/json

{
  "message": {
    "title": "New Update",
    "content": "Check out our latest features!",
    "image": "https://example.com/image.jpg"
  },
  "platforms": ["discord", "telegram", "twitter"]
}
```

#### Publish to Single Platform
```bash
POST /publish/:platform
Content-Type: application/json

{
  "message": {
    "title": "Discord-only message",
    "content": "This only goes to Discord!",
    "channel_id": "1234567890"
  }
}
```

#### Schedule Message Publishing
```bash
POST /schedule
Content-Type: application/json

{
  "message": {
    "title": "Scheduled Post",
    "content": "This posts in 60 seconds"
  },
  "delay": 60000,
  "platforms": ["twitter", "instagram"]
}
```

### Discord MCP Server (Port 3001)

```bash
# Get channels
GET http://localhost:3001/channels

# Send message
POST http://localhost:3001/message
{
  "channel_id": "1234567890",
  "content": "Hello Discord!",
  "embed": { /* Discord embed */ }
}

# Get messages from channel
GET http://localhost:3001/messages/:channel_id

# Register slash commands
POST http://localhost:3001/commands/register
{ "commands": [ /* slash command definitions */ ] }
```

### Telegram MCP Server (Port 3002)

```bash
# Send message
POST http://localhost:3002/message
{
  "chat_id": "1234567890",
  "text": "Hello Telegram!",
  "parse_mode": "HTML"
}

# Send photo
POST http://localhost:3002/photo
{
  "chat_id": "1234567890",
  "photo_url": "https://example.com/image.jpg",
  "caption": "Check this out!"
}

# Get chat info
GET http://localhost:3002/chat/:chat_id

# Get member count
GET http://localhost:3002/chat/:chat_id/members
```

### Meta MCP Server (Port 3003)

```bash
# Get account info
GET http://localhost:3003/account

# Post to Facebook/Instagram
POST http://localhost:3003/post
{
  "image_url": "https://example.com/image.jpg",
  "caption": "New post!"
}

# Get insights (analytics)
GET http://localhost:3003/insights/:media_id

# Get recent media
GET http://localhost:3003/media?limit=10

# Get followers
GET http://localhost:3003/followers
```

### Instagram MCP Server (Port 3004)

```bash
# Get hashtag posts
GET http://localhost:3004/hashtag/:tag/posts

# Get comments
GET http://localhost:3004/media/:media_id/comments

# Reply to comment
POST http://localhost:3004/comment/:comment_id/reply
{ "message": "Thanks for the comment!" }

# Webhook for events
POST http://localhost:3004/webhook
```

### Twitter MCP Server (Port 3005)

```bash
# Post tweet
POST http://localhost:3005/tweet
{
  "text": "Hello Twitter!",
  "reply_to": "1234567890",  // optional
  "quote_to": "0987654321"   // optional
}

# Get timeline
GET http://localhost:3005/timeline?limit=10

# Get tweet metrics
GET http://localhost:3005/tweet/:tweet_id

# Like tweet
POST http://localhost:3005/like/:tweet_id

# Retweet
POST http://localhost:3005/retweet/:tweet_id

# Search tweets
GET http://localhost:3005/search?q=tradehax&limit=10
```

## Getting API Credentials

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" section → "Add Bot"
4. Copy the bot token → `DISCORD_TOKEN`
5. Go to your Discord server settings
6. Copy Server ID → `DISCORD_GUILD_ID`
7. Configure bot permissions in OAuth2 section

**Required Permissions:**
- View Channels
- Send Messages
- Manage Messages
- Embed Links

### Telegram

1. Open Telegram app and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts:
   - Enter bot name
   - Enter bot username (must end with "bot")
4. Copy the token → `TELEGRAM_BOT_TOKEN`
5. Message the new bot and get chat ID → `TELEGRAM_CHAT_ID`

### Meta (Facebook)

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a new app (or use existing)
3. In Settings → Basic, copy:
   - App ID → `META_APP_ID`
   - App Secret → `META_APP_SECRET`
4. Go to Tools → Graph API Explorer
5. Generate access token → `META_PAGE_ACCESS_TOKEN`
6. Get page ID from page settings → `META_PAGE_ID`

### Instagram

1. Use same Meta app from above
2. Set up Instagram Graph API
3. Connect Instagram business account
4. Generate long-lived access token → `INSTAGRAM_ACCESS_TOKEN`
5. Get business account ID → `INSTAGRAM_BUSINESS_ACCOUNT_ID`

**Note:** Must use Instagram Business Account, not Creator Account

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create/select a project
3. Go to "Keys and tokens"
4. Generate keys:
   - API Key → `TWITTER_API_KEY`
   - API Secret → `TWITTER_API_SECRET`
   - Bearer Token → `TWITTER_BEARER_TOKEN`
5. Generate access tokens:
   - Access Token → `TWITTER_ACCESS_TOKEN`
   - Access Secret → `TWITTER_ACCESS_SECRET`

**Note:** Requires Elevated access level

## Examples

### Example 1: Publish to All Platforms

```bash
curl -X POST http://localhost:3000/publish \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "🚀 TradeHax New Feature",
      "content": "We just launched real-time trading insights with AI sentiment analysis!",
      "image": "https://tradehax.net/images/feature.jpg"
    }
  }'
```

### Example 2: Tweet-only Announcement

```bash
curl -X POST http://localhost:3000/publish/twitter \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "Market Alert",
      "content": "Bitcoin showing strong resistance at $43,500. Watch for breakout. #Trading #BTC"
    }
  }'
```

### Example 3: Schedule Instagram Post

```bash
curl -X POST http://localhost:3000/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "Market Update",
      "content": "Today'\''s trading performance 📊",
      "image": "https://tradehax.net/chart.jpg"
    },
    "delay": 3600000,
    "platforms": ["instagram"]
  }'
```

### Example 4: Discord Command Response

```bash
curl -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "1234567890",
    "embed": {
      "title": "Trading Signal",
      "description": "Strong buy signal detected",
      "color": 3447003,
      "fields": [
        {"name": "Pair", "value": "BTC/USD"},
        {"name": "Entry", "value": "$43,200"}
      ]
    }
  }'
```

## Integration with Unified MCP Environment

The social media MCP servers integrate seamlessly with your existing infrastructure:

### 1. Updated mcp-orchestrator.js

Add to server configuration:

```javascript
{
  id: 'social-orchestrator',
  type: 'local',
  port: 3000,
  path: 'scripts/social-sync-orchestrator.js',
  priority: 6
}
```

### 2. Docker Compose Integration

```yaml
services:
  # ... existing services ...
  
  social-orchestrator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - discord-mcp
      - telegram-mcp
      - meta-mcp
      - instagram-mcp
      - twitter-mcp
    networks:
      - tradehax-network
  
  discord-mcp:
    command: node scripts/mcp-servers/discord-mcp.js
    ports:
      - "3001:3001"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - DISCORD_GUILD_ID=${DISCORD_GUILD_ID}
    networks:
      - tradehax-network
  
  # ... similar for other social platforms ...
```

### 3. GitHub Actions Workflow

Already created: `.github/workflows/social-media-sync.yml`

Automatically:
- Deploys social media MCP servers
- Verifies all platform credentials
- Publishes to platforms on workflow completion
- Generates deployment reports

### 4. Single-Push Deployment

Update `unified-mcp-push.js` to include social platforms:

```javascript
// Push to social servers after main deployment
await orchestrator.publishToAll({
  title: 'Deployment Successful',
  content: `Version ${version} deployed to all targets`,
  image: 'https://tradehax.net/deployment-success.png'
});
```

## Monitoring & Health Checks

### Manual Health Check

```bash
# Check all services
curl http://localhost:3000/status | jq .

# Expected output:
# {
#   "servers": {
#     "discord-mcp": { "status": "ready" },
#     "telegram-mcp": { "status": "ready" },
#     ...
#   },
#   "summary": {
#     "total": 5,
#     "ready": 5,
#     "percentage": 100
#   }
# }
```

### Automated Health Checks

Health checks run every 60 seconds in:
- MCP Orchestrator
- Social Sync Orchestrator
- GitHub Actions workflow

### Metrics Collection

```bash
# Get platform metrics
curl http://localhost:3000/metrics | jq .

# Includes:
# - Discord: Channel count
# - Telegram: Bot status
# - Meta: Follower count
# - Instagram: Engagement metrics
# - Twitter: Tweet counts
```

## Troubleshooting

### Issue: "Cannot connect to Discord"

**Solution:**
1. Verify `DISCORD_TOKEN` is correct
2. Verify bot is added to guild
3. Check bot permissions
4. Restart Discord MCP server

### Issue: "Telegram bot not responding"

**Solution:**
1. Verify `TELEGRAM_BOT_TOKEN` format
2. Check @BotFather for recent token changes
3. Verify chat ID is correct
4. Restart Telegram MCP server

### Issue: "Instagram authentication failed"

**Solution:**
1. Generate new access token with extended validity
2. Ensure using Business Account, not Creator Account
3. Check token hasn't expired
4. Verify `INSTAGRAM_BUSINESS_ACCOUNT_ID` format

### Issue: "Twitter rate limited"

**Solution:**
1. Wait 15 minutes before retrying
2. Check Twitter API usage in dashboard
3. Upgrade to higher tier if needed
4. Implement exponential backoff

### Issue: "Port conflicts"

**Solution:**
```bash
# Check what's using a port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

## Environment Variables

### Required Variables

```env
# Discord (required for Discord publishing)
DISCORD_TOKEN=xxx
DISCORD_GUILD_ID=xxx

# Telegram (required for Telegram publishing)
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Meta (required for Facebook publishing)
META_APP_ID=xxx
META_APP_SECRET=xxx
META_PAGE_ACCESS_TOKEN=xxx

# Instagram (required for Instagram publishing)
INSTAGRAM_ACCESS_TOKEN=xxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=xxx

# Twitter (required for Twitter publishing)
TWITTER_API_KEY=xxx
TWITTER_BEARER_TOKEN=xxx
```

### Optional Variables

```env
# Discord
DISCORD_WEBHOOK_URL=xxx
DISCORD_CHANNEL_ID=xxx

# Telegram
TELEGRAM_ADMIN_ID=xxx

# Meta
META_PAGE_ID=xxx

# Instagram
INSTAGRAM_WEBHOOK_SECRET=xxx

# Ports (internal)
DISCORD_PORT=3001
TELEGRAM_PORT=3002
META_PORT=3003
INSTAGRAM_PORT=3004
TWITTER_PORT=3005
SOCIAL_ORCHESTRATOR_PORT=3000
```

## Security Considerations

1. **Never commit `.env.social` file** - Use `.env.social.template` only
2. **Store tokens in GitHub Secrets** - Not in repository
3. **Rotate tokens regularly** - Especially after deployments
4. **Use least-privilege permissions** - Only grant needed scopes
5. **Monitor API usage** - Watch for unauthorized access
6. **Enable webhook verification** - Validate incoming webhooks
7. **Use HTTPS for webhooks** - Especially for Instagram webhooks

## Performance Tips

1. **Batch publishing** - Send to multiple platforms in one request
2. **Use scheduled publishing** - Avoid rate limits
3. **Cache formatting** - Pre-format messages for platforms
4. **Parallel deployment** - Use concurrency for multiple platforms
5. **Monitor metrics** - Track engagement across platforms

## Next Steps

1. ✅ Environment variables configured
2. ✅ All MCP servers ready
3. ✅ Social Sync Orchestrator running
4. 📋 Integrate with main application
5. 📋 Set up automated publishing workflows
6. 📋 Configure social media dashboards

## Support & Documentation

- Discord: [discord.js Documentation](https://discord.js.org/)
- Telegram: [Telegraf Documentation](https://telegraf.js.org/)
- Meta: [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- Instagram: [Instagram Graph API Docs](https://developers.instagram.com/docs/instagram-graph-api/)
- Twitter: [Twitter API v2 Docs](https://developer.twitter.com/en/docs/twitter-api)

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready
