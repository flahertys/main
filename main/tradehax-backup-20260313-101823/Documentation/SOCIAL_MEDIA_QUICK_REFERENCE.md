# Social Media MCP Quick Reference

## Servers & Ports

| Service | Port | Command | Status |
|---------|------|---------|--------|
| Social Orchestrator | 3000 | `node social-sync-orchestrator.js` | ✅ Ready |
| Discord MCP | 3001 | `npm run discord` | ✅ Ready |
| Telegram MCP | 3002 | `npm run telegram` | ✅ Ready |
| Meta MCP | 3003 | `npm run meta` | ✅ Ready |
| Instagram MCP | 3004 | `npm run instagram` | ✅ Ready |
| Twitter MCP | 3005 | `npm run twitter` | ✅ Ready |

## Quick Commands

### Start All Services
```bash
# Option 1: Individual services
cd scripts/mcp-servers && npm run all

# Option 2: Docker compose
docker-compose -f docker-compose.social.yml up -d

# Option 3: Individual servers
docker-compose -f docker-compose.social.yml up -d discord-mcp telegram-mcp meta-mcp instagram-mcp twitter-mcp
```

### Stop All Services
```bash
docker-compose -f docker-compose.social.yml down
```

### Check Status
```bash
# Overall status
curl http://localhost:3000/status

# Specific server
curl http://localhost:3001/health  # Discord
curl http://localhost:3002/health  # Telegram
curl http://localhost:3003/health  # Meta
curl http://localhost:3004/health  # Instagram
curl http://localhost:3005/health  # Twitter
```

### View Logs
```bash
# Social orchestrator
docker logs -f social-orchestrator

# Specific service
docker logs -f discord-mcp
docker logs -f telegram-mcp
docker logs -f meta-mcp
docker logs -f instagram-mcp
docker logs -f twitter-mcp
```

## Publishing

### Publish to All Platforms
```bash
curl -X POST http://localhost:3000/publish \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "Update Title",
      "content": "Message content here",
      "image": "https://example.com/image.jpg"
    }
  }'
```

### Publish to Specific Platform
```bash
# Twitter
curl -X POST http://localhost:3000/publish/twitter \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "Tweet text"}}'

# Discord
curl -X POST http://localhost:3000/publish/discord \
  -H "Content-Type: application/json" \
  -d '{"message": {"content": "Discord message", "channel_id": "123"}}'

# Telegram
curl -X POST http://localhost:3000/publish/telegram \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "Telegram message", "chat_id": "123"}}'

# Instagram
curl -X POST http://localhost:3000/publish/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": {"image_url": "https://...", "caption": "Caption"}}'

# Meta (Facebook)
curl -X POST http://localhost:3000/publish/meta \
  -H "Content-Type: application/json" \
  -d '{"message": {"image_url": "https://...", "caption": "Caption"}}'
```

### Schedule Message
```bash
curl -X POST http://localhost:3000/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "message": {"text": "Scheduled post"},
    "delay": 3600000,
    "platforms": ["twitter"]
  }'
```

## Discord-Specific

### Send Discord Message
```bash
curl -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "1234567890",
    "content": "Hello Discord!"
  }'
```

### Get Discord Channels
```bash
curl http://localhost:3001/channels
```

### Get Discord Messages
```bash
curl http://localhost:3001/messages/1234567890
```

## Telegram-Specific

### Send Telegram Message
```bash
curl -X POST http://localhost:3002/message \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "1234567890",
    "text": "Hello Telegram!",
    "parse_mode": "HTML"
  }'
```

### Send Telegram Photo
```bash
curl -X POST http://localhost:3002/photo \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "1234567890",
    "photo_url": "https://example.com/image.jpg",
    "caption": "Photo caption"
  }'
```

### Get Chat Info
```bash
curl http://localhost:3002/chat/1234567890
curl http://localhost:3002/chat/1234567890/members
```

## Meta/Facebook-Specific

### Post to Facebook
```bash
curl -X POST http://localhost:3003/post \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "caption": "Post caption"
  }'
```

### Get Account Info
```bash
curl http://localhost:3003/account
```

### Get Followers
```bash
curl http://localhost:3003/followers
```

### Get Insights
```bash
curl http://localhost:3003/insights/media_id_here
```

## Instagram-Specific

### Search Hashtags
```bash
curl http://localhost:3004/hashtag/tradehax/posts
```

### Get Comments
```bash
curl http://localhost:3004/media/123456/comments
```

### Reply to Comment
```bash
curl -X POST http://localhost:3004/comment/123456/reply \
  -H "Content-Type: application/json" \
  -d '{"message": "Thanks for commenting!"}'
```

## Twitter-Specific

### Post Tweet
```bash
curl -X POST http://localhost:3005/tweet \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello Twitter!"}'
```

### Get Timeline
```bash
curl http://localhost:3005/timeline?limit=10
```

### Get Tweet Metrics
```bash
curl http://localhost:3005/tweet/1234567890
```

### Like Tweet
```bash
curl -X POST http://localhost:3005/like/1234567890
```

