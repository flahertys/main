# TradeHax Integration Guide - Backend + Frontend Deployment

This guide covers deploying the **Astral Awakening: TradeHax** game (backend API + React frontend) and integrating it with the main site.

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Site (GitHub Pages)                │
│              tradehax.net (index.html, services.html)        │
│                  + Game Links & Navigation                   │
└─────────────────┬───────────────────────────────────────────┘
                  │ Links to game
                  ▼
┌─────────────────────────────────────────────────────────────┐
│     Frontend (GitHub Pages or Vercel)                        │
│  tradehax-frontend/dist → game.tradehax.net or /game        │
│  React + Three.js Game with Web3                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ API calls
                   ▼
┌─────────────────────────────────────────────────────────────┐
│     Backend (Vercel)                                         │
│  tradehax-backend → api.tradehax.net or vercel deploy      │
│  Express.js + Solana + NFT Minting                           │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js 18+** and npm
- **Git** and GitHub account
- **Vercel account** (for backend deployment)
- **Solana CLI** (for token setup)
- **SHAMROCK token** created on Solana devnet

## Step 1: Backend Setup (Vercel)

### 1.1 Create SHAMROCK Token (One-time)

Follow the detailed instructions in [SHAMROCK_SETUP.md](./SHAMROCK_SETUP.md) sections 1-1.11:

```bash
# Quick summary:
solana config set --url https://api.devnet.solana.com
solana-keygen new --outfile ~/my-wallets/authority-keypair.json
solana airdrop 2 ~/my-wallets/authority-keypair.json --url devnet
solana-keygen new --outfile mint-keypair.json
MINT_PUBKEY=$(solana-keygen pubkey mint-keypair.json)
# ... [continue with full setup from SHAMROCK_SETUP.md]
```

**You'll need these values:**
- `SHAMROCK_MINT` - Token mint public key
- `AUTHORITY_SECRET` - Authority keypair array (from `cat ~/my-wallets/authority-keypair.json`)
- `TOKEN_ACCOUNT` - Token account public key

### 1.2 Test Backend Locally

```bash
cd tradehax-backend
npm install
npm run dev
```

Visit `http://localhost:3001/api/health` - should return:
```json
{"status":"ok","message":"TradeHax backend is running"}
```

### 1.3 Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
npm install -g vercel
cd tradehax-backend
vercel login
vercel --prod
```

**Option B: Using GitHub Integration**

1. Push `tradehax-backend` to your GitHub repo
2. Go to https://vercel.com
3. Click "New Project" → "Import from Git"
4. Select your repository
5. Set root directory to `tradehax-backend`
6. Deploy

### 1.4 Add Environment Variables in Vercel

In your Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add each variable:

```
SHAMROCK_MINT=<your-mint-pubkey>
AUTHORITY_SECRET=<your-authority-keypair-array>
SOLANA_RPC=https://api.devnet.solana.com
MONGODB_URI=<optional-mongo-atlas-uri>
TWITTER_APP_KEY=<your-key>
TWITTER_APP_SECRET=<your-secret>
TWITTER_ACCESS_TOKEN=<your-token>
TWITTER_ACCESS_SECRET=<your-secret>
```

### 1.5 Verify Deployment

```bash
curl https://your-vercel-app.vercel.app/api/health
```

Should return `{"status":"ok","message":"TradeHax backend is running"}`

**Save your backend URL** for the next step.

---

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd tradehax-frontend
npm install
```

### 2.2 Configure Environment

Edit or create `tradehax-frontend/.env`:

```
VITE_BACKEND_URL=https://your-backend-url.vercel.app
VITE_SOLANA_NETWORK=devnet
```

Replace `your-backend-url.vercel.app` with your actual Vercel backend URL.

### 2.3 Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and test:
- Connect Phantom wallet
- Collect clovers (WASD movement)
- Tweet quest reward
- NFT minting

### 2.4 Build for Production

```bash
npm run build
```

Creates optimized `dist/` folder ready to deploy.

### 2.5 Deploy to GitHub Pages

The workflow at `.github/workflows/deploy-frontend.yml` automatically deploys when you push to `main` with changes to `tradehax-frontend/`.

**To manually deploy:**

```bash
npm run build
# GitHub Actions will handle deployment automatically
git add tradehax-frontend/
git commit -m "Update game frontend"
git push origin main
```

Check deployment progress:
1. Go to your GitHub repo
2. Click **Actions** tab
3. Find "Deploy Frontend to GitHub Pages" workflow
4. Wait for ✅ completion

**Your game will be live at:** `https://<your-username>.github.io/tradehax-frontend/` (unless configured with custom domain)

---

## Step 3: Configure Custom Domain (Optional)

### 3.1 For Frontend (Game)

