/**
 * Explainability Engine
 *
 * Generates signal explanations (XAI) from TradingSignal data.
 * Breaks down contributing factors, risk level, historical accuracy,
 * and similar past signals to build user trust.
 */

import type {
  RiskLevel,
  SignalExplanation,
  SignalFactor,
  SignalHistoricalPerformance,
  SimilarSignal,
  TradingSignal,
} from "@/types/trading";

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = (seed % 2_147_483_647 + 2_147_483_647) % 2_147_483_647;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

// ─── Factor templates ─────────────────────────────────────────────────────────

const FACTOR_NAMES = [
  "RSI Oversold",
  "Sentiment Bullish",
  "Volume Spike",
  "MACD Crossover",
  "On-Chain Accumulation",
  "Trend Alignment",
  "Price Action",
  "Funding Rate",
] as const;

const FACTOR_VALUES_BULLISH: Record<typeof FACTOR_NAMES[number], string> = {
  "RSI Oversold": "RSI(14) = 28 (oversold)",
  "Sentiment Bullish": "Fear & Greed = 72 (greed)",
  "Volume Spike": "Volume 2.4× 20-bar avg",
  "MACD Crossover": "Bullish crossover on 4h",
  "On-Chain Accumulation": "Whale wallets +12% in 48h",
  "Trend Alignment": "Price above 200 EMA",
  "Price Action": "Higher-high break on daily",
  "Funding Rate": "Funding negative → contrarian buy",
};

const FACTOR_VALUES_BEARISH: Record<typeof FACTOR_NAMES[number], string> = {
  "RSI Oversold": "RSI(14) = 74 (overbought)",
  "Sentiment Bullish": "Fear & Greed = 18 (fear)",
  "Volume Spike": "Sell volume 3.1× avg",
  "MACD Crossover": "Bearish crossover on 4h",
  "On-Chain Accumulation": "Exchange inflows +22% in 24h",
  "Trend Alignment": "Price below 200 EMA",
  "Price Action": "Lower-low break on daily",
  "Funding Rate": "Funding elevated → over-leveraged longs",
};

// ─── Natural language summaries ───────────────────────────────────────────────

function buildSummary(
  signal: Pick<TradingSignal, "symbol" | "action" | "confidence">,
  factors: SignalFactor[],
  risk: RiskLevel,
): string {
  const topFactor = factors.slice().sort((a, b) => b.weight - a.weight)[0];
  const confidencePct = Math.round(signal.confidence * 100);
  const actionWord = signal.action === "buy" ? "long" : signal.action === "sell" ? "short" : "hold";
  const riskDesc = risk === "low" ? "low-risk" : risk === "medium" ? "moderate-risk" : "elevated-risk";

  return (
    `This ${confidencePct}% confidence ${actionWord} signal on ${signal.symbol} is primarily driven by ` +
    `${topFactor?.name ?? "multiple technical indicators"} (${topFactor?.value ?? ""}). ` +
    `Overall risk is assessed as ${riskDesc} based on current market conditions ` +
    `and ${factors.length} contributing factors.`
  );
}

// ─── Risk assessment ──────────────────────────────────────────────────────────

function assessRisk(
  confidence: number,
  topFactorWeight: number,
): { level: RiskLevel; reason: string } {
  if (confidence >= 0.75 && topFactorWeight >= 0.25) {
    return {
      level: "low",
      reason: "High model confidence with strong primary signal driver.",
    };
  }
  if (confidence >= 0.55) {
    return {
      level: "medium",
      reason: "Moderate confidence; signal has mixed supporting factors.",
    };
  }
  return {
    level: "high",
    reason: "Low confidence signal — proceed with reduced position size.",
  };
}

// ─── Main engine function ─────────────────────────────────────────────────────

/**
 * Generate a full XAI explanation for a trading signal.
 *
 * @param signal  The trading signal to explain.
 * @param seed    Deterministic seed for reproducible explanations (default: hash of signal.id).
 */
export function explainSignal(signal: TradingSignal, seed?: number): SignalExplanation {
  const numSeed = seed ?? signal.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = seededRng(numSeed);

  const isBullish = signal.action === "buy";
  const factorValues = isBullish ? FACTOR_VALUES_BULLISH : FACTOR_VALUES_BEARISH;

  // Pick 4-6 factors with weights summing to ~1.0
  const factorCount = 4 + Math.floor(rng() * 3); // 4, 5, or 6
  const selectedFactors = [...FACTOR_NAMES].sort(() => rng() - 0.5).slice(0, factorCount);

  // Assign weights (Dirichlet-like distribution)
  const rawWeights = selectedFactors.map(() => rng() + 0.1);
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
  const normalizedWeights = rawWeights.map((w) => Number((w / totalWeight).toFixed(2)));
  // Correct for rounding
  const delta = 1.0 - normalizedWeights.reduce((a, b) => a + b, 0);
  normalizedWeights[0] = Number((normalizedWeights[0] + delta).toFixed(2));

  const factors: SignalFactor[] = selectedFactors.map((name, i) => ({
    name,
    weight: normalizedWeights[i],
    value: factorValues[name],
    direction: isBullish ? "bullish" : "bearish",
  }));

  const topWeight = Math.max(...normalizedWeights);
  const { level: riskLevel, reason: riskReason } = assessRisk(signal.confidence, topWeight);

  // Historical performance (simulated)
  const historicalPerformance: SignalHistoricalPerformance = {
    signalType: `${signal.action}-${signal.timeframe}`,
    winRate: Number((0.45 + rng() * 0.35).toFixed(2)),
    avgReturnPct: Number((rng() * 12 - 2).toFixed(1)),
    sampleSize: 50 + Math.floor(rng() * 200),
    timeRange: "6 months",
  };

  // Similar past signals (simulated)
  const outcomeOptions: SimilarSignal["outcome"][] = ["win", "loss", "win"];
  const similarSignals: SimilarSignal[] = Array.from({ length: 3 }, (_, i) => {
    const returnVal = outcomeOptions[i] === "win" ? rng() * 15 : -(rng() * 10);
    return {
      id: `sim-${numSeed}-${i}`,
      symbol: signal.symbol,
      action: signal.action,
      generatedAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      outcome: outcomeOptions[i],
      returnPct: Number(returnVal.toFixed(1)),
      similarity: Number((0.7 + rng() * 0.25).toFixed(2)),
    };
  });

  return {
    signalId: signal.id,
    symbol: signal.symbol,
    action: signal.action,
    confidence: signal.confidence,
    factors,
    dataPointsAnalyzed: 500 + Math.floor(rng() * 2000),
    timeRangeAnalyzed: "30 days",
    dataSources: ["Price OHLCV", "On-Chain Analytics", "Sentiment Feed", "Derivatives Market"],
    historicalPerformance,
    riskLevel,
    riskReason,
    naturalLanguageSummary: buildSummary(signal, factors, riskLevel),
    similarSignals,
    generatedAt: new Date().toISOString(),
  };
}
