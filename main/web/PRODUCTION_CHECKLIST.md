# TradeHax Web Production Checklist

## Scope
Production checklist for the `web/` module deployed to `tradehax.net` with `/tradehax` as canonical interface route.

## Pre-Deploy ✅ COMPLETE
- [x] `npm ci`
- [x] `npm run release:check`
- [x] Verify route behavior locally:
  - [x] `/`
  - [x] `/tradehax`
  - [x] refresh on `/tradehax`
- [x] Verify health endpoint returns JSON:
  - [x] `/__health`

## Deploy Config ✅ COMPLETE
- [x] `vercel.json` present and configured
- [x] SPA fallback route to `/index.html` present
- [x] Security headers configured
- [x] Static assets cache policy configured
- [x] Health endpoint no-store cache policy configured

## Deployment Ready ⏳ NEXT STEP
```powershell
cd C:\tradez\main\web
npx --yes vercel@50.28.0 --prod --yes --scope hackavelliz
```

## Post-Deploy Validation (To Be Run After Deployment)
- [ ] `https://tradehax.net/` loads launcher page
- [ ] `https://tradehax.net/tradehax` loads terminal UI
- [ ] hard refresh on `/tradehax` works
- [ ] `https://tradehax.net/__health` returns `{"ok":true,...}`
- [ ] no blocking console errors in browser

## Domain Strategy ✅ CONFIRMED
- [x] Keep `tradehax.net` canonical
- [x] Keep `tradehaxai.tech` as forward/secondary until split is justified by KPIs

## Rollback Plan ✅ READY
- [x] Keep previous deployment alias
- [x] If critical regression: rollback to previous stable deployment immediately
  ```powershell
  npx --yes vercel@50.28.0 deployments ls --scope hackavelliz
  npx --yes vercel@50.28.0 alias set <PREVIOUS_URL> tradehax.net --scope hackavelliz
  ```

## Authorization
- [x] Code is production-ready (all tests passing)
- [x] Infrastructure is configured (vercel.json + health endpoint)
- [x] Vercel team scope identified (hackavelliz)
- [x] Security headers implemented
- [x] SPA routing configured
- [x] Mobile/browser optimizations complete

**STATUS: ✅ AUTHORIZED FOR PRODUCTION DEPLOYMENT**

See `DEPLOYMENT_READY_GO_LIVE.md` for complete step-by-step instructions.
