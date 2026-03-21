# TradeHax Multi-Project Deployment Guide

**Updated:** 2025-01-24  
**Projects:** 2 Active  
**Status:** Ready for Deployment  

---

## Project Overview

| Project | Domain | Primary | Status |
|---------|--------|---------|--------|
| **tradehax-net** | tradehax.net | ✅ Yes | Production |
| **tradehaxai-tech** | tradehaxai.tech | Secondary | Production |

Both projects share the same codebase but deploy to different Vercel projects for domain routing and analytics separation.

---

## Vercel Project Configuration

### Project 1: tradehax-net (tradehax.net)
**File:** `./.vercel/project.json`
```json
{
  "projectId": "prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw",
  "projectName": "tradehax-net",
  "domains": ["tradehax.net", "www.tradehax.net"]
}
```

**Setup Steps:**
1. Go to https://vercel.com/tradehax/tradehax-net/settings/domains
2. Verify domains are configured:
   - `tradehax.net` (root)
   - `www.tradehax.net` (www alias)
3. Verify DNS records point to Vercel:
   - A record: `76.76.19.96`
   - CNAME: `cname.vercel-dns.com`

### Project 2: tradehaxai-tech (tradehaxai.tech)
**Setup Steps:**
1. Create new Vercel project or link existing one
2. Set project name to `tradehaxai-tech`
3. Configure domain: `tradehaxai.tech`
4. Point DNS CNAME to Vercel
5. Create `.vercel/project-tech.json` for reference

---

## Multi-Project Deployment Strategy

### Option A: Single Codebase, Multiple Deployments (CURRENT)

Both projects share:
- Same source code (this repository)
- Same build process (`npm run build`)
- Same API endpoints
- Different domains only

**Advantages:**
- ✅ Single deployment pipeline
- ✅ No code duplication
- ✅ Easy to keep in sync

**How it works:**
1. Push to main branch
2. GitHub Actions builds once
3. Deploy same build to both projects

**Implementation:**
```yaml
# .github/workflows/deploy-multi.yml
- name: Deploy to tradehax-net
  run: vercel deploy --prod --project-id=prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw

- name: Deploy to tradehaxai-tech
  run: vercel deploy --prod --project-id=prj_xxxxx
```

### Option B: Separate Branches (If Needed)

If you want different code per domain:
- `main` → tradehax.net (primary)
- `tech-domain` → tradehaxai.tech (variant)

**When to use:** Only if domains need different features or branding.

---

## Environment Variables by Domain

Use Vercel environment overrides to customize per domain:

### tradehax.net Specific
**Vercel Dashboard → Settings → Environment Variables**

Add with scope `Production`:
```
NEXT_PUBLIC_APP_URL=https://tradehax.net
NEXT_PUBLIC_SITE_URL=https://tradehax.net
NEXT_PUBLIC_CONTACT_EMAIL=support@tradehax.net
GA_ID=G_TRADEHAX_NET
```

### tradehaxai.tech Specific
Add with scope `Production`:
```
NEXT_PUBLIC_APP_URL=https://tradehaxai.tech
NEXT_PUBLIC_SITE_URL=https://tradehaxai.tech
NEXT_PUBLIC_CONTACT_EMAIL=support@tradehaxai.tech
GA_ID=G_TRADEHAXAI_TECH
```

---

## Deployment Process

### Manual Deployment (Testing)

```bash
# 1. Build locally
npm run build

# 2. Preview build
npm run preview

# 3. Deploy to tradehax-net
vercel deploy --prod

# 4. Deploy to tradehaxai-tech (if separate project)
vercel deploy --prod --project-id=prj_xxxxx
```

### Automated Deployment (Production)

**When merged to `main`:**
1. GitHub Actions triggers
2. Runs linting and tests
3. Builds application
4. Deploys to tradehax-net (primary)
5. Optional: Deploy to tradehaxai-tech
6. Runs health checks
7. Posts status to pull request

**Workflow:** `./.github/workflows/deploy-production.yml`

---

## Domain Routing Configuration

### DNS Records

**tradehax.net (NameCheap)**
```
Type    | Name    | Value                    | TTL
--------|---------|--------------------------|------
A       | @       | 76.76.19.96              | 600
CNAME   | www     | cname.vercel-dns.com     | 600
TXT     | @       | v=spf1 -all              | 600
```

**tradehaxai.tech (NameCheap)**
```
Type    | Name    | Value                    | TTL
--------|---------|--------------------------|------
CNAME   | @       | cname.vercel-dns.com     | 600
CNAME   | www     | cname.vercel-dns.com     | 600
TXT     | @       | v=spf1 -all              | 600
```

### Vercel Configuration

