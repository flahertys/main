# Vercel Domain Setup for tradehaxai.tech

## Overview
This document provides step-by-step instructions for configuring the custom domain `tradehaxai.tech` to work with your Vercel deployment. These steps must be completed manually through your domain registrar's DNS settings and Vercel dashboard.

> **📋 Need DNS Inspection?** If you need to verify your current DNS configuration or troubleshoot issues, see [DNS_INSPECTION_REPORT.md](./DNS_INSPECTION_REPORT.md) for a detailed analysis of your DNS records.

## Prerequisites
- ✅ Domain registered: tradehaxai.tech (via domain registrar like Namecheap, GoDaddy, etc.)
- ✅ Vercel account with project deployed
- ✅ Access to domain DNS settings
- ✅ GitHub repository connected to Vercel

---

## Step 1: Domain Verification (REQUIRED)

**⚠️ IMPORTANT**: Before your custom domain will work on Vercel, you must add a domain verification TXT record to your DNS settings.

### Add Vercel Domain Verification TXT Record

In your domain registrar's DNS management interface (e.g., Namecheap Advanced DNS, GoDaddy DNS Management), add the following TXT record:

```
Type: TXT
Name: _vercel
Value: vc-domain-verify=tradehaxai.tech,9b1517380c738599577c
TTL: 3600 (or Auto)
```

**⚠️ CRITICAL WARNING - COMMON MISTAKE**:
- ❌ **WRONG**: Do NOT use `cname.vercel-dns.com.` as the value for the `_vercel` TXT record
- ✅ **CORRECT**: Use the verification string format: `vc-domain-verify=tradehaxai.tech,XXXXXXXXXXXXX`
- The `_vercel` record must be a **TXT record** with a **verification string**, NOT a CNAME domain
- The verification string starts with `vc-domain-verify=` followed by your domain and a unique code

**How to Get Your Verification String**:
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain" and enter `tradehaxai.tech`
3. Vercel will display the exact TXT record value you need
4. Copy the entire value (e.g., `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`)
5. Add this as the value for your `_vercel` TXT record in your DNS settings

**Note**: This verification record is specific to your Vercel account and domain. It must be added for Vercel to allow the custom domain to be configured.

### Why This Step is Manual
- DNS records must be configured outside of source control for security reasons
- Each domain registrar has a different interface for DNS management
- The verification record is tied to your specific Vercel account
- This is a one-time setup per domain

---

## Step 2: Configure DNS Records

After adding the verification TXT record, configure the following DNS records to point your domain to Vercel:

### A Record (Apex Domain)
```
Type: A
Name: @ (or leave blank for apex domain)
Value: 76.76.21.21
TTL: 3600
```

### CNAME Record (WWW Subdomain)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 3600
```

**Important Notes:**
- Remove any conflicting A or CNAME records (e.g., old GitHub Pages records)
- The CNAME value must end with a dot (.) in some DNS providers
- Changes can take 5 minutes to 48 hours to propagate globally

---

## Step 3: Add Domain in Vercel Dashboard

1. Log into [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project (it will be named after your GitHub repository)
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `tradehaxai.tech`
6. Click **Add**
7. Vercel will verify the DNS records and TXT verification
8. Repeat for `www.tradehaxai.tech` if desired

---

## Step 4: Verify Deployment

### Check DNS Propagation
Use [DNS Checker](https://dnschecker.org) to verify:
- `tradehaxai.tech` → Points to 76.76.21.21
- `www.tradehaxai.tech` → CNAME to cname.vercel-dns.com

### Verify SSL Certificate
- Vercel will automatically provision an SSL certificate after DNS propagation
- This usually takes 5-15 minutes after DNS is verified
- Check Vercel Dashboard → Domains for "Valid Configuration" status

### Test Your Site
Visit these URLs to confirm:
- ✅ https://tradehaxai.tech - Main site loads with HTTPS
- ✅ https://www.tradehaxai.tech - Redirects or loads correctly
- ✅ http://tradehaxai.tech - Redirects to HTTPS

---

## Troubleshooting

### Domain Verification Failed
**Issue**: Vercel shows "Domain verification failed" error

**Solutions**:
1. Double-check the TXT record value matches exactly: `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`
2. Ensure the TXT record name is `_vercel` (underscore included)
3. Wait 5-10 minutes for DNS changes to propagate
4. Use [DNS Checker](https://dnschecker.org) to verify TXT record: enter `_vercel.tradehaxai.tech`
5. If still failing after 1 hour, contact Vercel support

### DNS Not Resolving
**Issue**: Domain doesn't point to Vercel after adding A/CNAME records

**Solutions**:
- Wait 24-48 hours for full DNS propagation
- Verify DNS records are correct (A: 76.76.21.21, CNAME: cname.vercel-dns.com)
- Check that nameservers point to your DNS provider (not Vercel nameservers)
- Flush local DNS cache:
  - **Windows**: `ipconfig /flushdns`
  - **Mac**: `sudo dscacheutil -flushcache`
  - **Linux**: `sudo systemd-resolve --flush-caches`

### SSL Certificate Not Provisioning
**Issue**: Site shows "Not Secure" or SSL error after 24 hours

**Solutions**:
1. Ensure DNS is fully propagated first (use dnschecker.org)
2. Verify domain shows "Valid Configuration" in Vercel dashboard
3. Wait 30 minutes after DNS propagates
4. Try removing and re-adding the domain in Vercel
5. Check for CAA DNS records that might block Let's Encrypt
6. Contact Vercel support if issue persists after 48 hours

### Mixed Content Warnings
**Issue**: Some assets load over HTTP instead of HTTPS

**Solutions**:
- Update `NEXT_PUBLIC_APP_URL` environment variable to `https://tradehaxai.tech`
- Redeploy the application after updating environment variables
- Check that all asset URLs in code use relative paths or HTTPS
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Build Failures After Domain Setup
**Issue**: Deployments fail after adding custom domain

