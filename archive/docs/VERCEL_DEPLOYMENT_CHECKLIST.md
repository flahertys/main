# 🚀 Vercel Deployment Checklist

This checklist ensures the TradeHax AI platform is production-ready for deployment on Vercel with custom domain tradehaxai.tech.

## Pre-Deployment Checklist

### 📦 Code Quality & Build

- [x] **Lint Check**: Run `npm run lint` - No errors or warnings
- [x] **Build Check**: Run `npm run build` - Compiles successfully
- [x] **Dependencies**: Run `npm audit` - 0 vulnerabilities found
- [x] **TypeScript**: No type errors
- [x] **Next.js Config**: Optimized for production
- [ ] **Bundle Size**: Review build output, optimize if needed
- [ ] **Source Maps**: Disabled for production (or secured)

### 🔧 Configuration Files

- [x] **next.config.ts**: Production optimizations enabled
- [x] **vercel.json**: Security headers, caching, redirects configured
- [x] **.env.example**: Comprehensive documentation
- [x] **sample.env**: Quick start configuration
- [x] **tailwind.config.ts**: Production mode enabled
- [x] **.gitignore**: Sensitive files excluded

### 🌍 Environment Variables

#### Required Variables (Set in Vercel Dashboard)

- [ ] `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
- [ ] `NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com` (or dedicated RPC)
- [ ] `NEXT_PUBLIC_SITE_URL=https://tradehaxai.tech`
- [ ] `NEXT_PUBLIC_CLAIM_API_BASE=https://tradehaxai.tech/api/claim`

#### Optional But Recommended

- [ ] `NEXT_PUBLIC_HELIUS_API_KEY` - For better RPC performance
- [ ] `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - For analytics tracking
- [ ] `NODE_ENV=production` - Set automatically by Vercel

#### How to Set Environment Variables

1. Go to Vercel Dashboard → Your Project
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values
4. Select environments: Production, Preview, Development
5. Save changes

### 📚 Documentation

- [x] **README.md**: Comprehensive deployment guide
- [x] **API_DOCUMENTATION.md**: API endpoints documented
- [x] **DOMAIN_SETUP_GUIDE.md**: DNS configuration instructions
- [x] **DEPLOYMENT_GUIDE.md**: General deployment information
- [ ] **CHANGELOG.md**: Update with latest changes

### 🔒 Security

- [x] **Security Headers**: CSP, XSS, X-Frame-Options configured
- [x] **HTTPS Enforcement**: Configured in production
- [x] **Rate Limiting**: Documented (implementation pending)
- [x] **Input Validation**: API routes validate inputs
- [x] **Error Handling**: Secure error messages
- [ ] **Secrets**: All sensitive data in environment variables

### 🎨 Assets & Media

- [ ] **Favicon**: Present in `/app/favicon.ico`
- [ ] **OG Images**: `/public/og-image.png` for social sharing
- [ ] **Twitter Card**: `/public/twitter-image.png`
- [ ] **Logo**: High-resolution logo files
- [ ] **Icons**: All required icon sizes

### 📱 User Experience

- [ ] **Mobile Responsive**: Test on various screen sizes
- [ ] **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge
- [ ] **Loading States**: Proper loading indicators
- [ ] **Error States**: User-friendly error messages
- [ ] **404 Page**: Custom 404 page exists
- [ ] **Performance**: Lighthouse score > 90

## Vercel Deployment Steps

### Option 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. **Connect Repository**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository

2. **Configure Project**
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add all required variables
   - Select appropriate environments

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option 3: Automatic Deployment

The project is already configured for automatic deployment:
- ✅ GitHub Actions workflow exists (`.github/workflows/vercel-deploy.yml`)
- ✅ Pushes to `main` branch trigger deployments
- ✅ Pull requests create preview deployments

## Domain Setup

### For tradehaxai.tech

#### Step 1: Add Domain in Vercel

1. Vercel Dashboard → Project → Settings → Domains
2. Click "Add Domain"
3. Enter: `tradehaxai.tech`
4. Click "Add"
5. Vercel will show DNS instructions

#### Step 2: Configure Namecheap DNS

1. Login to [Namecheap](https://namecheap.com)
2. Go to Domain List → Manage `tradehaxai.tech`
3. Click "Advanced DNS" tab
4. Remove any conflicting records
5. Add new records:

**A Record (Apex Domain)**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```
**Note**: Vercel's IP addresses may change. Always verify the current IP from Vercel's domain configuration page.

