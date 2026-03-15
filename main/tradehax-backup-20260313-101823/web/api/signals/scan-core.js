const DEFAULT_THRESHOLDS = {
  priceMovePct: 4.5,
  volumeToCapPct: 6.0,
  intradayRangePct: 5.0,
  minScore: 45,
  minMarketCap: 750_000_000,
  minVolume24h: 60_000_000,
};

const DEFAULT_WEIGHTS = {
  directional: 0.4,
  participation: 0.35,
  volatility: 0.25,
};

function round(value, digits = 2) {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

function toSignalLabel(score) {
  if (score >= 80) return "HIGH";
  if (score >= 60) return "ELEVATED";
  return "WATCH";
}

function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;

  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deriveMarketRegime(items) {
  const ranges = items
    .map((item) => {
      const low = Number(item?.low24h || 0);
      const high = Number(item?.high24h || 0);
      return low > 0 ? ((high - low) / low) * 100 : 0;
    })
    .filter((value) => value > 0);

  const turnovers = items
    .map((item) => {
      const cap = Number(item?.marketCap || 0);
      const volume = Number(item?.volume24h || 0);
      return cap > 0 ? (volume / cap) * 100 : 0;
    })
    .filter((value) => value > 0);

  const medianRange = getMedian(ranges);
  const medianTurnover = getMedian(turnovers);

  const label =
    medianRange >= 8.5 || medianTurnover >= 8
      ? "HIGH_VOLATILITY"
      : medianRange >= 5.5 || medianTurnover >= 5.5
        ? "ELEVATED_ACTIVITY"
        : "NORMAL";

  return {
    label,
    medianRangePct: round(medianRange),
    medianTurnoverPct: round(medianTurnover),
  };
}

function toAdaptiveThresholds(base, regime) {
  const rangeShift = regime.label === "HIGH_VOLATILITY" ? 1.4 : regime.label === "ELEVATED_ACTIVITY" ? 0.7 : 0;
  const turnoverShift = regime.label === "HIGH_VOLATILITY" ? 1.25 : regime.label === "ELEVATED_ACTIVITY" ? 0.5 : 0;

  return {
    ...base,
    priceMovePct: round(base.priceMovePct + rangeShift),
    volumeToCapPct: round(base.volumeToCapPct + turnoverShift),
    intradayRangePct: round(base.intradayRangePct + rangeShift),
  };
}

function classifyStrategy(priceChangePct, intradayRangePct) {
  if (Math.abs(priceChangePct) >= 8 && intradayRangePct >= 10) {
    return "EXTREME_MOMENTUM";
  }

  if (Math.abs(priceChangePct) >= 5) {
    return priceChangePct > 0 ? "BREAKOUT_CONTINUATION" : "BREAKDOWN_CONTINUATION";
  }

  return "MEAN_REVERSION_WATCH";
}

function classifyHorizon(score, intradayRangePct) {
  if (score >= 80 || intradayRangePct >= 11) return "SCALP_TO_INTRADAY";
  if (score >= 60) return "INTRADAY_TO_SWING";
  return "WATCHLIST";
}

function buildReliability({
  factorsTriggered,
  marketCap,
  volume24h,
  score,
  thresholds,
}) {
  let reliability = 40 + factorsTriggered * 14;

  if (marketCap >= thresholds.minMarketCap) reliability += 10;
  if (volume24h >= thresholds.minVolume24h) reliability += 10;
  if (score >= 80) reliability += 6;

  return round(clamp(reliability, 0, 100), 1);
}

function buildPlan(symbol, score) {
  if (score >= 80) {
    return {
      trigger: `Break + hold above intraday resistance on ${symbol}`,
      invalidation: "Close back inside prior range with weakening momentum",
      risk: "Risk 0.75%-1.25% of portfolio, scale out in 2 tranches",
    };
  }

  if (score >= 60) {
    return {
      trigger: `Reclaim and hold VWAP-style mean with improving tape on ${symbol}`,
      invalidation: "Failed reclaim and immediate lower-low sequence",
      risk: "Risk 0.5%-1.0% of portfolio, use tighter invalidation",
    };
  }

  return {
    trigger: `Wait for confirmation candle before engaging ${symbol}`,
    invalidation: "No participation increase after trigger",
    risk: "Risk <= 0.5% until signal quality improves",
  };
}

export function scoreMarketOpportunity(
  item,
  thresholds = DEFAULT_THRESHOLDS,
  weights = DEFAULT_WEIGHTS
) {
  const priceChangePct = Number(item?.priceChangePercent24h || 0);
  const volume24h = Number(item?.volume24h || 0);
  const marketCap = Number(item?.marketCap || 0);
  const high24h = Number(item?.high24h || 0);
  const low24h = Number(item?.low24h || 0);

  const volumeToCapPct = marketCap > 0 ? (volume24h / marketCap) * 100 : 0;
  const intradayRangePct = low24h > 0 ? ((high24h - low24h) / low24h) * 100 : 0;

  const directionalPressure = clamp((Math.abs(priceChangePct) / thresholds.priceMovePct) * 100, 0, 100);
  const flowPressure = clamp((volumeToCapPct / thresholds.volumeToCapPct) * 100, 0, 100);
  const rangeExpansion = clamp((intradayRangePct / thresholds.intradayRangePct) * 100, 0, 100);

  const score = round(
    directionalPressure * weights.directional +
      flowPressure * weights.participation +
      rangeExpansion * weights.volatility,
    1
  );

  const reasons = [];
  if (Math.abs(priceChangePct) >= thresholds.priceMovePct) {
    reasons.push(`24h move ${round(priceChangePct)}% exceeds threshold`);
  }
  if (volumeToCapPct >= thresholds.volumeToCapPct) {
    reasons.push(`Turnover ${round(volumeToCapPct)}% of market cap signals elevated participation`);
  }
  if (intradayRangePct >= thresholds.intradayRangePct) {
    reasons.push(`Intraday expansion ${round(intradayRangePct)}% indicates volatility regime shift`);
  }

  const factorsTriggered = [
    Math.abs(priceChangePct) >= thresholds.priceMovePct,
    volumeToCapPct >= thresholds.volumeToCapPct,
    intradayRangePct >= thresholds.intradayRangePct,
  ].filter(Boolean).length;

  const strategyTag = classifyStrategy(priceChangePct, intradayRangePct);
  const horizon = classifyHorizon(score, intradayRangePct);
  const reliability = buildReliability({
    factorsTriggered,
    marketCap,
    volume24h,
    score,
    thresholds,
  });

  return {
    symbol: item.symbol,
    score,
    signalLabel: toSignalLabel(score),
    direction: priceChangePct >= 0 ? "BULLISH_PRESSURE" : "BEARISH_PRESSURE",
    reliability,
    strategyTag,
    horizon,
    factorsTriggered,
    metrics: {
      priceChangePct: round(priceChangePct),
      volumeToCapPct: round(volumeToCapPct),
      intradayRangePct: round(intradayRangePct),
      volume24h: round(volume24h, 0),
      marketCap: round(marketCap, 0),
    },
    reasons,
    plan: buildPlan(item.symbol, score),
  };
}

export function detectUnusualOpportunities(items, options = {}) {
  const baseThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(options.thresholds || {}),
  };

  const weights = {
    ...DEFAULT_WEIGHTS,
    ...(options.weights || {}),
  };

  const regime = deriveMarketRegime(items || []);
  const thresholds = toAdaptiveThresholds(baseThresholds, regime);
  const limit = Number(options.limit || 20);

  const scored = (items || [])
    .map((item) => scoreMarketOpportunity(item, thresholds, weights))
    .filter((item) => item.score >= thresholds.minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.reliability - a.reliability;
    })
    .slice(0, limit);

  return {
    timestamp: Date.now(),
    regime,
    thresholds,
    weights,
    totalScanned: (items || []).length,
    totalFlagged: scored.length,
    opportunities: scored,
  };
}

export const scannerDefaults = DEFAULT_THRESHOLDS;

