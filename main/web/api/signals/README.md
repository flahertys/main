# Unusual Signal Scanner (Phase 2)

This module provides a fast anomaly scanner for market pressure signals.

## Endpoint

- `GET /api/signals/unusual?symbols=BTC,ETH,SOL,DOGE,ADA,LINK`
- Optional tuning:
  - `minScore` (default `45`)
  - `limit` (default `20`)

## What It Scores

- 24h price displacement
- 24h turnover (`volume24h / marketCap`)
- intraday range expansion (`(high-low)/low`)
- adaptive market regime (`NORMAL`, `ELEVATED_ACTIVITY`, `HIGH_VOLATILITY`)
- reliability score (signal quality + liquidity filters)

## Response

Returns ranked opportunities with:

- `score`
- `signalLabel` (`WATCH`, `ELEVATED`, `HIGH`)
- `reliability` (0-100)
- `strategyTag` and `horizon`
- directional pressure
- concise execution plan (`trigger`, `invalidation`, `risk`)

## Design Goal

Modeled after industry scanner patterns (high-signal tape, low-noise ranking):

- adaptive thresholds instead of static cutoffs
- explainable ranking factors
- compact output designed for dashboard and alert routing

## Local Runner

```powershell
cd C:\tradez\main\web
npm run test:scanner
```

