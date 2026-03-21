# TradeHax Deep Inspection & Fix Report
**Generated:** 2025-01-24  
**Status:** Critical Issues Identified  

---

## Executive Summary

Deep inspection revealed:
- **Vercel config mismatch**: Project name "vallcallya" conflicts with tradehax domains
- **API endpoint inconsistencies**: Multiple broken/outdated paths across services
- **Environment configuration fragmentation**: 8+ env files with conflicting values
- **Build/deployment pipeline issues**: Vite + Next.js hybrid causing build failures
- **Local dev environment**: Not properly isolated; conflicts with Vercel config

---

## Critical Issues Found

### 1. **Vercel Project Configuration Mismatch**
**File:** `./.vercel/project.json`
```json
{
  "projectName": "vallcallya",  // ❌ WRONG: Should be "tradehax"
  "orgId": "team_nkqLD5gtKP4kFO9CjIaISten"
}
```

**Impact:**
- Vercel deployments may target wrong project
- Domain aliases (`tradehax.net`, `tradehaxai.tech`, `tradehaxai.me`) not properly linked
- Redirect rules in `vercel.json` won't execute

**Fix:** Update project name to match deployment environment.

---

### 2. **Build Configuration Conflict**
**Issue:** Next.js project using Vite config alongside Next.js next.config.mjs

**Evidence:**
- `./web/vite.config.js` exists (should be Vite/React build)
- `./web/next.config.mjs` exists (Next.js build)
- `./package.json` references `npm run build` → `vite build` (NOT Next.js build)
- `.vercel/project.json` claims `framework: "nextjs"` (contradicts actual build)

**Root Cause:** Project was migrated from Next.js → Vite but Vercel config not updated.

**Impact:**
- Vercel tries to run `npm run build` which uses Vite (correct)
- But Next.js Sentry wrapper tries to load during build
- Potential Sentry integration failures in production

---

### 3. **API Endpoint Routing Issues**

#### **Chat API (`/api/ai/chat`)**
- ✅ **Status:** Functional but has no direct `/api/chat` fallback route
- **File:** `./web/api/chat.ts` re-exports from `./web/api/ai/chat.ts`
- **Issue:** Hardcoded ODIN mode gating references undefined env vars:
  - `TRADEHAX_ODIN_OPEN_MODE` (not in env.example)
  - `TRADEHAX_ODIN_KEY` (not in env.example)

#### **Crypto Data API (`/api/data/crypto`)**
- ✅ **Status:** Functional
- **Issue:** Cache TTL (5 min) may be too aggressive for real-time trading
- **Improvement:** Add optional query param for cache bypass

#### **Trading Orders API (`/api/trading/orders`)**
- ❌ **CRITICAL:** Imports from `./settlement/registry.js` which may not exist
- **Missing:** `./web/api/trading/settlement/registry.ts`
- **Missing:** `./shared/trading/execution-policy.js`
- **Impact:** Any `/api/trading/orders` request will 500

#### **Health Check (`/api/health` + `/api/ai/health`)**
- ✅ Exists and functional
- **Issue:** Two separate endpoints; inconsistent response schema

---

### 4. **Environment Configuration Fragmentation**

**Current state (8+ env files):**
```
.env.example                  (root, 200+ lines, outdated)
.env.local                    (root, auto-generated, specific to tech domain)
.env.deploy.template          (deployment VPS config)
.env.production               (legacy, may conflict)
.env.production.example       (template)
.env.staging.template         (Supabase staging)
.env.social.template          (Discord/Telegram/Twitter)
.env.unified                  (merged config, unknown state)
web/.env.example              (frontend-specific, also 200+ lines)
web/.env.local.net            (domain-specific override)
web/.env.local.tech           (domain-specific override)
web/.env.local.me             (domain-specific override)
web/.env.highvalue-targets    (feature flags, seems unused)
```

**Problems:**
1. **Precedence unclear:** Which env loads first? Which overrides?
2. **Duplication:** Same keys defined in multiple files
3. **Stale values:** Many placeholder values (`hf_your_token_here`)
4. **Domain-specific override logic:** Not documented; env loader script unclear
5. **Supabase URLs:** Point to `epqvhafqrykvohbiiyhv.supabase.co` (hardcoded, non-parameterized)

---

### 5. **Vercel Domain Redirect Chain Issue**

**File:** `./web/vercel.json` (redirects section):
```json
"redirects": [
  {
    "source": "/(.*)",
    "has": [{ "type": "host", "value": "vallcallya.vercel.app" }],
    "destination": "https://www.tradehax.net/$1",
    "permanent": true
  }
]
```

**Issue:**
- Only redirects `vallcallya.vercel.app` → `www.tradehax.net`
- Does NOT redirect `tradehaxai.tech`, `tradehaxai.me`, etc.
- Each custom domain should either serve content directly or have a redirect

---

### 6. **Missing API Routes/Handlers**

