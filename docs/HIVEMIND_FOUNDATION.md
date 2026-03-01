# TradeHax Hivemind Foundation

This document defines the first production-safe foundation for a long-lived TradeHax "hivemind" system that compounds user intelligence over time.

## Objectives

- Keep intelligence growth continuous (daily, monthly, yearly) with explicit governance.
- Blend **live market streams** with **user-generated behavioral data**.
- Validate model readiness before training/deploy cycles.
- Preserve lineage for family/legacy continuity using stable account ownership IDs.

## Core Components

- `lib/ai/hivemind-core.ts` consolidates readiness checks for HF token configuration and dataset quality, inventories training datasets and JSONL integrity, and surfaces behavior-ingestion plus live-source status snapshots.
- `lib/ai/hivemind-memory-index.ts` adds retrieval-augmented personalized memory with optional HF embeddings and lexical fallback.
- `lib/ai/hivemind-lineage.ts` adds signed, multi-approval lineage transfer governance for legacy account continuity.
- `app/api/ai/admin/hivemind/route.ts` provides an admin-protected operational API for hivemind health and source visibility, including rate-limiting and trusted-origin controls.
- `app/api/ai/admin/hivemind/memory/route.ts` provides admin controls for memory upsert, profile sync, and semantic querying.
- `app/api/ai/admin/hivemind/lineage/route.ts` provides admin controls for transfer proposals, signature-based approvals, and finalization.
- `scripts/hivemind-readiness.js` is a CI-friendly doctor script for preflight checks; `--strict` exits non-zero when readiness gates fail.
- `scripts/hivemind-benchmark-trend.js` tracks benchmark score trends from `data/tradebot/eval-score.json`, appends history to `data/tradebot/eval-history.jsonl`, and supports strict gating on score floor and regression delta.

## Governance Inputs (Environment)

- `TRADEHAX_HIVEMIND_LEGACY_ACCOUNT_ID`
  - Stable lineage root identifier for long-term continuity.
- `TRADEHAX_HIVEMIND_DATA_RETENTION_DAYS`
  - Retention guardrail for longitudinal intelligence storage.
- `TRADEHAX_HIVEMIND_MIN_TRAINING_ROWS`
  - Minimum validated JSONL rows required before fine-tuning gates pass.
- `TRADEHAX_HIVEMIND_BENCHMARK_MIN_SCORE`
  - Score floor for benchmark quality checks.
- `TRADEHAX_HIVEMIND_BENCHMARK_MIN_DELTA`
  - Maximum tolerated negative score drift versus previous run.
- `TRADEHAX_HIVEMIND_BENCHMARK_WINDOW_SIZE`
  - Number of recent runs used for rolling trend analytics.
- `TRADEHAX_HIVEMIND_LINEAGE_SECRET`
  - HMAC secret for signing lineage approval requests (`x-tradehax-lineage-signature`).
- `TRADEHAX_HIVEMIND_MEMORY_EMBEDDING_MODEL`
  - Optional model override for personalized memory embeddings.

## Operational Cadence

Recommended daily cadence:

1. Collect behavior events + live feed overlays.
2. Run `hivemind:doctor`.
3. Run `tradebot:score-eval` and `hivemind:benchmark`.
4. If strict checks pass, export/train/evaluate for promotion.

## Scheduled Monitoring

- Workflow: `.github/workflows/hivemind-quality-gate.yml`
- Daily scheduled run collects readiness + benchmark artifacts.
- Manual runs can enable strict mode via workflow input to enforce hard gates.

## Next Build Steps

- Add persistence backend for memory index (Supabase table or vector DB).
- Add lineage execution hooks to migrate account-level personalization artifacts.
- Add automated canary promotion policy tied to benchmark trend quality bands.
