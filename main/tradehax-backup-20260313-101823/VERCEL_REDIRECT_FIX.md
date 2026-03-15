# 🔍 Vercel DNS Redirect Loop Diagnosis & Solution

**Date:** March 8, 2026  
**Status:** 🔴 **REDIRECT CHAIN DETECTED**

---

## 📊 Current Redirect Chain

```
tradehax.net/__health
    ↓ (307 Temporary Redirect)
www.tradehax.net/__health
    ↓ (404 NOT FOUND - Wrong app/routing)
```

```
tradehax.net/tradehax
    ↓ (307 Temporary Redirect)
www.tradehax.net/tradehax
    ↓ (404 NOT FOUND - Wrong app/routing)
```

---

## 🎯 Root Cause

The **Vercel project settings** are forcing a **catch-all redirect from apex → www**, which is preventing requests from reaching the correct deployment at `main-six-dun.vercel.app`.

This could be:
1. **Vercel Project Redirect Settings** - A "Redirect from www" or "Redirect apex to www" toggle
2. **Duplicate Domain Aliases** - Both apex and www aliased to different deployments
3. **vercel.json Routes** - An overly broad routing rule catching all traffic and redirecting

---

## 🛠️ Efficient Solution (3-Step)

### Step 1: Clear Conflicting Domain Aliases
In Vercel Dashboard:
1. Go to **Project Settings** → **Domains**
2. Remove BOTH current aliases for `tradehax.net` and `www.tradehax.net`
3. Remove any "Redirect from www" or "Redirect apex" toggles

### Step 2: Verify vercel.json Has No Apex Redirect
Check `web/vercel.json` - it should NOT have:
```json
{
  "routes": [
    { "src": "^/?$", "dest": "https://www.tradehax.net" }  // ❌ BAD
  ]
}
```

Expected (good):
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/__health", "dest": "/__health" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Step 3: Re-Add Domain Aliases (Fresh)
1. Go back to **Domains**
2. Add `tradehax.net` → `main-six-dun.vercel.app`
3. Add `www.tradehax.net` → `main-six-dun.vercel.app`
4. **Both should point to the same deployment** (no apex-to-www redirect)
5. Set **"Redirect from www"** toggle to **OFF**

---

## ✅ Expected Result After Fix

- `tradehax.net/__health` → 200 JSON (no redirect)
- `tradehax.net/tradehax` → 200 HTML (no redirect)
- `www.tradehax.net/__health` → 200 JSON (no redirect)
- `www.tradehax.net/tradehax` → 200 HTML (no redirect)
- Both apex and www serve **identical content** from `main-six-dun.vercel.app`

---

## 🔧 Alternative: Disable Apex Redirect in Vercel Project Settings

If the above doesn't work, try:
1. Go to **Project Settings** → **Domains**
2. Find the toggle: **"Redirect from www"** or **"Redirect www to apex"**
3. Toggle it to match your desired behavior
4. If you want **NO redirect**, both toggles should be OFF, and both should point to same deployment

---

## 📋 Checklist Before Testing

- [ ] Removed existing apex/www aliases from Domains
- [ ] Verified `web/vercel.json` has no apex-to-www redirect rule
- [ ] Re-added both aliases pointing to `main-six-dun.vercel.app`
- [ ] Disabled any "Redirect from www" toggles
- [ ] Waited 1-2 minutes for DNS propagation

---

## ⏱️ If Still 307 After 2 Minutes

**Likely Cause:** Vercel cache or DNS propagation delay

**Action:**
1. Hard refresh: `Ctrl+Shift+Delete` → Clear all cache
2. Check if cache is blocking old config: `curl -I https://tradehax.net/__health | grep -i cache`
3. If Age header shows old timestamp, purge Vercel cache from dashboard

---

## 📝 Reference: Current vercel.json (Should Be)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/__health",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/__health", "dest": "/__health" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

This allows:
- `/__health` to be served as static file from `public/__health` ✅
- All other routes to fall back to `index.html` for React Router ✅
- No apex-to-www redirect ✅

---

**Next:** Complete the 3-step solution above, then run verification tests.

