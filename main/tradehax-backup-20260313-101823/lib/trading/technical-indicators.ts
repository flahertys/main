// technical-indicators.ts
// Advanced technical indicator implementations for trading signal engine

// ─── EMA ──────────────────────────────────────────────────────────────
export function calcEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prev = prices[0];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
      continue;
    }
    prev = i === period - 1
      ? prices.slice(0, period).reduce((a, b) => a + b, 0) / period
      : prices[i] * k + prev * (1 - k);
    ema.push(prev);
  }
  return ema;
}

// ─── ATR ──────────────────────────────────────────────────────────────
export function calcATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const tr: number[] = [];
  for (let i = 0; i < highs.length; i++) {
    const h = highs[i], l = lows[i], c = i > 0 ? closes[i - 1] : closes[i];
    tr.push(Math.max(h - l, Math.abs(h - c), Math.abs(l - c)));
  }
  const atr: number[] = [];
  for (let i = 0; i < tr.length; i++) {
    if (i < period) {
      atr.push(NaN);
      continue;
    }
    const slice = tr.slice(i - period + 1, i + 1);
    atr.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return atr;
}

// ─── Supertrend ───────────────────────────────────────────────────────
export function calcSupertrend(highs: number[], lows: number[], closes: number[], period: number, multiplier: number): { trend: string[], value: number[] } {
  const atr = calcATR(highs, lows, closes, period);
  const trend: string[] = [];
  const value: number[] = [];
  let prevTrend = "down";
  let prevValue = closes[0];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      trend.push("none");
      value.push(NaN);
      continue;
    }
    const upperBand = ((highs[i] + lows[i]) / 2) + multiplier * atr[i];
    const lowerBand = ((highs[i] + lows[i]) / 2) - multiplier * atr[i];
    let currTrend = prevTrend;
    let currValue = prevValue;
    if (closes[i] > upperBand) {
      currTrend = "up";
      currValue = lowerBand;
    } else if (closes[i] < lowerBand) {
      currTrend = "down";
      currValue = upperBand;
    }
    trend.push(currTrend);
    value.push(currValue);
    prevTrend = currTrend;
    prevValue = currValue;
  }
  return { trend, value };
}

// More indicators (Ichimoku, Fibonacci, VWAP, etc.) can be added here

