# AGENTS.md

## Scope first
- Primary runtime is `web/`; root contains many deployment/runbook docs and automation scripts.
- Start with `web/src/main.jsx` -> `web/src/App.jsx` -> `web/src/app/AppShell.jsx` -> `web/src/features/neural-hub/NeuralHubPage.jsx` -> `web/src/NeuralHub.jsx`.
- Treat `vendor/` as third-party code unless a task explicitly targets it.

## Architecture map (what talks to what)
- Frontend is a Vite React SPA; routing is currently shell-based and keeps Neural Hub behavior stable (`web/ARCHITECTURE.md`).
- API routes live under `web/api/**` as Vercel handlers; most handlers set CORS + method guards inline.
- Session domain is split into transport + service + store: `web/api/sessions/index.ts`, `web/api/sessions/session-service.ts`, `web/api/sessions/store.ts`.
- Trading gate is split by responsibility: wallet auth (`web/api/trading/auth.ts`), preflight/execute (`web/api/trading/orders.ts`), policy (`web/shared/trading/execution-policy.js`), settlement adapters (`web/api/trading/settlement/**`).
- Persistence uses graceful fallback: Postgres when configured, in-memory otherwise (`web/api/trading/telemetry-repository.ts`, `web/api/trading/proof-store.ts`).

## Critical workflows
- Use Node 24.x (see `web/package.json` engines).
- Dev loop:
  ```powershell
  cd C:\tradez\main\web
  npm install
  npm run dev
  ```
- Release sanity check (smoke + production build): `npm run release:check`.
- Trading gate flow smoke test: `npm run test:trading-gate` (runs `scripts/trading-gate-smoke-test.mjs`).
- L2 routing checks: `npm run test:l2:routing:self` (offline), then `npm run test:l2:routing` (real endpoints).
- Deploy path is guarded by `.project-id` and repo checks (`scripts/predeploy-check.js`), then Vercel deploy (`web/package.json` -> `deploy*` scripts).

## Project-specific coding conventions
- TS API files often import local modules using `.js` extensions (example: `web/api/sessions/index.ts`); preserve this style.
- Keep API handlers thin and delegate logic to service/repository layers when present (sessions + trading follow this pattern).
- Execution behavior is profile-driven (`EXECUTION_PROFILE_ID` in `web/shared/trading/execution-policy.js`); avoid hardcoding chain assumptions in handlers.
- Reliability preference is "degrade gracefully": catch persistence failures and keep APIs available using memory fallback.
- CORS patterns vary by endpoint (open `*` vs allowlist in `web/api/sessions/index.ts`); match existing endpoint intent before changing.

## Integrations and env-sensitive points
- Supabase: client/server split via `web/src/lib/supabaseClient.ts` and `web/api/lib/supabase-admin.ts`; health endpoint is `web/api/supabase/health.ts`.
- Security headers and SPA rewrites are centralized in `web/vercel.json`.
- Health/config checks: `web/api/health.ts` validates required env keys; `web/.env.example` is the canonical variable map.
- Docker local stack (`docker-compose.yml`) wires app + Postgres + Redis; DB URLs align with trading telemetry/auth durability paths.

## Known repo gotcha
- `web/scripts/README.md` references `npm run test:api:smoke`, but this script is not currently defined in `web/package.json`; use direct script invocation only after confirming command names.

