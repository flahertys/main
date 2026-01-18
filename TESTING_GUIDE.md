# Quick Start Guide: Testing & Deployment

**For Developers and Testers**

## 🚀 Quick Setup (5 minutes)

### Step 1: Get WalletConnect Project ID (Optional)

**Note:** A default Reown (WalletConnect) Project ID is already configured. To use your own:

1. Go to https://dashboard.reown.com (formerly WalletConnect Cloud)
2. Sign up/login (free account)
3. Click "Create Project"
4. Copy your Project ID (looks like: `abc123def456...`)

### Step 2: Configure Environment

```bash
cd tradehax-frontend

# Create .env if it doesn't exist
cp .env.example .env

# The default Project ID is already in .env.example
# To use your own, edit .env
nano .env  # or use your favorite editor
```

The `.env` file will have:
```
VITE_WALLETCONNECT_PROJECT_ID=79b6b869e8bc24644ece855d8edbe246
```

### Step 3: Install and Build

```bash
# Install dependencies (if not done)
npm install

# Build for production
npm run build

# Or run in development mode
npm run dev
```

## 📱 Testing Checklist

### Desktop Testing (Chrome/Firefox/Edge)

**Phantom Wallet:**
- [ ] Click wallet button
- [ ] Select Phantom
- [ ] Wallet extension opens
- [ ] Approve connection
- [ ] Wallet address shown in HUD
- [ ] Play game, collect items
- [ ] Game state persists on refresh

**Solflare Wallet:**
- [ ] Same as Phantom above

**WalletConnect (Trust Wallet/MetaMask):**
- [ ] Click wallet button
- [ ] Select "WalletConnect"
- [ ] QR code modal appears
- [ ] Scan with mobile wallet app
- [ ] Approve connection
- [ ] Wallet address shown in HUD
- [ ] Play game, verify transactions

**Web5 DID:**
- [ ] Check HUD shows `🆔 DID: did:dht:...`
- [ ] Check HUD shows `✓ Web5 Connected`
- [ ] Play game, collect items
- [ ] Refresh browser
- [ ] Game state should load from Web5
- [ ] Try incognito mode (should use localStorage fallback)

### Mobile Testing (iOS Safari)

**Setup:**
1. Open Safari on iPhone
2. Navigate to your test URL
3. Allow popups if prompted

**Phantom Mobile:**
- [ ] Ensure Phantom app installed
- [ ] Click wallet button
- [ ] Should auto-open Phantom app
- [ ] Approve connection in app
- [ ] Return to browser
- [ ] Verify connection in HUD

**Trust Wallet Mobile:**
- [ ] Ensure Trust Wallet app installed
- [ ] Click wallet button
- [ ] Select WalletConnect
- [ ] Should open Trust Wallet app
- [ ] Approve connection
- [ ] Return to Safari

**MetaMask Mobile:**
- [ ] Ensure MetaMask app installed
- [ ] Click wallet button
- [ ] Select WalletConnect
- [ ] Should open MetaMask app
- [ ] Approve connection
- [ ] Return to Safari

**Mobile UX:**
- [ ] Touch controls responsive
- [ ] Buttons at least 44x44 pixels
- [ ] Safe area (notch) handled correctly
- [ ] Landscape mode works
- [ ] Viewport fills screen properly
- [ ] No horizontal scrolling
- [ ] HUD readable at small size

**Web5 on Mobile:**
- [ ] DID created on first load
- [ ] DID shown in HUD (truncated)
- [ ] Game state saves
- [ ] Refresh preserves state

### Mobile Testing (Android Chrome)

Same checklist as iOS Safari, but:
- Use Chrome browser
- Test on Android device
- Verify deep links work differently
- Check performance on lower-end devices

### Performance Testing

**Desktop:**
- [ ] Game loads in < 5 seconds
- [ ] Smooth 60 FPS gameplay
- [ ] No lag when collecting items
- [ ] Animations smooth

**Mobile:**
- [ ] Game loads in < 10 seconds
- [ ] Smooth 30+ FPS gameplay
- [ ] Touch controls responsive
- [ ] No excessive lag
- [ ] Battery drain acceptable

## 🐛 Common Issues & Solutions

### "WalletConnect is not defined"
**Solution:** Add VITE_WALLETCONNECT_PROJECT_ID to .env and rebuild

### "Web5 initialization failed"
**Solution:** 
- Check browser supports IndexedDB (modern browser required)
- Clear browser data and try again
- Game still works with localStorage fallback

