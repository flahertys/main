# TradeHax Backend API

🚀 **Production-Ready Authentication & User Management Server**

Secure backend for TradeHax Hybrid services with Web3 wallet authentication, OAuth 2.0 social login (Discord & Gmail), JWT token management, and user tier system.

## ✨ Features

### Authentication Methods
- **Web3 Solana Wallet**: Sign-in with Phantom, Solflare, or any Solana wallet
- **Discord OAuth**: Authenticate with Discord account
- **Gmail OAuth**: Authenticate with Google account

### Security
- ✅ Rate limiting (10 auth req/15 min)
- ✅ CSRF protection (state parameter validation)
- ✅ JWT token verification (7-day expiration)
- ✅ Input validation (wallet format, tier values, email)
- ✅ CORS origin validation
- ✅ Secure HTTP headers (HSTS, X-Frame-Options, CSP)

### User Management
- User profiles with authentication history
- Tier system (free, premium, vip)
- Discord role assignment support
- Login tracking and statistics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Discord app credentials (from Discord Developer Portal)
- Google OAuth credentials (from Google Cloud Console)

### Installation

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev

# Or start production server
NODE_ENV=production npm start
```

## 📖 API Endpoints

### Web3 Authentication

#### Get Challenge
```http
POST /auth/web3/challenge
Content-Type: application/json

{
  "wallet": "YOUR_SOLANA_WALLET_ADDRESS"
}

Response:
{
  "challenge": "Sign this to log in to Hackavelli Hax: 1234567890.a1b2c3d4...",
  "nonce": "a1b2c3d4e5f6g7h8...",
  "timestamp": 1234567890
}
```

#### Verify Signature
```http
POST /auth/web3/verify
Content-Type: application/json

{
  "wallet": "YOUR_SOLANA_WALLET_ADDRESS",
  "signature": "SIGNED_MESSAGE_FROM_WALLET",
  "challenge": "Sign this to log in to Hackavelli Hax: 1234567890.a1b2c3d4..."
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "wallet": "YOUR_WALLET",
    "tier": "free",
    "loginCount": 1
  },
  "expiresIn": 604800
}
```

### OAuth Authentication

#### Discord
```
GET /auth/oauth/discord
```
Redirects to Discord OAuth flow, then back to frontend with JWT in URL hash.

#### Gmail
```
GET /auth/oauth/gmail
```
Redirects to Google OAuth flow, then back to frontend with JWT in URL hash.

### User Endpoints

#### Get User Profile
```http
GET /user/:wallet
Authorization: Bearer JWT_TOKEN

Response:
{
  "wallet": "YOUR_WALLET",
  "tier": "free",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLogin": "2025-01-15T10:30:00Z",
  "loginCount": 5
}
```

#### Update User Tier (Admin Only)
```http
POST /user/:wallet/tier
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "tier": "premium"
}

Response:
{
  "success": true,
  "wallet": "YOUR_WALLET",
  "tier": "premium",
  "tierUpdatedAt": "2025-01-15T10:30:00Z"
}
```

### Discord Role Assignment

```http
POST /discord/assign-role
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "discordUserId": "123456789",
  "guildId": "987654321",
  "roleName": "premium-member"
}

Response:
{
  "success": true,
  "message": "Role assignment for 'premium-member' queued",
  "discordUserId": "123456789",
  "guildId": "987654321",
  "roleName": "premium-member"
}
```

### Health Check

```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "environment": "production",
  "uptime": 3600
}
```

## 🔐 Environment Variables

Required for production:

```bash
# Server
NODE_ENV=production
PORT=3001
BACKEND_URL=https://api.tradehax.net
FRONTEND_URL=https://tradehax.net

# Security
JWT_SECRET=your-super-secret-key-change-in-production

# Discord OAuth
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://api.tradehax.net/auth/oauth/discord/callback
DISCORD_STATE_KEY=discord-state-key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://api.tradehax.net/auth/oauth/gmail/callback
GOOGLE_STATE_KEY=google-state-key

# Optional
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_server_id

