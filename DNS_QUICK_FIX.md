# DNS Quick Fix Guide for tradehaxai.tech

**🚨 CRITICAL ISSUE FOUND**: Your `_vercel` TXT record is incorrectly configured!

---

## The Problem

Your current DNS configuration has this:
```
Type:  TXT Record
Host:  _vercel
Value: cname.vercel-dns.com.  ❌ WRONG!
```

This will **prevent Vercel from verifying your domain** and your site will not be accessible.

---

## The Solution

### 1. Delete the Wrong Record (NOW)
- Go to Namecheap → Domain List → Manage → Advanced DNS
- Find the TXT record with Host `_vercel` and Value `cname.vercel-dns.com.`
- Click delete/trash icon to remove it

### 2. Get Your Verification String from Vercel
- Go to https://vercel.com/dashboard
- Navigate to your project → Settings → Domains
- Click "Add Domain" and enter `tradehaxai.tech`
- Vercel will show you the verification string (looks like: `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`)
- Copy this entire string

### 3. Add the Correct TXT Record
In Namecheap Advanced DNS:
```
Type:  TXT Record
Host:  _vercel
Value: vc-domain-verify=tradehaxai.tech,XXXXXXXXXXXXX  ✅ (paste from Vercel)
TTL:   Automatic
```

### 4. Add WWW Support (Recommended)
While you're in Namecheap, also add:
```
Type:  CNAME Record
Host:  www
Value: cname.vercel-dns.com.
TTL:   Automatic
```

### 5. Wait & Verify
- Wait 15-30 minutes for DNS to propagate
- Check at https://dnschecker.org (search for `_vercel.tradehaxai.tech`)
- Complete domain addition in Vercel Dashboard
- Your site should be live at https://tradehaxai.tech

---

## Why This Matters

| Record Type | Purpose | Correct Value |
|-------------|---------|---------------|
| `_vercel` TXT | Proves you own the domain | `vc-domain-verify=...` ✅ |
| `_vercel` TXT | ~~Points to Vercel~~ | ~~`cname.vercel-dns.com.`~~ ❌ |

**Remember**: 
- TXT records = verification strings (like passwords)
- CNAME records = domain pointers (like URLs)
- Don't mix them up!

---

## Current Status

✅ **Working**:
- A Record: `@` → `76.76.21.21` (Vercel IP)
- SPF Record: Email configuration is correct

❌ **Broken**:
- TXT Record: `_vercel` has wrong value

⚠️ **Missing**:
- CNAME Record: `www` subdomain not configured

---

## Time to Fix
- **5 minutes**: Make DNS changes
- **15-30 minutes**: DNS propagation
- **Total**: ~30 minutes to be fully live

---

## Need Help?

See the detailed report: [DNS_INSPECTION_REPORT.md](./DNS_INSPECTION_REPORT.md)

Or follow the complete guide: [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md)

---

**Created**: 2026-02-08  
**Priority**: 🚨 HIGH - Site won't work without this fix