### Mobile wallet doesn't open
**Solution:**
- Ensure wallet app installed from App Store/Play Store
- Allow browser to open external apps
- Try opening wallet app first, then browse from within app

### Game won't load on mobile
**Solution:**
- Check console for errors
- Try different browser (Chrome vs Safari)
- Ensure device has WebGL support
- Clear browser cache

### Poor performance on mobile
**Solution:**
- Close background apps
- Check device has 2GB+ RAM
- Game automatically uses lower quality on weak devices
- Try landscape mode

## 📊 What to Test For

### Wallet Connection
- ✅ Multiple wallets work
- ✅ Connection persists across page refreshes
- ✅ Disconnect works
- ✅ Reconnect works
- ✅ Wallet address displayed correctly

### Web5 DID
- ✅ DID created automatically
- ✅ DID persists across sessions
- ✅ Game state saves to DWN
- ✅ Game state loads from DWN
- ✅ localStorage fallback works

### Mobile Experience
- ✅ Touch controls work
- ✅ Deep linking works
- ✅ UI scales properly
- ✅ Safe areas respected
- ✅ Performance acceptable
- ✅ No horizontal scroll

### Game Functionality
- ✅ Can move player
- ✅ Can collect items
- ✅ Score updates
- ✅ Level progression works
- ✅ NFT minting works
- ✅ Transactions succeed

## 🚢 Deployment Steps

### Build for Production

```bash
cd tradehax-frontend
npm run build
```

This creates `dist/` folder with optimized files.

### Deploy to GitHub Pages

```bash
# From repository root
cp -r tradehax-frontend/dist/* games/hyperborea/

git add games/hyperborea
git commit -m "Deploy Hyperborea alpha with WalletConnect & Web5"
git push origin main
```

### Deploy to Vercel

```bash
cd tradehax-frontend
vercel --prod
```

Or use Vercel GitHub integration.

### Deploy to Netlify

```bash
cd tradehax-frontend
netlify deploy --prod --dir=dist
```

### Environment Variables in Production

**GitHub Pages:**
- No server-side env vars
- All config must be in built files
- WalletConnect ID embedded in build

**Vercel/Netlify:**
- Add env vars in dashboard:
  - `VITE_WALLETCONNECT_PROJECT_ID`
  - `VITE_BACKEND_URL`
  - `VITE_SOLANA_NETWORK`

## 📈 Monitoring After Deployment

### Check These Metrics

1. **Wallet Connection Success Rate**
   - Track which wallets work
   - Identify connection failures

2. **Web5 DID Creation Rate**
   - See how many users get DIDs
   - Check initialization errors

3. **Mobile Usage**
   - Track mobile vs desktop users
   - Monitor mobile performance

4. **Game Engagement**
   - Items collected
   - Average session time
   - Return rate

### Tools to Use

- Google Analytics (already in index.html)
- Browser console logs
- Vercel/Netlify analytics
- Custom error tracking

## ✅ Definition of Done

### Before Marking Complete

- [ ] WalletConnect Project ID configured
- [ ] Tested on 2+ desktop browsers
- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome
- [ ] All 4 wallets connect successfully
- [ ] Web5 DID creates successfully
- [ ] Game state persists correctly
- [ ] Mobile performance acceptable
- [ ] No critical bugs found
- [ ] Documentation reviewed
- [ ] Deployed to staging environment
- [ ] Smoke testing passed

### Alpha Release Criteria

- [ ] All "Before Marking Complete" items ✅
- [ ] Security review passed
- [ ] Performance benchmarks met
- [ ] User documentation finalized
- [ ] Support channels ready
- [ ] Rollback plan prepared
- [ ] Monitoring configured

## 🎯 Success Metrics

**Alpha is successful if:**
- 80%+ wallet connections succeed
- 70%+ users get Web5 DID
- 60%+ mobile users can play smoothly
- 90%+ game state persists correctly
- < 5% critical bug rate

## 📞 Support & Help

**Found a bug?**
1. Check IMPLEMENTATION_SUMMARY.md for known issues
2. Check WALLETCONNECT_WEB5_GUIDE.md for solutions
3. Create GitHub issue with:
   - Browser/device info
   - Steps to reproduce
   - Console errors
   - Screenshots

**Need help?**
- Discord: [Community link]
- Email: support@tradehax.net
- GitHub Discussions

---

**Last Updated:** January 2, 2026  
**Version:** 1.0.0-alpha  
**Status:** Ready for Testing
