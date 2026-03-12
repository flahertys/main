import { assertNumber } from "./types.js";

export function sma(values, period) {
  if (values.length < period) return null;
  const window = values.slice(values.length - period);
  return window.reduce((sum, v) => sum + v, 0) / period;
}

export function returns(values) {
  if (values.length < 2) return [];
  const out = [];
  for (let i = 1; i < values.length; i += 1) {
    out.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  return out;
}

export function stdev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i += 1) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function extractFeatures(candles) {
  const closes = candles.map((c) => c.close);
  const latest = closes[closes.length - 1];
  assertNumber(latest, "latest close");

  const smaFast = sma(closes, 10);
  const smaSlow = sma(closes, 30);
  const momentum = smaFast && smaSlow ? (smaFast - smaSlow) / smaSlow : 0;

  const ret = returns(closes).slice(-20);
  const volatility = stdev(ret);

  const rsi14 = rsi(closes, 14);

  return {
    latest,
    smaFast,
    smaSlow,
    momentum,
    volatility,
    rsi14,
  };
}

