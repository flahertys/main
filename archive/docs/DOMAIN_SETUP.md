# 🌐 Complete Domain Setup Guide

## Overview
This guide covers the complete setup for deploying TradeHax AI to both GitHub Pages and Vercel with custom domains.

**Domains:**
- Primary: `tradehaxai.tech`
- Secondary: `tradehaxai.me`

**Deployment Platforms:**
- GitHub Pages (Static hosting)
- Vercel (Primary production deployment)

---

## Part 1: Vercel Deployment Setup

### Step 1: Vercel Project Configuration

1. **Login to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Find your project or import from GitHub

2. **Import GitHub Repository** (if not already done)
   - Click "Add New..." → "Project"
   - Select GitHub repository: `DarkModder33/main`
   - Click "Import"

3. **Configure Build Settings**
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `out`
   - Install Command: `npm install`
   - Root Directory: `./`

### Step 2: Add Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

```env
# Required
NEXT_PUBLIC_SITE_URL=https://tradehaxai.tech
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com

# Optional but recommended
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Important:** Set these for all environments (Production, Preview, Development)

### Step 3: Add Custom Domains in Vercel

1. **Add Primary Domain (tradehaxai.tech)**
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter: `tradehaxai.tech`
   - Click "Add"
   - Vercel will show DNS configuration instructions

2. **Add www Subdomain**
   - Click "Add Domain" again
   - Enter: `www.tradehaxai.tech`
   - Click "Add"
   - This will auto-redirect to apex domain

3. **Add Secondary Domain (tradehaxai.me)** (Optional)
   - Click "Add Domain"
   - Enter: `tradehaxai.me`
   - Click "Add"
   - Add `www.tradehaxai.me` as well

---

## Part 2: Namecheap DNS Configuration

### For tradehaxai.tech

1. **Login to Namecheap**
   - Go to https://namecheap.com
   - Navigate to Domain List → tradehaxai.tech → Manage
   - Click "Advanced DNS" tab

2. **Remove Conflicting Records**
   - Delete any existing A records pointing to GitHub Pages
   - Delete any CNAME records pointing to *.github.io
   - Keep MX records (email) if you have them

3. **Add Vercel DNS Records**

   **A Record (Apex Domain):**
   ```
   Type: A Record
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
   ```

   **CNAME Record (www subdomain):**
   ```
   Type: CNAME Record
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```

   **TXT Record (Domain Verification - if required by Vercel):**
   ```
   Type: TXT Record
   Host: _vercel
   Value: (provided by Vercel dashboard)
   TTL: Automatic
   ```

4. **Save All Changes**

### For tradehaxai.me (Optional)

Repeat the same DNS configuration:

```
A Record:
Host: @
Value: 76.76.21.21

CNAME Record:
Host: www
Value: cname.vercel-dns.com
```

---

## Part 3: GitHub Pages Setup

### Step 1: Enable GitHub Pages

1. **Go to Repository Settings**
   - Navigate to https://github.com/DarkModder33/main
   - Click "Settings" tab
   - Click "Pages" in left sidebar

2. **Configure Source**
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Folder: `/ (root)`
   - Click "Save"

3. **Custom Domain** (Optional - if you want GitHub Pages as backup)
   - Enter: `tradehaxai.tech` or use a subdomain like `pages.tradehaxai.tech`
   - Click "Save"
   - Check "Enforce HTTPS"

### Step 2: GitHub Secrets Configuration

For automated deployments, add these secrets:

1. **Go to Repository Settings → Secrets and variables → Actions**

2. **Add Vercel Secrets:**
   ```
   VERCEL_TOKEN - Get from https://vercel.com/account/tokens
   VERCEL_ORG_ID - Get from Vercel project settings
   VERCEL_PROJECT_ID - Get from Vercel project settings
   ```

3. **How to Get Vercel Credentials:**
   - **VERCEL_TOKEN**: Vercel Dashboard → Settings → Tokens → Create Token
   - **VERCEL_ORG_ID & VERCEL_PROJECT_ID**: 
     ```bash
     # Install Vercel CLI
     npm i -g vercel
     
     # Login and link project
     vercel login
     vercel link
     
     # View project info
     cat .vercel/project.json
     ```

---

## Part 4: DNS Propagation & Verification

### Step 1: Wait for DNS Propagation

- **Minimum:** 5-10 minutes
- **Typical:** 1-2 hours
- **Maximum:** 24-48 hours

### Step 2: Check DNS Propagation

Use these tools to verify:

1. **DNS Checker**
   - https://dnschecker.org
   - Enter: `tradehaxai.tech`
   - Check A record shows: `76.76.21.21`
   - Check from multiple global locations

2. **Command Line Check**
   ```bash
   # Windows
   nslookup tradehaxai.tech
   
   # Mac/Linux
   dig tradehaxai.tech
   host tradehaxai.tech
   ```

3. **Expected Results:**
   ```
   tradehaxai.tech → 76.76.21.21 (A record)
   www.tradehaxai.tech → cname.vercel-dns.com (CNAME)
   ```

### Step 3: Verify SSL Certificate

1. **Check Vercel Dashboard**
   - Go to Project Settings → Domains
   - Status should show: ✅ Valid Configuration
   - SSL should show: ✅ Certificate Issued

2. **Test HTTPS**
   - Visit: https://tradehaxai.tech
   - Check for padlock icon in browser
   - Certificate should be issued by Vercel

3. **SSL Checker Tool**
   - https://www.sslshopper.com/ssl-checker.html
   - Enter: `tradehaxai.tech`
   - Verify certificate is valid

---

## Part 5: Testing & Verification

### Automated Deployment Test

1. **Make a Test Commit**
   ```bash
   git add .
   git commit -m "test: verify deployment pipeline"
   git push origin main
   ```

2. **Monitor GitHub Actions**
   - Go to repository → Actions tab
   - Watch both workflows:
     - "Deploy to GitHub Pages"
     - "Deploy to Vercel"
   - Both should complete successfully

3. **Check Vercel Deployment**
   - Go to Vercel Dashboard → Deployments
   - Latest deployment should show "Ready"
   - Click to view deployment logs

### Manual Testing Checklist

Test all these URLs:

- [ ] **https://tradehaxai.tech** - Main site loads
- [ ] **http://tradehaxai.tech** - Redirects to HTTPS
- [ ] **https://www.tradehaxai.tech** - Redirects to apex domain
- [ ] **https://tradehaxai.me** - Loads (if configured)
- [ ] **https://www.tradehaxai.me** - Redirects (if configured)

### Feature Testing

- [ ] Homepage loads without errors
- [ ] All navigation links work
- [ ] Images load correctly
- [ ] Wallet connection works (Phantom/Solflare)
- [ ] Mobile responsive design works
- [ ] No console errors in browser
- [ ] Analytics tracking works (check Google Analytics)
- [ ] Forms submit correctly
- [ ] API endpoints respond

### Performance Testing

- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Mobile performance good
- [ ] No mixed content warnings
- [ ] All assets load from HTTPS

---

## Part 6: Mobile Optimization Verification

### Test on Real Devices

1. **iOS Testing**
   - Safari on iPhone
   - Chrome on iPhone
   - Test wallet connection
   - Test touch interactions

2. **Android Testing**
   - Chrome on Android
   - Samsung Internet
   - Test wallet connection
   - Test responsive layout

### Mobile-Specific Checks

- [ ] Viewport meta tag present
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling
- [ ] Forms are easy to fill on mobile
- [ ] Buttons are easily tappable

---

## Troubleshooting

### Issue: Domain Not Resolving

**Symptoms:** Site doesn't load at custom domain

**Solutions:**
1. Verify DNS records are correct (A: 76.76.21.21, CNAME: cname.vercel-dns.com)
2. Check for typos in DNS configuration
3. Wait longer for DNS propagation (up to 48 hours)
4. Clear local DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```
5. Try accessing from different network/device

