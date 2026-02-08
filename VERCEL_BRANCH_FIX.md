# 🚨 URGENT: Fix Vercel Deployment - Wrong Branch Configuration

## Problem
Your Vercel deployment is **failing with this error**:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
Command "npm install" exited with 254
```

## Root Cause
Vercel is configured to deploy from the **`gh-pages` branch** instead of the **`main` branch**.

- ❌ **`gh-pages` branch**: Contains only static HTML/CSS/JS files (build output for GitHub Pages)
- ✅ **`main` branch**: Contains source code, package.json, and everything Vercel needs to build

## The Fix (Takes 5 minutes)

### Step 1: Change Production Branch in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`main` or similar name)
3. Click **Settings** in the top menu
4. Click **Git** in the left sidebar
5. Find **"Production Branch"**
6. Change from `gh-pages` to `main`
7. Click **Save**

### Step 2: Update Next.js Configuration for Vercel

The repository is currently configured for static export (`output: 'export'` in `next.config.ts`), which is suitable for GitHub Pages but **not optimal for Vercel**. You have two options:

#### Option A: Keep Static Export (Simpler, works for both)
This works but doesn't leverage Vercel's full Next.js capabilities (no API routes, no SSR).

**No changes needed** - Vercel can deploy static exports, but update the output directory in vercel.json:

1. Edit `vercel.json` locally or in Vercel Dashboard → Settings → General
2. Change `"outputDirectory": "out"` (should already be set)
3. Ensure `"buildCommand": "npm run build"` is set

#### Option B: Use Dynamic Next.js for Vercel (Recommended)
This gives you full Next.js features on Vercel while keeping static export for GitHub Pages.

**Create environment-specific build:**

1. Create a new npm script in `package.json`:
```json
"scripts": {
  "build": "next build",
  "build:static": "next build",
  "build:vercel": "next build"
}
```

2. Create `next.config.vercel.ts` (Vercel-specific config):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No output: 'export' - use full Next.js features
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tradehaxai.tech' },
      { protocol: 'https', hostname: '*.vercel.app' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@solana/wallet-adapter-react'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
```

3. In Vercel Dashboard → Settings → General:
   - Set **Build Command**: `npm run build`
   - Set **Output Directory**: `.next`
   - Keep **Framework Preset**: Next.js

**Skip this step for now** - the simpler Option A should work first.

### Step 3: Trigger a New Deployment
1. Stay in the Vercel Dashboard
2. Click **Deployments** in the top menu
3. Find the latest deployment (it will show as "Failed")
4. Click the **"..."** menu button
5. Click **Redeploy**
6. Check **"Use existing Build Cache"** = OFF (uncheck it)
7. Click **Redeploy** button

### Step 4: Verify vercel.json Settings

Ensure your `vercel.json` has these settings:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs"
}
```

These are already correct in your repository.

### Step 5: Verify Success
1. Wait 2-3 minutes for the build to complete
2. The deployment status should change to **"Ready"** with a green checkmark
3. Visit https://tradehaxai.tech to confirm the site is live

## Why This Happened

This repository has **two deployment strategies**:

1. **GitHub Pages** (via `gh-pages` branch)
   - Automated by `.github/workflows/github-pages.yml`
   - Builds site and pushes static files to `gh-pages` branch
   - Used for GitHub's free hosting at `username.github.io/repo`

2. **Vercel** (should use `main` branch)
   - Automated by `.github/workflows/vercel-deploy.yml`
   - Builds from source code on `main` branch
   - Used for custom domain https://tradehaxai.tech

When Vercel was configured, the wrong branch was selected. This caused Vercel to try building from pre-built static files instead of source code.

## Visual Guide

### What Vercel Currently Sees (Wrong):
```
gh-pages branch
├── index.html         ← Static HTML
├── _next/             ← Built JavaScript
├── assets/            ← Images, CSS
└── 404.html
❌ NO package.json
❌ NO source code
```

### What Vercel Should See (Correct):
```
main branch
├── package.json       ✅ Dependencies
├── app/               ✅ Source code
├── components/        ✅ React components
├── next.config.ts     ✅ Next.js config
└── vercel.json        ✅ Vercel settings
```

## Additional Notes

### Both Deployments Can Coexist
- **GitHub Pages**: `gh-pages` branch → GitHub hosting (backup/alternate)
- **Vercel**: `main` branch → Primary deployment with custom domain

### If You Only Want Vercel
You can disable GitHub Pages deployments:
1. Go to repository Settings → Pages
2. Set Source to "None"
3. Or disable `.github/workflows/github-pages.yml`

### If Build Still Fails After Fix
Check these common issues:
1. Missing Vercel environment variables (see `VERCEL_DEPLOYMENT_TROUBLESHOOTING.md`)
2. Missing GitHub secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
3. Build errors in code (test locally with `npm run build`)

## Need More Help?

- **Full troubleshooting guide**: See `VERCEL_DEPLOYMENT_TROUBLESHOOTING.md`
- **Domain setup**: See `VERCEL_DOMAIN_SETUP.md`
- **Quick start**: See `DEPLOYMENT_QUICKSTART.md`

---

**Priority**: 🔴 **CRITICAL - Site is down**  
**Time to Fix**: ⏱️ **2 minutes**  
**Difficulty**: 🟢 **Easy - No code changes needed**
