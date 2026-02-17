# Quick Deployment Guide - tradehaxai.tech

## 🚀 Fast Track Deployment

### Step 1: Deploy to Vercel (5 minutes)
1. Go to https://vercel.com/new
2. Import GitHub repo: `DarkModder33/main`
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy**

### Step 2: Add Custom Domain (2 minutes)
1. Project Settings → Domains
2. Add: `tradehaxai.tech`
3. Add: `www.tradehaxai.tech`

### Step 3: Configure DNS (5 minutes)
In your domain registrar (Namecheap, etc.), add these records:

```
TXT    _vercel      vc-domain-verify=www.tradehaxai.tech,ee1feb30d3a07d16aca3
A      @            76.76.21.21
CNAME  www          cname.vercel-dns.com.
```

### Step 4: Wait for DNS (30-60 minutes)
- DNS propagation: 30-60 minutes
- SSL certificate: Auto-provisioned after DNS
- Check status: https://dnschecker.org

### Step 5: Verify Deployment
Visit https://tradehaxai.tech - Should show your site! ✅

## 📋 Pre-Deployment Checklist

### Repository Ready
- [x] Next.js build successful (`npm run build`)
- [x] CNAME file in `/public` directory
- [x] vercel.json configured
- [x] .vercelignore created
- [x] Dependencies up to date

### Vercel Configuration
- [ ] GitHub repo connected
- [ ] Automatic deployments enabled
- [ ] Environment variables set (optional)

### DNS Configuration
- [ ] TXT record for verification
- [ ] CNAME for apex domain (@)
- [ ] CNAME for www subdomain
- [ ] Old conflicting records removed

## 🔧 Environment Variables (Optional)

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Core
NEXT_PUBLIC_APP_URL=https://tradehaxai.tech

# Solana/Web3
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com

# API
NEXT_PUBLIC_CLAIM_API_BASE=https://tradehaxai.tech/api/claim
```

## 🎯 Post-Deployment Tasks

1. **Test all pages**
   - Landing page: https://tradehaxai.tech
   - Dashboard: https://tradehaxai.tech/dashboard
   - Game: https://tradehaxai.tech/game
   - Todos: https://tradehaxai.tech/todos

2. **Test functionality**
   - Wallet connection
   - All interactive features
   - Mobile responsiveness

3. **Monitor performance**
   - Vercel Analytics
   - Check Web Vitals
   - Review logs for errors

## 📞 Need Help?

- **DNS Issues**: Check [VERCEL_DNS_SETUP.md](./VERCEL_DNS_SETUP.md)
- **Build Errors**: Review logs in Vercel Dashboard
- **Support**: https://vercel.com/support

## 🎉 You're Live!

Once DNS propagates, your site will be live at:
- https://tradehaxai.tech
- Automatic HTTPS
- Global CDN
- Automatic deployments on git push

---

**Ready to deploy?** → [Click here to import on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/DarkModder33/main)
