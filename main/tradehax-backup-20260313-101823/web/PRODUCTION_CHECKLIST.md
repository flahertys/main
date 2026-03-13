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

## Deployment ✅ COMPLETE
- [x] Vercel CLI authenticated
- [x] Team scope identified (configured via `VERCEL_SCOPE` / `VERCEL_ORG_ID`)
- [x] Production deploy command prepared/executed for configured scope
- [x] Domain attached (`tradehax.net`)

## Post-Deploy Validation ✅ COMPLETE
- [x] `https://tradehax.net/` loads launcher page
- [x] `https://tradehax.net/tradehax` loads terminal UI
- [x] hard refresh on `/tradehax` works (SPA routing verified)
- [x] `https://tradehax.net/__health` returns `{"ok":true,...}`
- [x] no blocking console errors in browser

## Domain Strategy ✅ CONFIRMED
- [x] Keep `tradehax.net` canonical (LIVE)
- [x] Keep `tradehaxai.tech` as forward/secondary until split is justified by KPIs

## Rollback Plan ✅ READY
- [x] Keep previous deployment alias
- [x] If critical regression: rollback to previous stable deployment immediately
  ```powershell
  npx --yes vercel@50.28.0 deployments ls --scope $env:VERCEL_SCOPE
  npx --yes vercel@50.28.0 alias set <PREVIOUS_URL> tradehax.net --scope $env:VERCEL_SCOPE
  ```

## Authorization & Go-Live ✅ APPROVED
- [x] Code is production-ready (all tests passing)
- [x] Infrastructure is configured (vercel.json + health endpoint)
- [x] Vercel team scope identified (configured value)
- [x] Security headers implemented and verified
- [x] SPA routing configured and tested
- [x] Mobile/browser optimizations complete
- [x] Vercel deployment token provided and authenticated
- [x] Production deployment executed successfully

**STATUS: ✅ LIVE ON PRODUCTION**

**Domain:** https://tradehax.net  
**Version:** 1.1.0  
**Launch Date:** March 7, 2026  
**Vercel Scope/Org:** Use `VERCEL_SCOPE` (or `VERCEL_ORG_ID`). Provided account id can be set as:
```powershell
$env:VERCEL_ORG_ID="tmRvCzC52EldX6o8WTgxKV2z"
```

See `DEPLOYMENT_COMPLETE.md` for detailed post-deployment documentation.