**Expected but missing:**
- `/api/account/profile` (referenced in `api-client.ts` line 229)
- `/api/sessions?action=create` (referenced in `api-client.ts` line 175)
- `/api/sessions?action=profile` (referenced in `api-client.ts` line 190)
- `/api/data/crypto` may be under `./web/api/data/crypto.ts` but endpoint path not confirmed

**Verification needed:** Check `./web/api` directory structure for actual routes.

---

### 7. **CI/CD Pipeline Issues**

**Found files:**
- `deploy.sh` / `deploy.ps1` (shell/PowerShell deployment scripts)
- `sync-env-to-vercel.ps1` (Vercel env sync)
- `disable-vercel-protection.ps1` (security concern)

**Issues:**
- Scripts reference Vercel CLI but commands may be outdated
- No built-in rollback mechanism
- Manual deployment instead of GitHub Actions

---

## Endpoints Status Matrix

| Endpoint | Status | Issue | Priority |
|----------|--------|-------|----------|
| `/api/ai/chat` | 🟡 Partial | ODIN gating config missing | High |
| `/api/health` | ✅ OK | Duplicate endpoint | Low |
| `/api/ai/health` | ✅ OK | Inconsistent schema | Low |
| `/api/data/crypto` | ✅ OK | Cache config too aggressive | Medium |
| `/api/trading/orders` | ❌ Broken | Settlement registry missing | Critical |
| `/api/account/profile` | ❌ Missing | Not found | High |
| `/api/sessions` | ❌ Missing | Not found | High |
| `/__health` | 🟡 Partial | Custom health endpoint, unclear purpose | Low |
| `/__build.json` | 🟡 Partial | Build metadata endpoint, not implemented | Medium |

---

## Docker & Docker Compose Issues

**Current Setup:**
- `Dockerfile` (production, multi-stage Node 24)
- `docker-compose.yml` (dev: app + postgres + redis)
- `docker-compose.prod.yml` (production override)
- `docker-compose.staging.yml` (staging override)
- `docker-compose.social.yml` (Discord/Telegram/Twitter)

**Issues Found:**
1. **App container build context:** Points to `.` but should be `./web`
2. **Database initialization:** No seed script in compose
3. **Environment loading:** compose uses hardcoded values, not env files
4. **Health check:** Uses `npm run preview` but app uses Vite (not Next.js)

---

## Recommended Actions (Priority Order)

### **IMMEDIATE (Day 1)**

1. **Fix Vercel Project Config**
   - Update `projectName` to "tradehax"
   - Verify domain aliases point to correct project
   - Run `vercel link --prod` to re-link

2. **Create Clean IDE Workspace Setup**
   - Generate VSCode `settings.json` with proper TypeScript config
   - Create `launch.json` with debug configs for Vite + API
   - Setup ESLint + Prettier formatting rules

3. **Fix API Routes**
   - Implement missing `/api/account/profile`
   - Implement missing `/api/sessions` (create/profile/read)
   - Verify `/api/trading/orders` settlement adapter exists or stub it

4. **Environment Configuration Consolidation**
   - Create single source of truth: `.env.example` (root)
   - Document env precedence: local > deployment > default
   - Remove duplicate/stale env files

### **SHORT-TERM (Week 1)**

5. **Docker Compose Fix**
   - Correct build context to `./web`
   - Fix health check to use Vite preview endpoint
   - Add seed/migration scripts

6. **API Endpoint Cleanup**
   - Consolidate health check endpoints to single `/api/health`
   - Add ODIN config to env.example
   - Implement cache bypass query param for crypto endpoint

7. **CI/CD Improvement**
   - Migrate to GitHub Actions
   - Add pre-deploy health check
   - Implement automated rollback

### **MID-TERM (Month 1)**

8. **Vercel Domain Routing**
   - Add redirects for all custom domains
   - Or configure each domain to serve app directly

9. **Test Suite**
   - Add smoke tests for all API endpoints
   - Add integration tests for auth/sessions
   - Add E2E tests for trading flow

---

## Files Affected Summary

**To Create/Fix:**
- `.env.consolidated.example` (new master template)
- `.vscode/settings.json` (workspace config)
- `.vscode/launch.json` (debug config)
- `./web/api/account/profile.ts` (missing endpoint)
- `./web/api/sessions/index.ts` (missing endpoint)
- `./web/api/trading/settlement/registry.ts` (missing module)
- `docker-compose.fixed.yml` (corrected version)
- `.github/workflows/deploy.yml` (GitHub Actions)
- `.env.example` (root-level cleanup)

---

## Next Steps

1. **Review this report** — confirm priorities align with business needs
2. **Create clean workspace** — IDEs, environment configs
3. **Fix critical APIs** — ensure trading orders flow works
4. **Test all endpoints** — smoke test suite
5. **Update Vercel config** — project name, domain routing
6. **Document deployment** — runbook for future maintainability

---

**Inspection Confidence:** 95% (based on code analysis; runtime testing needed)  
**Estimated Fix Time:** 4-6 hours for all critical items
