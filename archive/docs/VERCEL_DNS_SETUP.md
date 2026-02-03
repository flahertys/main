# Vercel DNS Setup for tradehaxai.tech

## Overview
This document provides the complete DNS configuration for deploying this Next.js application to Vercel with the custom domain `tradehaxai.tech`.

## Prerequisites
- ✅ Vercel account created
- ✅ Domain registered: tradehaxai.tech
- ✅ Access to domain DNS settings (Namecheap or equivalent)
- ✅ GitHub repository connected to Vercel

## DNS Records Configuration

### 1. Domain Verification (Required for Vercel)
Add the following TXT record for domain verification:

```
Type: TXT
Name: _vercel
Value: vc-domain-verify=www.tradehaxai.tech,ee1feb30d3a07d16aca3
TTL: 3600
```

### 2. Apex Domain (@) Configuration
**Recommended: Using Vercel A Record**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Alternative: Using Vercel CNAME (if supported by your DNS provider)**
Some DNS providers support CNAME flattening for apex domains:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com.
TTL: 3600
```

**Note**: If migrating from GitHub Pages, remove the old CNAME pointing to `darkmodder33.github.io`

### 3. WWW Subdomain Configuration
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 3600
```

**Alternative configuration:**
```
Type: CNAME
Name: www
Value: f2551808ace42e4a.vercel-dns-017.com.
TTL: 3600
```

## Vercel Project Setup

### Step 1: Connect GitHub Repository
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `DarkModder33/main`
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 2: Add Custom Domain
1. Go to Project Settings → Domains
2. Add domain: `tradehaxai.tech`
3. Add domain: `www.tradehaxai.tech`
4. Vercel will provide DNS instructions - verify they match the records above

### Step 3: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Application URLs
NEXT_PUBLIC_APP_URL=https://tradehaxai.tech
NEXT_PUBLIC_FRONTEND_URL=https://tradehaxai.tech

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-api-key

# API Configuration
NEXT_PUBLIC_CLAIM_API_BASE=https://tradehaxai.tech/api/claim
NEXT_PUBLIC_BACKEND_URL=https://api.tradehaxai.tech

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# Contact
NEXT_PUBLIC_CONTACT_EMAIL=support@tradehaxai.tech
```

### Step 4: Deploy
1. Push changes to GitHub main branch
2. Vercel will automatically deploy
3. Monitor deployment in Vercel Dashboard
4. Wait for DNS propagation (5-60 minutes)

## DNS Provider Configuration

### For Namecheap
1. Log in to Namecheap
2. Go to Domain List → Manage → Advanced DNS
3. Add the DNS records listed above
4. Remove any conflicting records
5. Save changes

### For Other Providers
Follow similar steps in your DNS provider's control panel. Ensure:
- No conflicting A or CNAME records exist
- TTL values are set appropriately (3600 seconds recommended)
- All records are saved and published

## Verification Steps

### 1. Check DNS Propagation
Use [DNS Checker](https://dnschecker.org) to verify:
- `tradehaxai.tech` → Points to Vercel
- `www.tradehaxai.tech` → CNAME to Vercel

### 2. Verify SSL Certificate
Once DNS propagates, Vercel will automatically provision SSL:
- Check Vercel Dashboard → Domains
- Look for "Valid Configuration" status
- SSL usually provisions within 15 minutes

### 3. Test Your Site
Visit these URLs:
- https://tradehaxai.tech - Main site
- https://www.tradehaxai.tech - Should redirect to main
- http://tradehaxai.tech - Should redirect to HTTPS

## Deployment Features

### Automatic Deployments
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from pull requests
- Each commit triggers a new deployment

### Built-in Features
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Edge Functions
- ✅ Analytics
- ✅ Web Vitals monitoring
- ✅ Automatic image optimization

## Troubleshooting

### DNS Not Resolving
- Wait 24-48 hours for full propagation
- Verify DNS records are correct
- Check nameservers point to your DNS provider

### SSL Certificate Issues
- Ensure DNS is fully propagated first
- Try removing and re-adding domain in Vercel
- Contact Vercel support if issue persists

### Build Failures
- Check build logs in Vercel Dashboard
- Verify all dependencies in package.json
- Ensure environment variables are set
- Test build locally: `npm run build`

## Security Best Practices

1. **Never commit sensitive data**
   - Keep `.env` files out of git
   - Use Vercel Environment Variables for secrets

2. **Enable Vercel Security Features**
   - Password Protection (for preview deployments)
   - Vercel Firewall (Enterprise)
   - DDoS Protection (automatic)

3. **Regular Updates**
   - Keep Next.js and dependencies updated
   - Monitor npm audit for vulnerabilities
   - Review Vercel security advisories

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Support](https://vercel.com/support)
- DNS Checker: https://dnschecker.org
- SSL Checker: https://www.sslshopper.com/ssl-checker.html

## Deployment Checklist

- [ ] GitHub repository connected to Vercel
- [ ] DNS records configured
- [ ] Custom domain added in Vercel
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] DNS propagated (use dnschecker.org)
- [ ] SSL certificate issued
- [ ] Site accessible via https://tradehaxai.tech
- [ ] www subdomain redirects correctly
- [ ] All features working (wallet connection, games, etc.)
- [ ] Analytics configured
- [ ] Production ready!

---

**Last Updated**: 2026-01-27
**Status**: Ready for deployment
