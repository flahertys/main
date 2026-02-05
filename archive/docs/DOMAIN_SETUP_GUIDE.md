# 🌐 Complete Domain Setup Guide for tradehaxai.tech

## Overview
This guide will walk you through connecting your Vercel deployment to your custom domain tradehaxai.tech purchased via Namecheap.

## Prerequisites
- ✅ Domain purchased: tradehaxai.tech (via Namecheap)
- ✅ Vercel account with project deployed
- ✅ Access to Namecheap DNS settings
- ✅ This repository deployed to Vercel

---

## Part 1: Vercel Domain Configuration

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find your project (currently deployed as shamrockstocks-github-io.vercel.app)
3. Click on the project to open it

### Step 2: Add Custom Domain
1. Click **Settings** in the top navigation
2. Click **Domains** in the left sidebar
3. In the "Add Domain" field, enter: `tradehaxai.tech`
4. Click **Add**
5. Vercel will show DNS configuration instructions - **keep this page open**

### Step 3: Add www Subdomain
1. In the same Domains section, click **Add Domain** again
2. Enter: `www.tradehaxai.tech`
3. Click **Add**
4. Vercel will configure this to redirect to your main domain

---

## Part 2: Namecheap DNS Configuration

### Step 1: Access Namecheap DNS Settings
1. Log into https://namecheap.com
2. Click **Domain List** in the left sidebar
3. Find **tradehaxai.tech** and click **Manage**
4. Click the **Advanced DNS** tab

### Step 2: Remove Existing Records
**IMPORTANT:** Before adding new records, remove any conflicting ones:
- ❌ Delete any A records pointing to GitHub Pages (185.199.108.153, etc.)
- ❌ Delete any CNAME records pointing to *.github.io
- ✅ Keep any email-related records (MX, TXT for email verification)

### Step 3: Add Vercel DNS Records

Add the following records exactly as shown:

#### A Record (for apex domain tradehaxai.tech)
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic (or 300)
```

#### CNAME Record (for www.tradehaxai.tech)
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic (or 300)
```

### Step 4: Save Changes
1. Click **Save All Changes** button
2. You should see confirmation that DNS records were updated

---

## Part 3: Verify Domain Connection

### Step 1: Wait for DNS Propagation
- **Minimum wait:** 5-10 minutes
- **Maximum wait:** 24-48 hours (usually 1-2 hours)
- **Tip:** DNS changes propagate faster if you use shorter TTL values

### Step 2: Check DNS Propagation
Use online tools to verify DNS has propagated:
- https://dnschecker.org - Enter `tradehaxai.tech` and check A record
- Should show IP: 76.76.21.21
- Check from multiple locations worldwide

### Step 3: Verify in Vercel Dashboard
1. Go back to Vercel Dashboard → Your Project → Settings → Domains
2. Check status of tradehaxai.tech
3. Should show: **✅ Valid Configuration**
4. If still showing warning, wait longer for DNS propagation

### Step 4: SSL Certificate Provisioning
- Vercel automatically provisions SSL certificate (HTTPS)
- This happens **after** DNS is fully propagated
- Usually takes 5-15 minutes after DNS propagation
- You'll see **✅ SSL Certificate Issued** in Vercel dashboard

---

## Part 4: Test Your Live Site

### Test These URLs:
1. **https://tradehaxai.tech** - Should load your site with HTTPS
2. **http://tradehaxai.tech** - Should redirect to HTTPS
3. **https://www.tradehaxai.tech** - Should redirect to apex domain
4. **https://shamrockstocks-github-io.vercel.app** - Original URL should still work

### What to Check:
- ✅ Site loads without errors
- ✅ HTTPS padlock shows in browser
- ✅ All images and assets load correctly
- ✅ Wallet connection works
- ✅ No mixed content warnings

---

## Part 5: Configure Environment Variables

### Step 1: Set Environment Variables in Vercel
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable (click **Add** for each one):

**Analytics:**
```
Key: NEXT_PUBLIC_GA_MEASUREMENT_ID
Value: G-XXXXXXXXXX (from Google Analytics)
Environments: Production, Preview, Development
```

**Monetization:**
```
Key: NEXT_PUBLIC_ADSENSE_ID
Value: ca-pub-XXXXXXXXXXXXXXXX (from Google AdSense)
Environments: Production
```

**App Configuration:**
```
Key: NEXT_PUBLIC_APP_URL
Value: https://tradehaxai.tech
Environments: Production, Preview, Development
```

```
Key: NEXT_PUBLIC_CONTACT_EMAIL
Value: support@tradehaxai.tech
Environments: Production, Preview, Development
```

### Step 2: Redeploy with Environment Variables
1. After adding environment variables, go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Check **Use existing Build Cache**
6. Click **Redeploy**

---

## Troubleshooting

### Domain Not Connecting?

**Issue:** Site doesn't load at tradehaxai.tech after 24 hours

**Solutions:**
1. Verify DNS records are exact (A record: 76.76.21.21, CNAME: cname.vercel-dns.com)
2. Check for typos in records
3. Ensure no conflicting records exist
4. Try flushing your local DNS cache:
   - **Windows:** `ipconfig /flushdns`
   - **Mac:** `sudo dscacheutil -flushcache`
   - **Linux:** `sudo systemd-resolve --flush-caches`

### SSL Certificate Not Provisioning?

**Issue:** Site shows "Not Secure" or SSL error

**Solutions:**
1. Ensure DNS is fully propagated (use dnschecker.org)
2. Wait 15-30 minutes after DNS propagates
3. In Vercel Domains settings, try **Renew Certificate** button
4. If still failing after 1 hour, contact Vercel support

### Assets Not Loading?

**Issue:** Images, CSS, or JavaScript files return 404

**Solutions:**
1. Check `NEXT_PUBLIC_APP_URL` environment variable is set correctly
2. Redeploy after setting environment variables
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for specific error messages

### Vercel Shows "Invalid Configuration"

**Issue:** Vercel dashboard shows red error for domain

**Possible causes:**
1. DNS not propagated yet (wait longer)
2. Wrong DNS values (double-check A record and CNAME)
3. Nameservers not pointing to Namecheap (check domain registrar settings)

**Solution:**
1. Go to Namecheap → Domain List → tradehaxai.tech → Domain
2. Verify Nameservers are set to Namecheap default:
   - dns1.registrar-servers.com
   - dns2.registrar-servers.com

---

## Success Checklist

Once everything is working, you should have:
- ✅ tradehaxai.tech loads your site with HTTPS
- ✅ www.tradehaxai.tech redirects to apex domain
- ✅ SSL certificate showing padlock in browser
- ✅ All environment variables set in Vercel
- ✅ Google Analytics tracking (check in GA dashboard)
- ✅ Vercel Analytics enabled
- ✅ Site fully functional (wallet, trading features, etc.)

---

## Next Steps: Monetization

After domain is live, proceed to set up income streams:
1. **Google Analytics** - Already tracking (see MONETIZATION_GUIDE.md)
2. **Google AdSense** - Apply and add ad code
3. **Affiliate Links** - Add crypto exchange referral links
4. **Email Marketing** - Set up Mailchimp/ConvertKit
5. **Premium Features** - Consider Stripe for subscriptions

See **MONETIZATION_GUIDE.md** for detailed setup instructions.

---

## Support

If you encounter issues:
- **Vercel Support:** https://vercel.com/support
- **Namecheap Support:** https://namecheap.com/support
- **DNS Checker:** https://dnschecker.org
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html