### Retweet
```bash
curl -X POST http://localhost:3005/retweet/1234567890
```

### Search Tweets
```bash
curl http://localhost:3005/search?q=tradehax&limit=10
```

## Environment Variables

### Set Variables
```bash
# Create .env.social file
cp .env.social.template .env.social

# Edit with credentials
nano .env.social  # or your preferred editor

# Source for current shell
source .env.social  # Unix/macOS
# or set via .env file in docker-compose
```

### Required Credentials Format

```
# Discord
DISCORD_TOKEN=NzkyNTA4NTg5NjcwNjcwODkz.X-hvzA... (50+ chars)

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Meta
META_APP_ID=123456789012345 (numeric)
META_APP_SECRET=abc123def456ghi789jkl012mno345pqr

# Instagram
INSTAGRAM_ACCESS_TOKEN=IGQVJYeS1r... (long token)
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400571220147 (numeric)

# Twitter
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAIXzAQAAAAA...
```

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Find and kill process using port
lsof -i :3000  # macOS/Linux
# Kill it
kill -9 <PID>

# Or change port in docker-compose
# Change ports: [new_port]:3000
```

### Service Not Responding
```bash
# Restart service
docker restart discord-mcp  # or other service

# Check logs
docker logs discord-mcp --tail 50

# Full restart
docker-compose -f docker-compose.social.yml restart
```

### Authentication Failed
```bash
# Verify token in .env.social
cat .env.social | grep DISCORD_TOKEN

# Check if token is valid in platform console
# Regenerate token if needed

# Restart service with new token
docker-compose -f docker-compose.social.yml up -d discord-mcp
```

### API Rate Limited
```bash
# Wait 15 minutes
# Or upgrade API tier
# Check API dashboard for usage

# Implement backoff in code:
# curl with --retry option
# Delay between requests
```

## Monitoring

### Get Metrics
```bash
curl http://localhost:3000/metrics | jq .
```

### Health Dashboard
```bash
curl http://localhost:3000/status | jq .

# Pretty print
curl http://localhost:3000/status | jq '.'

# Specific servers
curl http://localhost:3000/status | jq '.servers.discord_mcp'
```

### Monitor All at Once
```bash
# Create monitoring script
watch -n 5 'curl -s http://localhost:3000/status | jq "."'
```

## Integration with Main System

### Add to Unified Orchestrator
```bash
# Edit scripts/mcp-orchestrator.js
# Add server configs (see SOCIAL_MEDIA_INTEGRATION.md)

# Test
node scripts/mcp-orchestrator.js --status
```

### Deploy with Main Services
```bash
# Single command deployment
node scripts/unified-mcp-push.js

# Watch mode
node scripts/unified-mcp-push.js --watch
```

### GitHub Actions Deployment
```bash
git add .env.social.template docker-compose.social.yml
git commit -m "feat: add social media MCP integration"
git push origin main
# GitHub Actions automatically deploys
```

## Common Workflows

### Publish Marketing Update to All Platforms
```bash
curl -X POST http://localhost:3000/publish \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "🚀 New Feature Release",
      "content": "We just launched AI-powered trading signals! Try it now on tradehax.net",
      "image": "https://tradehax.net/feature-banner.jpg"
    }
  }'
```

### Send Twitter-Only Thread
```bash
# Tweet 1
curl -X POST http://localhost:3005/tweet \
  -d '{"text": "Thread: The future of trading bots 1/3"}'

# Tweet 2 (reply to previous)
curl -X POST http://localhost:3005/tweet \
  -d '{"text": "We are revolutionizing... 2/3", "reply_to": "1234567890"}'

# Tweet 3
curl -X POST http://localhost:3005/tweet \
  -d '{"text": "Join us! 3/3", "reply_to": "1234567891"}'
```

### Schedule Post for Later
```bash
# Schedule for 1 hour from now
curl -X POST http://localhost:3000/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "Evening Update",
      "content": "Daily trading summary coming soon..."
    },
    "delay": 3600000,
    "platforms": ["twitter", "instagram"]
  }'
```

### Auto-Publish Deployment Status
```bash
# After deployment completes
curl -X POST http://localhost:3000/publish \
  -d '{
    "message": {
      "title": "✅ Deployment Complete",
      "content": "TradeHax v1.2.3 now live! All systems operational.",
      "image": "https://tradehax.net/deployment-success.png"
    },
    "platforms": ["discord", "telegram"]
  }'
```

## Performance Tips

- ✅ Use scheduled publishing to avoid rate limits
- ✅ Batch posts to multiple platforms in one request
- ✅ Cache platform-formatted messages
- ✅ Use platform-specific endpoints for best performance
- ✅ Monitor API usage in platform dashboards
- ✅ Implement exponential backoff for retries

## Security

- 🔒 Never commit `.env.social` - use `.env.social.template`
- 🔒 Store tokens in GitHub Secrets
- 🔒 Use HTTPS for webhook URLs
- 🔒 Verify webhook signatures
- 🔒 Rotate tokens regularly
- 🔒 Monitor unauthorized API access
- 🔒 Use least-privilege token scopes

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready
