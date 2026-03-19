# 🗺️ Domain & Project Pipeline Architecture

**Generated:** March 19, 2026  
**Status:** Under Remediation  
**Author:** CI/CD Automation

---

## 📊 Current State: Three Domains, One Vercel Project

### Domain Inventory

| Domain | TLD | Status | Vercel Deployment | Deployment Age | Current Role |
|--------|-----|--------|------------------|-----------------|--------------|
| **tradehax.net** | `.net` | 🔴 **DISCONNECTED** | None found | — | Primary (intended) |
| **tradehaxai.tech** | `.tech` | ✅ **LIVE** | web-d16kda3e5 | 2 days | Secondary frontend |
| **tradehaxai.me** | `.me` | ✅ **LIVE** | tradehaxai-assistant-8y7i3jbu7 | 2 days | Secondary frontend |

### Vercel Project Binding

**Project:** `vallcallya`  
**Project ID:** `prj_ujLSwpPRBZ6wt4z1BBePTwpMMAPw`  
**Team/Org:** `digitaldynasty` (formerly `hackavelliz`)  
**Root Directory:** `/web` (inferred from .vercel/project.json)  
**Framework:** Next.js  
**Build Command:** `npm run build`  
**Install Command:** `npm install`  
**Node Version:** 24.x

---

## 🔴 CRITICAL ISSUE: tradehax.net Disconnection

### Problem Diagnosis

1. **DNS Resolution:** tradehax.net likely still resolves correctly via Namecheap DNS.
2. **Vercel Alias Missing:** No alias found in `digitaldynasty` team pointing `tradehax.net` to any deployment.
3. **Last Known State:** Per TRADEHAXAI_DOMAINS_FIXED.md (March 8), all three domains were aliased to `main-o0z2ts0on-hackavelliz.vercel.app`.
4. **Current State:** Only `.tech` and `.me` are aliased; `.net` is orphaned.

### Why This Happened

- Old deployment URL (`main-o0z2ts0on-hackavelliz`) has been superseded by newer builds.
- When old deployment was replaced, the `.net` alias was **not** migrated to new primary deployment.
- `.tech` and `.me` are aliased to different recent deployments (different project roots).

---

## 🏗️ Local Project Structure

```
C:\tradez\main
├── web/                    ← Primary frontend (Next.js)
│   ├── .vercel/
│   │   └── project.json   (vallcallya, digitaldynasty org)
│   ├── package.json       (build: vite, npm run build → dist/)
│   ├── vercel.json        (SPA routing, static @vercel/static-build)
│   ├── .env.local         (← Currently for .me domain)
│   ├── .env.local.me      (tradehaxai.me config)
│   ├── .env.local.tech    (tradehaxai.tech config)
│   ├── .env.local.net     (tradehax.net config)
│   └── src/app/           (Next.js app directory)
│
├── api/                    ← Backend API (Node.js, not separately deployed)
├── models/                 ← ML models (not separately deployed)
├── services/               ← Service layer (not separately deployed)
└── scripts/                ← Automation scripts
    ├── deploy-domain.ps1  (mentioned in docs but unclear current state)
    └── deploy-domain.sh
```

---

## ✅ Solution: Unified Pipeline with Clear Labeling

### Step 1: Reconnect tradehax.net Domain

**Immediate Action:**

```powershell
# Find the latest main deployment
npx vercel deployments --scope digitaldynasty | Select-Object -First 3

# Alias it
npx vercel alias set <latest-main-deployment-url> tradehax.net --scope digitaldynasty
npx vercel alias set <latest-main-deployment-url> www.tradehax.net --scope digitaldynasty
```

### Step 2: Normalize Environment Labeling

**Current Problem:** `.env.local`, `.env.local.me`, `.env.local.tech`, `.env.local.net` are confusing.

**Solution:** Implement environment profile system:

```
web/
├── .env.profiles/          ← NEW: Centralized environment directory
│   ├── local.env           (development)
│   ├── staging.env         (preview deployments)
│   ├── production.env      (prod base config)
│   ├── production.net.env  (production override for .net)
│   ├── production.tech.env (production override for .tech)
│   └── production.me.env   (production override for .me)
├── .env.loader.mjs         ← NEW: Script to load profiles
└── scripts/
    └── load-env-profile.mjs (NEW: Environment loader)
```

