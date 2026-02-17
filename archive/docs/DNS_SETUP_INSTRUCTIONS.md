# DNS Setup Instructions for tradehaxai.tech

This guide will help you configure your Namecheap domain (tradehaxai.tech) to work with both GitHub Pages and Vercel.

## Current Deployment Status

Your TradeHax AI application is a Next.js site that includes:
- ✅ Main landing page with trading platform features
- ✅ **Hyperborea Game** at `/game` route
- ✅ Portfolio, Services, Music sections
- ✅ Blog with multiple posts
- ✅ Todo dashboard
- ✅ Static export configured for GitHub Pages

## Option 1: GitHub Pages Primary Deployment (Recommended for Static Site)

### Step 1: Configure GitHub Repository Settings

1. Go to your repository: `https://github.com/DarkModder33/main`
2. Click on **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

### Step 2: Configure Namecheap DNS (For GitHub Pages)

1. Log in to your Namecheap account
2. Go to **Domain List** and click **Manage** next to `tradehaxai.tech`
3. Go to the **Advanced DNS** tab
4. Add/Update the following DNS records:

#### For Apex Domain (@)
```
Type: A Record
Host: @
Value: 185.199.108.153
TTL: Automatic
```

Add 3 more A records with the same host (@):
```
185.199.109.153
185.199.110.153
185.199.111.153
```

#### For WWW Subdomain
```
Type: CNAME Record
Host: www
Value: darkmodder33.github.io.
TTL: Automatic
```

**Important:** Make sure to include the trailing dot (.) after `github.io.`

### Step 3: Verify GitHub Pages Deployment

1. Wait 5-10 minutes for DNS propagation
2. Visit: `https://tradehaxai.tech`
3. You should see your TradeHax AI landing page
4. Visit: `https://tradehaxai.tech/game` to access the Hyperborea game

### Step 4: Enable HTTPS on GitHub Pages

1. Go back to **Settings** → **Pages**
2. Wait for the SSL certificate to provision (can take up to 24 hours)
3. Check the box for **Enforce HTTPS** once available

---

## Option 2: Vercel Primary Deployment (Recommended for Dynamic Features)

If you want to deploy to Vercel (for better performance and serverless functions support):

### Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository: `DarkModder33/main`
4. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default for non-static)
   - **Install Command:** `npm install` (default)

5. Add Environment Variables (optional):
   ```
   NEXT_PUBLIC_SITE_URL=https://tradehaxai.tech
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
   ```

6. Click **Deploy**

### Step 2: Configure Namecheap DNS (For Vercel)

1. Log in to your Namecheap account
2. Go to **Domain List** and click **Manage** next to `tradehaxai.tech`
3. Go to the **Advanced DNS** tab
4. Add/Update the following DNS records:

#### For Apex Domain (@)
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

#### For WWW Subdomain
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com.
TTL: Automatic
```

**Important:** Make sure to include the trailing dot (.) after `vercel-dns.com.`

### Step 3: Add Domain in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Add both domains:
   - `tradehaxai.tech`
   - `www.tradehaxai.tech`
3. Vercel will verify DNS configuration automatically
4. Wait for SSL certificate to provision (usually 1-5 minutes)

### Step 4: Verify Vercel Deployment

1. Visit: `https://tradehaxai.tech`
2. You should see your TradeHax AI landing page
3. Visit: `https://tradehaxai.tech/game` to access the Hyperborea game

---

## Hybrid Approach: GitHub Pages + Vercel

You can use both if needed:
- **GitHub Pages:** For static content and backups
- **Vercel:** For production with better performance

To do this:
1. Follow **Option 1** to set up GitHub Pages at a subdomain (e.g., `gh.tradehaxai.tech`)
2. Follow **Option 2** to set up Vercel at the main domain (`tradehaxai.tech`)

---

## Verification Steps

After DNS configuration, verify your deployment:

### 1. Check DNS Propagation
```bash
# Check A records
dig tradehaxai.tech A +short

# Check CNAME records
dig www.tradehaxai.tech CNAME +short
```

Or use online tools:
- https://dnschecker.org/
- https://www.whatsmydns.net/

### 2. Test Your Site

