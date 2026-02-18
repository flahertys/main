# TradeHax IDE + Pipeline Workflow

This workspace now uses one explicit local-to-CI flow so daily work feels predictable for AI-assisted development.

## 1) Pick One Active Local Repo

Canonical/mirror model:
- `C:\tradez\main`
- `C:\DarkModder33\main`

Use `C:\tradez\main` as canonical for active coding and keep `C:\DarkModder33\main` as mirror-only.

## 2) Local IDE Loop

Use `tradehaxai.code-workspace` and these VS Code tasks:
- `TradeHax: Dev Server`
- `TradeHax: Lint`
- `TradeHax: Type Check`
- `TradeHax: Local Pipeline`
- `TradeHax: Deploy Preflight`
- `TradeHax: Repo Status`
- `TradeHax: Sync Mirror`
- `TradeHax: Extension Watch`

`TradeHax: Local Pipeline` is the default build task and runs:
- `npm run pipeline:local`

## 3) Script Contract

- `npm run pipeline:quality`
  - Lint + TypeScript checks
- `npm run pipeline:local`
  - Local quality gate + production build
- `npm run pipeline:deploy-checks`
  - DNS + Vercel validation scripts
- `npm run pipeline:ci`
  - Clean + quality + production build
  - Runs deploy checks automatically when `bash` is available (always in Linux CI)

## 4) CI Contract

`.github/workflows/build-check.yml` now runs:
- `npm run pipeline:ci`

That keeps CI behavior aligned with the same command contract used locally.

## 5) Debug Flow

Use launch profiles:
- `TradeHax: Next.js Full Stack`
- `TradeHax: Browser Debug`
- `TradeHax: VS Code Extension`
- `TradeHax: App + Extension` (compound)
