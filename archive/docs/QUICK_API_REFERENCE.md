# Quick API Keys Reference Card

Essential API keys and environment variables needed for Vercel deployment.

---

## 🚀 Essential (Must Have)

### 1. Solana Blockchain
```bash
SHAMROCK_MINT=YourMintPubkeyHere
AUTHORITY_SECRET=[1,2,3,...,32]  # 32-number array from keypair.json
SOLANA_RPC=https://api.devnet.solana.com
```
**Get from**: Solana CLI (see [VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md#1-solana-blockchain-shamrock-token))

### 2. MongoDB Database
```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/tradehax
```
**Get from**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (FREE)

### 3. JWT Security
```bash
JWT_SECRET=<generate-secure-random-string>
```
**Generate with**: `openssl rand -base64 32`

---

## 🔑 Authentication (Recommended)

### 4. Discord OAuth
```bash
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_REDIRECT_URI=https://api.tradehax.net/auth/oauth/discord/callback
```
**Get from**: [discord.com/developers/applications](https://discord.com/developers/applications)

### 5. Google OAuth
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://api.tradehax.net/auth/oauth/gmail/callback
```
**Get from**: [console.cloud.google.com](https://console.cloud.google.com)

---

## ⭐ Optional Features

### 6. Twitter/X API (Task Verification)
```bash
TWITTER_APP_KEY=your_app_key
TWITTER_APP_SECRET=your_app_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```
**Get from**: [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)

### 7. EmailJS (Contact Forms)
```javascript
// In index.html or script.js
window.__EMAILJS_CONFIG = {
  USER_ID: 'your_user_id',
  REPAIRS: {
    SERVICE_ID: 'service_id',
    TEMPLATE_ID: 'template_id'
  }
}
```
**Get from**: [emailjs.com](https://www.emailjs.com) (200 emails/month FREE)

### 8. PayPal (Payments)
```bash
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_SECRET=your-secret
```
**Get from**: [developer.paypal.com](https://developer.paypal.com/dashboard/)

### 9. WalletConnect (Web3)
```bash
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
```
**Get from**: [cloud.walletconnect.com](https://cloud.walletconnect.com)

### 10. Google Analytics (Tracking)
```javascript
// In index.html
gtag('config', 'GA_MEASUREMENT_ID');  // Replace GA_MEASUREMENT_ID
```
**Get from**: [analytics.google.com](https://analytics.google.com)

---

## 📋 Minimum Deployment Checklist

Quick checklist for getting your app live:

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Set essential environment variables
vercel env add SHAMROCK_MINT
vercel env add AUTHORITY_SECRET
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add SOLANA_RPC

# 4. Deploy
vercel --prod

# 5. Test
curl https://your-app.vercel.app/api/health
```

---

## 🔒 Security Reminders

- ✅ **Never commit `.env` files** to git
- ✅ **Use different keys** for dev/prod
- ✅ **Rotate secrets regularly**
- ✅ **Enable 2FA** on all accounts
- ❌ **Never share API keys** publicly

---

## 🆘 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| "Missing SHAMROCK_MINT" | Add to Vercel env vars and redeploy |
| "MongoDB connection failed" | Check MONGODB_URI and IP whitelist (0.0.0.0/0) |
| "Discord redirect mismatch" | Verify DISCORD_REDIRECT_URI matches exactly |
| "401 Unauthorized" | Check JWT_SECRET is set |

---

## 📚 Full Documentation

For detailed setup instructions, see:
- **[VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md)** - Complete guide with step-by-step instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Solana and token setup
- **[tradehax-backend/README.md](./tradehax-backend/README.md)** - Backend API docs

---

## 🎯 Priority Order

### Week 1 (Essential)
1. Vercel account + project setup
2. Solana SHAMROCK token
3. MongoDB database
4. Deploy with minimum config

### Week 2 (Authentication)
5. Discord OAuth
6. Google OAuth
7. Test authentication flow

### Week 3+ (Features)
8. Twitter API (if needed)
9. EmailJS (contact forms)
10. PayPal (payments)
11. Analytics & monitoring

---

**Need Help?** See the full [VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md) guide for detailed instructions.
