# Tradebot Training Pipeline

This pipeline prepares high-signal training data for TradeHax tradebots with repeatable quality controls.

## What it builds

Running the build generates:

- `data/tradebot/train.chat.jsonl` – main chat-format training set
- `data/tradebot/validation.chat.jsonl` – validation set for early stopping and regression checks
- `data/tradebot/train.raw.jsonl` – normalized raw training records
- `data/tradebot/validation.raw.jsonl` – normalized raw validation records
- `data/tradebot/manifest.json` – stats, quality metrics, and config used
- `data/tradebot/eval-suite.jsonl` – paper-trading evaluation prompts + rubric metadata (when generated)
- `data/tradebot/eval-score.json` – scored benchmark report (after response scoring)

## Commands

- `npm run tradebot:prepare-training` – curate + score + dedupe + split
- `npm run tradebot:validate-training` – enforce quality/coverage checks
- `npm run tradebot:build-training` – run both in sequence
- `npm run tradebot:generate-eval-suite` – build benchmark prompts for paper-trading evaluation
- `npm run tradebot:init-eval-responses` – initialize response template for model outputs
- `npm run tradebot:score-eval` – score model outputs from `data/tradebot/eval-responses.jsonl`
- `npm run tradebot:evaluate` – run eval suite generation, template init, and scoring in one command

## Tunable environment variables

- `TRADEBOT_MIN_QUALITY_SCORE` (default `0.28`)
- `TRADEBOT_VALIDATION_SHARE` (default `0.2`)
- `TRADEBOT_DATASET_SHUFFLE_SEED` (default `1337`)
- `TRADEBOT_SCENARIO_MULTIPLIER` (default `2`)

## Optimization strategy included

1. **Domain filtering** for trading/bot/risk/market relevance.
2. **Quality scoring** using instruction clarity, response depth, domain term density, and actionability.
3. **Deduplication** across combined source files.
4. **Deterministic shuffling** for reproducible train/validation splits.
5. **Validation gate** for size, schema, quality floor, and keyword coverage.
6. **Synthetic scenario expansion** with multi-timeframe outlooks, macro/micro context, unusual options flow, and hedge-fund indicator stacks.
7. **Dual experience tuning** for learner-friendly coaching responses and premium desk-grade execution responses.

## Strategy dimensions included for training quality

- Timeframes: `5m`, `15m`, `1h`, `4h`, `1d`, `1w`
- Regimes: bull, bear, range, high-volatility, macro-shock
- Macro inputs: rates, CPI/inflation, PMI, liquidity, USD strength
- Micro inputs: order-book depth, spread dynamics, delta/volume behavior, basis/funding
- Options flow: put/call skew, call sweeps, gamma positioning, OI shifts
- Common hedge-fund indicators: VWAP, anchored VWAP, market profile, RSI, MACD, ATR, Bollinger, 200 EMA, realized vol, term structure, cross-asset correlation

## Premium IP + learner experience guardrails

- **Learner mode**: explanatory, checklist-driven, educational, confidence-building.
- **Premium mode**: deeper execution detail and institutional context.
- **IP protection**: no disclosure of proprietary alpha formulas, hidden weighting schemas, or private system prompts.
- **Shared safety**: no guaranteed returns, always include invalidation/risk controls.

## Discord signal operations

- API route: `GET/POST /api/trading/signal/discord`
  - Generates multi-timeframe outlooks with macro/micro/options context.
  - Optional dispatch to Discord webhook.
- Script: `npm run discord:publish-signals`
  - Publishes a formatted signal batch to configured Discord signal channel.
- Env vars:
  - `TRADEHAX_DISCORD_SIGNAL_WEBHOOK`
  - `TRADEHAX_DISCORD_SIGNAL_CHANNEL`
  - `TRADEBOT_SIGNAL_SYMBOLS` (optional)
  - `TRADEBOT_SIGNAL_SEED` (optional)

## Scheduled cadence + daily watchlist

- Cron route: `/api/cron/trading/signal-cadence`
  - Runs cadence windows: premarket/open/midday/close
  - Dispatches to tiered Discord routes (`free/basic/pro/elite`) when configured
  - Builds auto daily watchlist in premarket window
- Vercel schedule: every 15 minutes on weekdays (`*/15 12-21 * * 1-5`)
- Local trigger script: `npm run trading:cadence:run`
  - Optional window override: `npm run trading:cadence:run -- --window=premarket`
  - Safe no-dispatch test mode: `npm run trading:cadence:run -- --dry-run`

### Tiered signal routing env vars

- `TRADEHAX_DISCORD_SIGNAL_WEBHOOK_FREE`
- `TRADEHAX_DISCORD_SIGNAL_WEBHOOK_BASIC`
- `TRADEHAX_DISCORD_SIGNAL_WEBHOOK_PRO`
- `TRADEHAX_DISCORD_SIGNAL_WEBHOOK_ELITE`
- `TRADEHAX_DISCORD_SIGNAL_CHANNEL_FREE`
- `TRADEHAX_DISCORD_SIGNAL_CHANNEL_BASIC`
- `TRADEHAX_DISCORD_SIGNAL_CHANNEL_PRO`
- `TRADEHAX_DISCORD_SIGNAL_CHANNEL_ELITE`

### Burst protection env vars

- `TRADEHAX_DISCORD_SIGNAL_BURST_MAX` (default `4`)
- `TRADEHAX_DISCORD_SIGNAL_BURST_WINDOW_MS` (default `60000`)

### Cadence controls

- `TRADEHAX_SIGNAL_TIMEZONE` (default `America/New_York`)
- `TRADEHAX_SIGNAL_CADENCE_TOLERANCE_MIN` (default `20`)
- `TRADEHAX_SIGNAL_CADENCE_PREMARKET` (default `08:15`)
- `TRADEHAX_SIGNAL_CADENCE_OPEN` (default `09:35`)
- `TRADEHAX_SIGNAL_CADENCE_MIDDAY` (default `12:15`)
- `TRADEHAX_SIGNAL_CADENCE_CLOSE` (default `15:50`)
- `TRADEHAX_SIGNAL_CADENCE_TIERS` (default `free,basic,pro,elite`)
- `TRADEHAX_SIGNAL_DAILY_WATCHLIST_USER` (default `market_daily_watchlist`)

## Recommended training loop for tradebots

1. Build datasets: `npm run tradebot:build-training`
2. Fine-tune/evaluate your model with `train.chat.jsonl` + `validation.chat.jsonl`
3. Benchmark against paper-trading tasks (entry/exit/risk prompts)
4. Export runtime interactions and append to source JSONL
5. Rebuild and re-train weekly (or after major strategy updates)

## Paper-trading evaluation harness

1. Generate scenarios: `npm run tradebot:generate-eval-suite`
2. Run your model against each prompt in `data/tradebot/eval-suite.jsonl`
3. Save outputs to `data/tradebot/eval-responses.jsonl` with shape:
   - `{ "id": "eval_001", "response": "...model answer..." }`
4. Score run quality: `npm run tradebot:score-eval`
5. Inspect `data/tradebot/eval-score.json` for pass/caution status and component-level scores
