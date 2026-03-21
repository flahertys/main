# Two-Project Setup: Quick Start

**Projects:** tradehax.net + tradehaxai.tech  
**Status:** ✅ Ready to Deploy  
**Updated:** 2025-01-24

---

## 30-Second Overview

You have **2 active Vercel projects** sharing the same codebase:

| Domain | Project | Purpose |
|--------|---------|---------|
| **tradehax.net** | tradehax-net (primary) | Main deployment target |
| **tradehaxai.tech** | tradehaxai-tech | Secondary domain |

**Both deploy from this repository automatically** when you push to `main`.

---

## Setup Checklist

### 1. Verify Vercel Projects Exist
```bash
# Go to: https://vercel.com/tradehax
# You should see:
# ✅ tradehax-net (project)
# ✅ tradehaxai-tech (project)
```

### 2. Get Project IDs
```bash
# Go to each project → Settings → General
# Copy the Project ID and note:
# - tradehax-net: prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw (✅ already in code)
# - tradehaxai-tech: prj_xxxxx (you'll need this)
```

### 3. Verify Domains Configured
**tradehax.net project:**
- Go to Settings → Domains
- Should show: `tradehax.net`, `www.tradehax.net`

**tradehaxai-tech project:**
- Go to Settings → Domains  
- Should show: `tradehaxai.tech` (and optionally `www.tradehaxai.tech`)

### 4. Setup GitHub Actions Secrets
Go to: **Repository → Settings → Secrets and Variables → Actions**

Add these secrets:
```
VERCEL_TOKEN              ← Your Vercel API token
VERCEL_ORG_ID             ← Your Vercel org ID (team_xxxxx)
VERCEL_PROJECT_ID_NET     ← prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw (tradehax-net)
VERCEL_PROJECT_ID_TECH    ← prj_xxxxx (tradehaxai-tech)
```

**How to get Vercel token:**
1. Go to https://vercel.com/account/tokens
2. Click "Create"
3. Name: "GitHub Actions"
4. Scope: Full Account
5. Copy and paste into GitHub secret

### 5. Update .env.local
```bash
cp .env.consolidated.example .env.local
nano .env.local

# Required:
HUGGINGFACE_API_KEY=hf_your_token_here
SUPABASE_URL=https://...
SUPABASE_SECRET_KEY=sb_secret_...
NEXTAUTH_SECRET=your_secret_here
```

### 6. Test Locally
```bash
npm install
npm run build
npm run preview

# In another terminal:
curl http://localhost:4173/__health
```

### 7. Push & Watch Deploy
```bash
git add .
git commit -m "Update multi-project deployment config"
git push origin main

# Go to: https://github.com/your-repo/actions
# Watch the workflow deploy to both projects
```

---

## What Happens on `git push main`

```
1. GitHub Actions Triggers
   ↓
2. Checkout code
   ↓
3. Install dependencies (npm ci)
   ↓
4. Run tests & linting
   ↓
5. Build application (npm run build)
   ↓
6. Deploy to tradehax-net (production)
   ├─ Wait for health checks
   ├─ Test API endpoints
   └─ Notify if successful/failed
   ↓
7. Deploy to tradehaxai-tech (production)
   ├─ Wait for health checks
   ├─ Test API endpoints
   └─ Notify if successful/failed
   ↓
8. Both live at:
   ✅ https://tradehax.net
   ✅ https://tradehaxai.tech
```

---

## Domain-Specific Environment Variables

Each domain can have its own configuration via Vercel dashboard:

### tradehax.net (Primary)
**Settings → Environment Variables → Add**
```
Name:  NEXT_PUBLIC_APP_URL
Value: https://tradehax.net
Scope: Production

Name:  NEXT_PUBLIC_CONTACT_EMAIL
Value: support@tradehax.net
Scope: Production
```

### tradehaxai.tech (Secondary)
Same process, but for the tradehaxai-tech project:
```
Name:  NEXT_PUBLIC_APP_URL
Value: https://tradehaxai.tech
Scope: Production

Name:  NEXT_PUBLIC_CONTACT_EMAIL
Value: support@tradehaxai.tech
Scope: Production
```

