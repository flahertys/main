# Complete Deployment Guide - Live Game Launch

Follow these steps to deploy TradeHax game to production.

---

## Step 1: Install Solana CLI (Local Machine)

### Windows
```powershell
# Run PowerShell as Administrator
irm https://release.solana.com/v1.18.22/solana-install-init.exe | iex
```

Close and reopen PowerShell, then verify:
```powershell
solana --version
```

### macOS/Linux
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"
```

---

## Step 2: Configure Solana for Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana config get
```

Should show: `RPC URL: https://api.devnet.solana.com`

---

## Step 3: Create Authority Wallet & Fund It

```bash
# Create directory for wallets
mkdir ~/my-wallets

# Generate authority keypair
solana-keygen new --outfile ~/my-wallets/authority-keypair.json

# Airdrop SOL (testnet funds - free)
solana airdrop 2 ~/my-wallets/authority-keypair.json --url devnet
solana airdrop 2 ~/my-wallets/authority-keypair.json --url devnet
```

**Wait 30 seconds between airdrops.** You need ~0.5 SOL for token creation.

Check balance:
```bash
solana balance ~/my-wallets/authority-keypair.json --url devnet
```

---

## Step 4: Create SHAMROCK Token

### 4.1 Generate Mint Keypair
```bash
cd ~/my-wallets
solana-keygen new --outfile mint-keypair.json

# Get the mint address
MINT_PUBKEY=$(solana-keygen pubkey mint-keypair.json)
echo "Your SHAMROCK_MINT: $MINT_PUBKEY"
```

**Save this - you need it for Vercel!**

### 4.2 Fund the Mint Account
```bash
# Get rent cost
RENT=$(solana rent 82 --url devnet | grep "Minimum balance" | awk '{print $4}')

# Transfer SOL to mint
solana transfer ~/my-wallets/authority-keypair.json $MINT_PUBKEY $RENT \
  --allow-unfunded-recipient --signer mint-keypair.json --url devnet
```

### 4.3 Initialize Token Mint
```bash
spl-token initialize-mint mint-keypair.json \
  --decimals 9 \
  --mint-authority ~/my-wallets/authority-keypair.json \
  --url devnet
```

### 4.4 Create Token Account
```bash
spl-token create-account $MINT_PUBKEY \
  --owner ~/my-wallets/authority-keypair.json \
  --url devnet
```

Get the token account:
```bash
TOKEN_ACCOUNT=$(spl-token accounts --owner ~/my-wallets/authority-keypair.json --url devnet | grep "$MINT_PUBKEY" | awk '{print $1}')
echo "TOKEN_ACCOUNT: $TOKEN_ACCOUNT"
```

### 4.5 Mint Initial Supply (1M tokens)
```bash
spl-token mint $MINT_PUBKEY 1000000000000000 $TOKEN_ACCOUNT --url devnet
```

---

## Step 5: Save Your Credentials

You need these for Vercel. Get the authority secret key:

```bash
cat ~/my-wallets/authority-keypair.json
```

**You'll see an array like:** `[1,2,3,...,255]`

**Save these values somewhere safe (not in Git):**
- `SHAMROCK_MINT` - Your mint public key (from Step 4.1)
- `AUTHORITY_SECRET` - The authority keypair array (from above)
- `TOKEN_ACCOUNT` - Your token account (from Step 4.4)

---

## Step 6: Deploy Backend to Vercel

### 6.1 Create/Login to Vercel Account

Go to https://vercel.com and create account (or login with GitHub).

### 6.2 Deploy Backend

**Option A: Using Vercel CLI (Recommended)**

```bash
npm install -g vercel
vercel login
cd tradehax-backend
vercel --prod
```

Follow prompts, confirm project settings.

**Option B: Using GitHub (Easier)**

1. Make sure `tradehax-backend/` is committed to GitHub
2. Go to https://vercel.com/new
3. Click "Import Git Repository"
4. Select your GitHub repo
5. Root directory: `tradehax-backend`
6. Click "Deploy"

