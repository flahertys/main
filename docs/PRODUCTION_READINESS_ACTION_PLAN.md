<!-- cspell:ignore TradeHax -->

# TradeHax Production Readiness Action Plan

## Objective

Take TradeHax from “feature complete” to **production-grade reliability, security, and operability** with a prioritized execution plan.

## Current baseline (already verified)

- Lint and type-check pass.
- Local pipeline task completes.
- Deploy preflight task passes and reports at least one configured delivery route.
- AI Hub roadmap includes Phase 3 differentiated intelligence and ODIN superuser lane.

## P0 (must complete before production launch)

### 1) Security hardening

- Enforce secret hygiene:
  - No plaintext admin passwords in production.
  - Require `TRADEHAX_LOGIN_PASSWORD_HASH` and disable `TRADEHAX_LOGIN_PASSWORD` in prod.
- Ensure `NEXTAUTH_SECRET` and `TRADEHAX_USER_DATA_ENCRYPTION_KEY` are strong random values.
- Enforce webhook signature checks and timestamp replay window for all webhook routes.
- Add strict origin allow list for privileged API routes.
- Verify all sensitive routes are rate-limited and audited.

### 2) Reliability & rollback

- Add provider fallback policy tests for chat/image/model routing.
- Define runbook for provider outage (degrade mode vs fail-closed).
- Add release rollback SOP:
  - last-known-good commit/tag,
  - one-command rollback procedure,
  - verification checklist post-rollback.

### 3) Observability

- Wire error tracking (`SENTRY_DSN`) and verify source maps for prod builds.
- Add API-level structured logs with request ID correlation.
- Track critical metrics:
  - API error rate,
  - fallback rate,
  - P95 latency,
  - auth failures,
  - automation preflight block rate.

### 4) Deployment gates

- Require successful pre-merge checks:
  - lint,
  - type-check,
  - build,
  - deploy preflight checks.
- Add production smoke tests for:
  - login,
  - AI chat response,
  - image generation path,
  - account profile read/write,
  - webhook verification.

## P1 (ship in first 1-2 weeks after launch)

### 1) ODIN lane controlled rollout

- Enable `HUB_ODIN_*` flags behind an allow list first.
- Roll out by cohort percentages (`HUB_ODIN_ROLLOUT_PERCENT`) with kill switch.
- Instrument ODIN success/failure metrics:
  - runbook success rate,
  - auto-repair acceptance,
  - deterministic-mode variance.

### 2) User trust & transparency

- Add response source freshness timestamp where grounded data is used.
- Show confidence bands for next-best-action recommendations.
- Add memory transparency panel (“why remembered”, scope, revoke).

### 3) Abuse and misuse controls

- Enforce stricter quotas per user tier and endpoint class.
- Add anomaly detection for burst abuse and prompt flooding.
- Add admin incident controls (temporary freeze, route-level throttle).

## P2 (scale/enterprise readiness)

- Multi-region deployment strategy and failover playbook.
- Cost governance dashboard for model arbitration spend.
- SOC2-friendly audit export path for privileged actions.
- Incident simulation drills (quarterly game days).

## Recommended environment policy

Use `AI_ENVIRONMENT_TEMPLATE.env` as the source of truth and map values to:

- Local: `.env.local`
- Preview: environment-scoped variables
- Production: locked secrets manager / deployment platform env settings

Never store production secrets in the repository.

## Production go/no-go checklist

- [ ] P0 security items complete
- [ ] P0 reliability/rollback complete
- [ ] P0 observability complete
- [ ] Deployment gates active in CI
- [ ] Smoke test suite green on production candidate
- [ ] On-call + incident runbook signed off

## Suggested ownership

- Platform owner: deployment gates, rollback, observability
- Security owner: auth/webhook/rate-limit hardening
- AI owner: fallback policy, ODIN metrics, arbitration quality
- Product owner: rollout cohorts, user trust UX, onboarding
