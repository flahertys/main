# IDE Pipeline & Multi-Location Sync Workflow

This workflow is designed to make TradeHax development consistent from any machine/location.

## Goals

- Same quality gate everywhere (lint + type-check)
- Quick awareness of sync state against `origin/main`
- Optional build and Namecheap deploy-readiness check
- One command in terminal or one task in VS Code

## Commands

### Quick sync (default)

- `npm run ide:sync`

Runs:
- git fetch + ahead/behind report
- git hooks install/update (best effort)
- lint
- type-check

### Full sync (recommended before pushing)

- `npm run ide:sync:full`

Runs quick sync +:
- install dependencies (`npm ci`)
- production build
- Namecheap deploy config check (warning mode)

### Deploy-ready strict sync

- `npm run ide:sync:deploy-ready`

Runs full sync +:
- strict Namecheap check (fails if required deploy secrets/vars are missing)

## VS Code tasks

Use command palette: **Run Task**

- `TradeHax: IDE Sync (Quick)`
- `TradeHax: IDE Sync (Full)`
- `TradeHax: IDE Sync (Deploy Ready)`

## Multi-location best practices

1. Run `TradeHax: IDE Sync (Quick)` when opening workspace.
2. If behind `origin/main`, pull/rebase before edits.
3. Before pushing, run `TradeHax: IDE Sync (Full)`.
4. Before DNS/deploy changes, run `TradeHax: IDE Sync (Deploy Ready)`.
5. Keep secrets only in GitHub Actions secrets and server env files; never commit secrets.

## Minimal setup needed to enable Namecheap deploy automation

Required GitHub secrets:
- `NAMECHEAP_VPS_HOST`
- `NAMECHEAP_VPS_USER`
- `NAMECHEAP_VPS_SSH_KEY`

Optional:
- `NAMECHEAP_VPS_PORT`
- `NAMECHEAP_APP_ROOT`
- `NAMECHEAP_APP_PORT`

Reference: `NAMECHEAP_MIGRATION_CHECKLIST.md`
