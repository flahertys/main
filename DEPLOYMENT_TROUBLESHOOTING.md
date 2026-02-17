# Deployment Troubleshooting Guide

## Issue: Changes not appearing live on tradehaxai.tech or tradehax.net

### Root Cause
GitHub Pages workflow only triggered manually (`workflow_dispatch`). Now it's fixed to auto-trigger on push.

---

## ✅ Fixed Issues

### 1. GitHub Pages Auto-Deploy
**Before:** Only triggered manually  
**Now:** Automatically triggers on every push to `main`

**What happens:**
- Build static export from Next.js
- Deploy to `gh-pages` branch
- DNS points `tradehaxai.tech` → GitHub Pages

---

## 🔍 Verify Deployments

### Check GitHub Pages Deployment Status
1. Go to: **GitHub → Settings → Pages**
2. Look for "Your site is live at `https://tradehaxai.tech`"
3. Build status shows under "Deployments"

### Check Recent Workflow Runs
1. Go to: **GitHub → Actions tab**
2. Look for "Deploy to GitHub Pages" workflow
3. Click the latest run to see logs

### Manual Test Deploy
Push a test commit to `main` and verify it appears within 1-2 minutes:
```bash
git push origin main
```

Then check:
- https://tradehaxai.tech (should update within 2 minutes)
- https://github.com/DarkModder33/main/deployments (see deployment history)

---

## Vercel Deployment (tradehax.net)

### Required Secrets
For `tradehax.net` to auto-deploy, you need to add these GitHub secrets:

**Settings → Secrets and variables → Actions → New repository secret**

1. `VERCEL_TOKEN` - Get from [Vercel Settings](https://vercel.com/account/tokens)
2. `VERCEL_ORG_ID` - Get from Vercel project settings
3. `VERCEL_PROJECT_ID` - Get from Vercel project settings

### How to Get Vercel Secrets

**VERCEL_TOKEN:**
1. Login to [Vercel](https://vercel.com)
2. Settings → Tokens
3. Create a new token, copy it

**VERCEL_ORG_ID & VERCEL_PROJECT_ID:**
1. Go to your Vercel project
2. Settings → General
3. Copy `Project ID` and `Org ID` from the page

### Current Status
If you see this warning in Actions logs:
```
⚠️  Vercel deployment skipped - missing required secrets
```

Then Vercel secrets aren't configured. Add them to proceed.

---

## 📋 Complete Workflow

### When you push to `main`:
1. ✅ **GitHub Pages** auto-builds and deploys to `tradehaxai.tech`
   - Takes 2-5 minutes
   - Deploy logs visible in Actions

2. ✅ **Vercel** auto-builds and deploys to `tradehax.net`
   - Requires secrets (see above)
   - Takes 2-5 minutes
   - Deploy logs visible in Actions

3. ✅ **CI Pipeline** runs tests
   - Linting, type-checking, Docker build

---

## 🐛 Debugging Steps

### If changes still don't appear:

1. **Check commit is on `main`:**
   ```bash
   git branch -a
   git log --oneline -5
   ```
   Should show your commit on `main` branch

2. **Verify push succeeded:**
   ```bash
   git status
   ```
   Should show "Your branch is up to date with 'origin/main'"

3. **Check build output:**
   - Go to Actions tab
   - Click the "Deploy to GitHub Pages" run
   - Look for "Verify build output" step
   - Should show files in `./out/` directory

4. **Check GitHub Pages settings:**
   - Repo Settings → Pages
   - Source should be "Deploy from a branch"
   - Branch should be `gh-pages`
   - Domain should be `tradehaxai.tech`

5. **Clear browser cache:**
   ```bash
   # Hard refresh (Windows/Linux: Ctrl+Shift+R, Mac: Cmd+Shift+R)
   # Or open DevTools → Application → Clear Site Data
   ```

6. **Check DNS:**
   ```bash
   nslookup tradehaxai.tech
   nslookup tradehax.net
   ```
   Should resolve to correct IP

---

## ⚡ Quick Commands

```bash
# View recent commits
git log --oneline -10

# View current branch
git branch

# Force check for latest (if cache is stale)
git fetch origin
git status

# View build logs for latest deployment
# Open: https://github.com/DarkModder33/main/actions

# Manual workflow trigger (if needed)
# Go to Actions → Deploy to GitHub Pages → Run workflow
```

---

## 📞 Still Not Working?

Check in this order:
1. ✅ Is commit on `main` branch? `git status`
2. ✅ Did workflow run? Check Actions tab
3. ✅ Did build succeed? Check "Verify build output" step
4. ✅ Is CNAME file present? Check gh-pages branch for `CNAME` file
5. ✅ Is DNS configured? Run `nslookup tradehaxai.tech`
6. ✅ Clear browser cache (Ctrl+Shift+R)

---

## Configuration Files

### GitHub Pages
- Workflow: `.github/workflows/github-pages.yml`
- Output: `out/` directory (static export)
- Branch: `gh-pages`
- Domain: `tradehaxai.tech`

### Vercel
- Workflow: `.github/workflows/vercel-deploy.yml`
- Domain: `tradehax.net`
- Requires: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

### Next.js Config
- File: `next.config.ts`
- Static export: `output: 'export'` for GitHub Pages
- Build command: `npm run build`
