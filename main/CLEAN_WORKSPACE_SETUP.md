# TradeHax Clean Workspace Setup Guide

**Last Updated:** 2025-01-24  
**Status:** Ready for Implementation  

---

## Quick Start (5 minutes)

```bash
# 1. Use consolidated env template
cp .env.consolidated.example .env.local

# 2. Fill in required secrets (marked with "your_")
nano .env.local

# 3. Install dependencies
npm install

# 4. Start development environment (local + API)
npm run dev

# 5. Verify endpoints
curl http://localhost:3000/__health
curl http://localhost:3000/api/ai/health
```

---

## IDE Setup (VSCode)

### Step 1: Extensions
```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension eamodio.gitlens
code --install-extension ms-vscode-remote.remote-containers
code --install-extension ms-azuretools.vscode-docker
code --install-extension gruntfuggly.todo-tree
```

### Step 2: Settings Already Configured
The following files are auto-generated:
- `.vscode/settings.json` — formatter, linter, workspace rules
- `.vscode/launch.json` — debug configurations
- `.renovaterc.json` — dependency updates

**Your workspace is ready to use.** No manual configuration needed.

### Step 3: Debug Configurations Available
Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to access:
- **Vite Dev Server** — frontend hot reload
- **Node.js API (Vercel Functions)** — backend API debugging
- **Full Stack** — both frontend + API together
- **Jest Tests** — run test suite with debugging

---

## Environment Configuration

### Master Template Location
**File:** `.env.consolidated.example`

This is the **single source of truth** for all environment variables. It contains:
- Full documentation for each variable
- Grouped by feature (AI, Auth, DB, Services)
- Best practices and security notes
- Validation instructions

### Setup by Environment

#### Development (.env.local)
```bash
cp .env.consolidated.example .env.local

# Edit with your dev keys
nano .env.local

# Required keys for local dev:
# - HUGGINGFACE_API_KEY
# - DATABASE_URL (or use Docker)
# - SUPABASE_URL + SUPABASE_SECRET_KEY
```

#### Production (Vercel Dashboard)
Do NOT use .env.local in production. Instead:

1. Go to https://vercel.com/tradehax/vallcallya/settings/environment-variables
2. Add each variable from `.env.consolidated.example`
3. Set environment to **Production**
4. Redeploy after adding secrets

#### Domain-Specific (tradehax.net vs tradehaxai.tech vs tradehaxai.me)
Use Vercel environment overrides:
```
# Vercel Dashboard → Settings → Environment Variables

# Select "Production" + specific domain
- Domain: tradehax.net
  NEXT_PUBLIC_APP_URL: https://tradehax.net
  NEXT_PUBLIC_SITE_URL: https://tradehax.net

- Domain: tradehaxai.tech
  NEXT_PUBLIC_APP_URL: https://tradehaxai.tech
  NEXT_PUBLIC_SITE_URL: https://tradehaxai.tech
```

---

## API Endpoint Reference

### Health Check Endpoints

**GET /api/health**
```bash
curl http://localhost:3000/api/health
```
Response: Environment variable status

**GET /api/ai/health**
```bash
curl http://localhost:3000/api/ai/health
```
Response: HuggingFace + OpenAI provider status

### Chat Endpoint

**POST /api/ai/chat**
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "analyze BTC"}
    ],
    "context": {
      "userProfile": {
        "userId": "user123",
        "riskTolerance": "moderate",
        "tradingStyle": "swing"
      }
    },
    "mode": "base"
  }'
```

### Crypto Data Endpoint

**GET /api/data/crypto?symbol=BTC**
```bash
curl http://localhost:3000/api/data/crypto?symbol=BTC
```

### Sessions (New - for authentication state)

**POST /api/sessions?action=create**
```bash
curl -X POST http://localhost:3000/api/sessions?action=create \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

**GET /api/sessions?action=read&sessionId=...**
```bash
curl http://localhost:3000/api/sessions?action=read&sessionId=abc123
```

### User Profile (New - for preference storage)

**GET /api/account/profile**
```bash
curl http://localhost:3000/api/account/profile \
  -H "Authorization: Bearer user123"
```

**PUT /api/account/profile**
```bash
curl -X PUT http://localhost:3000/api/account/profile \
  -H "Authorization: Bearer user123" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "firstName": "John",
    "riskTolerance": "moderate",
    "tradingStyle": "swing",
    "portfolioValue": 50000
  }'
```

---

## Docker Development

### Start Local Environment (with DB + Cache)

```bash
# Build and start all services
docker-compose up --build

# In another terminal, run app
npm run dev
```

Services running:
- App: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Rebuild Specific Service

```bash
docker-compose up --build app
docker-compose restart postgres
```

### View Logs

