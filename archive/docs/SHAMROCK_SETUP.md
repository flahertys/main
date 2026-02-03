# Astral Awakening: TradeHax - Complete Setup Guide

## Prerequisites

### Required Tools
- **Solana CLI**: https://docs.solana.com/cli/install-solana-cli-tools
- **Node.js 18+**: https://nodejs.org/
- **npm or yarn**: Comes with Node.js
- **Vercel Account**: https://vercel.com
- **Git**: https://git-scm.com/

### Optional Tools
- **Phantom Wallet**: https://phantom.app (for testing)
- **Solflare Wallet**: https://solflare.com

---

## 1. Create SHAMROCK Token on Solana Devnet

### Step 1.1: Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"
```

### Step 1.2: Configure Solana CLI for Devnet
```bash
solana config set --url https://api.devnet.solana.com
solana config get
```

### Step 1.3: Create Authority Wallet
```bash
solana-keygen new --outfile ~/my-wallets/authority-keypair.json
```

### Step 1.4: Airdrop SOL to Authority Wallet
```bash
solana airdrop 2 ~/my-wallets/authority-keypair.json --url devnet
solana airdrop 2 ~/my-wallets/authority-keypair.json --url devnet  # May need 2-3 drops
```

### Step 1.5: Create Token Mint Keypair
```bash
solana-keygen new --outfile mint-keypair.json
```

### Step 1.6: Get Mint Public Key
```bash
MINT_PUBKEY=$(solana-keygen pubkey mint-keypair.json)
echo "SHAMROCK_MINT=$MINT_PUBKEY"
```

### Step 1.7: Calculate and Fund Rent
```bash
RENT=$(solana rent 82 --url devnet | grep "Minimum balance" | awk '{print $4}')
solana transfer ~/my-wallets/authority-keypair.json $MINT_PUBKEY $RENT \
  --allow-unfunded-recipient --signer mint-keypair.json --url devnet
```

### Step 1.8: Initialize Token Mint
```bash
spl-token initialize-mint mint-keypair.json \
  --decimals 9 \
  --mint-authority ~/my-wallets/authority-keypair.json \
  --url devnet
```

### Step 1.9: Create Token Account for Authority
```bash
spl-token create-account $MINT_PUBKEY \
  --owner ~/my-wallets/authority-keypair.json \
  --url devnet
```

Get the token account address:
```bash
TOKEN_ACCOUNT=$(spl-token accounts --owner ~/my-wallets/authority-keypair.json --url devnet | grep -A1 "$MINT_PUBKEY" | tail -1 | awk '{print $1}')
echo "TOKEN_ACCOUNT=$TOKEN_ACCOUNT"
```

### Step 1.10: Mint Initial Supply (1M tokens)
```bash
spl-token mint $MINT_PUBKEY 1000000000000000 $TOKEN_ACCOUNT --url devnet
```

### Step 1.11: Save Credentials
```bash
# Get authority secret key
cat ~/my-wallets/authority-keypair.json
```

**Save these values:**
- `SHAMROCK_MINT` - The mint public key
- `AUTHORITY_SECRET` - The authority keypair array (from cat command)
- `TOKEN_ACCOUNT` - The token account public key

---

## 2. Set Up Backend on Vercel

### Step 2.1: Install Dependencies
```bash
cd tradehax-backend
npm install
```

### Step 2.2: Test Locally
```bash
npm run dev
# Visit http://localhost:3001/api/health
```

### Step 2.3: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Option B: Using GitHub
1. Push `tradehax-backend` to your GitHub repository
2. Go to https://vercel.com
3. Click "New Project"
4. Import from Git
5. Select your repository
6. Configure project name and root directory

### Step 2.4: Add Environment Variables
In Vercel dashboard for your backend project:

Go to **Settings** → **Environment Variables** and add:

```
SHAMROCK_MINT=<your-mint-public-key>
AUTHORITY_SECRET=<your-authority-keypair-as-json-array>
SOLANA_RPC=https://api.devnet.solana.com
MONGODB_URI=<optional-mongo-atlas-uri>
TWITTER_APP_KEY=<your-twitter-key>
TWITTER_APP_SECRET=<your-twitter-secret>
TWITTER_ACCESS_TOKEN=<your-twitter-token>
TWITTER_ACCESS_SECRET=<your-twitter-access-secret>
```

### Step 2.5: Verify Deployment
```bash
curl https://your-project.vercel.app/api/health
```

You should see:
```json
{"status":"ok","message":"TradeHax backend is running"}
```

**Save:** The backend URL (e.g., `https://your-project.vercel.app`)

