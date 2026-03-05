# TradeHax Documentation Index (Canonical)

This file is the **single entry point** for operational documentation.

Use this before opening any other markdown guide.

## Primary runbooks

- `README.md` — product overview, local setup, and developer workflow.
- `DEPLOYMENT_QUICKSTART.md` — deployment decision tree and execution order.
- `TESTING_GUIDE.md` — validation and testing workflow.
- `SECURITY.md` — security posture and practices.

## Deployment path guides

### Path A: Vercel

- `GITHUB_SECRETS_SETUP.md`
- `VERCEL_DOMAIN_SETUP.md`
- `VERCEL_DEPLOYMENT_TROUBLESHOOTING.md`
- `VERCEL_STATIC_EXPORT_FIX.md`
- `VERCEL_BRANCH_FIX.md`

### Path B: Namecheap VPS

- `NAMECHEAP_CPANEL_DEPLOYMENT.md`
- `NAMECHEAP_MIGRATION_CHECKLIST.md`
- `deploy/namecheap/README.md`

## DNS and domain docs

- `DNS_INDEX.md`
- `DNS_QUICK_FIX.md`
- `DNS_CONFIGURATION_SUMMARY.md`
- `DNS_INSPECTION_REPORT.md`
- `DNS_COMPARISON_TABLE.md`

## AI and platform operations

- `AI_ENVIRONMENT_STANDARDS.md`
- `AI_SETUP_SUMMARY.md`
- `HF_INTEGRATION_GUIDE.md`
- `HF_FINE_TUNING_WORKFLOW.md`
- `TRADEBOT_TRAINING_PIPELINE.md`
- `TRADEHAX_AI_PLATFORM_SUMMARY.md`

## Archived/historical docs

- `archive/docs/**` contains historical references and prior implementation records.
- Do **not** treat archive docs as source-of-truth for current deployment behavior.

## Root legacy redirect stubs

The following root docs are intentionally retained as lightweight redirects to avoid breaking historical links:

- `COMPLETE_DEPLOYMENT_GUIDE.md`
- `DEPLOYMENT_CHECKLIST.md`
- `DEPLOYMENT_FINAL_SUMMARY.md`
- `DEPLOYMENT_FIX_CHECKLIST.md`
- `DEPLOYMENT_FIX_SUMMARY.md`
- `DEPLOYMENT_PATHS.md`

## Precision operating rule

A change is considered complete only when:

1. It is committed and pushed to `origin/main`.
2. The selected deployment path finishes successfully.
3. Live site behavior matches expected outcomes.

---

Last updated: 2026-03-05