```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

---

## Deployment Checklist

Before deploying to production:

### 1. Environment Variables
- [ ] All required secrets filled in (no `your_` placeholders)
- [ ] Correct domain URLs (tradehax.net, not vallcallya.vercel.app)
- [ ] API keys rotated within last 30 days
- [ ] NEXTAUTH_SECRET is securely generated

### 2. Vercel Configuration
- [ ] `.vercel/project.json` projectName is "tradehax"
- [ ] Domain aliases configured (tradehax.net, tradehaxai.tech, tradehaxai.me)
- [ ] CNAME records pointing to Vercel
- [ ] SSL certificate valid

### 3. API Endpoints
- [ ] Health check endpoint returns OK: `curl https://tradehax.net/__health`
- [ ] Chat endpoint responds: `curl -X POST https://tradehax.net/api/ai/chat`
- [ ] Trading orders preflight passes: `curl -X POST https://tradehax.net/api/trading/orders?action=preflight`

### 4. Database & Cache
- [ ] Supabase project is accessible
- [ ] Database migrations applied
- [ ] Redis connection working (if used)

### 5. Third-Party Services
- [ ] HuggingFace API key valid and has quota
- [ ] Stripe keys are production (not test)
- [ ] Discord/Telegram webhooks active (if enabled)

### 6. Security
- [ ] No credentials in `.git` history
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] CORS origins restricted to known domains

---

## Troubleshooting

### "Module not found: ./settlement/registry"
**Cause:** Missing settlement adapter module  
**Fix:** The stub file should be created. If missing, create `./web/api/trading/settlement/registry.ts`

### "HuggingFace API error: No API key"
**Cause:** `HUGGINGFACE_API_KEY` not set  
**Fix:** Add your HF token to `.env.local`  
```
HUGGINGFACE_API_KEY=hf_your_actual_token_here
```

### "Cannot connect to database"
**Cause:** `DATABASE_URL` not set or database not running  
**Fix:** Either:
- Set DATABASE_URL in .env.local
- Or run `docker-compose up postgres`

### "Vite build fails during Vercel deploy"
**Cause:** Next.js wrapper trying to run but build is using Vite  
**Fix:** This is expected. Vercel correctly uses `npm run build` which runs Vite. Check logs for actual error.

### "CORS error when calling /api/ai/chat"
**Cause:** Origin not in allowlist  
**Fix:** Check `./web/api/ai/chat.ts` line ~110 for `allowedOrigins`. Add your domain.

---

## File Structure Reference

```
.
├── .env.consolidated.example      ← Master template (USE THIS)
├── .env.local                      ← Your dev config (NEVER commit)
├── .vscode/
│   ├── settings.json               ← IDE configuration (READY)
│   ├── launch.json                 ← Debug configs (READY)
│   └── extensions.json             ← Recommended extensions
├── web/
│   ├── api/
│   │   ├── ai/chat.ts              ← AI chat endpoint
│   │   ├── data/crypto.ts          ← Crypto price data
│   │   ├── account/profile.ts      ← User profile (NEW)
│   │   ├── sessions/index.ts       ← Session management (NEW)
│   │   ├── health.ts               ← Health check
│   │   └── trading/
│   │       ├── orders.ts           ← Trading orders
│   │       └── settlement/         ← Settlement adapters
│   ├── src/
│   │   ├── lib/api-client.ts       ← Frontend API wrapper
│   │   └── ...
│   ├── package.json                ← Dependencies
│   ├── vite.config.js              ← Build config (Vite)
│   ├── next.config.mjs             ← Next.js config (legacy, not used)
│   ├── vercel.json                 ← Vercel deployment config
│   └── tsconfig.json               ← TypeScript config
├── .vercel/
│   └── project.json                ← Vercel project metadata
├── docker-compose.yml              ← Local dev services
├── Dockerfile                       ← Production image
└── DEEP_INSPECTION_REPORT.md       ← Full analysis report
```

---

## Next Steps

1. **Review DEEP_INSPECTION_REPORT.md** for complete issue analysis
2. **Copy .env.consolidated.example to .env.local** and fill in your secrets
3. **Open VSCode** — workspace configuration is auto-ready
4. **Run `npm install && npm run dev`** to start development
5. **Test endpoints** using curl commands above
6. **Deploy to Vercel** when ready (ensure all env vars are set)

---

## Support & Resources

- **Full Analysis:** See `./DEEP_INSPECTION_REPORT.md`
- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev
- **HuggingFace API:** https://api-inference.huggingface.co/docs
- **Supabase Docs:** https://supabase.com/docs
- **Docker Compose:** https://docs.docker.com/compose

---

**Last verified:** 2025-01-24  
**Status:** ✅ Ready to deploy