### 6.3 Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
SHAMROCK_MINT = <your-mint-from-step-4.1>
AUTHORITY_SECRET = <your-keypair-array-from-step-5>
SOLANA_RPC = https://api.devnet.solana.com
MONGODB_URI = (optional - leave empty)
TWITTER_APP_KEY = (optional - leave empty)
TWITTER_APP_SECRET = (optional - leave empty)
TWITTER_ACCESS_TOKEN = (optional - leave empty)
TWITTER_ACCESS_SECRET = (optional - leave empty)
```

4. Click "Save"
5. Redeploy (Deployments → Redeploy)

### 6.4 Test Backend

```bash
curl https://your-project.vercel.app/api/health
```

Should return:
```json
{"status":"ok","message":"TradeHax backend is running"}
```

**Save your backend URL:** `https://your-project.vercel.app`

---

## Step 7: Update Frontend Environment

1. Edit `tradehax-frontend/.env`:

```
VITE_BACKEND_URL=https://your-project.vercel.app
VITE_SOLANA_NETWORK=devnet
```

Replace `your-project.vercel.app` with your actual Vercel backend URL.

2. Commit and push:

```bash
git add tradehax-frontend/.env
git commit -m "Configure backend URL for production"
git push origin main
```

---

## Step 8: Deploy Frontend to GitHub Pages

GitHub Actions workflow is already configured at `.github/workflows/deploy-frontend.yml`

When you push changes to `tradehax-frontend/`, it automatically:
1. Installs dependencies
2. Builds the project
3. Deploys to GitHub Pages

### 8.1 Check Deployment Status

1. Go to your GitHub repo
2. Click **Actions** tab
3. Find "Deploy Frontend to GitHub Pages" workflow
4. Wait for ✅ green checkmark

### 8.2 Access Your Game

After deployment completes:

```
https://yourusername.github.io/tradehax-frontend/
```

(Replace `yourusername` with your GitHub username)

---

## Step 9: Test the Game

1. Open the game URL
2. Click "Connect Wallet"
3. Select Phantom wallet
4. Make sure Phantom is set to **Devnet**
5. Approve connection
6. Play! (WASD to move)

---

## Step 10: Verify All Features

### Wallet Connection
- [ ] Connect button works
- [ ] Phantom prompts for approval
- [ ] Wallet address displayed

### Game
- [ ] Game loads (3D maze visible)
- [ ] WASD movement works
- [ ] Clovers spawn and collect
- [ ] Energy bar fills up
- [ ] Portal appears at 100 energy

### Rewards
- [ ] Tweet quest button works
- [ ] Can submit tweet URL
- [ ] Get 100 SHAMROCK tokens
- [ ] See transaction on Solana Explorer

### NFT Minting
- [ ] NFT mint panel opens
- [ ] Can see 5 skins
- [ ] Can mint with 10 SHAMROCK
- [ ] NFT appears in Phantom wallet

---

## Troubleshooting

### Backend won't deploy
```
Error: "SHAMROCK_MINT is not set"
→ Add environment variables in Vercel dashboard
→ Redeploy the project
```

### Frontend won't connect to backend
```
Error: "Failed to fetch from backend"
→ Check .env file has correct URL
→ Verify backend health endpoint works
→ Check CORS in backend (should be enabled)
```

### Wallet won't connect
```
→ Install Phantom: https://phantom.app
→ Set Phantom to Devnet network
→ Try refreshing page
→ Clear browser cache
```

### No rewards showing
```
→ Verify tweet contains #HyperboreaAscent
→ Check authority wallet has SOL
→ View backend logs in Vercel
→ Confirm SHAMROCK_MINT is correct
```

---

## Links

- **Frontend URL:** https://yourusername.github.io/tradehax-frontend/
- **Backend URL:** https://your-project.vercel.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Actions:** Go to Actions tab on GitHub
- **Solana Explorer (Devnet):** https://explorer.solana.com?cluster=devnet

---

## What's Next?

After verifying everything works:

1. **Get Feedback** - Let users test the game
2. **Add Polish** - Improve UI/UX based on feedback
3. **Monitor Logs** - Track errors in Vercel/GitHub
4. **Plan Mainnet** - Only after thorough testing on devnet

---

**Total Time:** ~1-2 hours (Solana CLI install + token setup + deployments)

Need help with any step? Check SECURITY_AUDIT_REPORT_2025.md or INTEGRATION_GUIDE.md for more details.
