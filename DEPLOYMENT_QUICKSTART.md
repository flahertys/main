# Vercel Deployment Setup - Quick Start

## Overview
This repository is configured for automatic deployment to **https://tradehaxai.tech** when you push to the `main` branch.

## 🚀 Quick Setup (5 Steps)

### Step 1: Configure GitHub Secrets (5 minutes)

You need to add three secrets to your GitHub repository for automated deployments:

1. Go to: https://github.com/DarkModder33/main/settings/secrets/actions
2. Add these three secrets (click "New repository secret" for each):
   - `VERCEL_TOKEN` - Get from Vercel Dashboard → Settings → Tokens
   - `VERCEL_ORG_ID` - Get from running `vercel link` locally
   - `VERCEL_PROJECT_ID` - Get from running `vercel link` locally

**📖 Detailed instructions:** [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

---

### Step 2: Add Domain Verification Record (2 minutes)

**⚠️ CRITICAL:** Add this TXT record to your DNS provider (Namecheap, GoDaddy, etc.):

```
Type: TXT
Name: _vercel
Value: vc-domain-verify=tradehaxai.tech,9b1517380c738599577c
TTL: 3600
```

This is **required** for Vercel to allow your custom domain.

---

### Step 3: Configure DNS Records (5 minutes)

Add these DNS records in your domain registrar:

**A Record (apex domain):**
```
Type: A
Host: @
Value: 76.76.21.21
TTL: 3600
```

**CNAME Record (www subdomain):**
```
Type: CNAME
Host: www
Value: cname.vercel-dns.com.
TTL: 3600
```

**📖 Detailed instructions:** [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md)

---

### Step 4: Add Domain in Vercel Dashboard (2 minutes)

1. Log into [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to your project (it will be named after your GitHub repository)
3. Click **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `tradehaxai.tech`
5. Click **Add**
6. Vercel will verify DNS records and issue SSL certificate

---

### Step 5: Push to Main Branch (Automatic)

Once the above steps are complete:

```bash
git add .
git commit -m "your changes"
git push origin main
```

The deployment happens automatically:
1. GitHub Actions workflow runs
2. Code is built and tested
3. Deployed to Vercel
4. Live at https://tradehaxai.tech within 3-5 minutes

---

## ✅ Verification

After setup, verify everything works:

1. **Check GitHub Actions**: https://github.com/DarkModder33/main/actions
   - Should show green checkmark for "Deploy to Vercel"

2. **Check DNS Propagation**: https://dnschecker.org
   - Enter `tradehaxai.tech`, should show `76.76.21.21`

3. **Check Vercel Dashboard**: 
   - Domain should show "Valid Configuration" ✅
   - SSL certificate should show "Active" ✅

4. **Visit Site**: https://tradehaxai.tech
   - Should load with HTTPS padlock
   - No errors in browser console

---

## 🆘 Troubleshooting

If something doesn't work:

### Site Not Loading?
1. Wait 5-60 minutes for DNS propagation
2. Check DNS records are correct
3. Verify domain verification TXT record was added
4. Check [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md)

### GitHub Actions Failing?
1. Verify all three GitHub secrets are set correctly
2. Check workflow logs for specific error
3. See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) troubleshooting section

### Build Failing?
1. Test locally: `npm run build`
2. Fix any errors in code
3. Check Vercel deployment logs
4. See [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md)

---

## 📚 Documentation

Complete guides available:

- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)**
  - How to get and configure GitHub secrets
  - VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
  - Security best practices

- **[VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md)**
  - Complete domain configuration guide
  - DNS records setup
  - Domain verification
  - SSL certificate setup

- **[VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md)**
  - Comprehensive troubleshooting guide
  - Common issues and solutions
  - Emergency rollback procedures
  - Vercel dashboard health checks

- **[README.md](./README.md)**
  - Project overview
  - Local development setup
  - Environment variables
  - Project structure

---

## 🔄 Workflow

### Automatic Deployment Workflow

```
Push to main branch
       ↓
GitHub Actions triggered
       ↓
1. Checkout code
2. Install Vercel CLI
3. Pull Vercel environment
4. Build project
5. Deploy to Vercel
       ↓
Live at https://tradehaxai.tech
```

### What Happens on Each Push

- **Main branch**: Deploys to production (tradehaxai.tech)
- **Pull requests**: Creates preview deployment + comment with URL
- **Other branches**: No automatic deployment

---

## 🔒 Security Notes

### Required for Security
- TXT record verifies domain ownership
- GitHub secrets keep tokens secure
- HTTPS enforced automatically by Vercel
- CSP headers configured in `vercel.json`

### Best Practices
- Never commit `.env` files
- Rotate VERCEL_TOKEN every 3-6 months
- Use environment variables for all secrets
- Keep dependencies updated: `npm audit`

---

## 🎯 Project Stack

- **Framework**: Next.js 15.5.10
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Blockchain**: Solana Web3.js
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions
- **Domain**: tradehaxai.tech

---

## 📞 Support

### Documentation Issues
- Check troubleshooting guide first
- Review GitHub Actions logs
- Check Vercel deployment logs

### External Support
- **Vercel Support**: https://vercel.com/support
- **GitHub Actions**: https://docs.github.com/en/actions
- **Domain/DNS**: Your domain registrar's support

### Tools
- **DNS Checker**: https://dnschecker.org
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Vercel Status**: https://vercel-status.com

---

## 📝 Maintenance Checklist

### After Initial Setup
- [ ] Test deployment by pushing to main
- [ ] Verify site loads at https://tradehaxai.tech
- [ ] Check SSL certificate is active
- [ ] Set up environment variables in Vercel
- [ ] Configure monitoring/alerts

### Monthly
- [ ] Check GitHub Actions are working
- [ ] Verify DNS records are correct
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`

### Quarterly
- [ ] Rotate VERCEL_TOKEN
- [ ] Review and update documentation
- [ ] Test rollback procedures
- [ ] Check Vercel usage/billing

---

**Last Updated**: 2026-01-28  
**Repository**: https://github.com/DarkModder33/main  
**Live Site**: https://tradehaxai.tech  
**Status**: ✅ Production Ready
