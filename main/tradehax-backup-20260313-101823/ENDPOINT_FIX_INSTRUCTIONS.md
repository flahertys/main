# 🔧 TradeHax Endpoint Fix Instructions

**Date:** March 8, 2026  
**Status:** 🟡 **FINAL STEP REQUIRED** (90% complete)  
**Issue:** `/__health` and `/tradehax` returning 404 due to wrong deployment alias  
**Solution:** Point tradehax.net domains to correct Vite SPA deployment

---

## ✅ What's Been Fixed

1. **DNS Helper Script** (`scripts/namecheap-dns-copypasta.ps1`)
   - ✅ Enhanced to recognize Vercel apex IP flattening (`76.76.21.21`)
   - ✅ Validates both apex A record and www CNAME
   - ✅ No more false warnings on correct DNS setup

2. **Namecheap Guide** (`scripts/namecheap-dns-copypasta.bat`)
   - ✅ Updated with correct record types (apex A + www CNAME)
   - ✅ Clear step-by-step instructions for manual setup

3. **Deployment Script** (`web/deploy-tradehax.ps1`)
   - ✅ Fixed PowerShell error handling

4. **Web App** (`web/`)
   - ✅ Vite SPA builds successfully (495KB uncompressed, 170KB gzipped)
   - ✅ Smoke tests pass
   - ✅ Deployed to Vercel: `main-six-dun.vercel.app`
   - ✅ Has correct routes: `/`, `/tradehax`, `/__health`

---

## ⚠️ **FINAL STEP: Alias Domains to Correct Deployment**

### Current State
- `tradehax.net` → 307 redirects to `www.tradehax.net`
- `www.tradehax.net` → ❌ **404** (pointing to wrong Next.js app, not Vite SPA)

### What to Do

**Option A: Via Vercel Web Dashboard (Recommended)**

1. Go to **https://vercel.com/dashboard**
2. Click into the project containing `main-six-dun.vercel.app`
3. Select **Deployments** tab
4. Find and click **`main-six-dun.vercel.app`** (the one marked "Valid Configuration")
5. Click **Domains**
6. Add these two aliases:
   - `tradehax.net`
   - `www.tradehax.net`
7. Wait 30-60 seconds for DNS propagation
8. Run verification below

**Option B: Via CLI (once auth is fixed)**

```powershell
npx --yes vercel@50.28.0 login  # Re-authenticate with correct account
npx --yes vercel@50.28.0 alias set main-six-dun.vercel.app tradehax.net
npx --yes vercel@50.28.0 alias set main-six-dun.vercel.app www.tradehax.net
```

---

## ✅ Verification (After Aliasing)

Once domains are aliased, test these endpoints:

```powershell
# Should return 200 + serve HTML
curl.exe -I https://tradehax.net/

# Should return 200 + serve HTML
curl.exe -I https://www.tradehax.net/tradehax

# Should return 200 + JSON health response
curl.exe https://www.tradehax.net/__health
# Expected: {"ok":true,"service":"tradehax-web","version":"1.1.0"}

# On iPhone Safari, navigate to:
# https://tradehax.net/tradehax
# Should load the full TradeHax SPA interface without 404
```

---

## 🔍 Current Endpoint Status

| Endpoint | Current | Expected | Status |
|----------|---------|----------|--------|
| `https://tradehax.net/` | 307 → www | 200 HTML | ✅ Redirect works |
| `https://www.tradehax.net/` | 404 (Next.js) | 200 HTML (Vite) | ❌ Wrong app |
| `https://www.tradehax.net/tradehax` | 404 | 200 HTML | ❌ Wrong app |
| `https://www.tradehax.net/__health` | 404 | 200 JSON | ❌ Wrong app |
| `https://tradehax.net/api/health` | 200 JSON | 200 JSON | ✅ Works (different service) |

---

## 📋 DNS Summary

**Current DNS Configuration (Verified ✅)**
- `tradehax.net` (apex) → `A` record `76.76.21.21` (Vercel edge)
- `www.tradehax.net` → `CNAME` `cname.vercel-dns.com`

**Deployment Routing (Needs Final Step)**
- `main-six-dun.vercel.app` is ready at Vercel
- Just needs domain aliases applied in dashboard

---

## 🎯 Expected Outcome

After completing the alias step above, all endpoints will return:
- `✅ /__health` → 200 with health JSON
- `✅ /tradehax` → 200 with full SPA HTML + interactive trading interface
- `✅ /` → 200 with landing page
- ✅ Mobile Safari will load full app without 404

---

## 📞 Troubleshooting

**If 404 persists after 2 minutes:**
1. Clear browser cache (Cmd+Shift+Delete on Mac, Ctrl+Shift+Delete on Windows)
2. Verify alias was actually saved: Go back to Vercel dashboard Domains section
3. Check if DNS propagated: `nslookup tradehax.net` should show Vercel IP

**If you're still having CLI issues:**
- Use Vercel web dashboard only (no CLI needed)
- Or run: `rm ~/.vercelrc` then re-login

---

## 📝 Files Modified

- ✅ `scripts/namecheap-dns-copypasta.ps1` - Enhanced DNS validation
- ✅ `scripts/namecheap-dns-copypasta.bat` - Corrected guide
- ✅ `web/deploy-tradehax.ps1` - Fixed PowerShell syntax
- ✅ `web/` - Already deployed to Vercel (main-six-dun.vercel.app)

---

**Status:** Ready for production once domain aliases are applied.

Run verification commands after completing Option A or B above.