**CNAME Record (www) - Recommended**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```
**Note**: CNAME records are preferred as Vercel manages IP addresses automatically.

6. Save all changes
7. Wait for DNS propagation (5-60 minutes)

#### Step 3: Verify Domain

1. Return to Vercel Domains page
2. Wait for green checkmark (✅ Valid Configuration)
3. SSL certificate will be issued automatically
4. Test: Visit https://tradehaxai.tech

## Post-Deployment Verification

### ✅ Functional Testing

- [ ] Homepage loads correctly: https://tradehaxai.tech
- [ ] All navigation links work
- [ ] API endpoints respond:
  - `GET /api/claim` returns status
  - `POST /api/subscribe` accepts submissions
- [ ] Wallet connection works (Phantom/Solflare)
- [ ] Forms submit properly
- [ ] Images load correctly
- [ ] Analytics tracking works (check Vercel Analytics)

### 🔍 Technical Testing

- [ ] **DNS Resolution**: Check with [dnschecker.org](https://dnschecker.org)
- [ ] **SSL Certificate**: Valid and issued by Vercel
- [ ] **HTTPS Redirect**: HTTP redirects to HTTPS
- [ ] **Security Headers**: Check with [securityheaders.com](https://securityheaders.com)
- [ ] **Page Speed**: Check with [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] **Mobile Friendly**: Check with [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### 📊 Performance Metrics

Target Lighthouse Scores:
- [ ] **Performance**: > 90
- [ ] **Accessibility**: > 90
- [ ] **Best Practices**: > 90
- [ ] **SEO**: > 90

### 🐛 Error Monitoring

- [ ] **Vercel Logs**: Check for any runtime errors
- [ ] **Console Errors**: Open DevTools, check console
- [ ] **Network Errors**: Check network tab for failed requests
- [ ] **Error Pages**: Test 404 and error pages

### 📱 Device Testing

Test on:
- [ ] Desktop (Chrome, Firefox, Safari, Edge)
- [ ] Tablet (iPad, Android tablet)
- [ ] Mobile (iPhone, Android phone)
- [ ] Different screen sizes (small, medium, large)

### 🌍 Geographic Testing

- [ ] Test from different geographic locations (if possible)
- [ ] Check CDN edge caching
- [ ] Verify fast load times globally

## Rollback Plan

If issues are discovered after deployment:

### Quick Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find the previous stable deployment
3. Click "..." → "Promote to Production"
4. Previous version is now live

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

## Monitoring & Maintenance

### Daily Checks

- [ ] Check Vercel deployment status
- [ ] Review analytics data
- [ ] Check for any error logs
- [ ] Monitor uptime

### Weekly Checks

- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Review dependency vulnerabilities: `npm audit`
- [ ] Update dependencies if needed: `npm update`

### Monthly Checks

- [ ] Full security audit
- [ ] Performance optimization review
- [ ] User feedback review
- [ ] Feature usage analytics

## Troubleshooting Common Issues

### Issue: Build Fails

**Solution:**
```bash
# Clear cache and rebuild locally
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Issue: Environment Variables Not Working

**Solution:**
1. Verify variables are set in Vercel Dashboard
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding/changing variables
4. Ensure `NEXT_PUBLIC_` prefix for client-side variables

### Issue: Domain Not Resolving

**Solution:**
1. Wait up to 48 hours for DNS propagation
2. Check DNS records in Namecheap
3. Use [dnschecker.org](https://dnschecker.org) to verify
4. Ensure no conflicting records exist

### Issue: SSL Certificate Not Issued

**Solution:**
1. Ensure DNS is fully propagated
2. Wait up to 24 hours for certificate
3. Check Vercel domain status
4. Contact Vercel support if needed

### Issue: API Routes Return 404

**Solution:**
1. Verify routes exist in `app/api/` directory
2. Check Vercel function logs
3. Ensure routes are named `route.ts` or `route.js`
4. Redeploy if routes were recently added

## Success Criteria

Deployment is successful when ALL of the following are true:

- ✅ All pages load without errors
- ✅ API endpoints respond correctly
- ✅ SSL certificate is active
- ✅ DNS is fully propagated
- ✅ No console errors
- ✅ Performance metrics meet targets
- ✅ Mobile responsiveness works
- ✅ Analytics are tracking
- ✅ All links work correctly
- ✅ Security headers are configured

## Support & Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Project README**: See [README.md](./README.md)
- **API Documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Domain Setup**: See [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md)

## Contact

For deployment issues or questions:
- Email: support@tradehaxai.tech
- GitHub Issues: [github.com/DarkModder33/main/issues](https://github.com/DarkModder33/main/issues)

---

**Prepared by**: TradeHax AI Development Team  
**Date**: January 27, 2026  
**Version**: 1.0.0
