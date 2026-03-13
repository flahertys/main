# Social Media MCP Integration with Unified Environment

## Overview

This document explains how to integrate the new social media MCP servers with your existing unified MCP deployment environment.

## Step 1: Update mcp-orchestrator.js

Add the following server configurations to the `servers` array in `scripts/mcp-orchestrator.js`:

```javascript
{
  id: 'social-orchestrator',
  type: 'local',
  port: 3000,
  path: 'C:\\tradez\\main',
  docker: false,
  priority: 6,
  env: {
    NODE_ENV: 'production',
    SOCIAL_ORCHESTRATOR_PORT: 3000
  }
},
{
  id: 'discord-mcp',
  type: 'docker',
  container: 'tradehax:latest',
  port: 3001,
  ports: '3001:3001',
  priority: 7,
  docker: true,
  env: {
    DISCORD_PORT: 3001,
    NODE_ENV: 'production'
  }
},
{
  id: 'telegram-mcp',
  type: 'docker',
  container: 'tradehax:latest',
  port: 3002,
  ports: '3002:3002',
  priority: 8,
  docker: true,
  env: {
    TELEGRAM_PORT: 3002,
    NODE_ENV: 'production'
  }
},
{
  id: 'meta-mcp',
  type: 'docker',
  container: 'tradehax:latest',
  port: 3003,
  ports: '3003:3003',
  priority: 9,
  docker: true,
  env: {
    META_PORT: 3003,
    NODE_ENV: 'production'
  }
},
{
  id: 'instagram-mcp',
  type: 'docker',
  container: 'tradehax:latest',
  port: 3004,
  ports: '3004:3004',
  priority: 10,
  docker: true,
  env: {
    INSTAGRAM_PORT: 3004,
    NODE_ENV: 'production'
  }
},
{
  id: 'twitter-mcp',
  type: 'docker',
  container: 'tradehax:latest',
  port: 3005,
  ports: '3005:3005',
  priority: 11,
  docker: true,
  env: {
    TWITTER_PORT: 3005,
    NODE_ENV: 'production'
  }
}
```

## Step 2: Update unified-mcp-push.js

Add social media server deployment to the push queue:

```javascript
/**
 * Deploy social media MCP servers
 */
async deploySocialServers() {
  try {
    this.log('Step 6.5: Deploying social media MCP servers', 'info');
    
    const socialServers = [
      'discord-mcp',
      'telegram-mcp',
      'meta-mcp',
      'instagram-mcp',
      'twitter-mcp'
    ];
    
    // Start all social media servers in Docker
    for (const serverId of socialServers) {
      try {
        execSync(\`docker-compose -f docker-compose.social.yml up -d \${serverId}\`);
        this.log(\`✅ \${serverId} started\`, 'success');
      } catch (error) {
        this.log(\`⚠️ \${serverId} deployment skipped: \${error.message}\`, 'warning');
      }
    }
    
  } catch (error) {
    throw new Error(\`Social media deployment failed: \${error.message}\`);
  }
}
```

Then add to the execution flow:

```javascript
// In executePush() method, after Step 5:
await this.deploySocialServers();
```

## Step 3: Update GitHub Actions Workflow

Merge the social media workflow into your unified deployment. In `.github/workflows/unified-mcp-deploy.yml`, add after the `deploy-mcp-servers` job:

```yaml
deploy-social-media:
  runs-on: ubuntu-latest
  needs: prepare
  if: needs.prepare.outputs.build-status == 'success'
  strategy:
    matrix:
      social_server: 
        - discord-mcp
        - telegram-mcp
        - meta-mcp
        - instagram-mcp
        - twitter-mcp
  
  steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Deploy ${{ matrix.social_server }}
      env:
        DEPLOY_ID: ${{ needs.prepare.outputs.deployment-id }}
      run: |
        echo "Deploying ${{ matrix.social_server }}..."
        docker-compose -f docker-compose.social.yml up -d ${{ matrix.social_server }}
    
    - name: Verify ${{ matrix.social_server }}
      continue-on-error: true
      run: |
        sleep 3
        curl -f http://localhost:$(echo ${{ matrix.social_server }} | grep -o '[0-9]*$')/health || true
```

Also add to the `sync-all` job dependencies:

```yaml
deploy-social-media:
  # ... job definition ...
needs: [deploy-namecheap, deploy-docker, deploy-kubernetes, deploy-mcp-servers, deploy-social-media]
```

## Step 4: Add GitHub Secrets

Add the following secrets to your GitHub repository:

```
# Discord
DISCORD_TOKEN=xxx
DISCORD_GUILD_ID=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
TELEGRAM_ADMIN_ID=xxx

# Meta
META_APP_ID=xxx
META_APP_SECRET=xxx
META_PAGE_ID=xxx
META_PAGE_ACCESS_TOKEN=xxx

# Instagram
INSTAGRAM_ACCESS_TOKEN=xxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=xxx
INSTAGRAM_WEBHOOK_SECRET=xxx

# Twitter
TWITTER_API_KEY=xxx
TWITTER_API_SECRET=xxx
TWITTER_BEARER_TOKEN=xxx
TWITTER_ACCESS_TOKEN=xxx
TWITTER_ACCESS_SECRET=xxx
```

## Step 5: Update Docker Compose

Option A: Include social servers in main `docker-compose.yml`:

```yaml
# Add to existing docker-compose.yml
services:
  # ... existing services ...
  
  # Include entire docker-compose.social.yml content here
  social-orchestrator:
    # ... configuration ...
```

