/**
 * Backtesting Engine
 *
 * Simulates trading strategy execution against historical OHLCV data.
 * Handles entry/exit signals, position sizing, fees, slippage, and performance metrics.
 */

import type {
  BacktestConfig,
  BacktestResult,
  BacktestStats,
  BacktestTrade,
  EquityPoint,
  MonthlyReturn,
} from "@/types/trading";
import { generateHistoricalCandles, timeRangeToMs } from "./historical-data";
import { nanoid } from "@/lib/utils";

// ─── Simple RSI calculation ───────────────────────────────────────────────────

function calcRsi(closes: number[], period = 14): number[] {
  const rsi: number[] = Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const diff = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }

  return rsi;
}

// ─── Signal generation ────────────────────────────────────────────────────────

function generateSignals(closes: number[]): ("buy" | "sell" | "hold")[] {
  const rsi = calcRsi(closes);
  return closes.map((_, i) => {
    if (i < 15) return "hold";
    if (rsi[i] < 35 && rsi[i - 1] >= 35) return "buy";
    if (rsi[i] > 65 && rsi[i - 1] <= 65) return "sell";
    return "hold";
  });
}

// ─── Monthly returns ──────────────────────────────────────────────────────────

function buildMonthlyReturns(equityCurve: EquityPoint[]): MonthlyReturn[] {
  const byMonth: Record<string, { start: number; end: number }> = {};

  for (const pt of equityCurve) {
    const d = new Date(pt.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!byMonth[key]) byMonth[key] = { start: pt.equity, end: pt.equity };
    byMonth[key].end = pt.equity;
  }

  return Object.entries(byMonth).map(([key, { start, end }]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      year,
      month,
      returnPct: start > 0 ? Number((((end - start) / start) * 100).toFixed(2)) : 0,
    };
  });
}

// ─── Performance stats ────────────────────────────────────────────────────────

function calcStats(
  trades: BacktestTrade[],
  equityCurve: EquityPoint[],
  initialCapital: number,
): BacktestStats {
  const finalEquity = equityCurve[equityCurve.length - 1]?.equity ?? initialCapital;
  const totalReturnPct = ((finalEquity - initialCapital) / initialCapital) * 100;

  const benchmarkFinal = equityCurve[equityCurve.length - 1]?.benchmark ?? initialCapital;
  const benchmarkReturnPct = ((benchmarkFinal - initialCapital) / initialCapital) * 100;

  const wins = trades.filter((t) => t.pnlUsd > 0);
  const winRatePct = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgDurationMs = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.durationMs, 0) / trades.length
    : 0;

  // Max drawdown
  let maxDrawdownPct = 0;
  let peak = initialCapital;
  for (const pt of equityCurve) {
    if (pt.equity > peak) peak = pt.equity;
    const dd = peak > 0 ? ((peak - pt.equity) / peak) * 100 : 0;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
  }

  // Sharpe ratio (simplified, assumes 0% risk-free rate)
  const returns = equityCurve.slice(1).map((pt, i) => {
    const prev = equityCurve[i].equity;
    return prev > 0 ? (pt.equity - prev) / prev : 0;
  });
  const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const annualFactor = Math.sqrt(252);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * annualFactor : 0;

  // Profit factor
  const grossProfit = wins.reduce((sum, t) => sum + t.pnlUsd, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnlUsd < 0).reduce((sum, t) => sum + t.pnlUsd, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  return {
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    winRatePct: Number(winRatePct.toFixed(2)),
    avgTradeDurationMs: Math.round(avgDurationMs),
    totalTrades: trades.length,
    profitFactor: Number(profitFactor.toFixed(2)),
    benchmarkReturnPct: Number(benchmarkReturnPct.toFixed(2)),
  };
}

// ─── Position sizing ──────────────────────────────────────────────────────────

/** Fraction of equity deployed per trade. Keep 2% as cash buffer for fees. */
const POSITION_SIZE_RATIO = 0.98;

/**
 * Run a backtest simulation for the given configuration.
 *
 * @param config  Backtest parameters (symbol, time range, capital, fees, etc.)
 * @returns       Full BacktestResult with trades, equity curve, stats, and monthly returns.
 */
export function runBacktest(config: BacktestConfig): BacktestResult {
  const now = Date.now();
  const { startMs, endMs } = config.timeRange === "custom" && config.customStartDate && config.customEndDate
    ? { startMs: new Date(config.customStartDate).getTime(), endMs: new Date(config.customEndDate).getTime() }
    : timeRangeToMs(config.timeRange, now);

  const symbol = config.symbol || "BTC";
  const candles = generateHistoricalCandles(symbol, startMs, endMs, config.id.charCodeAt(0));
  const closes = candles.map((c) => c.close);
  const signals = generateSignals(closes);

  let equity = config.initialCapital;
  let inPosition = false;
  let entryPrice = 0;
  let entryIndex = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  // Benchmark (buy and hold from start)
  const benchmarkStartPrice = closes[0] ?? 1;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const signal = signals[i];
    const close = candle.close;

    if (!inPosition && signal === "buy") {
      // Apply slippage
      entryPrice = close * (1 + config.slippagePct / 100);
      const fee = equity * POSITION_SIZE_RATIO * (config.feePct / 100);
      equity -= fee;
      entryIndex = i;
      inPosition = true;
    } else if (inPosition && (signal === "sell" || i === candles.length - 1)) {
      const exitPrice = close * (1 - config.slippagePct / 100);
      const tradeReturn = (exitPrice - entryPrice) / entryPrice;
      const positionSize = equity * POSITION_SIZE_RATIO;
      const pnlUsd = positionSize * tradeReturn;
      const fee = positionSize * (config.feePct / 100);
      equity += pnlUsd - fee;
      equity = Math.max(0, equity);

      const durationMs = (i - entryIndex) * 24 * 60 * 60 * 1000;

      trades.push({
        id: nanoid(),
        symbol,
        side: "buy",
        entryPrice: Number(entryPrice.toFixed(2)),
        exitPrice: Number(exitPrice.toFixed(2)),
        quantity: Number((positionSize / entryPrice).toFixed(6)),
        entryTime: candles[entryIndex].timestamp,
        exitTime: candle.timestamp,
        durationMs,
        pnlUsd: Number(pnlUsd.toFixed(2)),
        pnlPct: Number((tradeReturn * 100).toFixed(2)),
        fees: Number(fee.toFixed(2)),
        signalReason: `RSI ${signal === "sell" ? "overbought" : "oversold"} crossover`,
      });

      inPosition = false;
    }

    const benchmark = config.initialCapital * (close / benchmarkStartPrice);
    equityCurve.push({
      timestamp: candle.timestamp,
      equity: Number(equity.toFixed(2)),
      benchmark: Number(benchmark.toFixed(2)),
    });
  }

  const stats = calcStats(trades, equityCurve, config.initialCapital);
  const monthlyReturns = buildMonthlyReturns(equityCurve);

  return {
    id: nanoid(),
    config,
    stats,
    trades,
    equityCurve,
    monthlyReturns,
    completedAt: new Date().toISOString(),
  };
}
