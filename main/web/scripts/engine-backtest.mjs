import fs from "node:fs";
import path from "node:path";
import { TradeHaxEngine } from "../src/engine/index.js";

const dataPath = path.join(process.cwd(), "scripts", "sample-ohlc.json");
const raw = fs.readFileSync(dataPath, "utf8");
const candles = JSON.parse(raw);

const engine = new TradeHaxEngine({
  riskTolerance: "moderate",
  equity: 25000,
  macro: {
    bias: 0.1,
    liquidityRegime: "neutral",
  },
});

const current = engine.evaluate(candles);
const report = engine.backtest(candles, { warmup: 30 });

console.log("=== TradeHax Engine Snapshot ===");
console.log(JSON.stringify(current, null, 2));
console.log("\n=== Backtest Report ===");
console.log(JSON.stringify({
  startEquity: report.startEquity,
  endEquity: Number(report.endEquity.toFixed(2)),
  totalReturnPct: Number((report.totalReturn * 100).toFixed(2)),
  winRatePct: Number((report.winRate * 100).toFixed(2)),
  trades: report.trades,
  wins: report.wins,
  losses: report.losses,
  maxDrawdownPct: Number((report.maxDrawdown * 100).toFixed(2)),
}, null, 2));

