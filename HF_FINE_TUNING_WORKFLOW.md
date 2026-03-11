# Hugging Face Fine-Tuning Workflow for TradeHax

## Overview

This workflow is production-oriented:

- Train with a real Mistral base model.
- Push adapters/model artifacts to Hugging Face Hub.
- Switch runtime inference to your fine-tuned model ID.

## 1) Push latest repo state

1. Ensure local lint/type-check pass.
2. Push branch:
   - `git push origin main`

## 2) Configure real training in `.env`

Use these defaults for real runs:

- `HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1`
- `HF_HUB_MODEL_ID=your-org/tradehax-mistral-finetuned`
- `DATASET_PATH=tradehax-training-expanded.jsonl`
- `TRAIN_EPOCHS=3`
- `TRAIN_BATCH_SIZE=4`
- `TRAIN_LR=2e-5`
- `LORA_R=16`
- `LORA_ALPHA=32`
- `LOAD_4BIT=True`
- `USE_CUDA=True` (if GPU available)
- `CLEAN_CHECKPOINTS=True` (for clean reruns)

If GPU is unavailable or CPU-only is too slow:

- Use **Hugging Face AutoTrain** for managed training, or
- Run in **Google Colab** (T4/A100 runtime) with this repo script + dataset upload.

## 3) Run fine-tune

Before training, refresh live market deltas into `data/external-datasets`:

- Dry-run ingestion:
  - `npm run llm:ingest-live-deltas:dry-run`
- Write live delta rows:
  - `npm run llm:ingest-live-deltas`
- Full continuous refresh (ingest + prepare + validate):
  - `npm run llm:continuous-refresh`

Optional env vars for ingestion:

- `TRADEHAX_LIVE_SYMBOLS=BTC,ETH,SOL,SPY,QQQ,TSLA,NVDA`
- `FINNHUB_API_KEY=...` (enables live news deltas)
- `TRADEHAX_LIVE_MAX_SYMBOLS=12`
- `TRADEHAX_LIVE_INGEST_RETRIES=2`
- `TRADEHAX_LIVE_INGEST_TIMEOUT_MS=9000`

Install dependencies (once):

- `pip install -r scripts/fine-tune-requirements.txt`

Run training:

- `npm run fine-tune`

The workflow script supports dependency bootstrap (`--install-deps`) via `run-finetune-workflow.js` when needed.

## 4) Push to Hub and switch inference model

After successful `push_to_hub`:

1. In Vercel project environment variables, set:
   - `HF_MODEL_ID=your-org/tradehax-mistral-finetuned`
2. Redeploy.

## 5) Test inference

Validate server route:

- `POST /api/hf-server`
- Body example:
  - `{ "prompt": "Give me a concise BTC/ETH market brief.", "task": "text-generation" }`

Expected result:

- `200` with `{ output: ... }`

If failures occur:

- Confirm `HF_API_TOKEN` and `HF_MODEL_ID` in Vercel.
- Confirm model visibility/permissions on HF Hub.
- Check Vercel function logs for HF inference errors.

## 6) Monetization enablement for premium AI

To expose premium AI subscriptions:

- Enable `NEXT_PUBLIC_ENABLE_PAYMENTS=true`
- Configure billing envs (Stripe/Coinbase/etc.) used by monetization routes.
- Verify billing screens and `/api/monetization/*` endpoints in staging before prod cutover.

## Notes

- Tiny-model tests are useful for plumbing verification only.
- Real quality targets require Mistral + full dataset + stable HF Hub artifact.
