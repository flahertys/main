import fs from 'node:fs';
import path from 'node:path';
import { TradeHaxEngine } from '../src/engine/index.js';

const dataPath = path.join(process.cwd(), 'scripts', 'sample-ohlc.json');
const candles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const scenarios = [
  { name: 'neutral', macro: { bias: 0, liquidityRegime: 'neutral' } },
  { name: 'risk-on', macro: { bias: 0.2, liquidityRegime: 'loose' } },
  { name: 'risk-off', macro: { bias: -0.2, liquidityRegime: 'tight' } },
];

const rows = scenarios.map((s) => {
  const engine = new TradeHaxEngine({ riskTolerance: 'moderate', equity: 25000, macro: s.macro });
  const evalOut = engine.evaluate(candles);
  const bt = engine.backtest(candles, { warmup: 30 });

  return {
    scenario: s.name,
    action: evalOut.signal.action,
    confidence: evalOut.signal.confidence,
    totalReturnPct: Number((bt.totalReturn * 100).toFixed(2)),
    winRatePct: Number((bt.winRate * 100).toFixed(2)),
    trades: bt.trades,
    maxDrawdownPct: Number((bt.maxDrawdown * 100).toFixed(2)),
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  samples: candles.length,
  scenarios: rows,
};

const outPath = path.join(process.cwd(), 'dist', 'engine-quality-report.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log('=== Engine Quality Report ===');
console.table(rows);
console.log(`Saved: ${outPath}`);

