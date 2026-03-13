# 🔗 TradeHax API Connection Setup Guide

**Complete step-by-step guide for setting up all API integrations**

---

## 🎯 Quick Start

### 1. Test All Connections
```bash
npm run test-connections
# or
node scripts/api-connection-manager.js
```

### 2. Run Autonomous Push System
```bash
npm run autonomous-push test
# or
node scripts/autonomous-push-orchestrator.js test
```

---

## 📋 Setup Checklist

### Critical Connections (Required)
- [ ] Hugging Face API (LLM)
- [ ] Discord Webhook (Alerts)
- [ ] Telegram Bot (Notifications)
- [ ] NextAuth (Authentication)

### High Priority (Recommended)
- [ ] Stripe API (Payments)
- [ ] Database (PostgreSQL)
- [ ] Redis Cache
- [ ] Solana RPC

### Medium Priority (Optional)
- [ ] Twitter/X API
- [ ] Instagram Graph API
- [ ] Facebook Graph API
- [ ] YouTube Data API

---

## 🔧 Detailed Setup Instructions

### 1. Hugging Face (LLM)

**Status**: ✅ CONFIGURED

**Token**: Already set in `.env.local`
```bash
NEXT_PUBLIC_HF_API_TOKEN=hf_pdyLByADYtFFpUDxUvGcKpGCcMKNOIOY
```

**Test**:
```bash
npm run verify-hf-token
```

**Endpoints Used**:
- `https://api-inference.huggingface.co/models/{model}`
- Default model: `meta-llama/Llama-2-7b-chat-hf`

---

### 2. Discord Integration

**Steps**:

1. **Create Application**
   - Visit: https://discord.com/developers/applications
   - Click "New Application"
   - Name it "TradeHax Bot"

2. **Create Bot**
   - Go to "Bot" section
   - Click "Add Bot"
   - Copy the bot token

3. **Get Server/Guild ID**
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click your server → Copy ID

4. **Create Webhook**
   - Go to your Discord server
   - Select channel → Edit Channel → Integrations → Webhooks
   - Create Webhook → Copy URL

5. **Add to `.env.local`**
   ```bash
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_GUILD_ID=your_server_id_here
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   DISCORD_PORT=3001
   ```

6. **Test**:
   ```bash
   node scripts/api-connection-manager.js
   ```

---

### 3. Telegram Integration

**Steps**:

1. **Create Bot**
   - Open Telegram and search for @BotFather
   - Send `/newbot` command
   - Follow prompts to create bot
   - Copy the bot token

2. **Get Chat ID**
   - Start your bot
   - Send any message to it
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `"chat":{"id": ...}` in the response

3. **Add to `.env.local`**
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   TELEGRAM_ADMIN_ID=your_admin_id_here
   TELEGRAM_PORT=3002
   ```

4. **Test**:
   ```bash
   node scripts/autonomous-push-orchestrator.js test
   ```

---

### 4. Stripe (Payments)

**Steps**:

1. **Create Account**
   - Visit: https://stripe.com
   - Sign up for account

2. **Get API Keys**
   - Go to Developers → API keys
   - Copy "Secret key" (starts with `sk_`)
   - Copy "Publishable key" (starts with `pk_`)

3. **Set Up Webhook**
   - Go to Developers → Webhooks
   - Add endpoint: `https://tradehax.net/api/monetization/webhooks/stripe`
   - Select events to listen for
   - Copy webhook signing secret (starts with `whsec_`)

4. **Add to `.env.local`**
   ```bash
   STRIPE_SECRET_KEY=sk_test_or_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Test**:
   - Create test payment in Stripe dashboard
   - Verify webhook is called

---

### 5. Twitter/X API

**Steps**:

1. **Create Developer Account**
   - Visit: https://developer.twitter.com
   - Apply for developer account
   - Create new project

2. **Generate Keys**
   - Go to project → Keys and tokens
   - Generate API Key & Secret
   - Generate Bearer Token
   - Generate Access Token & Secret

3. **Add to `.env.local`**
   ```bash
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_BEARER_TOKEN=your_bearer_token
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_secret
   TWITTER_PORT=3005
   ```

4. **Test**:
   ```bash
   curl -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
     "https://api.twitter.com/2/users/me"
   ```

---

### 6. Instagram Graph API

**Steps**:

1. **Use Meta for Developers**
   - Visit: https://developers.facebook.com
   - Create app if you don't have one
   - Add Instagram product

2. **Get Access Token**
   - Use Graph API Explorer
   - Select your app
   - Get long-lived access token
   - Find business account ID in Instagram settings

3. **Add to `.env.local`**
   ```bash
   INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_id
   INSTAGRAM_WEBHOOK_SECRET=your_webhook_secret
   INSTAGRAM_PORT=3004
   ```

4. **Test**:
   ```bash
   curl "https://graph.instagram.com/me?access_token=YOUR_TOKEN"
   ```

---

### 7. Facebook/Meta Page

**Steps**:

1. **Create App**
   - Visit: https://developers.facebook.com
   - Create app (Business type)

2. **Get Credentials**
   - Settings → Basic: Copy App ID and App Secret
   - Use Graph API Explorer to get Page Access Token
   - Find Page ID in your Facebook Page settings

3. **Add to `.env.local`**
   ```bash
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_PAGE_ID=your_page_id
   META_PAGE_ACCESS_TOKEN=your_page_token
   META_PORT=3003
   ```

4. **Test**:
   ```bash
   curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
   ```

---

### 8. Database (PostgreSQL)

**Local Setup**:

1. **Install PostgreSQL**
   ```bash
   # Windows
   choco install postgresql

   # Mac
   brew install postgresql
   
   # Linux
   sudo apt-get install postgresql
   ```

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE tradehax;
   CREATE USER tradehax_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE tradehax TO tradehax_user;
   ```

