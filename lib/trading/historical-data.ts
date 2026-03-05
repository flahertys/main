/**
 * Historical Price Data Utilities
 *
 * Generates simulated OHLCV candles for backtesting.
 * In production, replace with real exchange API calls (Binance Klines, CoinGecko, etc.).
 */

export interface OHLCVCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = (seed % 2_147_483_647 + 2_147_483_647) % 2_147_483_647;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

// ─── Simulated prices ─────────────────────────────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  BTC: 65_000,
  ETH: 3_200,
  SOL: 145,
  BNB: 580,
  ADA: 0.45,
};

/**
 * Generate simulated daily OHLCV candles for a given symbol and date range.
 * Uses a seeded random walk with mean-reversion and occasional trend moves.
 *
 * @param symbol    Asset symbol (e.g. "BTC")
 * @param startMs   Start timestamp in ms
 * @param endMs     End timestamp in ms
 * @param seed      Optional seed for reproducibility
 */
export function generateHistoricalCandles(
  symbol: string,
  startMs: number,
  endMs: number,
  seed = 42,
): OHLCVCandle[] {
  const rng = seededRng(seed + symbol.charCodeAt(0));
  const basePrice = BASE_PRICES[symbol] ?? 100;
  const DAY = 24 * 60 * 60 * 1000;
  const candles: OHLCVCandle[] = [];

  let price = basePrice * (0.6 + rng() * 0.4); // start at 60-100% of base
  const meanReversion = 0.01;

  for (let ts = startMs; ts <= endMs; ts += DAY) {
    // Random daily return with mean reversion
    const drift = (basePrice - price) / basePrice * meanReversion;
    const dailyReturn = drift + (rng() - 0.495) * 0.05;
    const open = price;
    price = price * (1 + dailyReturn);
    const close = price;
    const range = price * (0.005 + rng() * 0.03);
    const high = Math.max(open, close) + range * rng();
    const low = Math.min(open, close) - range * rng();
    const volume = basePrice * (100 + rng() * 2000);

    candles.push({
      timestamp: new Date(ts).toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(Math.max(0.01, low).toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(2)),
    });
  }

  return candles;
}

/** Return start timestamp in ms for a given time range code. */
export function timeRangeToMs(timeRange: string, endMs = Date.now()): { startMs: number; endMs: number } {
  const map: Record<string, number> = {
    "1M": 30 * 24 * 60 * 60 * 1000,
    "3M": 90 * 24 * 60 * 60 * 1000,
    "6M": 180 * 24 * 60 * 60 * 1000,
    "1Y": 365 * 24 * 60 * 60 * 1000,
  };
  const duration = map[timeRange] ?? 90 * 24 * 60 * 60 * 1000;
  return { startMs: endMs - duration, endMs };
}