---

## Verify Everything Works

### Test tradehax.net
```bash
curl https://tradehax.net/__health
curl https://tradehax.net/api/health
curl https://tradehax.net/api/ai/health
curl https://tradehax.net/api/data/crypto?symbol=BTC
```

### Test tradehaxai.tech
```bash
curl https://tradehaxai.tech/__health
curl https://tradehaxai.tech/api/health
curl https://tradehaxai.tech/api/ai/health
curl https://tradehaxai.tech/api/data/crypto?symbol=BTC
```

**Expected Response:**
```json
{
  "ok": true,
  "status": "healthy"
}
```

---

## Troubleshooting

### "Cannot find project ID"
- Go to Vercel → Project → Settings → General
- Look for "Project ID" field
- Add to GitHub secrets as `VERCEL_PROJECT_ID_TECH`

### "Deployment fails with 'authentication error'"
- Verify `VERCEL_TOKEN` is set correctly
- Make sure it's not expired
- Create new token at https://vercel.com/account/tokens

### "Health check times out"
- Wait 30 seconds (cold start)
- Check Vercel logs: `vercel logs`
- Check GitHub Actions output for build errors

### "Domain not resolving"
- Go to Vercel → Project → Settings → Domains
- Check if domain is verified (green checkmark)
- Verify DNS records in domain registrar (NameCheap)
- May take 5-10 minutes for DNS to propagate

### "Only one project deploys"
- Make sure both `VERCEL_PROJECT_ID_NET` and `VERCEL_PROJECT_ID_TECH` are in GitHub secrets
- Check GitHub Actions workflow output

---

## Manual Deployment (If Needed)

```bash
# Deploy to tradehax-net only
vercel deploy --prod --project-id=prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw

# Deploy to tradehaxai-tech only
vercel deploy --prod --project-id=prj_xxxxx

# Deploy both
for id in prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw prj_xxxxx; do
  vercel deploy --prod --project-id=$id
done
```

---

## Rollback (If Deployment Breaks)

### Via Vercel Dashboard
1. Go to project → Deployments
2. Find last good deployment
3. Click three dots → "Promote to Production"

### Via CLI
```bash
vercel deployments    # List all
vercel promote <url>  # Promote previous
```

---

## Monitoring Both Projects

### Real-time logs
```bash
# tradehax-net
vercel logs https://tradehax.net --follow

# tradehaxai-tech
vercel logs https://tradehaxai.tech --follow
```

### Check health periodically
```bash
# Add to cron job or run manually
watch -n 60 'echo "=== tradehax.net ===" && curl -s https://tradehax.net/__health | jq . && echo "" && echo "=== tradehaxai.tech ===" && curl -s https://tradehaxai.tech/__health | jq .'
```

---

## Files Modified

- ✅ `.vercel/project.json` — Updated projectName to "tradehax-net"
- ✅ `./web/vercel.json` — Removed old redirects, fixed rewrites
- ✅ `.github/workflows/deploy-multi-project.yml` — New multi-project workflow
- ✅ `./MULTI_PROJECT_DEPLOYMENT.md` — Detailed guide

---

## Quick Reference

| Task | Command |
|------|---------|
| Build locally | `npm run build` |
| Preview locally | `npm run preview` |
| Deploy to tradehax-net | `vercel deploy --prod` |
| Deploy to tradehaxai-tech | `vercel deploy --prod --project-id=prj_xxxxx` |
| Check health | `curl https://tradehax.net/__health` |
| View logs | `vercel logs` |
| List deployments | `vercel deployments` |
| Promote previous | `vercel promote <deployment-url>` |

---

## What's Next?

1. ✅ Verify both Vercel projects exist
2. ✅ Get project IDs and add to GitHub secrets
3. ✅ Verify domains are configured
4. ✅ Push to main → auto-deploys to both
5. ✅ Test both domains

---

**Status:** ✅ Ready to Deploy  
**Both projects automatically deploy from `main` branch**  
**Estimated setup time: 15 minutes**
