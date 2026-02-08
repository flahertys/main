# Vercel Deployment Troubleshooting Guide

## Overview
This guide helps you diagnose and resolve common issues when deploying to https://tradehaxai.tech via Vercel.

---

## Quick Diagnostic Checklist

If your site is not live after pushing to main, work through this checklist:

### 1. GitHub Actions Status ✅
- [ ] Navigate to: https://github.com/DarkModder33/main/actions
- [ ] Check that the "Deploy to Vercel" workflow ran successfully
- [ ] Look for green checkmarks, not red X marks
- [ ] Review workflow logs if deployment failed

### 2. Vercel Dashboard Status ✅
- [ ] Log into [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Find your project and check latest deployment status
- [ ] Verify deployment shows as "Ready" not "Failed" or "Building"
- [ ] Check deployment logs for any errors

### 3. DNS Configuration ✅
- [ ] Verify DNS records in your domain registrar
- [ ] Check A record: `@` → `76.76.21.21`
- [ ] Check CNAME record: `www` → `cname.vercel-dns.com.`
- [ ] Confirm verification TXT record: `_vercel` → `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`

### 4. Domain Status in Vercel ✅
- [ ] Go to Vercel Dashboard → Settings → Domains
- [ ] Verify tradehaxai.tech shows "Valid Configuration"
- [ ] Check SSL certificate status is "Active"
- [ ] Ensure domain is assigned to correct project

### 5. DNS Propagation ✅
- [ ] Visit [DNS Checker](https://dnschecker.org)
- [ ] Enter `tradehaxai.tech` and check A record globally
- [ ] Verify most locations show correct IP: 76.76.21.21
- [ ] If not propagated, wait and check again in 1 hour

---

## Common Issues & Solutions

### Issue 1: GitHub Actions Workflow Fails

#### Symptom
- Workflow shows red X mark
- Deployment never reaches Vercel
- Error in workflow logs

#### Diagnosis
Check the workflow logs in GitHub Actions:
1. Go to: https://github.com/DarkModder33/main/actions
2. Click on the failed workflow run
3. Expand the failed step to see error message

#### Common Causes & Fixes

**Missing VERCEL_TOKEN Secret**
```
Error: missing required environment variable VERCEL_TOKEN
```
**Solution**:
1. Go to Vercel Dashboard → Settings → Tokens
2. Create a new token with name "GitHub Actions"
3. Copy the token value
4. Go to GitHub repo → Settings → Secrets and variables → Actions
5. Click "New repository secret"
6. Name: `VERCEL_TOKEN`, Value: [paste token]
7. Click "Add secret"

**Missing VERCEL_ORG_ID or VERCEL_PROJECT_ID**
```
Error: missing required VERCEL_ORG_ID or VERCEL_PROJECT_ID
```
**Solution**:
1. In your local project directory, run: `vercel link`
2. This creates `.vercel/project.json` with your IDs
3. Extract values from that file:
   - `projectId` → Set as GitHub secret `VERCEL_PROJECT_ID`
   - `orgId` → Set as GitHub secret `VERCEL_ORG_ID`

**Build Fails**
```
Error: Command "npm run build" failed
```
**Solution**:
1. Test build locally: `npm run build`
2. Fix any build errors in your code
3. Commit and push fixes
4. Verify build passes locally before pushing

---

### Issue 2: Vercel Build Fails

#### Symptom
- GitHub Actions succeeds
- Vercel shows "Build Failed" in dashboard
- Deployment logs show errors

#### Diagnosis
Check Vercel deployment logs:
1. Go to Vercel Dashboard → Deployments
2. Click on the failed deployment
3. Review build logs for specific errors

#### Common Causes & Fixes

**Wrong Branch Configuration - Deploying from gh-pages**
```
Error: ENOENT: no such file or directory, open '/vercel/path0/package.json'
npm error enoent Could not read package.json
Command "npm install" exited with 254
```
**Problem**: Vercel is trying to deploy from the `gh-pages` branch, which only contains static build output (HTML/CSS/JS files) without source code or package.json.

**Solution**:
1. Go to Vercel Dashboard → Settings → Git
2. Under "Production Branch", change from `gh-pages` to `main`
3. Click "Save"
4. Go to Deployments tab
5. Click "Redeploy" on the latest deployment
6. The build should now succeed

**Why this happens**: The `gh-pages` branch is used for GitHub Pages deployment (static hosting) and contains only the build output from the `out/` directory. Vercel needs the source code from the `main` branch to run `npm install` and `npm run build`.

**Missing Dependencies**
```
Error: Cannot find module 'some-package'
```
**Solution**:
1. Ensure package is in `package.json` dependencies
2. Run `npm install` locally to verify
3. Commit and push updated `package.json` and `package-lock.json`

**Environment Variable Missing**
```
Error: NEXT_PUBLIC_SOME_VAR is not defined
```
**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add the missing variable
3. Set appropriate value
4. Select "Production" environment
5. Redeploy from Deployments tab

**Out of Memory**
```
Error: JavaScript heap out of memory
```
**Solution**:
1. Check for memory leaks in code
2. Optimize large data processing
3. Consider upgrading Vercel plan for more memory
4. Add `NODE_OPTIONS="--max-old-space-size=4096"` to build command

**TypeScript Errors**
```
Error: Type error: Property 'x' does not exist on type 'Y'
```
**Solution**:
1. Fix TypeScript errors locally: `npm run lint`
2. Run `npm run build` to catch all errors
3. Commit fixes and push

---

### Issue 3: Domain Not Resolving

#### Symptom
- Build succeeds
- Vercel deployment is Ready
- Site doesn't load at tradehaxai.tech
- Shows "This site can't be reached" error

#### Diagnosis
```bash
# Check DNS resolution
nslookup tradehaxai.tech

# Check from multiple locations
# Visit: https://dnschecker.org
```

#### Common Causes & Fixes

**DNS Records Not Added**
**Solution**: Follow [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md) to add required records

**DNS Not Propagated Yet**
**Solution**: 
- Wait 24-48 hours for full propagation
- Check progress at https://dnschecker.org
- Use `nslookup tradehaxai.tech` to test locally

**Wrong DNS Values**
**Solution**:
- Verify A record value is exactly: `76.76.21.21`
- Verify CNAME value is exactly: `cname.vercel-dns.com.`
- Fix any typos or incorrect values

**Conflicting DNS Records**
**Solution**:
- Remove old GitHub Pages A records
- Remove old CNAME records
- Keep only Vercel-specific records

**Wrong Nameservers**
**Solution**:
- Verify nameservers point to your DNS provider (e.g., Namecheap)
- Do NOT use Vercel nameservers unless you transferred domain management
- Check in domain registrar → Nameserver settings

---

### Issue 4: Domain Verification Failed

#### Symptom
- Vercel shows "Domain verification pending"
- Can't add custom domain
- Error: "Domain verification failed"

#### Diagnosis
Check TXT record:
```bash
# Check if TXT record exists
nslookup -type=TXT _vercel.tradehaxai.tech

# Or use online tool
# Visit: https://mxtoolbox.com/TXTLookup.aspx
```

#### Solution
1. Add TXT record to DNS:
   - **Name**: `_vercel`
   - **Value**: `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`
   - **TTL**: 3600
2. Wait 10 minutes for DNS propagation
3. Click "Retry" in Vercel dashboard
4. If still failing after 1 hour, double-check the value matches exactly

---

### Issue 5: SSL Certificate Not Provisioning

#### Symptom
- Domain resolves correctly
- Shows "Not Secure" in browser
- SSL certificate pending or failed
- ERR_CERT_COMMON_NAME_INVALID error

#### Diagnosis
1. Check Vercel Dashboard → Settings → Domains
2. Look for SSL status next to your domain
3. Check browser error details

#### Common Causes & Fixes

**DNS Not Fully Propagated**
**Solution**: Wait for DNS to propagate globally before SSL can be issued

**CAA Records Blocking Let's Encrypt**
**Solution**:
1. Check for CAA records: `nslookup -type=CAA tradehaxai.tech`
2. If present, ensure Let's Encrypt is allowed
3. Add CAA record: `0 issue "letsencrypt.org"`

**Domain Verification Failed**
**Solution**: Ensure TXT record for domain verification is added (see Issue 4)

**Too Many Certificate Requests**
**Solution**: 
- Let's Encrypt has rate limits
- Wait 1 hour before retrying
- Don't keep removing and re-adding domain

**Fix by Removing and Re-adding Domain**
**Solution**:
1. Vercel Dashboard → Settings → Domains
2. Click "⋯" next to tradehaxai.tech
3. Click "Remove"
4. Wait 5 minutes
5. Add domain again
6. SSL should provision within 15 minutes

---

### Issue 6: Site Loads but Shows 404 for All Pages

#### Symptom
- Domain resolves
- Site loads but all pages show 404
- Assets (images, CSS) may not load

#### Common Causes & Fixes

**Wrong Build Output Directory**
**Solution**:
1. Verify `vercel.json` has: `"outputDirectory": ".next"`
2. Ensure Next.js is building correctly: `npm run build`
3. Check `.next` directory exists after build

**Framework Not Detected**
**Solution**:
1. Ensure `vercel.json` has: `"framework": "nextjs"`
2. Redeploy after updating vercel.json

**Build Command Wrong**
**Solution**:
1. Verify `vercel.json` has: `"buildCommand": "npm run build"`
2. Ensure package.json has: `"build": "next build"`

---

### Issue 7: Environment Variables Not Working

#### Symptom
- Build succeeds
- Site loads but features don't work
- API calls fail
- Console shows "undefined" for env vars

#### Diagnosis
Check browser console:
```javascript
// Open browser DevTools → Console
console.log(process.env.NEXT_PUBLIC_APP_URL)
// Should show: https://tradehaxai.tech
```

#### Solution
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all `NEXT_PUBLIC_*` variables are set
3. Ensure they're enabled for "Production" environment
4. After adding/updating, go to Deployments tab
5. Click "⋯" on latest deployment → "Redeploy"
6. Check "Use existing Build Cache" = OFF
7. Click "Redeploy"

**Important**: Environment variables starting with `NEXT_PUBLIC_` are embedded at build time. Changing them requires a rebuild.

---

### Issue 8: Assets Loading from Wrong Domain

#### Symptom
- Site loads but shows broken images
- CSS doesn't apply
- Console shows 404s for assets
- Assets loading from localhost or wrong domain

#### Solution
1. Update environment variable:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://tradehaxai.tech`
2. Ensure next.config.ts has correct image domains
3. Redeploy (without cache)
4. Clear browser cache: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

### Issue 9: Old Version of Site Showing

#### Symptom
- Pushed new code
- GitHub Actions succeeded
- Vercel shows new deployment
- Browser still shows old version

#### Solution

**Clear Browser Cache**
```
Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)
Safari: Cmd+Option+R
```

**Clear Vercel Edge Cache**
1. Vercel Dashboard → Deployments
2. Click on latest production deployment
3. Click "Clear Cache"
4. Wait 2-3 minutes
5. Hard refresh browser

**Check if Correct Deployment is Production**
1. Vercel Dashboard → Deployments
2. Verify latest deployment has "Production" label
3. If not, click "⋯" → "Promote to Production"

---

## Vercel Dashboard Health Checks

### Required Configuration

#### Settings → General
- [x] **Project Name**: Matches your repository
- [x] **Framework Preset**: Next.js
- [x] **Build Command**: `npm run build`
- [x] **Output Directory**: `.next`
- [x] **Install Command**: `npm install`
- [x] **Root Directory**: `./` (or leave blank)

#### Settings → Git
- [x] **Connected Repository**: DarkModder33/main
- [x] **Production Branch**: `main` ⚠️ **IMPORTANT: Must be `main`, NOT `gh-pages`**
- [x] **Automatic Deployments**: Enabled
- [x] **Deploy Hooks**: Optional (can coexist with GitHub Actions)

**Note**: The `gh-pages` branch is used exclusively for GitHub Pages static hosting and contains only build output. Vercel must deploy from the `main` branch which contains source code.

#### Settings → Domains
- [x] **tradehaxai.tech**: Valid Configuration ✅
- [x] **SSL Status**: Active ✅
- [x] **DNS Status**: Configured ✅

#### Settings → Environment Variables
At minimum, set these for Production:
- [x] `NEXT_PUBLIC_APP_URL` = `https://tradehaxai.tech`
- [x] `NEXT_PUBLIC_SOLANA_NETWORK` = `mainnet-beta`
- [x] `NEXT_PUBLIC_SOLANA_RPC` = [Your RPC URL]

### Deployment Status
- [x] Latest deployment: **Ready** (green)
- [x] Build time: < 5 minutes
- [x] No errors in build logs
- [x] Production deployment active

---

## Testing After Deployment

Run through this test checklist after any deployment:

### Basic Functionality
- [ ] Visit https://tradehaxai.tech
- [ ] Site loads without errors
- [ ] HTTPS padlock shows in browser
- [ ] No mixed content warnings
- [ ] All images load correctly
- [ ] Navigation works
- [ ] Console has no critical errors

### Wallet Integration
- [ ] Wallet connect button visible
- [ ] Can open wallet modal
- [ ] Can connect Solana wallet (if installed)
- [ ] No errors in console related to Web3

### Performance
- [ ] First load is under 3 seconds
- [ ] No layout shift (CLS issues)
- [ ] Images are optimized
- [ ] Lighthouse score > 90

### Analytics
- [ ] Vercel Analytics tracking visits
- [ ] Google Analytics receiving data (if configured)
- [ ] No tracking errors in console

---

## Emergency Rollback

If a deployment breaks the site:

### Option 1: Rollback in Vercel
1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "⋯" → "Promote to Production"
4. Site reverts in ~30 seconds

### Option 2: Revert Git Commit
```bash
# Identify bad commit
git log --oneline

# Revert the commit
git revert <commit-hash>

# Push to trigger new deployment
git push origin main
```

### Option 3: Emergency Fix
1. Fix the issue in code
2. Commit with clear message: "fix: emergency fix for [issue]"
3. Push to main
4. Monitor deployment in real-time

---

## Getting Help

### Vercel Support
- **Dashboard**: Support button in bottom right
- **Email**: support@vercel.com
- **Docs**: https://vercel.com/docs
- **Status Page**: https://vercel-status.com

### GitHub Actions Support
- **Docs**: https://docs.github.com/en/actions
- **Community Forum**: https://github.community

### DNS/Domain Support
- **Namecheap**: https://namecheap.com/support
- **DNS Tools**: https://dnschecker.org, https://mxtoolbox.com

### Project-Specific Issues
- Check repository README.md
- Review existing documentation
- Open GitHub issue in repository

---

## Prevention Checklist

Prevent deployment issues before they happen:

### Before Pushing to Main
- [ ] Test build locally: `npm run build`
- [ ] Run linter: `npm run lint`
- [ ] Test locally: `npm run dev` and verify functionality
- [ ] Check for TypeScript errors
- [ ] Review changes for hardcoded URLs or paths

### Regular Maintenance
- [ ] Monitor Vercel deployment status weekly
- [ ] Check DNS configuration monthly
- [ ] Review SSL certificate status
- [ ] Update dependencies regularly
- [ ] Test rollback procedures
- [ ] Document any custom configurations

---

**Last Updated**: 2026-01-28  
**For**: tradehaxai.tech Vercel Deployment  
**Maintained By**: DarkModder33
