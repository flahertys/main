# Quick Deployment Reference

## 🎯 The Golden Rule

**Always commit to GitHub first. Never deploy directly to Vercel.**

## ⚡ Quick Commands

```bash
# Standard deployment workflow
git add .
git commit -m "Your changes"
git push origin main
# ✅ Auto-deploys to GitHub Pages + Vercel

# Verify deployment status
npm run verify:deployment

# Check GitHub Actions
open https://github.com/ShamrocksStocks/shamrockstocks.github.io/actions
```

## 🏗️ What Deploys Where

| Component | Destination | URL | Trigger |
|-----------|-------------|-----|---------|
| Frontend (HTML/CSS/JS) | GitHub Pages | https://tradehax.net | Push to main |
| Backend API | Vercel | Your Vercel URL | Backend files change |
| Static Assets | GitHub Pages | Served with site | Push to main |

## 📋 Deployment Checklist

- [ ] Changes committed locally
- [ ] Tests pass (`npm run test:all`)
- [ ] Pushed to `main` branch
- [ ] GitHub Actions workflow succeeds
- [ ] Verified site at tradehax.net
- [ ] Backend health check passes (if backend changed)

## 🔧 Setup (One-Time)

### 1. GitHub Secrets
```bash
# In GitHub repo settings → Secrets → Actions
VERCEL_TOKEN=xxxxx  # From https://vercel.com/account/tokens
```

### 2. Vercel Project
```bash
cd tradehax-backend
vercel link
# Add environment variables
bash ../setup-vercel-env.sh
```

### 3. Git Hooks (Optional)
```bash
pwsh scripts/install-hooks.ps1  # Windows
# or
bash scripts/install-hooks.sh   # Mac/Linux
```

## 🚨 Troubleshooting

### Frontend not updating

```bash
# Check GitHub Actions
gh workflow view

# Force rebuild
git commit --allow-empty -m "Rebuild"
git push origin main

# Clear cache
curl -X PURGE https://tradehax.net
```

### Backend not deploying

```bash
# Check Vercel token
gh secret list | grep VERCEL

# Manual deploy (emergency only)
cd tradehax-backend
vercel --prod
# ⚠️ Remember to commit changes to GitHub!
```

### Workflow failed

1. Check Actions tab for error logs
2. Verify all secrets are set
3. Check file paths in workflow triggers
4. Ensure dependencies are correct

## 📚 Full Documentation

- **[DEPLOYMENT_SYNC_GUIDE.md](./DEPLOYMENT_SYNC_GUIDE.md)** - Complete guide
- **[VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md)** - Vercel setup
- **[README.md](./README.md)** - General documentation

## 💡 Pro Tips

1. **Use feature branches** for significant changes
2. **Let CI test** before deploying (via PR)
3. **Monitor first deployment** to catch issues early
4. **Keep secrets secure** - never commit them
5. **Document breaking changes** in commit messages

## ⏱️ Deployment Times

- Frontend: ~2-3 minutes
- Backend: ~1-2 minutes
- Total: ~3-5 minutes from push to live

## 🎉 Success Indicators

- ✅ GitHub Actions workflow shows green checkmark
- ✅ https://tradehax.net loads without errors
- ✅ Backend health endpoint returns `{"status": "ok"}`
- ✅ No console errors in browser DevTools