3. **Add to `.env.local`**
   ```bash
   DATABASE_URL=postgresql://tradehax_user:secure_password@localhost:5432/tradehax
   DATABASE_POOL_SIZE=20
   DATABASE_TIMEOUT=10
   ```

**Cloud Setup (Recommended)**:
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Serverless PostgreSQL)
- **Railway**: https://railway.app (Easy deployment)

---

### 9. Redis Cache

**Local Setup**:

1. **Install Redis**
   ```bash
   # Windows (WSL recommended)
   wsl --install
   sudo apt-get install redis-server

   # Mac
   brew install redis
   brew services start redis

   # Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **Add to `.env.local`**
   ```bash
   REDIS_URL=redis://localhost:6379/0
   REDIS_CACHE_TTL=3600
   ```

**Cloud Setup (Recommended)**:
- **Upstash**: https://upstash.com (Serverless Redis, free tier)
- **Redis Cloud**: https://redis.com (Managed Redis)

---

### 10. Solana RPC

**Public RPC** (Already configured):
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
```

**Private RPC** (Recommended for production):
- **Quicknode**: https://quicknode.com
- **Alchemy**: https://alchemy.com
- **Helius**: https://helius.xyz

**Add to `.env.local`**:
```bash
NEXT_PUBLIC_SOLANA_RPC=https://your-private-rpc-endpoint.com
```

---

## 🧪 Testing Your Setup

### Test Individual Connections
```bash
# Test all connections
node scripts/api-connection-manager.js

# Test HF token
npm run verify-hf-token

# Test autonomous push (no actual push)
node scripts/autonomous-push-orchestrator.js test
```

### Test Autonomous Push
```bash
# Generate market brief
node scripts/autonomous-push-orchestrator.js brief

# Generate trading signal
node scripts/autonomous-push-orchestrator.js signal BTC/USD

# Generate watchlist
node scripts/autonomous-push-orchestrator.js watchlist

# Run full cycle
node scripts/autonomous-push-orchestrator.js cycle
```

---

## 📊 Connection Status Dashboard

Run this to see live status of all connections:
```bash
node scripts/api-connection-manager.js
```

Expected output:
```
Testing Hugging Face LLM... [OK] (245ms)
Testing Discord Webhook... [OK] (123ms)
Testing Telegram Bot... [OK] (189ms)
Testing Stripe API... [OK] (312ms)
...
SUMMARY:
Total Connections Tested: 11
Successful: 8
Failed: 3
```

---

## 🚀 Next Steps After Setup

1. **Deploy to Production**
   ```bash
   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1 -DryRun:$false -DeployRemote
   ```

2. **Set Up Cron Jobs**
   - Schedule autonomous push cycles
   - Set up daily market briefs
   - Configure alert monitoring

3. **Monitor Performance**
   - Check API rate limits
   - Monitor connection health
   - Track push success rates

4. **Scale as Needed**
   - Add more social platforms
   - Increase push frequency
   - Expand content types

---

## 🔐 Security Best Practices

1. **Never Commit Secrets**
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in production
   - Rotate tokens regularly

2. **Monitor API Usage**
   - Track rate limits
   - Set up usage alerts
   - Monitor for unusual activity

3. **Secure Webhooks**
   - Verify signatures
   - Use HTTPS only
   - Implement rate limiting

4. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

---

## 📞 Troubleshooting

### HF Token Issues
```bash
# Verify token
curl -H "Authorization: Bearer hf_pdyLByADYtFFpUDxUvGcKpGCcMKNOIOY" \
  https://api-inference.huggingface.co/models/gpt2

# Expected: HTTP 200
```

### Discord Webhook Issues
```bash
# Test webhook
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"Test"}' \
  YOUR_WEBHOOK_URL

# Expected: HTTP 204
```

### Telegram Bot Issues
```bash
# Check bot status
curl https://api.telegram.org/botYOUR_TOKEN/getMe

# Expected: {"ok":true,"result":{...}}
```

---

## 📚 Additional Resources

- API Inventory: `API_CONNECTIONS_INVENTORY.md`
- HF Token Setup: `Documentation/HF_TOKEN_SETUP.md`
- Deployment Guide: `LIVEPASS_DEPLOYMENT_REPORT.md`
- Quick Reference: `QUICK_REFERENCE.md`

---

**Setup Complete?** Run the full test suite:
```bash
npm run test-connections && \
npm run verify-hf-token && \
node scripts/autonomous-push-orchestrator.js test
```

If all tests pass: **✅ Ready for autonomous AI-driven push system!**