---

## 3. Set Up Frontend on GitHub Pages

### Step 3.1: Install Dependencies
```bash
cd tradehax-frontend
npm install
```

### Step 3.2: Create .env File
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_BACKEND_URL=https://your-backend-url.vercel.app
VITE_SOLANA_NETWORK=devnet
```

### Step 3.3: Test Locally
```bash
npm run dev
# Visit http://localhost:5173
```

Test wallet connection and game functionality.

### Step 3.4: Build for Production
```bash
npm run build
```

This creates the `dist/` folder ready for deployment.

### Step 3.5: Deploy to GitHub Pages

#### Option A: Automatic (Recommended)
1. Create GitHub Actions workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'tradehax-frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd tradehax-frontend && npm install
      
      - name: Build
        run: cd tradehax-frontend && npm run build
      
      - name: Deploy to Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./tradehax-frontend/dist
          cname: yourdomain.com  # Optional: for custom domain
```

2. Commit and push to trigger deployment

#### Option B: Manual
```bash
cd tradehax-frontend
npm run build
# Copy dist/ contents to your hosting provider
```

### Step 3.6: Configure Custom Domain (Optional)
In your GitHub repository:
1. Go to **Settings** → **Pages**
2. Select source: **GitHub Actions** or **Deploy from branch**
3. Add custom domain in the pages section
4. Create CNAME file with your domain

---

## 4. Configure Twitter/X API (Optional for Task Verification)

### Step 4.1: Get API Keys
1. Go to https://developer.x.com
2. Create a new app
3. Get your API keys and tokens
4. Add to Vercel environment variables

### Step 4.2: Test Task Reward
```bash
curl -X POST https://your-backend.vercel.app/api/award-task \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "YOUR_WALLET_ADDRESS",
    "tweetUrl": "https://x.com/user/status/1234567890"
  }'
```

---

## 5. Production Checklist

### Before Going Mainnet
- [ ] Backend deployed on Vercel
- [ ] Frontend deployed on GitHub Pages or custom domain
- [ ] Environment variables set correctly
- [ ] Wallet connection tested with Phantom/Solflare
- [ ] Task reward system verified
- [ ] PWA installable on mobile
- [ ] CORS configured properly
- [ ] Error handling tested

### Mainnet Migration
1. Change `SOLANA_RPC` to: `https://api.mainnet-beta.solana.com`
2. Create SHAMROCK token on mainnet with same process
3. Fund authority wallet with real SOL
4. Update all environment variables
5. Update frontend network to `Mainnet-Beta`
6. Deploy updates

---

## 6. Troubleshooting

### Problem: "Invalid Account" when minting
- Ensure rent is properly funded
- Check mint authority is correct

### Problem: Backend not found 404
- Verify Vercel deployment succeeded
- Check environment variables are set
- Test health endpoint: `/api/health`

### Problem: Wallet not connecting
- Ensure Solana CLI is on devnet
- Try Phantom wallet first (more common)
- Check browser console for errors

### Problem: Token transfer fails
- Verify associated token account exists
- Check authority wallet has SOL for gas
- Ensure token mint address is correct

---

## Deployment URLs

After setup, update these files with your URLs:

1. **Frontend `.env`**:
   ```
   VITE_BACKEND_URL=https://your-backend.vercel.app
   ```

2. **Backend `vercel.json`** (if using Vercel):
   - No changes needed; uses environment variables

3. **Frontend `vite.config.js`**:
   - No changes needed; uses environment variables

---

## Next Steps

1. Add custom domain to your site
2. Set up monitoring and error tracking
3. Create tutorial/onboarding flow
4. Add more game features and collectibles
5. Launch marketing campaign with #HyperboreaAscent
6. Monitor Solana gas fees and adjust pricing
7. Scale to other Solana programs (NFT mints, swaps, etc.)

---

## Resources

- **Solana Docs**: https://docs.solana.com
- **SPL Token Program**: https://spl.solana.com/token
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
- **Three.js**: https://threejs.org/docs/
- **Vite**: https://vitejs.dev/
- **Vercel**: https://vercel.com/docs
