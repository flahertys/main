# ✅ Vercel Deployment Fix Checklist

Use this checklist to fix your Vercel deployment issue step by step.

## Pre-Check: Verify the Problem

Run the configuration checker:
```bash
./scripts/check-vercel-config.sh
```

If you see warnings or the deployment is still failing, follow the steps below.

---

## Step-by-Step Fix

### ☐ Step 1: Verify Repository Configuration (Local)

**Time: 1 minute**

1. Open terminal in your repository directory
2. Run: `./scripts/check-vercel-config.sh`
3. Confirm all checks pass (green checkmarks)
4. If any checks fail, fix them before proceeding

**Expected Result**: All checks should pass with 0 failures

---

### ☐ Step 2: Fix Vercel Project Settings (Vercel Dashboard)

**Time: 2 minutes**

**Critical Settings to Check:**

1. **Log into Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (named "main" or similar)
3. **Go to Settings → Git**
   - ✅ Production Branch must be: `main`
   - ❌ NOT `gh-pages`
   - Click **Save** if you made changes

4. **Go to Settings → General**
   - ✅ Framework Preset: `Next.js`
   - ✅ Build Command: `npm run build` (or leave as default)
   - ✅ Output Directory: `out` (for static export) or `.next` (for dynamic)
   - ✅ Install Command: `npm install` (or leave as default)
   - ✅ Root Directory: Leave blank or `./`
   - Click **Save** if you made changes

**Expected Result**: Settings should match the checkmarks above

---

### ☐ Step 3: Verify GitHub Secrets (GitHub)

**Time: 2 minutes**

1. **Go to**: https://github.com/DarkModder33/main/settings/secrets/actions
2. **Verify these secrets exist**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

3. **If any are missing**, see [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for setup instructions

**Expected Result**: All three secrets should be present

---

### ☐ Step 4: Trigger Deployment (Vercel Dashboard)

**Time: 3 minutes**

1. **Go to**: Vercel Dashboard → Deployments
2. **Find the latest failed deployment**
3. **Click the "..." menu** → **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. **Click** "Redeploy"
6. **Wait** 2-3 minutes for build to complete

**Expected Result**: Deployment status changes to "Ready" (green)

---

### ☐ Step 5: Verify Deployment Success

**Time: 1 minute**

**Check Vercel Dashboard:**
- [ ] Latest deployment shows "Ready" status
- [ ] No errors in build logs
- [ ] Deployment time is reasonable (< 5 minutes)

**Check Website:**
- [ ] Visit: https://tradehaxai.tech
- [ ] Site loads without errors
- [ ] HTTPS padlock shows in browser
- [ ] Console has no critical errors (F12 → Console)

**Expected Result**: Site is live and functional

---

## Troubleshooting

### If Build Still Fails After Step 4:

**Check Build Logs in Vercel:**
1. Vercel Dashboard → Deployments
2. Click on the failed deployment
3. Review the build logs for specific errors

**Common Issues:**
- Missing environment variables → [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md#issue-7)
- TypeScript errors → Fix locally then push: `npm run build`
- Missing dependencies → Update package.json: `npm install <package>`

### If DNS Not Resolving:

**Check Domain Configuration:**
1. Vercel Dashboard → Settings → Domains
2. Verify domain shows "Valid Configuration"
3. Check DNS records are correct: [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md)
4. Wait 24 hours for DNS propagation

**Test DNS:**
```bash
nslookup tradehaxai.tech
# Should return: 76.76.21.21
```

### If Site Shows Old Version:

**Clear Cache:**
1. Browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Vercel: Dashboard → Deployments → Click deployment → "Clear Cache"
3. Wait 2-3 minutes and try again

---

## Verification Commands

Run these commands to verify everything is working:

```bash
# 1. Check repository configuration
./scripts/check-vercel-config.sh

# 2. Check DNS resolution
nslookup tradehaxai.tech

# 3. Check site is live
curl -I https://tradehaxai.tech

# 4. Check GitHub Actions status
# Visit: https://github.com/DarkModder33/main/actions
```

---

## Success Criteria

✅ All of these should be true:
- [ ] Vercel deployment status is "Ready"
- [ ] Site loads at https://tradehaxai.tech
- [ ] HTTPS certificate is valid
- [ ] No console errors on the homepage
- [ ] Navigation between pages works
- [ ] Images and assets load correctly

---

## Need Help?

**Documentation:**
- Quick fix guide: [VERCEL_BRANCH_FIX.md](./VERCEL_BRANCH_FIX.md)
- Full troubleshooting: [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md)
- Domain setup: [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md)
- GitHub secrets: [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

**Support:**
- Vercel Support: https://vercel.com/help
- GitHub Actions Docs: https://docs.github.com/en/actions

---

**Last Updated**: 2026-02-08  
**Estimated Total Time**: 10-15 minutes  
**Difficulty**: 🟢 Easy - No coding required