1. In GitHub repo: **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **GitHub Actions**
3. Custom domain (if desired):
   - Add subdomain record in DNS pointing to GitHub Pages

### 3.2 For Backend

If using Vercel, they provide a `.vercel.app` domain automatically. For custom domain:

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain and follow DNS setup

---

## Step 4: Integrate with Main Site

### 4.1 Add Game Link to Navigation

Edit `index.html` - add game link to navigation section:

```html
<a href="/tradehax-frontend/">Play Astral Awakening</a>
```

Or link to your custom game domain:

```html
<a href="https://game.tradehax.net/">Play Astral Awakening</a>
```

### 4.2 Add Game Section to Homepage

Add a new section to `index.html` (optional but recommended):

```html
<section id="game" class="game-section">
    <h2>Astral Awakening: The Game</h2>
    <p>Collect clovers, earn SHAMROCK tokens, and mint NFT skins!</p>
    <a href="/tradehax-frontend/" class="btn">Play Now</a>
</section>
```

### 4.3 Update Sitemap

Edit `sitemap.xml` to include game URL:

```xml
<url>
    <loc>https://tradehax.net/tradehax-frontend/</loc>
    <changefreq>weekly</changefreq>
</url>
```

---

## Testing Checklist

Before going live, verify:

### Backend
- [ ] Health endpoint returns `{"status":"ok",...}`
- [ ] Backend logs show no errors
- [ ] Environment variables set in Vercel dashboard
- [ ] Token transfer test works (manual curl request)

### Frontend
- [ ] Builds successfully (`npm run build`)
- [ ] Loads at deployment URL
- [ ] Wallet connection works with Phantom/Solflare
- [ ] Can collect clovers (WASD movement)
- [ ] Energy system works (5 clovers = 100 energy)
- [ ] Tweet quest submission works
- [ ] NFT minting panel displays skins
- [ ] Backend URL in `.env` is correct
- [ ] No console errors (F12 → Console)

### Integration
- [ ] Main site navigation links to game
- [ ] Game page loads correctly
- [ ] Smooth scroll/navigation between site sections
- [ ] Mobile responsive on both sites

---

## Troubleshooting

### Backend won't deploy
```bash
# Verify file structure
ls tradehax-backend/
# Should have: api/, package.json, vercel.json

# Check for syntax errors
node tradehax-backend/api/index.js
```

### Frontend won't connect to backend
```bash
# Check your .env file
cat tradehax-frontend/.env

# Verify backend URL is correct
curl https://your-backend.vercel.app/api/health

# Check browser console (F12) for error messages
```

### Wallet connection fails
- Ensure Phantom wallet is installed
- Switch Phantom to **Solana Devnet**
- Try refreshing the page
- Clear browser cache

### Rewards not showing
- Verify tweet contains `#HyperboreaAscent`
- Check authority wallet has SOL for gas fees
- Review Vercel backend logs for errors
- Confirm `SHAMROCK_MINT` environment variable is correct

### GitHub Actions workflow not running
1. Push changes to `tradehax-frontend/` directory
2. Check **Actions** tab in GitHub repo
3. If blocked: Go to **Actions** → **Enable workflows**
4. Re-push changes to trigger

---

## Production Migration to Mainnet

When ready to go live on Solana mainnet:

1. Create new SHAMROCK token on mainnet (repeat Step 1 with `--url mainnet-beta`)
2. Update backend environment variables:
   - `SOLANA_RPC`: `https://api.mainnet-beta.solana.com`
   - `SHAMROCK_MINT`: New mainnet mint address
   - `AUTHORITY_SECRET`: New mainnet authority keypair
3. Fund authority wallet with real SOL
4. Update frontend `.env`:
   - `VITE_SOLANA_NETWORK=mainnet-beta`
5. Redeploy both backend and frontend
6. Test with real wallets on mainnet

---

## Useful Commands

### Frontend
```bash
cd tradehax-frontend
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:5173)
npm run build      # Build for production
npm run lint       # Check code quality
```

### Backend
```bash
cd tradehax-backend
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3001)
npm run start      # Production start
```

### Git
```bash
git status         # See changes
git add .          # Stage all changes
git commit -m "message"  # Commit
git push origin main     # Push to GitHub
```

---

## Resources

- **Frontend README**: [tradehax-frontend/README.md](./tradehax-frontend/README.md)
- **Backend README**: [tradehax-backend/README.md](./tradehax-backend/README.md)
- **SHAMROCK Token Setup**: [SHAMROCK_SETUP.md](./SHAMROCK_SETUP.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Solana Docs**: https://docs.solana.com

---

## Support

For issues:
1. Check browser console (F12)
2. Review backend logs in Vercel
3. Check GitHub Actions logs for deployment errors
4. Refer to README files for each app