**Solutions**:
1. Check build logs in Vercel Dashboard → Deployments
2. Verify all environment variables are set correctly
3. Test build locally: `npm run build`
4. Ensure all dependencies are in package.json
5. Check for any hardcoded URLs that need updating

---

## Vercel Dashboard Checks

If your site is not live after completing the above steps, verify the following in the Vercel Dashboard:

### Project Settings
1. **Settings → General**
   - Production Branch: `main` ✅
   - Framework: `Next.js` ✅

2. **Settings → Domains**
   - tradehaxai.tech: Valid Configuration ✅
   - SSL Certificate: Active ✅

3. **Settings → Environment Variables**
   - All required variables set for Production ✅
   - `NEXT_PUBLIC_APP_URL=https://tradehaxai.tech` ✅

### Recent Deployments
1. **Deployments Tab**
   - Latest deployment: Ready ✅
   - Production deployment: Active ✅
   - No build errors ✅

### Analytics & Monitoring
1. **Analytics Tab**
   - Traffic showing for tradehaxai.tech ✅
   - No 4xx or 5xx errors ✅

---

## DNS Propagation Timeline

Typical propagation times:
- **5-10 minutes**: Initial DNS servers update
- **1-2 hours**: Most DNS servers worldwide updated
- **24-48 hours**: Full global propagation guaranteed

**Pro Tip**: Use lower TTL values (300-600 seconds) during initial setup for faster updates. Increase to 3600+ after domain is stable.

---

## Security Best Practices

1. **Keep DNS Records Secure**
   - Never share DNS provider credentials
   - Enable 2FA on domain registrar account
   - Use strong, unique passwords

2. **Monitor Domain Status**
   - Set up alerts for DNS changes
   - Regularly verify domain ownership
   - Monitor SSL certificate expiration

3. **Environment Variables**
   - Never commit `.env` files to git
   - Use Vercel Environment Variables for secrets
   - Rotate API keys periodically

---

## Additional Resources

- **Vercel Domains Documentation**: https://vercel.com/docs/concepts/projects/domains
- **DNS Checker Tool**: https://dnschecker.org
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Vercel Support**: https://vercel.com/support
- **Next.js Documentation**: https://nextjs.org/docs

---

## Deployment Checklist

Complete this checklist to ensure proper domain setup:

- [ ] Domain verification TXT record added: `_vercel` → `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`
- [ ] A record added: `@` → `76.76.21.21`
- [ ] CNAME record added: `www` → `cname.vercel-dns.com.`
- [ ] Domain added in Vercel dashboard: tradehaxai.tech
- [ ] DNS propagation verified using dnschecker.org
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] SSL certificate issued and active
- [ ] Site accessible via https://tradehaxai.tech
- [ ] No mixed content warnings in browser console
- [ ] All environment variables updated for production
- [ ] Latest deployment successful on main branch
- [ ] Analytics tracking working on custom domain

---

**Last Updated**: 2026-01-28  
**Status**: Production Ready  
**Deployment Method**: Automated via GitHub Actions + Vercel