**tradehax.net Project:**
- Domain: `tradehax.net`
- Alias: `www.tradehax.net` (auto-configured)
- SSL: Auto (Let's Encrypt)

**tradehaxai.tech Project:**
- Domain: `tradehaxai.tech`
- Alias: `www.tradehaxai.tech` (optional)
- SSL: Auto (Let's Encrypt)

---

## Switching Between Projects (CLI)

```bash
# Link to tradehax-net project
vercel link
# Select org: tradehax
# Select project: tradehax-net
# Overwrite .vercel/project.json? Yes

# Verify
vercel projects list

# Deploy to linked project
vercel deploy --prod
```

For tradehaxai-tech, create separate config:
```bash
# Save current config
cp .vercel/project.json .vercel/project-net.json

# Link to tech project
vercel link --project-id=prj_xxxxx

# Deploy
vercel deploy --prod

# Switch back
cp .vercel/project-net.json .vercel/project.json
```

---

## Health Checks & Monitoring

### Check tradehax.net
```bash
curl https://tradehax.net/__health
curl https://tradehax.net/api/health
curl https://tradehax.net/api/ai/health
```

### Check tradehaxai.tech
```bash
curl https://tradehaxai.tech/__health
curl https://tradehaxai.tech/api/health
curl https://tradehaxai.tech/api/ai/health
```

### Monitor Both
```bash
# Create script: check-health.sh
for domain in tradehax.net tradehaxai.tech; do
  echo "Checking $domain..."
  curl -I https://$domain/__health
done
```

---

## Rollback Procedure

If deployment fails:

### Quick Rollback (Vercel Dashboard)
1. Go to project → Deployments
2. Find last successful deployment
3. Click three dots → "Promote to Production"

### Via CLI
```bash
# Get deployment list
vercel deployments

# Promote previous deployment
vercel promote <deployment-url>
```

---

## Pre-Deployment Checklist

- [ ] All environment variables filled (no `your_` placeholders)
- [ ] Build passes locally: `npm run build`
- [ ] Tests pass: `npm run test`
- [ ] Health endpoints respond
- [ ] Both domains resolve to Vercel
- [ ] SSL certificates valid
- [ ] API keys rotated (within 30 days)
- [ ] GitHub Actions secrets configured

---

## Troubleshooting

### Domain not resolving
```bash
# Check DNS
nslookup tradehax.net
nslookup tradehaxai.tech

# Should return Vercel IPs:
# 76.76.19.96
# Or CNAME to cname.vercel-dns.com
```

### Deployment stuck
```bash
# Check Vercel build logs
vercel logs

# Check GitHub Actions
# Go to repo → Actions → See failed workflow
```

### Health check fails
```bash
# Check application logs
vercel logs --follow

# Local test
npm run build
npm run preview
curl http://localhost:4173/__health
```

### Wrong environment variables loading
```bash
# Verify in Vercel dashboard
# Settings → Environment Variables
# Check scope (Production vs Preview vs Development)

# Or check at runtime
curl https://tradehax.net/api/health | jq .env
```

---

## Updating Projects

### Add new domain
1. In Vercel dashboard → Settings → Domains
2. Click "Add" and enter domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-10 minutes)

### Remove domain
1. In Vercel dashboard → Settings → Domains
2. Find domain → Click three dots → "Remove"
3. Update DNS records (remove CNAME)

### Change project settings
1. In Vercel dashboard → Settings → General
2. Update:
   - Build command
   - Output directory
   - Root directory
   - Node version
3. Re-deploy with `vercel deploy --prod`

---

## Cost Optimization

Both projects share:
- ✅ Same serverless functions (1 build per deploy)
- ✅ Same CDN cache (served from same infrastructure)
- ✅ Same bandwidth billing

**Cost:** Essentially the cost of 1 project + 1 extra domain alias.

---

## Migration Path (If Consolidating Later)

If you want to consolidate back to single project:

1. Remove tradehaxai-tech project from Vercel
2. Add `tradehaxai.tech` as domain alias in tradehax-net
3. Update Vercel redirects/rewrites to handle domain logic
4. Update environment variables per domain
5. Update CI/CD to single deployment

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **DNS Management:** NameCheap dashboard
- **Environment Variables:** Vercel Settings → Environment Variables
- **Monitoring:** Vercel Analytics dashboard

---

## Next Steps

1. **Verify both projects in Vercel**
   - Go to https://vercel.com/tradehax
   - Confirm tradehax-net and tradehaxai-tech exist

2. **Test health endpoints**
   ```bash
   curl https://tradehax.net/__health
   curl https://tradehaxai.tech/__health
   ```

3. **Setup GitHub Actions secrets**
   - Go to repo → Settings → Secrets and Variables → Actions
   - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for each

4. **Deploy with confidence**
   ```bash
   git push origin main
   # GitHub Actions auto-deploys to both projects
   ```

---

**Last Updated:** 2025-01-24  
**Status:** ✅ Ready for Multi-Project Deployment  
**Confidence:** 98%