### Issue: SSL Certificate Not Issued

**Symptoms:** "Not Secure" warning or SSL error

**Solutions:**
1. Ensure DNS is fully propagated (use dnschecker.org)
2. Wait 15-30 minutes after DNS propagates
3. In Vercel Dashboard → Domains, click "Refresh" or "Renew Certificate"
4. Check domain verification TXT record is present
5. Contact Vercel support if issue persists after 24 hours

### Issue: GitHub Actions Workflow Fails

**Symptoms:** Red X on commits, deployment fails

**Solutions:**
1. Check Actions tab for error logs
2. Verify all secrets are set correctly
3. Ensure `npm run build` works locally
4. Check for syntax errors in workflow files
5. Verify Node.js version compatibility

### Issue: Vercel Build Fails

**Symptoms:** Deployment shows "Failed" status

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Check for missing dependencies
5. Verify Next.js configuration is correct

### Issue: Site Loads but Features Don't Work

**Symptoms:** Wallet won't connect, API calls fail

**Solutions:**
1. Check browser console for errors
2. Verify environment variables are set in Vercel
3. Check CSP headers aren't blocking resources
4. Verify RPC endpoint is accessible
5. Test API endpoints directly

### Issue: Mobile Site Issues

**Symptoms:** Layout broken on mobile, features don't work

**Solutions:**
1. Check viewport meta tag in layout.tsx
2. Test responsive breakpoints
3. Verify touch events work
4. Check for mobile-specific console errors
5. Test on multiple devices/browsers

---

## Maintenance & Updates

### Regular Checks

**Weekly:**
- [ ] Check site is accessible
- [ ] Monitor Vercel analytics
- [ ] Check for security updates

**Monthly:**
- [ ] Update dependencies: `npm update`
- [ ] Review and renew SSL certificates (auto-renewed by Vercel)
- [ ] Check DNS records are still correct
- [ ] Review error logs

### Updating the Site

1. **Make Changes Locally**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: description of changes"
   ```

2. **Test Locally**
   ```bash
   npm run build
   npm run start
   # Test at http://localhost:3000
   ```

3. **Deploy**
   ```bash
   git push origin main
   # Automatic deployment triggers
   ```

4. **Verify Deployment**
   - Check GitHub Actions completed
   - Check Vercel deployment succeeded
   - Test live site

---

## Emergency Rollback

If a deployment breaks the site:

### Option 1: Rollback in Vercel Dashboard

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback

### Option 2: Revert Git Commit

```bash
# Find the commit to revert to
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit (use with caution)
git reset --hard HEAD~1
git push origin main --force
```

---

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Namecheap Support:** https://www.namecheap.com/support/
- **DNS Checker:** https://dnschecker.org
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html
- **GitHub Actions Docs:** https://docs.github.com/en/actions

---

## Success Checklist

Once everything is working:

- [x] Next.js configuration optimized
- [x] GitHub Actions workflows configured
- [x] Vercel project set up
- [x] Environment variables configured
- [x] DNS records configured in Namecheap
- [x] Custom domains added in Vercel
- [x] SSL certificates issued
- [x] Site loads at https://tradehaxai.tech
- [x] Mobile optimization verified
- [x] All features working
- [x] Analytics tracking
- [x] Automatic deployments working

---

**Last Updated:** 2025-01-XX
**Deployment Status:** ✅ Live at https://tradehaxai.tech
