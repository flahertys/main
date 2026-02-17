# Vercel API Keys & Configuration Guide

Complete guide for setting up all required API keys and environment variables for your TradeHax Vercel deployment.

---

## Table of Contents
1. [Vercel Project Setup](#vercel-project-setup)
2. [Required API Keys](#required-api-keys)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Security Best Practices](#security-best-practices)
6. [Quick Deployment Checklist](#quick-deployment-checklist)

---

## Vercel Project Setup

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Connect your repository: `darkmodder33.github.io`

### 2. Import Project
```bash
# Using Vercel CLI (recommended)
npm i -g vercel
vercel login
vercel --prod
```

Or use the Vercel dashboard:
- Dashboard → "Add New..." → "Project"
- Import Git Repository → Select `darkmodder33.github.io`

---

## Required API Keys

### Essential Services (Required)

#### 1. **Solana Blockchain** (SHAMROCK Token)
- **Purpose**: Token rewards, blockchain transactions
- **Where**: Solana CLI (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))
- **Cost**: Free (devnet), Transaction fees (mainnet)

Required variables:
```bash
SHAMROCK_MINT=<your-mint-pubkey>
AUTHORITY_SECRET=[1,2,3,...,32]  # JSON array of 32 numbers
SOLANA_RPC=https://api.devnet.solana.com
```

**How to Get**:
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"

# Create authority wallet
solana-keygen new --outfile ~/authority-keypair.json

# Get the secret key array
cat ~/authority-keypair.json
# Copy the array of numbers [1,2,3,...,32]

# Create SHAMROCK token
solana-keygen new --outfile ~/mint-keypair.json
MINT_PUBKEY=$(solana-keygen pubkey ~/mint-keypair.json)
echo "SHAMROCK_MINT: $MINT_PUBKEY"
```

---

#### 2. **MongoDB Atlas** (Database)
- **Purpose**: Store user data, tasks, rewards
- **Where**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Cost**: Free tier available (512MB)

Required variable:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tradehax?retryWrites=true&w=majority
```

**How to Get**:
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox - FREE)
3. Create database user:
   - Database Access → Add New Database User
   - Username: `tradehax_user`
   - Password: (auto-generate or create secure password)
4. Whitelist IP addresses:
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` (allow from anywhere) for Vercel
5. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password

---

### Optional Services (Recommended)

#### 3. **Twitter/X API** (Task Verification)
- **Purpose**: Verify tweet tasks for rewards
- **Where**: [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
- **Cost**: Free tier available

Required variables:
```bash
TWITTER_APP_KEY=your_twitter_app_key
TWITTER_APP_SECRET=your_twitter_app_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
```

**How to Get**:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project/app
3. Navigate to "Keys and tokens"
4. Generate:
   - API Key & Secret (App Key & Secret)
   - Access Token & Secret
5. Save all 4 values

---

#### 4. **Discord OAuth** (Authentication)
- **Purpose**: Allow users to login with Discord
- **Where**: [discord.com/developers/applications](https://discord.com/developers/applications)
- **Cost**: Free

Required variables:
```bash
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=https://api.tradehax.net/auth/oauth/discord/callback
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=your-discord-server-id
```

**How to Get**:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "TradeHax"
4. OAuth2 → General:
   - Copy **Client ID**
   - Copy **Client Secret**
   - Add Redirect URL: `https://api.tradehax.net/auth/oauth/discord/callback`
5. Bot section:
   - Create bot
   - Copy **Bot Token**
6. Get Guild ID (Server ID):
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click your server → Copy ID

---

#### 5. **Google OAuth** (Gmail Authentication)
- **Purpose**: Allow users to login with Google
- **Where**: [console.cloud.google.com](https://console.cloud.google.com)
- **Cost**: Free

Required variables:
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.tradehax.net/auth/oauth/gmail/callback
```

**How to Get**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project "TradeHax"
3. Enable Google+ API:
   - APIs & Services → Library
   - Search "Google+ API"
   - Enable
4. Create OAuth credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://api.tradehax.net/auth/oauth/gmail/callback`
5. Copy Client ID and Client Secret

---

#### 6. **EmailJS** (Contact Forms)
- **Purpose**: Send contact form emails
- **Where**: [emailjs.com](https://www.emailjs.com)
- **Cost**: Free tier (200 emails/month)

Required variables (in frontend):
```javascript
window.__EMAILJS_CONFIG = {
  USER_ID: 'your_emailjs_user_id',
  REPAIRS: {
    SERVICE_ID: 'your_service_id',
    TEMPLATE_ID: 'your_template_id'
  },
  CONTACT: {
    SERVICE_ID: 'your_service_id',
    TEMPLATE_ID: 'your_template_id'
  }
}
```

**How to Get**:
1. Sign up at [emailjs.com](https://www.emailjs.com)
2. Get User ID:
   - Account → API Keys → Your User ID
3. Add Email Service:
   - Email Services → Add New Service
   - Choose provider (Gmail recommended)
4. Create Email Template:
   - Email Templates → Create New Template
   - Design your template
   - Copy Template ID
5. Copy Service ID from Email Services

---

#### 7. **PayPal** (Payments)
- **Purpose**: Accept payments for services
- **Where**: [developer.paypal.com](https://developer.paypal.com/dashboard/)
- **Cost**: Free (transaction fees apply)

Required variables:
```bash
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
```

**How to Get**:
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create app (Sandbox or Live)
3. Get credentials:
   - Client ID
   - Secret
4. Set up webhooks:
   - Webhooks → Add Webhook
   - Webhook URL: `https://api.tradehax.net/webhooks/paypal`
   - Events: Select payment events
   - Copy Webhook ID

---

#### 8. **WalletConnect** (Web3 Wallets)
- **Purpose**: Connect Solana/Ethereum wallets
- **Where**: [cloud.walletconnect.com](https://cloud.walletconnect.com)
- **Cost**: Free

Required variable:
```bash
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
```

**How to Get**:
1. Sign up at [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID

---

#### 9. **Google Analytics** (Optional)
- **Purpose**: Track website analytics
- **Where**: [analytics.google.com](https://analytics.google.com)
- **Cost**: Free

Update in `index.html`:
```javascript
gtag('config', 'GA_MEASUREMENT_ID');  // Replace with your ID
```

**How to Get**:
1. Go to [Google Analytics](https://analytics.google.com)
2. Create account and property
3. Get Measurement ID (format: G-XXXXXXXXXX)

---

## Environment Variables Reference

### Vercel Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables

#### TradeHax Backend (`tradehax-backend`)

```bash
# Solana & Blockchain
SHAMROCK_MINT=<your-mint-pubkey>
AUTHORITY_SECRET=[1,2,3,...,32]
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tradehax

# Twitter/X API
TWITTER_APP_KEY=<your-key>
TWITTER_APP_SECRET=<your-secret>
TWITTER_ACCESS_TOKEN=<your-token>
TWITTER_ACCESS_SECRET=<your-secret>

# Discord OAuth
DISCORD_CLIENT_ID=<your-client-id>
DISCORD_CLIENT_SECRET=<your-client-secret>
DISCORD_REDIRECT_URI=https://api.tradehax.net/auth/oauth/discord/callback
DISCORD_BOT_TOKEN=<your-bot-token>
DISCORD_GUILD_ID=<your-guild-id>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.tradehax.net/auth/oauth/gmail/callback

# PayPal
PAYPAL_CLIENT_ID=<your-paypal-client-id>
PAYPAL_SECRET=<your-paypal-secret>
PAYPAL_WEBHOOK_ID=<your-webhook-id>

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
NODE_ENV=production
```

#### TradeHax Frontend (`tradehax-frontend`)

```bash
VITE_BACKEND_URL=https://your-vercel-backend.vercel.app
VITE_SOLANA_NETWORK=devnet
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

---

## Step-by-Step Setup

### Phase 1: Essential Setup (Required)

1. **Create Vercel Account & Import Project**
   ```bash
   npm i -g vercel
   vercel login
   cd /path/to/darkmodder33.github.io
   vercel
   ```

2. **Set up Solana & SHAMROCK Token**
   - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) steps 1-4
   - Save `SHAMROCK_MINT` and `AUTHORITY_SECRET`

3. **Set up MongoDB**
   - Create free cluster at mongodb.com
   - Get connection string
   - Create database named `tradehax`

4. **Add Environment Variables to Vercel**
   ```bash
   # Using Vercel CLI
   vercel env add SHAMROCK_MINT
   vercel env add AUTHORITY_SECRET
   vercel env add MONGODB_URI
   ```
   
   Or use dashboard:
   - Vercel → Project → Settings → Environment Variables
   - Add each variable
   - Set environment: Production, Preview, Development

5. **Deploy**
   ```bash
   vercel --prod
   ```

### Phase 2: Authentication (Recommended)

6. **Set up Discord OAuth**
   - Follow Discord OAuth steps above
   - Add variables to Vercel

7. **Set up Google OAuth**
   - Follow Google OAuth steps above
   - Add variables to Vercel

### Phase 3: Optional Features

8. **Set up Twitter API** (for task verification)
9. **Set up EmailJS** (for contact forms)
10. **Set up PayPal** (for payments)
11. **Set up WalletConnect** (for Web3 wallets)
12. **Set up Google Analytics** (for tracking)

---

## Security Best Practices

### ✅ DO:
- **Use Vercel's encrypted environment variables** - Never commit `.env` files
- **Rotate secrets regularly** - Especially JWT_SECRET and API keys
- **Use separate keys for development/production**
- **Enable 2FA** on all service accounts
- **Whitelist IPs** where possible (MongoDB, APIs)
- **Use webhook secrets** for PayPal, Discord, etc.
- **Monitor API usage** to detect unauthorized access

### ❌ DON'T:
- **Never commit API keys to git** - Add `.env` to `.gitignore`
- **Never share API keys** publicly or in support tickets
- **Don't use production keys in development**
- **Don't hardcode secrets in frontend code**
- **Don't use weak JWT secrets**

### Security Checklist

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Check for exposed secrets (before committing)
git diff | grep -i "secret\|password\|api_key"

# Verify .gitignore includes:
# .env
# .env.local
# .env.production
```

---

## Quick Deployment Checklist

### Minimum Viable Deployment (MVP)

- [ ] Vercel account created
- [ ] Repository connected to Vercel
- [ ] `SHAMROCK_MINT` configured
- [ ] `AUTHORITY_SECRET` configured
- [ ] `SOLANA_RPC` set to devnet
- [ ] `MONGODB_URI` configured
- [ ] `JWT_SECRET` generated
- [ ] Environment variables added to Vercel
- [ ] Deploy to production (`vercel --prod`)
- [ ] Test health endpoint: `https://your-app.vercel.app/api/health`

### Full Production Deployment

- [ ] All MVP items completed
- [ ] Discord OAuth configured
- [ ] Google OAuth configured
- [ ] Twitter API configured (optional)
- [ ] EmailJS configured
- [ ] PayPal configured (optional)
- [ ] WalletConnect configured
- [ ] Google Analytics configured
- [ ] Custom domain configured (tradehax.net)
- [ ] SSL certificate active
- [ ] Error monitoring set up (Sentry)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] All endpoints tested

---

## Troubleshooting

### Common Issues

#### "Missing SHAMROCK_MINT environment variable"
- Add `SHAMROCK_MINT` to Vercel environment variables
- Redeploy after adding variables

#### "MongoDB connection failed"
- Check MONGODB_URI is correct
- Verify IP whitelist includes `0.0.0.0/0`
- Check database user has correct permissions

#### "Discord OAuth redirect mismatch"
- Verify `DISCORD_REDIRECT_URI` matches Discord app settings exactly
- Check for typos in domain name

#### "401 Unauthorized" on API calls
- Check `JWT_SECRET` is set
- Verify authentication tokens are being sent
- Check CORS configuration

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Solana Docs**: [docs.solana.com](https://docs.solana.com)
- **MongoDB Atlas**: [mongodb.com/docs/atlas](https://www.mongodb.com/docs/atlas/)
- **Discord Developers**: [discord.com/developers/docs](https://discord.com/developers/docs)

---

## Next Steps

After completing this setup:

1. **Test all endpoints** using the provided test scripts
2. **Monitor deployments** in Vercel dashboard
3. **Check logs** for any errors
4. **Set up monitoring** (Sentry, LogRocket, etc.)
5. **Configure custom domain** if not already done
6. **Enable analytics** to track usage

---

## Quick Reference: Vercel CLI Commands

```bash
# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull

# Remove environment variable
vercel env rm VARIABLE_NAME

# View logs
vercel logs

# View deployments
vercel ls

# Rollback deployment
vercel rollback
```

---

**Note**: This guide covers the TradeHax project. Adjust service configurations based on your specific needs.

For more details, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete Solana setup
- [SHAMROCK_SETUP.md](./SHAMROCK_SETUP.md) - SHAMROCK token details
- [backend/README.md](./backend/README.md) - Backend API documentation
- [tradehax-backend/README.md](./tradehax-backend/README.md) - TradeHax backend API
