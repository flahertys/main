# Vercel Static Export Fix

## Problem

The Vercel deployment was failing with the error:

```
The file "/vercel/path0/out/routes-manifest.json" couldn't be found.
```

This happened because:

1. **next.config.ts** had `output: 'export'` configured for static export (GitHub Pages)
2. Static export creates files in `out/` directory without a `routes-manifest.json` file
3. Vercel expects `routes-manifest.json` to exist in the build output for proper Next.js deployments
4. The configuration was forcing both GitHub Pages AND Vercel to use static export, which doesn't work for Vercel

## Solution

We implemented a **conditional static export** strategy that:

- ✅ Uses static export (`out/`) for GitHub Pages deployment
- ✅ Uses standard Next.js build (`.next/`) for Vercel deployment
- ✅ Maintains both deployment methods without conflicts

### Changes Made

#### 1. next.config.ts - Conditional Static Export

```typescript
const nextConfig: NextConfig = {
  // Static export for GitHub Pages only (not for Vercel)
  // Vercel automatically sets VERCEL=1 environment variable
  ...(process.env.VERCEL !== '1' && { output: 'export' }),
  // ... rest of config
};
```

**How it works:**
- When building locally or in GitHub Actions: `output: 'export'` is applied → creates `out/` directory
- When building on Vercel: `VERCEL=1` is automatically set → `output: 'export'` is skipped → creates `.next/` directory with `routes-manifest.json`

#### 2. vercel.json - Remove Output Directory Override

**Before:**
```json
{
  "outputDirectory": "out"
}
```

**After:**
```json
{
  // outputDirectory removed - let Vercel use default .next
}
```

**Why:** Vercel's default behavior is to look for Next.js builds in `.next/` directory. By removing the override, we let Vercel do what it does best.

#### 3. .vercelignore - Allow .next Directory

**Before:**
```
.next
out
```

**After:**
```
# .next is needed for Vercel deployment
out
```

**Why:** Vercel needs access to the `.next/` build directory to properly deploy the application.

## How the Dual Deployment Works

### GitHub Pages Deployment (GitHub Actions)

```
1. Code pushed to main branch
2. GitHub Actions workflow runs
3. Runs: npm run build
4. VERCEL env var is NOT set
5. next.config.ts applies output: 'export'
6. Creates: out/ directory with static HTML files
7. Pushes out/ to gh-pages branch
8. GitHub Pages serves from gh-pages branch
```

### Vercel Deployment (Vercel Platform)

```
1. Code pushed to main branch
2. Vercel detects changes
3. Runs: npm install && npm run build
4. VERCEL=1 is automatically set by Vercel
5. next.config.ts skips output: 'export'
6. Creates: .next/ directory with routes-manifest.json
7. Vercel deploys using standard Next.js hosting
8. Full Next.js features available (SSR, API routes, etc.)
```

## Verification

### Test Locally (Static Export Mode)

```bash
# Clean previous builds
npm run clean

# Build without VERCEL env (simulates GitHub Pages)
npm run build

# Verify out/ directory exists
ls -la out/

# Should show: index.html, blog/, game/, etc.
```

### Test Locally (Vercel Mode)

```bash
# Clean previous builds
npm run clean

# Build with VERCEL=1 (simulates Vercel deployment)
VERCEL=1 npm run build

# Verify .next/ directory exists with routes-manifest.json
ls -la .next/routes-manifest.json

# Should show: .next/routes-manifest.json file
```

## Benefits of This Approach

1. ✅ **No code duplication** - single codebase serves both deployments
2. ✅ **Automatic switching** - environment detection handles everything
3. ✅ **Best of both worlds**:
   - GitHub Pages: Free static hosting, backup deployment
   - Vercel: Full Next.js features, custom domain, edge functions
4. ✅ **Zero configuration needed** - Vercel sets VERCEL=1 automatically
5. ✅ **Future-proof** - can easily switch strategies if needed

## Troubleshooting

### Issue: Vercel still shows "routes-manifest.json not found"

**Check:**
1. Verify `.next` is NOT in `.vercelignore`
2. Verify `vercel.json` does NOT have `"outputDirectory": "out"`
3. Check Vercel build logs to confirm VERCEL=1 is set
4. Try redeploying without cache: Vercel Dashboard → Deployments → Redeploy → Uncheck "Use existing Build Cache"

### Issue: GitHub Pages deployment broken

**Check:**
1. Verify `output: 'export'` is still in next.config.ts (conditionally)
2. Check GitHub Actions workflow is running `npm run build` (without VERCEL=1)
3. Verify `out/` directory is being created in GitHub Actions
4. Check gh-pages branch has the static files

### Issue: Both deployments fail

**Check:**
1. Test build locally: `npm run build` (should work)
2. Test Vercel build: `VERCEL=1 npm run build` (should work)
3. Check for TypeScript/ESLint errors
4. Verify all dependencies are in package.json

## Related Documentation

- [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md) - Complete troubleshooting guide
- [DEPLOYMENT_FIX_SUMMARY.md](./DEPLOYMENT_FIX_SUMMARY.md) - Dual deployment overview
- [VERCEL_BRANCH_FIX.md](./VERCEL_BRANCH_FIX.md) - Branch configuration fix

## Summary

This fix enables the repository to maintain two independent deployment strategies:

- **GitHub Pages**: Static export for free hosting and backup
- **Vercel**: Standard Next.js deployment for production with custom domain

The conditional configuration ensures both deployments work correctly without conflicts, using environment detection to automatically choose the right build strategy.

---

**Issue Fixed**: routes-manifest.json not found in /out/  
**Solution**: Conditional static export based on VERCEL environment variable  
**Result**: Both GitHub Pages and Vercel deployments now work correctly  
**Date**: 2026-02-08
