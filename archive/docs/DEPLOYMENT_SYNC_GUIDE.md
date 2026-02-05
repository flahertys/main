# Deployment Synchronization Guide

## Overview

This repository uses a **GitHub-first deployment strategy** that ensures all code changes are committed to the main GitHub repository before being deployed to production environments. This prevents deployment drift and ensures version control integrity.

## Architecture

```
Developer Push → GitHub Repository (main branch)
                        ↓
                 GitHub Actions
                   ↙        ↘
        Frontend Deploy    Backend Deploy
              ↓                  ↓
        GitHub Pages         Vercel
              ↓                  ↓
        tradehax.net        API endpoints
```

## Deployment Workflows

### 1. Coordinated Full-Stack Deployment (`coordinated-deploy.yml`)

**Trigger**: Push to `main` branch or manual trigger

**What it does**:
- Detects which parts of the codebase changed (frontend vs backend)
- Deploys only what changed
- Ensures both deployments are synchronized
- Verifies all changes are committed to GitHub first

**Frontend paths**:
- `index.html`, `about.html`, `services.html`
- `script.js`, `assets/**`, `js/**`
- `tradehax-frontend/**`
- Root `package.json` and `package-lock.json`

**Backend paths**:
- `tradehax-backend/**`
- `backend/**`

### 2. CI/CD Pipeline (`ci.yml`)

**Trigger**: Push to `main` or PR to `main`

**What it does**:
- Runs tests on frontend and backend
- Performs security audits
- Builds static site
- Deploys to GitHub Pages on main branch pushes

### 3. Vercel Backend Deployment (`deploy-vercel-backend.yml`)

**Trigger**: Changes to `tradehax-backend/**` on `main` branch

**What it does**:
- Installs Vercel CLI
- Pulls Vercel environment configuration
- Builds backend artifacts
- Deploys to Vercel production

## Setup Requirements

### GitHub Secrets

You need to configure the following secrets in your GitHub repository:

1. **VERCEL_TOKEN**: Generate from Vercel dashboard
   - Go to https://vercel.com/account/tokens
   - Create new token with appropriate scope
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

2. **VERCEL_ORG_ID** (Optional): Your Vercel organization ID
   - Found in Vercel project settings

3. **VERCEL_PROJECT_ID** (Optional): Your Vercel project ID
   - Found in Vercel project settings

### Vercel Project Setup

1. **Link Vercel Project** (First time only):
   ```bash
   cd tradehax-backend
   vercel link
   ```
   This creates a `.vercel` directory (gitignored)

2. **Add Environment Variables to Vercel**:
   ```bash
   vercel env add SHAMROCK_MINT production
   vercel env add AUTHORITY_SECRET production
   vercel env add MONGODB_URI production
   vercel env add JWT_SECRET production
   ```
   
   Or use the automated script:
   ```bash
   bash setup-vercel-env.sh
   ```

## Deployment Process

### For Developers

**Standard Workflow** (Recommended):
```bash
# 1. Make changes to frontend or backend
git add .
git commit -m "Add new feature"

# 2. Push to main branch
git push origin main

# 3. GitHub Actions automatically:
#    - Tests your code
#    - Deploys frontend to tradehax.net (if changed)
#    - Deploys backend to Vercel (if changed)
#    - Verifies synchronization
```

**Feature Branch Workflow**:
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "Add feature"

# 3. Push and create PR
git push origin feature/my-feature

# 4. GitHub Actions runs tests on PR
# 5. After PR approval, merge to main
# 6. Automatic deployment triggers
```

### Manual Deployment

**Frontend Only**:
```bash
npm run htflow:build
# Then push to trigger GitHub Pages deployment
```

**Backend Only** (Emergency):
```bash
cd tradehax-backend
vercel --prod
```
⚠️ **Warning**: Manual Vercel deployments bypass version control. Always commit to GitHub first!

## Verification

### After Deployment

1. **Check Frontend**:
   ```bash
   curl https://tradehax.net
   ```
   Should return the homepage HTML

2. **Check Backend**:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
   Should return: `{"status": "ok", ...}`

3. **Check GitHub Actions**:
   - Go to repository → Actions tab
   - Verify workflows completed successfully
   - Check logs for any errors

### Deployment Status

- **Frontend**: https://tradehax.net (GitHub Pages)
- **Backend**: Check Vercel dashboard for URL
- **Actions**: https://github.com/ShamrocksStocks/shamrockstocks.github.io/actions

## Key Principles

### ✅ DO

- ✅ Always commit and push to GitHub first
- ✅ Use feature branches for development
- ✅ Let GitHub Actions handle deployments
- ✅ Review deployment logs in Actions tab
- ✅ Test locally before pushing

### ❌ DON'T

- ❌ Deploy directly to Vercel without committing to GitHub
- ❌ Push directly to main without PR (for significant changes)
- ❌ Commit sensitive data or API keys
- ❌ Modify `.github/workflows` without testing

## Troubleshooting

### Frontend not updating on tradehax.net

1. Check GitHub Actions logs
2. Verify `dist/` folder was built correctly
3. Clear browser cache
4. Check CNAME file points to `tradehax.net`
5. Verify GitHub Pages is enabled in repository settings

### Backend not deploying to Vercel

1. Check `VERCEL_TOKEN` secret is set correctly
2. Verify `tradehax-backend/vercel.json` exists
3. Check Vercel project is linked
4. Review GitHub Actions logs for errors
5. Ensure Vercel environment variables are set

### Deployment synchronization failed

1. Check both workflows completed
2. Verify no merge conflicts
3. Check file paths in workflow triggers
4. Review Actions tab for error messages

### "No direct Vercel commits" enforcement

The workflow design ensures:
- All code must be committed to GitHub first
- Deployments trigger from GitHub Actions
- No manual Vercel deployments needed
- Complete audit trail in git history

## Monitoring

### GitHub Actions

Monitor workflow runs at:
https://github.com/ShamrocksStocks/shamrockstocks.github.io/actions

### Vercel Dashboard

Check deployment status at:
https://vercel.com/dashboard

### Site Status

- Frontend: https://tradehax.net
- Backend health: `https://your-project.vercel.app/api/health`

## Best Practices

1. **Small, focused commits**: Easier to debug if deployment fails
2. **Descriptive commit messages**: Helps track what was deployed when
3. **Test locally first**: Reduce failed deployments
4. **Monitor Actions**: Watch first few deployments to ensure success
5. **Environment variables**: Never commit secrets, use GitHub Secrets and Vercel env vars

## Support

- **Workflows**: See `.github/workflows/` directory
- **Vercel Setup**: See `VERCEL_API_SETUP.md`
- **Quick Start**: See `QUICK_START.md`
- **Integration**: See `INTEGRATION_GUIDE.md`

## Summary

This deployment system ensures:
- ✅ All code is version controlled in GitHub
- ✅ No deployment drift between environments
- ✅ Automated testing before deployment
- ✅ Frontend and backend deploy together when needed
- ✅ Complete audit trail of all deployments
- ✅ tradehax.net always reflects the main branch
