# TradeHax Quick Reference Card

**Print this or keep in your terminal!**

---

## 🚀 60-Second Start

```bash
# 1. Setup environment
cp .env.consolidated.example .env.local
nano .env.local  # add your API keys

# 2. Install & run
npm install
npm run dev

# 3. Check health
curl http://localhost:3000/__health
curl http://localhost:3000/api/ai/health
```

---

## 📁 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `.env.consolidated.example` | Master env template | ✅ Use this |
| `.vscode/settings.json` | IDE config | ✅ Ready |
| `.vscode/launch.json` | Debug configs | ✅ Ready |
| `./web/api/ai/chat.ts` | Chat endpoint | ✅ Working |
| `./web/api/data/crypto.ts` | Crypto data | ✅ Working |
| `./web/api/account/profile.ts` | User profiles | ✅ NEW |
| `./web/api/sessions/index.ts` | Sessions | ✅ NEW |
| `./DEEP_INSPECTION_REPORT.md` | Full analysis | 📖 Read first |
| `./CLEAN_WORKSPACE_SETUP.md` | Setup guide | 📖 Reference |

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Vite + API hot reload
npm run build           # Build for production
npm run preview         # Test production build locally

# Testing
npm run test --if-present              # Run tests
npm run test:smoke --if-present        # Smoke tests
npm run lint --if-present              # Lint code

# Docker
docker-compose up --build              # Start all services
docker-compose logs -f app             # Watch app logs
docker-compose down                    # Stop all services

# Deployment
vercel deploy           # Deploy preview
vercel deploy --prod    # Deploy production
```

---

## 🔌 API Endpoints

### Health
```bash
curl http://localhost:3000/__health
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ai/health
```

### Chat (AI)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role":"user","content":"analyze BTC"}]}'
```

### Market Data
```bash
curl http://localhost:3000/api/data/crypto?symbol=BTC
```

### Sessions
```bash
# Create
curl -X POST http://localhost:3000/api/sessions?action=create

# Get
curl http://localhost:3000/api/sessions?action=read&sessionId=abc123

# Update profile
curl -X PUT http://localhost:3000/api/sessions?action=profile&sessionId=abc123 \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","riskTolerance":"moderate"}'
```

### Profile
```bash
# Get
curl http://localhost:3000/api/account/profile \
  -H "Authorization: Bearer user123"

# Update
curl -X PUT http://localhost:3000/api/account/profile \
  -H "Authorization: Bearer user123" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","riskTolerance":"moderate"}'
```

---

## 🔑 Required Secrets

**Essential for running locally:**
```
HUGGINGFACE_API_KEY=hf_...
SUPABASE_URL=https://...supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
NEXTAUTH_SECRET=your_secret_here
```

**Optional (for features):**
- `OPENAI_API_KEY` — GPT-4 fallback (optional)
- `STRIPE_SECRET_KEY` — Payment processing
- `DISCORD_TOKEN` — Discord integration
- `TELEGRAM_BOT_TOKEN` — Telegram integration

---

## 🐛 Debug Configurations (VSCode)

Press `Ctrl+Shift+D` and select:
- **Vite Dev Server** — Frontend debugging
- **Node.js API** — API debugging
- **Full Stack** — Both together
- **Jest Tests** — Test debugging

---

## 📊 Architecture

```
Frontend (React/Vite)
    ↓
Vercel Edge (Routing)
    ↓
API Endpoints (Next.js Serverless)
    ├── /api/ai/chat (HuggingFace/OpenAI)
    ├── /api/data/crypto (CoinGecko/Binance)
    ├── /api/trading/orders (Polygon)
    ├── /api/account/profile (Supabase)
    └── /api/sessions (In-memory or Redis)
    ↓
External Services
    ├── Supabase (Database)
    ├── Redis (Cache)
    ├── HuggingFace (LLM)
    ├── OpenAI (Fallback LLM)
    └── CoinGecko (Market Data)
```

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| `HUGGINGFACE_API_KEY missing` | Add to `.env.local` |
| `Cannot connect to database` | Run `docker-compose up postgres` or set `DATABASE_URL` |
| `CORS error` | Add domain to allowlist in `/api/ai/chat.ts` |
| `Module not found: settlement/registry` | Create stub or check import path |
| `Build fails on Vercel` | Check `npm run build` output locally first |
| `Health check timeout` | Wait 30s for cold start; check logs with `vercel logs` |

---

## 🎯 Deployment Checklist

- [ ] All env vars filled (no `your_` placeholders)
- [ ] `.vercel/project.json` projectName = "tradehax"
- [ ] GitHub Actions secrets configured
- [ ] `npm run build` passes locally
- [ ] Health endpoint responds
- [ ] Domain aliases configured
- [ ] SSL certificate valid
- [ ] Vercel domain routing configured

---

## 📚 Documentation Index

```
INSPECTION_SUMMARY.md ← START HERE (overview + status)
    ├── DEEP_INSPECTION_REPORT.md (detailed analysis)
    ├── CLEAN_WORKSPACE_SETUP.md (setup & deployment)
    └── This file (quick reference)
```

---

## 🔗 External Resources

- **Vercel:** https://vercel.com/docs
- **Vite:** https://vitejs.dev
- **HuggingFace API:** https://api-inference.huggingface.co/docs
- **Supabase:** https://supabase.com/docs
- **Docker Compose:** https://docs.docker.com/compose
- **GitHub Actions:** https://docs.github.com/en/actions

---

## 📞 Support Resources

- **Setup problems?** → `CLEAN_WORKSPACE_SETUP.md` § Troubleshooting
- **API questions?** → `.env.consolidated.example` (documented)
- **Deployment?** → GitHub Actions workflow auto-deploys
- **Architecture?** → `DEEP_INSPECTION_REPORT.md`

---

**Last Updated:** 2025-01-24  
**Status:** ✅ Ready to Use  
**Print-friendly:** Yes (fits 1-2 pages)

---

## One More Thing: IDE Quick Setup

```bash
# Open VSCode
code .

# Extensions auto-prompt (via recommendations)
# Or manually install:
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension eamodio.gitlens

# You're done! Settings auto-load from .vscode/settings.json
# Debug configs available in .vscode/launch.json
```

---

**Made with ❤️ for TradeHax**
