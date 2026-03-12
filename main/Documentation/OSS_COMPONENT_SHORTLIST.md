# OSS Component Shortlist (Permissive Licenses Only)

## License Policy
Allowed: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC.

## Candidate Components

### Data + Indicators
1. **technicalindicators** (MIT)
- Purpose: TA indicators (RSI, EMA, MACD, Bollinger, ATR).
- Fit: Quick scanner and explainability signal factors.
- Integration: `web/src/lib/data-provider-router.ts` and `web/src/lib/signal-explainability-engine.ts`.

2. **ccxt** (MIT)
- Purpose: Unified exchange market data/trading API adapters.
- Fit: Standardized crypto feed normalization.
- Integration: New adapter layer in `data-provider-router.ts`.

### Quant + Backtesting (JS/Python optional)
3. **backtestjs** (MIT)
- Purpose: Node-based strategy backtesting.
- Fit: Validate assistant-generated plans before surfacing templates.
- Integration: Optional service job for benchmark reports.

4. **vectorbt** (MIT, Python)
- Purpose: High-performance vectorized strategy research.
- Fit: Offline benchmark generation for signal-quality baselines.
- Integration: Separate analytics service; expose summarized metrics to web app.

### Explainability + Risk
5. **mathjs** (Apache-2.0)
- Purpose: Deterministic scoring math and decomposition.
- Fit: Confidence decomposition and risk envelopes.
- Integration: `signal-explainability-engine.ts`.

6. **zod** (MIT)
- Purpose: Runtime schema validation.
- Fit: Harden AI output parsing + scanner config validation.
- Integration: `web/api/ai/chat.ts`, `api-client.ts`.

### UI/State (optional)
7. **zustand** (MIT)
- Purpose: Lightweight state management.
- Fit: Signal feed, filters, alert states with low overhead.
- Integration: `web/src` UI state store.

8. **date-fns** (MIT)
- Purpose: Reliable date/time calculations.
- Fit: Session windows, alert expiry, market session handling.
- Integration: UI + API utility layer.

---

## Recommended First Wave
- technicalindicators
- zod
- mathjs
- date-fns

These offer high value with minimal architecture disruption.

---

## Integration Notes
- Keep adapters isolated from core decision logic.
- Add license metadata tracking in `web/oss-components.json`.
- Run `npm run audit:licenses` in CI before deploy.

