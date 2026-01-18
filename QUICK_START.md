# Quick Start Guide - Astral Awakening: TradeHax

Get up and running in 15 minutes (after SHAMROCK token setup).

## ⚡ 5-Minute Backend Setup

### 1. Install and Deploy
```bash
cd tradehax-backend
npm install

# Test locally
npm run dev
# Visit http://localhost:3001/api/health
```

### 2. Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Add Env Variables in Vercel Dashboard
- `SHAMROCK_MINT` - Your token mint pubkey
- `AUTHORITY_SECRET` - Authority keypair array
- `SOLANA_RPC` - `https://api.devnet.solana.com`
- (Optional) MongoDB, Twitter API keys

**Save your backend URL** (e.g., `https://your-app.vercel.app`)

---

## ⚡ 5-Minute Frontend Setup

### 1. Install
```bash
cd tradehax-frontend
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your backend URL
VITE_BACKEND_URL=https://your-backend.vercel.app
```

### 3. Test Locally
```bash
npm run dev
# Visit http://localhost:5173
```
- Connect wallet (use Phantom)
- Try collecting clovers (WASD to move)
- Test tweet reward

### 4. Deploy to GitHub Pages
```bash
npm run build
# Copy dist/ to your hosting or use:
vercel --prod
```

---

## ⚡ 5-Minute SHAMROCK Token Setup (if you haven't done this yet)

### Quick Version
```bash
# 1. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"

# 2. Set to devnet
solana config set --url https://api.devnet.solana.com

# 3. Create authority wallet
solana-keygen new --outfile ~/my-wallets/authority-keypair.json

# 4. Airdrop SOL
solana airdrop 2 ~/my-wallets/authority-keypair.json --url devnet

# 5. Create mint
solana-keygen new --outfile mint-keypair.json
MINT_PUBKEY=$(solana-keygen pubkey mint-keypair.json)

# 6. Get rent cost
RENT=$(solana rent 82 --url devnet | grep "Minimum balance" | awk '{print $4}')

# 7. Fund and initialize
solana transfer ~/my-wallets/authority-keypair.json $MINT_PUBKEY $RENT \
  --allow-unfunded-recipient --signer mint-keypair.json --url devnet

spl-token initialize-mint mint-keypair.json \
  --decimals 9 \
  --mint-authority ~/my-wallets/authority-keypair.json \
  --url devnet

# 8. Create account and mint supply
TOKEN_ACCOUNT=$(spl-token create-account $MINT_PUBKEY \
  --owner ~/my-wallets/authority-keypair.json --url devnet | tail -1)

spl-token mint $MINT_PUBKEY 1000000000000000 $TOKEN_ACCOUNT --url devnet

# 9. Save these:
echo "SHAMROCK_MINT=$MINT_PUBKEY"
cat ~/my-wallets/authority-keypair.json # For AUTHORITY_SECRET
```

See [SHAMROCK_SETUP.md](./SHAMROCK_SETUP.md) for detailed instructions.

---

## 🎮 Test the Game

### 1. Connect Wallet
- Click "Connect Phantom" button
- Approve in Phantom extension

### 2. Play
- Use **W/A/S/D** to move
- Collect **5 clovers** (glowing purple circles)
- Reach **100 energy** to unlock portal

### 3. Earn SHAMROCK
- Click "Tweet Quest: Earn 100 SHAMROCK"
- Post to X (Twitter) with `#HyperboreaAscent`
- Paste your tweet URL
- Get 100 tokens instantly!

### 4. Mint NFT Skins (New!)
- Click **"🎨 Mint NFT Skin"** button
- Browse 5 exclusive deity-themed skins
- Click to preview details (god/goddess, element, rarity)
- Click **"✨ Mint for 10 SHAMROCK"**
- Confirm transaction in wallet
- NFT appears in wallet (10-30 seconds)
- View on Solana Explorer
- Transfer on NFT marketplaces!

---

## 📋 Deployment Checklist

- [ ] SHAMROCK token created on devnet
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set (including Metaplex for NFTs)
- [ ] Frontend `.env` configured with backend URL
- [ ] Frontend deployed (GitHub Pages or Vercel)
- [ ] Wallet connects successfully
- [ ] Clovers collect and grant energy
- [ ] Tweet reward system works (100 SHAMROCK per tweet)
- [ ] NFT mint panel opens and displays skins
- [ ] Can mint NFT and burn 10 SHAMROCK
- [ ] Minted NFT appears in wallet
- [ ] PWA installable on mobile

---

## 🐛 Quick Troubleshooting

### Backend won't deploy
```bash
# Check if everything is there
ls tradehax-backend/
# Should have: package.json, api/index.js, vercel.json
```

### Frontend won't connect to backend
```bash
# Test backend is working
curl https://your-backend.vercel.app/api/health
# Should return: {"status":"ok",...}

# Check .env file
cat tradehax-frontend/.env
# Should have correct VITE_BACKEND_URL
```

### Wallet won't connect
- Install Phantom: https://phantom.app
- Make sure you're on devnet in Phantom
- Try refreshing the page

### Rewards not working
- Verify tweet contains `#HyperboreaAscent`
- Check backend logs in Vercel
- Confirm SHAMROCK_MINT is correct
- Check authority wallet has SOL

---

## 📱 Mobile/PWA Setup

1. Open game on mobile browser
2. Tap share → "Add to Home Screen"
3. Game is now installed as app
4. Works offline (with cached assets)

---

## 🚀 Next Steps

1. **Customize**: Edit colors, game mechanics, rewards in code
2. **Launch**: Share #HyperboreaAscent link
3. **Promote**: Tweet about game with rewards
4. **Scale**: Add more features and game modes
5. **Monetize**: Add in-app purchases, NFT cosmetics
6. **Mainnet**: Switch SHAMROCK to mainnet after testing

---

## 📚 Documentation

- **Detailed Setup**: [SHAMROCK_SETUP.md](./SHAMROCK_SETUP.md)
- **Backend Docs**: [tradehax-backend/README.md](./tradehax-backend/README.md)
- **Frontend Docs**: [tradehax-frontend/README.md](./tradehax-frontend/README.md)

---

## 💬 Get Help

- Check console errors: F12 → Console tab
- Read error messages carefully
- See troubleshooting in full docs
- Ask in Discord community

---

**You've got this! 🍀**