Visit the following URLs to ensure everything works:
- Main site: `https://tradehaxai.tech`
- WWW redirect: `https://www.tradehaxai.tech` (should redirect to apex)
- Hyperborea Game: `https://tradehaxai.tech/game`
- Blog: `https://tradehaxai.tech/blog`
- Dashboard: `https://tradehaxai.tech/dashboard`
- Services: `https://tradehaxai.tech/services`
- Music: `https://tradehaxai.tech/music`
- Portfolio: `https://tradehaxai.tech/portfolio`

### 3. Verify Game Functionality

The Hyperborea game should:
- Load at `/game` route
- Display a "Play Now" button
- Show game features and NFT information
- Have proper header and footer navigation

### 4. Check HTTPS Certificate

- Ensure the padlock icon appears in your browser
- Verify certificate is valid (click on padlock → Certificate)
- Check that all resources load over HTTPS (no mixed content warnings)

---

## Troubleshooting

### DNS Not Updating
- DNS changes can take 24-48 hours to propagate globally
- Check DNS with: `nslookup tradehaxai.tech 8.8.8.8`
- Clear your browser cache and try incognito mode

### SSL Certificate Issues
- **GitHub Pages:** SSL provisioning can take up to 24 hours
- **Vercel:** SSL is usually instant (1-5 minutes)
- Ensure HTTPS enforcement is enabled

### 404 Errors on GitHub Pages
- Verify the `gh-pages` branch exists and contains the `out/` folder contents
- Check that the `CNAME` file contains `tradehaxai.tech`
- Ensure `.nojekyll` file is present in the root

### Site Shows Old Content (Old Games)
- The build now uses the Next.js app structure with Hyperborea at `/game`
- Old HTML files (games.html, index.html in root) are NOT deployed
- The GitHub Actions workflow builds from the `app/` directory only
- Clear browser cache if you see old content

### Vercel Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Next.js config is correct

---

## Current Deployment Configuration

### What Gets Deployed

The GitHub Actions workflow (`.github/workflows/github-pages.yml`) automatically:
1. Installs dependencies with `npm ci`
2. Builds the Next.js app with `npm run build`
3. Generates static HTML in the `out/` directory
4. Adds `CNAME` file with `tradehaxai.tech`
5. Adds `.nojekyll` file for GitHub Pages
6. Deploys to the `gh-pages` branch

### Site Structure

```
/ (root)                    → Landing page (TradeHax AI platform)
/game                       → Hyperborea Game
/dashboard                  → Trading dashboard
/blog                       → Blog listing
/blog/[slug]                → Individual blog posts
/services                   → Tech services
/music                      → Music lessons & showcase
/portfolio                  → Portfolio showcase
/todos                      → Todo app
```

### Important Notes

- ✅ Build is configured for static export (`output: 'export'`)
- ✅ All images are unoptimized for static deployment
- ✅ No API routes (incompatible with static export)
- ✅ All dynamic routes have `generateStaticParams()`
- ✅ The Hyperborea game is integrated into the Next.js app at `/game`

---

## Next Steps After DNS Setup

1. **Monitor Deployment**
   - Check GitHub Actions for successful deployments
   - Watch Vercel dashboard for build status
   - Set up analytics (Google Analytics, Vercel Analytics)

2. **Test Everything**
   - Test all navigation links
   - Verify game functionality
   - Check mobile responsiveness
   - Test wallet connections (Solana)

3. **SEO Optimization**
   - Submit sitemap to Google Search Console
   - Verify meta tags and Open Graph images
   - Test page load speed with PageSpeed Insights

4. **Monitoring & Analytics**
   - Enable Vercel Analytics
   - Set up Google Analytics
   - Monitor error logs
   - Track user engagement

---

## Support

If you encounter issues:
- Check GitHub Actions logs: `https://github.com/DarkModder33/main/actions`
- Review Vercel deployment logs (if using Vercel)
- Verify DNS with online tools
- Contact Namecheap support for DNS issues
- Contact Vercel support for deployment issues

---

## Quick Reference

### Namecheap DNS Settings for GitHub Pages
```
A Record: @ → 185.199.108.153
A Record: @ → 185.199.109.153
A Record: @ → 185.199.110.153
A Record: @ → 185.199.111.153
CNAME: www → darkmodder33.github.io.
```

### Namecheap DNS Settings for Vercel
```
A Record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com.
```

---

**Last Updated:** January 29, 2026  
**Deployment Status:** ✅ Build Fixed & Ready to Deploy  
**Primary Domain:** tradehaxai.tech
