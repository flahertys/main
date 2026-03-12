import { extractFeatures } from "./features.js";
import { generateSignal } from "./strategy.js";
import { computeRiskPlan } from "./risk.js";

export function runBacktest(candles, options = {}) {
  const warmup = options.warmup || 40;
  const profile = options.profile || { riskTolerance: "moderate", equity: 25000 };
  const macro = options.macro || { bias: 0, liquidityRegime: "neutral" };

  let equity = profile.equity;
  let peak = equity;
  let maxDrawdown = 0;
  let wins = 0;
  let losses = 0;
  const trades = [];

  for (let i = warmup; i < candles.length - 1; i += 1) {
    const window = candles.slice(0, i + 1);
    const features = extractFeatures(window);
    const signal = generateSignal(features, macro);

    if (signal.action === "HOLD") continue;

    const risk = computeRiskPlan(signal, { ...profile, equity });
    const entry = candles[i].close;
    const exit = candles[i + 1].close;
    const move = (exit - entry) / entry;
    const pnlPct = signal.action === "BUY" ? move : -move;
    const pnl = equity * pnlPct * (risk.riskPct / 0.01);

    equity += pnl;
    if (pnl >= 0) wins += 1;
    else losses += 1;

    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;

    trades.push({
      ts: candles[i + 1].timestamp,
      action: signal.action,
      confidence: signal.confidence,
      entry,
      exit,
      pnl,
      equity,
    });
  }

  const total = wins + losses;
  const winRate = total ? wins / total : 0;
  const totalReturn = (equity - profile.equity) / profile.equity;

  return {
    startEquity: profile.equity,
    endEquity: equity,
    totalReturn,
    winRate,
    trades: total,
    wins,
    losses,
    maxDrawdown,
    history: trades,
  };
}

