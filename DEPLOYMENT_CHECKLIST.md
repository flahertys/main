# 🚀 Vercel Deployment Checklist for tradehaxai.tech

## ✅ Pre-Deployment (COMPLETED)
- [x] Repository cloned and dependencies installed
- [x] Build tested and working (`npm run build`)
- [x] Lint passes with no warnings (`npm run lint`)
- [x] Dev server tested and working (`npm run dev`)
- [x] .env file removed from git tracking (security fix)
- [x] All React Hook warnings fixed
- [x] Security scan passed (0 vulnerabilities)
- [x] Code review completed

## 📋 Vercel Deployment Steps

### 1. Import Project to Vercel
```
Project ID: prj_7UYDscb0mTNAvZJrbAU9JY4K4r04
Repository: DarkModder33/main
Branch: main (or copilot/debug-main-branch)
```

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select GitHub repository: `DarkModder33/main`
4. Configure project settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Configure Domain in Vercel
1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add domains:
   - `tradehaxai.tech`
   - `www.tradehaxai.tech`
3. Vercel will provide DNS instructions

### 3. Configure DNS in Namecheap

**For tradehaxai.tech:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| CNAME | www | cname.vercel-dns.com | Automatic |
| TXT | _vercel | vc-domain-verify=www.tradehaxai.tech,ee1feb30d3a07d16aca3 | Automatic |

**Alternative DNS (if using f2551808ace42e4a):**
```
CNAME: www → f2551808ace42e4a.vercel-dns-017.com
```

### 4. Set Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

```bash
# Required for production
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_CLAIM_API_BASE=https://tradehaxai.tech/api/claim

# Optional - add your own values
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
```

**Note:** Do NOT include sensitive keys in environment variables. Use Vercel's secure environment variable storage.

### 5. Deploy
1. Click "Deploy" in Vercel Dashboard
2. Wait for build to complete
3. Check deployment logs for any errors

### 6. Verify Deployment

Test these URLs:
- ✅ https://tradehaxai.tech
- ✅ https://www.tradehaxai.tech
- ✅ https://[your-vercel-url].vercel.app

Check:
- [ ] Site loads correctly
- [ ] SSL certificate is active (HTTPS)
- [ ] All pages render properly
- [ ] Solana wallet connection works
- [ ] No console errors

## 🔒 Security Notes

1. **Never commit .env file** - It's now properly ignored
2. **Use Vercel's environment variables** for sensitive data
3. **Rotate any exposed credentials** from the .env file that was previously tracked
4. **Security headers are configured** in vercel.json

## 📝 Post-Deployment

1. **Monitor** the first few hours for any issues
2. **Test** all major features (wallet connection, games, etc.)
3. **Check analytics** if configured
4. **Update documentation** with live URL

## 🆘 Troubleshooting

### Build fails on Vercel?
- Check build logs in Vercel Dashboard
- Verify all dependencies are in package.json
- Ensure Node.js version is compatible (18.x or later)

### Domain not connecting?
- Wait 5-10 minutes for DNS propagation (can take up to 48 hours)
- Use [DNS Checker](https://dnschecker.org) to verify
- Check DNS records match exactly

### SSL not working?
- Wait 15-30 minutes after DNS is configured
- Ensure DNS is fully propagated
- Contact Vercel support if issues persist

## 📚 Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Custom Domain Setup](https://vercel.com/docs/concepts/projects/domains)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Status:** ✅ Ready for Deployment
**Last Updated:** 2026-01-27
**Branch:** copilot/debug-main-branch