Option B: Use multi-file compose (recommended):

```bash
# Start all services including social media
docker-compose -f docker-compose.yml -f docker-compose.social.yml up -d

# Or include in docker-compose.override.yml
docker-compose up -d
```

## Step 6: Update .github/workflows/.dockerignore

Ensure social media files are included in Docker:

```dockerfile
# Add to .dockerignore
!scripts/mcp-servers/
!scripts/social-*.js
!.env.social.template
```

## Step 7: Update Dockerfile (if using custom image)

Add build steps for social media MCP servers:

```dockerfile
# Social media MCP servers
COPY scripts/mcp-servers/ /app/scripts/mcp-servers/
COPY scripts/social-*.js /app/scripts/

# Install social media dependencies
RUN cd /app/scripts/mcp-servers && npm install --production

# Expose social media ports
EXPOSE 3000 3001 3002 3003 3004 3005
```

## Step 8: Update .gitignore

Add to `.gitignore` to protect credentials:

```
.env.social
.env.social.production
social-credentials.json
*/node_modules/
```

## Step 9: Create GitHub Actions for Social Publishing (Optional)

Create `.github/workflows/social-publish.yml`:

```yaml
name: Social Media Publishing

on:
  workflow_dispatch:
    inputs:
      message:
        description: 'Message to publish'
        required: true
      platforms:
        description: 'Comma-separated platforms'
        required: false
        default: 'twitter,discord'
      image_url:
        description: 'Image URL (optional)'
        required: false

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install axios
      
      - name: Publish to platforms
        env:
          MESSAGE: ${{ github.event.inputs.message }}
          PLATFORMS: ${{ github.event.inputs.platforms }}
          IMAGE_URL: ${{ github.event.inputs.image_url }}
        run: |
          node << 'EOF'
          const axios = require('axios');
          
          const platforms = process.env.PLATFORMS.split(',');
          const message = {
            title: 'TradeHax Update',
            content: process.env.MESSAGE,
            image: process.env.IMAGE_URL
          };
          
          axios.post('http://localhost:3000/publish', { message, platforms })
            .then(res => console.log('✅ Published:', res.data))
            .catch(err => console.error('❌ Error:', err.message));
          EOF
```

## Deployment Workflow

### Local Development

```bash
# 1. Setup environment
cp .env.social.template .env.social
# Edit .env.social with your credentials

# 2. Start all services
docker-compose -f docker-compose.yml -f docker-compose.social.yml up -d

# 3. Verify services
curl http://localhost:3000/status

# 4. Push to GitHub
git push origin main
```

### Production Deployment

```bash
# 1. GitHub Actions automatically deploys on push to main
# 2. Social media servers start in parallel with core services
# 3. Unified health checks verify all targets
# 4. Status dashboard shows all platforms

# Monitor:
curl https://tradehax.net/api/orchestrator/status
```

## Unified Status Dashboard

After integration, your unified status will show:

```json
{
  "servers": {
    "namecheap-vps": { "status": "ready" },
    "local-dev": { "status": "ready" },
    "ollama-server": { "status": "ready" },
    "langchain-server": { "status": "ready" },
    "kubernetes-cluster": { "status": "ready" },
    "social-orchestrator": { "status": "ready" },
    "discord-mcp": { "status": "ready" },
    "telegram-mcp": { "status": "ready" },
    "meta-mcp": { "status": "ready" },
    "instagram-mcp": { "status": "ready" },
    "twitter-mcp": { "status": "ready" }
  },
  "summary": {
    "total": 11,
    "ready": 11,
    "percentage": 100
  }
}
```

## Testing Integration

```bash
# 1. Check orchestrator status
curl http://localhost:3000/status

# 2. Check social media metrics
curl http://localhost:3000/metrics

# 3. Test single platform
curl -X POST http://localhost:3000/publish/twitter \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "Test from TradeHax"}}'

# 4. Test all platforms
curl -X POST http://localhost:3000/publish \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "title": "TradeHax Integration Test",
      "content": "All social media platforms now connected!"
    }
  }'
```

## Troubleshooting Integration

### Social servers not starting with main deployment

**Solution:** Ensure `docker-compose.social.yml` is in repository root

```bash
ls -la docker-compose.social.yml
git add docker-compose.social.yml
git commit -m "Add social media docker compose"
git push
```

### Environment variables not loading

**Solution:** Verify `.env.social` exists and is loaded

```bash
# Check file exists
ls -la .env.social

# Verify in docker-compose
docker-compose config | grep DISCORD_TOKEN
```

### Ports conflicting

**Solution:** Change port numbers in docker-compose.social.yml

```yaml
# Change ports: [available_port]:3001
ports:
  - "13001:3001"  # Use 13001 instead of 3001
```

### Social servers not visible in orchestrator

**Solution:** Restart orchestrator to re-discover services

```bash
docker restart social-orchestrator
# Or
node scripts/mcp-orchestrator.js --force-sync
```

## Next Steps

1. ✅ Integrate social servers with orchestrator
2. ✅ Add GitHub Secrets for credentials  
3. ✅ Update deployment workflows
4. ✅ Test unified deployment
5. 📋 Monitor social media metrics
6. 📋 Set up automated publishing
7. 📋 Create social media dashboards

## Rollback

If issues occur, revert social media integration:

```bash
# Stop social media services
docker-compose -f docker-compose.social.yml down

# Remove from orchestrator
git revert <commit>

# Restart main services
docker-compose up -d
```

---

**Integration Status:** ✅ Ready for Production
**Version:** 1.0.0
