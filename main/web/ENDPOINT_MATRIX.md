# Endpoint Matrix

Last validated: 2026-03-22 UTC  
Environment: `https://tradehaxai.tech`  
Deployment: `https://web-bxp2q5a52-digitaldynasty.vercel.app`

## Runtime Summary

- AI runtime health is currently `degraded`.
- Root cause is credential state, not endpoint wiring:
  - Hugging Face: `auth_failed` (401)
  - OpenAI: `invalid_key_format`
- Chat endpoints are reachable and working, but fallback to `demo` provider until live keys are corrected.

## Endpoint Validation Matrix

| Endpoint | Method | Status | Result | Notes |
|---|---|---:|---|---|
| `/api/ai/health` | `GET` | 200 | PASS | Returns provider/mode capability JSON |
| `/api/health-grok-supabase` | `GET` | 200 | PASS | Unified health endpoint reachable |
| `/api/health` | `GET` | 200 | PASS | Legacy env health reachable |
| `/api/data/crypto?symbol=BTC` | `GET` | 200 | PASS | Market data endpoint reachable |
| `/api/signals/unusual?symbols=BTC,ETH` | `GET` | 200 | PASS | Signal scanner endpoint reachable |
| `/api/ai/chat` | `POST` | 200 | PASS | Canonical AI endpoint reachable (currently demo fallback) |
| `/api/chat` | `POST` | 200 | PASS | Legacy chat shim reachable |
| `/api/ai/telemetry` | `POST` | 200 | PASS | Telemetry ingestion reachable |
| `/api/sessions?action=create` | `POST` | 200 | PASS | Session bootstrap reachable |
| `/api/trading/auth?action=challenge` | `POST` | 200 | PASS | Trading auth challenge reachable |
| `/api/webhooks/stripe?channel=discord` | `OPTIONS` | 500 | FAIL | Stripe webhook OPTIONS path currently errors |
| `/api/webhooks/stripe?channel=telegram` | `OPTIONS` | 500 | FAIL | Stripe webhook OPTIONS path currently errors |

## Integration Alignment Implemented

- Frontend AI calls standardized to canonical endpoint constants:
  - Primary: `/api/ai/chat`
  - Legacy compatibility: `/api/chat` still supported via shim.
- Webhook mappings aligned in frontend config to implemented handler route:
  - `/api/webhooks/stripe?channel=discord`
  - `/api/webhooks/stripe?channel=telegram`
- Lightweight site capability resolver added to consume `/api/ai/health` and expose:
  - live provider availability
  - mode availability (`base`, `advanced`, `odin`)
  - provider reason map for UI gating/alerts

## Remaining Blockers to Reach Fully Live Sitewide AI

1. **Provider Credentials (Critical)**
   - Set valid Hugging Face and/or OpenAI keys in production env for this Vercel project.
   - Re-validate until `/api/ai/health` reports at least one non-demo provider with `validated: true`.

2. **Stripe Webhook OPTIONS/CORS Path (High)**
   - Current webhook route returns 500 on `OPTIONS` checks for channelized URLs.
   - Make webhook handler safely handle `OPTIONS` without admin key checks and without Stripe parsing.

3. **Domain Routing Consistency (High)**
   - Ensure canonical user domain for AI (`tradehax.net` vs `tradehaxai.tech`) resolves `/api/*` consistently.
   - If both remain active, route/proxy API paths identically.

## Quick Re-Validation Commands

```powershell
Invoke-RestMethod -Uri "https://tradehaxai.tech/api/ai/health" -Method Get

$body = @{ messages = @(@{ role = 'user'; content = 'ping' }); mode = 'base' } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://tradehaxai.tech/api/ai/chat" -Method Post -ContentType "application/json" -Body $body

Invoke-WebRequest -Uri "https://tradehaxai.tech/api/webhooks/stripe?channel=discord" -Method Options -UseBasicParsing
Invoke-WebRequest -Uri "https://tradehaxai.tech/api/webhooks/stripe?channel=telegram" -Method Options -UseBasicParsing
```

