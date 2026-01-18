# 🌐 tradehaxai.tech Domain Setup Guide

> **⚠️ Note:** This repository uses **Vercel-only deployment**. GitHub Pages is not configured and should not be used. All domain configuration is managed through the Vercel Dashboard.

## Step 1: Vercel Dashboard Configuration

> **Important:** Domain configuration for this repository is managed **exclusively through the Vercel Dashboard**, not through CNAME files or GitHub settings.

1. Log into [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: **shamrockstocks-github-io**
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `tradehaxai.tech`
6. Click **Add**
7. Repeat for `www.tradehaxai.tech`

## Step 2: Namecheap DNS Configuration

1. Log into [Namecheap](https://namecheap.com)
2. Go to **Domain List**
3. Click **Manage** next to **tradehaxai.tech**
4. Click **Advanced DNS** tab
5. Add/Edit these records:

### DNS Records for Vercel:

**A Record (for apex domain):**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

**CNAME Record (for www subdomain):**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

### Remove Conflicting Records:
- ❌ Delete any existing A records for @ pointing to GitHub Pages IPs (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)
- ❌ Delete any CNAME records pointing to github.io (GitHub Pages is not used in this repository)

## Step 3: Verify Domain Connection

1. Wait 5-10 minutes for DNS propagation (can take up to 48 hours)
2. In Vercel Dashboard → Domains, check status:
   - ✅ Should show "Valid Configuration" with green checkmark
3. Vercel will automatically provision SSL certificate (HTTPS)

## Step 4: Test Your Site

Visit these URLs:
- https://tradehaxai.tech (should load your site)
- https://www.tradehaxai.tech (should redirect to apex domain)
- https://shamrockstocks-github-io.vercel.app (should still work)

## Step 5: Set Environment Variables in Vercel

1. In Vercel Dashboard → Settings → Environment Variables
2. Add each variable from `.env.example`:
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Your Google Analytics ID
   - `NEXT_PUBLIC_ADSENSE_ID` - Your Google AdSense ID
   - `NEXT_PUBLIC_APP_URL=https://tradehaxai.tech`
   - `NEXT_PUBLIC_CONTACT_EMAIL=support@tradehaxai.tech`
3. Click **Save**
4. Redeploy the app (Settings → Deployments → latest → ⋯ → Redeploy)

## Troubleshooting

### Domain not connecting?
- Check DNS records are exactly as specified
- Wait longer (DNS can take 24-48 hours)
- Use [DNS Checker](https://dnschecker.org) to verify propagation

### SSL Certificate not provisioning?
- Ensure DNS is fully propagated
- Check Vercel domain status shows "Valid Configuration"
- May take 15-30 minutes after DNS is correct

### Site loads but images/styles broken?
- Check `NEXT_PUBLIC_APP_URL` environment variable is set correctly
- Redeploy the app after setting environment variables

## Additional Resources

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Namecheap DNS Setup Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9645/2208/how-do-i-link-my-domain-to-vercel/)
- [DNS Propagation Checker](https://dnschecker.org)
