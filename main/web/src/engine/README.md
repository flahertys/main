# TradeHax Engine (Isolated Core)

This directory isolates the reusable trading engine from UI and API concerns.

## Modules
- `features.js`: indicator/feature extraction
- `strategy.js`: signal policy (BUY/SELL/HOLD)
- `risk.js`: risk sizing policy
- `backtest.js`: deterministic backtest runner
- `index.js`: `TradeHaxEngine` facade

## Design Goals
- Deterministic and testable
- Clean-room, proprietary implementation
- Easy to benchmark and evolve

## Example
```js
import { TradeHaxEngine } from "./index.js";

const engine = new TradeHaxEngine({
  riskTolerance: "moderate",
  equity: 25000,
  macro: { bias: 0.15, liquidityRegime: "neutral" },
});

const result = engine.evaluate(candles);
const report = engine.backtest(candles);
```

## Note
This engine improves decision support but cannot guarantee future market outcomes. Use strict risk controls.