# Solana (required for wallet endpoints)
# Cluster: mainnet-beta | devnet | testnet
SOLANA_NETWORK=mainnet-beta
# Use a dedicated RPC provider (Helius/Triton/QuickNode/etc.) for production reliability
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional: Alerting
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

See [.env.example](.env.example) for complete template.

## 📚 Documentation

- **[SECURITY_HARDENING.md](./SECURITY_HARDENING.md)** - Security implementation details
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deploy to Heroku, AWS, DigitalOcean, Docker
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Frontend integration & architecture
- **[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)** - Pre-launch verification
- **[COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)** - What's been done & what's next

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl https://api.tradehax.net/health

# Web3 challenge
curl -X POST https://api.tradehax.net/auth/web3/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet":"YOUR_WALLET"}'

# OAuth Discord (open in browser)
https://api.tradehax.net/auth/oauth/discord

# Rate limiting test (expect 429 after 10 requests)
for i in {1..15}; do
  curl -X POST https://api.tradehax.net/auth/web3/challenge \
    -H "Content-Type: application/json" \
    -d '{"wallet":"test"}'
done
```

## 🚀 Deployment

### Heroku (Recommended)
```bash
heroku create tradehax-api
heroku config:set JWT_SECRET=xxx --app tradehax-api
heroku config:set DISCORD_CLIENT_ID=xxx --app tradehax-api
# ... set other variables
git push heroku main
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Docker
```bash
docker build -t tradehax-api .
docker run -p 3001:3001 \
  -e JWT_SECRET=xxx \
  -e DISCORD_CLIENT_ID=xxx \
  tradehax-api
```

### AWS, DigitalOcean, or Self-Hosted
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for platform-specific instructions.

## 🔄 Development Workflow

```bash
# Start dev server with auto-reload
npm run dev

# Run tests (if applicable)
npm test

# Check for security vulnerabilities
npm audit

# Format code
npm run format
```

## 🛠️ Architecture

```
Request
  ↓
Security Middleware (CORS, headers, rate limit)
  ↓
Input Validation
  ↓
Authentication (JWT, Web3, OAuth)
  ↓
Authorization (role check, user access)
  ↓
Business Logic (create user, update tier, etc.)
  ↓
Response / Database
```

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth | 10 req | 15 min |
| OAuth | 5 req | 1 min |
| General | 100 req | 15 min |

Limits reset after window expires.

## 🔐 Security Best Practices

- ✅ Never commit `.env` file to git
- ✅ Store secrets in secure environment variables
- ✅ Use HTTPS only in production
- ✅ Rotate JWT_SECRET periodically
- ✅ Monitor error logs for attacks
- ✅ Update dependencies monthly
- ✅ Enable HSTS header
- ✅ Restrict CORS to trusted origins

## 🚨 Troubleshooting

### OAuth Callback Fails
- Verify DISCORD_CLIENT_SECRET and GOOGLE_CLIENT_SECRET
- Check redirect URIs match exactly
- Ensure time is synchronized on server

### JWT Token Rejected
- Verify JWT_SECRET is consistent
- Check token expiration (7 days)
- Include "Bearer " prefix in Authorization header

### CORS Blocked
- Verify frontend URL in FRONTEND_URL env var
- Check allowed origins in code
- Ensure https:// in production

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting) for more solutions.

## 📞 Support

- Check documentation files in this directory
- Review error messages in server logs
- Test with provided curl examples
- Monitor uptime at https://api.tradehax.net/health

## 📄 License

Same license as main TradeHax project.

## 🎯 Next Steps

1. ✅ [Setup OAuth credentials](./DEPLOYMENT_GUIDE.md#pre-deployment-checklist)
2. ✅ [Configure environment variables](./.env.example)
3. ✅ [Choose deployment platform](./DEPLOYMENT_GUIDE.md#deployment-options)
4. ✅ [Deploy to production](./DEPLOYMENT_GUIDE.md)
5. ✅ [Monitor and maintain](./LAUNCH_CHECKLIST.md#daily-operations-checklist)

---

**Status**: ✅ Production Ready
**Last Updated**: 2025
**Maintained By**: TradeHax Team
