import { SignalAction } from "./types.js";

export function generateSignal(features, macro = {}) {
  const {
    momentum = 0,
    volatility = 0,
    rsi14 = 50,
    latest = 0,
  } = features;

  const macroBias = Number(macro.bias || 0); // -1 bearish, +1 bullish
  const liquidityRegime = macro.liquidityRegime || "neutral"; // tight|neutral|loose

  let score = 0;

  if (momentum > 0.004) score += 0.35;
  if (momentum < -0.004) score -= 0.35;

  if (rsi14 !== null && rsi14 < 35) score += 0.25;
  if (rsi14 !== null && rsi14 > 65) score -= 0.25;

  if (volatility > 0.03) score *= 0.7;
  if (liquidityRegime === "loose") score += 0.1;
  if (liquidityRegime === "tight") score -= 0.1;

  score += macroBias * 0.2;

  let action = SignalAction.HOLD;
  if (score > 0.2) action = SignalAction.BUY;
  if (score < -0.2) action = SignalAction.SELL;

  const confidence = Math.max(35, Math.min(90, Math.round(50 + score * 100)));

  return {
    action,
    confidence,
    price: latest,
    score,
    reasons: [
      `Momentum: ${(momentum * 100).toFixed(2)}%`,
      `RSI14: ${rsi14 === null ? "n/a" : rsi14.toFixed(1)}`,
      `Volatility: ${(volatility * 100).toFixed(2)}%`,
      `Macro bias: ${macroBias.toFixed(2)} (${liquidityRegime})`,
    ],
  };
}