### Step 3: Deploy Pipeline Stages

```yaml
Environments:
  local:
    label: "Local Development"
    url: "http://localhost:3000"
    build_target: "vite (preview)"
    env_file: ".env.profiles/local.env"
    
  staging:
    label: "Preview/Staging"
    url: "preview-*.vercel.app or *.vercel.app (non-prod)"
    build_target: "vercel build --preview"
    env_file: ".env.profiles/staging.env"
    
  production:
    label: "Production (All Domains)"
    subdomains:
      - name: "tradehax.net"
        url: "https://tradehax.net"
        env_file: ".env.profiles/production.net.env"
        deployment: "latest (main branch)"
        
      - name: "tradehaxai.tech"
        url: "https://tradehaxai.tech"
        env_file: ".env.profiles/production.tech.env"
        deployment: "web-d16kda3e5-digitaldynasty"
        
      - name: "tradehaxai.me"
        url: "https://tradehaxai.me"
        env_file: ".env.profiles/production.me.env"
        deployment: "tradehaxai-assistant-8y7i3jbu7-digitaldynasty"
```

---

## 🚀 Deployment Workflow (Clarified)

### Phase 1: Build Locally (All Domains Use Same Build)

```powershell
cd C:\tradez\main\web

# Load environment for target domain
$env:DEPLOY_TARGET="net"  # or "tech" or "me"
npm run build  # Outputs to dist/
```

### Phase 2: Deploy to Vercel

```powershell
# Option A: Deploy with preview (staging)
npx vercel

# Option B: Deploy to production
npx vercel --prod

# Then alias to correct domain
npx vercel alias set <deployment-url> tradehax.net --scope digitaldynasty
```

### Phase 3: Verification

```powershell
npm run verify:deploy-bundle -- --url https://tradehax.net --expected-commit b9933b8
npm run verify:deploy-bundle -- --url https://tradehaxai.tech --expected-commit b9933b8
npm run verify:deploy-bundle -- --url https://tradehaxai.me --expected-commit b9933b8
```

---

## 📋 Remediation Checklist

- [ ] **Reconnect tradehax.net**
  - [ ] Find latest `main` deployment in Vercel
  - [ ] Run `vercel alias set <url> tradehax.net --scope digitaldynasty`
  - [ ] Verify DNS (Namecheap → Vercel nameservers)
  - [ ] Test: `curl -I https://tradehax.net/`

- [ ] **Create environment profile system**
  - [ ] Create `.env.profiles/` directory
  - [ ] Extract base configs into `production.env`
  - [ ] Create domain-specific overrides (`production.net.env`, etc.)
  - [ ] Create `.env.loader.mjs` to load profiles dynamically

- [ ] **Document domain purposes**
  - [ ] `.net` = Primary brand domain (trading.com alternative)
  - [ ] `.tech` = Secondary frontend (future: separate API endpoint)
  - [ ] `.me` = Tertiary (fallback/regional)

- [ ] **Wire verification into CI/CD**
  - [ ] Add deployment verification to pre-deploy checks
  - [ ] Log deployment URLs and commit mappings to file
  - [ ] Create dashboard/summary of all three domains' health

- [ ] **Clear labeling in code**
  - [ ] Add `DEPLOY_TARGET` env var to identify which domain's config is active
  - [ ] Embed in app footer/debug panel for transparency
  - [ ] Update `.vercel/project.json` comments with role clarity

---

## 🎯 Expected End State

When complete, you should have:

1. **All three domains working and aliased** to latest Vercel deployment(s)
2. **Clear separation** between local dev, staging, and three production domains
3. **One build pipeline** that works for all three domains
4. **Labeled environments** so it's obvious which config is loaded
5. **Verification scripts** that prove each domain serves the correct commit
6. **Documentation** of what each domain is for going forward

---

## 📞 Next Steps

1. Run remediation scripts (will be created in next phase)
2. Test all three domains via verification script
3. Commit clarified environment setup to git
4. Create deployment runbook for team scaling


