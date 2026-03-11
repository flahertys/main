/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import { getIntelligenceSnapshot } from "@/lib/intelligence/provider";
import {
  getAdaptivePatternWeighting,
  getCalibrationAdjustment,
  getProbabilityCalibrationSummary,
  recordProbabilityForecast,
} from "@/lib/intelligence/probability-calibration";
import { applyAutoPolicyHysteresis, getAutoPolicyRecommendation } from "@/lib/intelligence/probability-policy-store";
import type { CryptoFlowTrade, DarkPoolTrade, FlowTrade, IntelligenceNewsItem } from "@/lib/intelligence/types";

export type ProbabilityDirection = "long" | "short";
export type ProbabilityPolicyProfile = "auto" | "conservative" | "balanced" | "aggressive";

export type ProbabilityDriver = {
  label: string;
  value: number;
  polarity: "bullish" | "bearish" | "neutral";
  detail: string;
};

export type ProbabilityPattern = {
  id: string;
  title: string;
  direction: ProbabilityDirection;
  strength: number;
  rationale: string;
  adaptiveMultiplier?: number;
  adaptiveStatus?: "promoted" | "neutral" | "demoted";
};

export type ProbabilityScenario = {
  symbol: string;
  assetType: "equity" | "crypto";
  horizon: "scalp" | "intraday" | "swing";
  longProbability: number;
  shortProbability: number;
  confidence: number;
  bias: ProbabilityDirection;
  drivers: ProbabilityDriver[];
  patterns: ProbabilityPattern[];
  generatedAt: string;
  providerMode: "live" | "simulated";
  qualityBand: "elite" | "strong" | "watch";
  calibration: {
    rawLongProbability: number;
    delta: number;
    sampleCount: number;
    applied: boolean;
    reason: string;
  };
  adaptation: {
    netLongDelta: number;
    promotedCount: number;
    demotedCount: number;
    halfLifeMinutes: number;
    cooldownHalfLifeMinutes: number;
  };
  policy: {
    requested: ProbabilityPolicyProfile;
    applied: Exclude<ProbabilityPolicyProfile, "auto">;
    rationale: string;
    impactDelta: number;
    selectionBasis: "explicit" | "stored" | "attribution" | "health" | "guardrail";
    selectorConfidence: number;
    selectorSampleCount: number;
    selectorScoreEdge: number;
    hysteresisLocked: boolean;
    hysteresisSwitched: boolean;
    hysteresisHoldSecondsRemaining: number;
    previousAutoPolicy?: Exclude<ProbabilityPolicyProfile, "auto">;
    dynamicMinSwitchEdge: number;
    dynamicMinSwitchConfidence: number;
    selectorVolatility: number;
    selectorHitRateDispersion: number;
    warmupActive: boolean;
    warmupMinMatches: number;
    warmupMatchesGained: number;
    warmupMatchesRemaining: number;
  };
  forecastId: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function normalizeSymbol(value: string) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function toPct(value: number) {
  return Number.parseFloat(clamp(value, 0, 1).toFixed(4));
}

type SignalScore = {
  score: number;
  detail: string;
  samples: number;
  freshness: number;
  reliability: number;
};

function parseIsoMs(value: string | undefined) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function ageMinutes(value: string | undefined) {
  const parsed = parseIsoMs(value);
  if (!Number.isFinite(parsed)) {
    return 24 * 60;
  }
  return Math.max(0, (Date.now() - parsed) / 60_000);
}

function recencyWeight(value: string | undefined, halfLifeMinutes: number, floor = 0.12) {
  return clamp(Math.pow(0.5, ageMinutes(value) / halfLifeMinutes), floor, 1);
}

function resolveSignalReliability(samples: number, freshness: number) {
  const sampleFactor = clamp(samples / 6, 0.18, 1);
  return clamp(sampleFactor * 0.6 + freshness * 0.4, 0.12, 1);
}

function scoreCallPutFlow(flowTape: FlowTrade[], symbol: string) {
  const rows = flowTape.filter((row) => row.symbol === symbol);
  if (rows.length === 0) {
    return {
      score: 0,
      detail: "No options flow for symbol.",
      samples: 0,
      freshness: 0,
      reliability: 0,
    } satisfies SignalScore;
  }

  let callPremium = 0;
  let putPremium = 0;
  let unusual = 0;
  let weightTotal = 0;
  let freshnessWeighted = 0;

  for (const row of rows) {
    const timeWeight = recencyWeight(row.openedAt, 55);
    const premiumWeight = timeWeight * (row.sweep ? 1.1 : 1);
    const weightedPremium = row.premiumUsd * (1 + row.unusualScore / 100) * premiumWeight;
    unusual += row.unusualScore * premiumWeight;
    weightTotal += premiumWeight;
    freshnessWeighted += timeWeight;
    if (row.side === "call") {
      callPremium += weightedPremium;
    } else {
      putPremium += weightedPremium;
    }
  }

  const total = callPremium + putPremium;
  const imbalance = total > 0 ? (callPremium - putPremium) / total : 0;
  const unusualAvg = weightTotal > 0 ? unusual / weightTotal : 50;
  const unusualBoost = (unusualAvg - 50) / 100;
  const freshness = rows.length > 0 ? clamp(freshnessWeighted / rows.length, 0, 1) : 0;
  const score = clamp(imbalance * 0.8 + unusualBoost * 0.2, -1, 1);

  return {
    score,
    detail: `Flow imbalance ${(imbalance * 100).toFixed(1)}%, unusual avg ${unusualAvg.toFixed(1)}.`,
    samples: rows.length,
    freshness,
    reliability: resolveSignalReliability(rows.length, freshness),
  } satisfies SignalScore;
}

function scoreDarkPool(darkPoolTape: DarkPoolTrade[], symbol: string) {
  const rows = darkPoolTape.filter((row) => row.symbol === symbol);
  if (rows.length === 0) {
    return {
      score: 0,
      detail: "No dark pool blocks for symbol.",
      samples: 0,
      freshness: 0,
      reliability: 0,
    } satisfies SignalScore;
  }

  let buy = 0;
  let sell = 0;
  let mixed = 0;
  let unusual = 0;
  let weightTotal = 0;
  let freshnessWeighted = 0;
  for (const row of rows) {
    const timeWeight = recencyWeight(row.executedAt, 80);
    const sizeWeight = timeWeight * (row.sideEstimate === "mixed" ? 0.8 : 1);
    unusual += row.unusualScore * sizeWeight;
    weightTotal += sizeWeight;
    freshnessWeighted += timeWeight;
    if (row.sideEstimate === "buy") {
      buy += row.notionalUsd * sizeWeight;
    } else if (row.sideEstimate === "sell") {
      sell += row.notionalUsd * sizeWeight;
    } else {
      mixed += row.notionalUsd * sizeWeight;
    }
  }

  const denominator = buy + sell + mixed * 0.6;
  const imbalance = denominator > 0 ? (buy - sell) / denominator : 0;
  const unusualAvg = weightTotal > 0 ? unusual / weightTotal : 50;
  const unusualBoost = (unusualAvg - 50) / 100;
  const freshness = rows.length > 0 ? clamp(freshnessWeighted / rows.length, 0, 1) : 0;
  const score = clamp(imbalance * 0.75 + unusualBoost * 0.25, -1, 1);

  return {
    score,
    detail: `Dark-pool buy/sell imbalance ${(imbalance * 100).toFixed(1)}%, unusual avg ${unusualAvg.toFixed(1)}.`,
    samples: rows.length,
    freshness,
    reliability: resolveSignalReliability(rows.length, freshness),
  } satisfies SignalScore;
}

function scoreCryptoFlow(cryptoTape: CryptoFlowTrade[], symbol: string) {
  const rows = cryptoTape.filter((row) => row.pair.startsWith(symbol));
  if (rows.length === 0) {
    return {
      score: 0,
      detail: "No crypto flow rows for symbol.",
      samples: 0,
      freshness: 0,
      reliability: 0,
    } satisfies SignalScore;
  }

  let longNotional = 0;
  let shortNotional = 0;
  let confidenceSum = 0;
  let weightTotal = 0;
  let freshnessWeighted = 0;

  for (const row of rows) {
    const timeWeight = recencyWeight(row.triggeredAt, 45);
    const directionalWeight = timeWeight * clamp(0.7 + row.confidence * 0.6, 0.7, 1.3);
    confidenceSum += row.confidence * directionalWeight;
    weightTotal += directionalWeight;
    freshnessWeighted += timeWeight;
    if (row.side === "long" || row.side === "spot_buy") {
      longNotional += row.notionalUsd * directionalWeight;
    } else {
      shortNotional += row.notionalUsd * directionalWeight;
    }
  }

  const total = longNotional + shortNotional;
  const directional = total > 0 ? (longNotional - shortNotional) / total : 0;
  const avgConfidence = weightTotal > 0 ? confidenceSum / weightTotal : 0.5;
  const confidenceBoost = (avgConfidence - 0.5) * 1.2;
  const freshness = rows.length > 0 ? clamp(freshnessWeighted / rows.length, 0, 1) : 0;
  const score = clamp(directional * 0.8 + confidenceBoost * 0.2, -1, 1);

  return {
    score,
    detail: `Crypto directional ${(directional * 100).toFixed(1)}%, avg confidence ${(avgConfidence * 100).toFixed(1)}%.`,
    samples: rows.length,
    freshness,
    reliability: resolveSignalReliability(rows.length, freshness),
  } satisfies SignalScore;
}

function scoreNews(news: IntelligenceNewsItem[], symbol: string) {
  const rows = news.filter((row) => row.symbol === symbol);
  if (rows.length === 0) {
    return {
      score: 0,
      detail: "No symbol-specific news catalysts.",
      samples: 0,
      freshness: 0,
      reliability: 0,
    } satisfies SignalScore;
  }

  let macroBias = 0;
  let riskBias = 0;
  let weightTotal = 0;
  let freshnessWeighted = 0;
  for (const row of rows) {
    const impactWeight = row.impact === "high" ? 1 : row.impact === "medium" ? 0.6 : 0.35;
    const timeWeight = recencyWeight(row.publishedAt, 180, 0.08);
    const weight = impactWeight * timeWeight;
    weightTotal += weight;
    freshnessWeighted += timeWeight;
    const text = `${row.title} ${row.summary}`.toLowerCase();
    const bullishToken = /(beat|upgrade|inflow|accumulation|breakout|dovish|cooling inflation)/.test(text);
    const bearishToken = /(downgrade|outflow|distribution|breakdown|hawkish|hot inflation|risk-off)/.test(text);

    if (bullishToken && !bearishToken) {
      macroBias += weight;
    } else if (bearishToken && !bullishToken) {
      macroBias -= weight;
    }

    if (row.category === "macro" || row.category === "policy") {
      riskBias += weight;
    }
  }

  const scaled = weightTotal > 0 ? macroBias / weightTotal : 0;
  const riskScaled = weightTotal > 0 ? riskBias / weightTotal : 0;
  const freshness = rows.length > 0 ? clamp(freshnessWeighted / rows.length, 0, 1) : 0;
  const score = clamp(scaled * (1 - clamp(riskScaled * 0.15, 0, 0.25)), -1, 1);

  return {
    score,
    detail: `News directional score ${(scaled * 100).toFixed(1)} with macro risk pressure ${(riskScaled * 100).toFixed(1)}.`,
    samples: rows.length,
    freshness,
    reliability: resolveSignalReliability(rows.length, freshness),
  } satisfies SignalScore;
}

function detectPatterns(input: {
  symbol: string;
  assetType: "equity" | "crypto";
  flow: { score: number; samples: number };
  dark: { score: number; samples: number };
  crypto: { score: number; samples: number };
  news: { score: number; samples: number };
}) {
  const patterns: ProbabilityPattern[] = [];

  if (input.assetType === "equity" && input.flow.samples >= 2 && input.flow.score > 0.28) {
    patterns.push({
      id: `pattern_flow_call_dominance_${input.symbol}`,
      title: "Call-Sweep Dominance",
      direction: "long",
      strength: toPct((input.flow.score + 1) / 2),
      rationale: "Call premium concentration and unusual-score stacking indicate upside positioning.",
    });
  }

  if (input.assetType === "equity" && input.dark.samples >= 2 && input.dark.score < -0.22) {
    patterns.push({
      id: `pattern_dark_distribution_${input.symbol}`,
      title: "Dark Pool Distribution",
      direction: "short",
      strength: toPct((Math.abs(input.dark.score) + 0.1) / 1.1),
      rationale: "Sell-side block imbalance suggests distribution into strength.",
    });
  }

  if (input.assetType === "crypto" && input.crypto.samples >= 2 && input.crypto.score > 0.22) {
    patterns.push({
      id: `pattern_crypto_bid_pressure_${input.symbol}`,
      title: "Cross-Exchange Bid Pressure",
      direction: "long",
      strength: toPct((input.crypto.score + 1) / 2),
      rationale: "Spot buy + long imbalance with elevated confidence indicates persistent bid support.",
    });
  }

  if (input.news.samples > 0 && input.news.score < -0.2) {
    patterns.push({
      id: `pattern_macro_headwind_${input.symbol}`,
      title: "Macro Headwind Regime",
      direction: "short",
      strength: toPct((Math.abs(input.news.score) + 0.1) / 1.1),
      rationale: "Catalyst mix is skewing risk-off and suppressing upside follow-through.",
    });
  }

  return patterns.slice(0, 4);
}

function toQualityBand(confidence: number) {
  if (confidence >= 0.82) return "elite" as const;
  if (confidence >= 0.68) return "strong" as const;
  return "watch" as const;
}

function horizonWeight(horizon: "scalp" | "intraday" | "swing") {
  if (horizon === "scalp") {
    return {
      flow: 0.38,
      dark: 0.32,
      crypto: 0.24,
      news: 0.06,
    };
  }

  if (horizon === "swing") {
    return {
      flow: 0.28,
      dark: 0.22,
      crypto: 0.2,
      news: 0.3,
    };
  }

  return {
    flow: 0.33,
    dark: 0.28,
    crypto: 0.22,
    news: 0.17,
  };
}

function shapeProbabilityByPolicy(input: {
  longProbability: number;
  policy: Exclude<ProbabilityPolicyProfile, "auto">;
}) {
  const p = clamp(input.longProbability, 0.001, 0.999);
  if (input.policy === "conservative") {
    const compressed = 0.5 + (p - 0.5) * 0.78;
    return clamp(compressed, 0.08, 0.92);
  }
  if (input.policy === "aggressive") {
    const expanded = 0.5 + (p - 0.5) * 1.12;
    return clamp(expanded, 0.02, 0.98);
  }
  return clamp(p, 0.03, 0.97);
}

function resolvePolicy(input: {
  requested: ProbabilityPolicyProfile | undefined;
  profileKey?: string;
  horizon: "scalp" | "intraday" | "swing";
  health: {
    status: "healthy" | "watch" | "critical";
    score: number;
  };
}) {
  const requested = input.requested || "auto";
  if (requested === "auto") {
    const recommendation = getAutoPolicyRecommendation({
      profileKey: input.profileKey,
      horizon: input.horizon,
      health: input.health,
    });

    const hysteresis = applyAutoPolicyHysteresis({
      profileKey: input.profileKey,
      horizon: input.horizon,
      recommendation,
    });

    let applied: Exclude<ProbabilityPolicyProfile, "auto"> = hysteresis.policy;
    let rationale = `${recommendation.reason} ${hysteresis.reason}`;
    let selectionBasis: "explicit" | "stored" | "attribution" | "health" | "guardrail" = recommendation.basis;

    if (input.health.status === "critical" && applied !== "conservative") {
      applied = "conservative";
      selectionBasis = "guardrail";
      rationale = `Guardrail override to conservative because calibration health is critical (score ${input.health.score}). ${recommendation.reason}`;
    } else if (input.health.status === "watch" && applied === "aggressive") {
      applied = "balanced";
      selectionBasis = "guardrail";
      rationale = `Guardrail override to balanced because calibration health is watch (score ${input.health.score}). ${recommendation.reason}`;
    }

    return {
      requested,
      applied,
      rationale,
      selectionBasis,
      selectorConfidence: Number.parseFloat(recommendation.confidence.toFixed(4)),
      selectorSampleCount: recommendation.matchedOutcomes,
      selectorScoreEdge: Number.parseFloat(recommendation.scoreEdge.toFixed(4)),
      hysteresisLocked: hysteresis.locked,
      hysteresisSwitched: hysteresis.switched,
      hysteresisHoldSecondsRemaining: hysteresis.holdSecondsRemaining,
      previousAutoPolicy: hysteresis.previousPolicy,
      dynamicMinSwitchEdge: hysteresis.minSwitchEdgeUsed,
      dynamicMinSwitchConfidence: hysteresis.minSwitchConfidenceUsed,
      selectorVolatility: hysteresis.volatility,
      selectorHitRateDispersion: hysteresis.hitRateDispersion,
      warmupActive: hysteresis.warmupActive,
      warmupMinMatches: hysteresis.warmupMinMatches,
      warmupMatchesGained: hysteresis.warmupMatchesGained,
      warmupMatchesRemaining: hysteresis.warmupMatchesRemaining,
    };
  }

  if (requested === "aggressive" && input.health.status !== "healthy") {
    return {
      requested,
      applied: "balanced" as const,
      rationale: "Aggressive profile guardrailed to balanced because calibration health is not healthy.",
      selectionBasis: "guardrail" as const,
      selectorConfidence: 0.9,
      selectorSampleCount: 0,
      selectorScoreEdge: 0,
      hysteresisLocked: false,
      hysteresisSwitched: false,
      hysteresisHoldSecondsRemaining: 0,
      previousAutoPolicy: undefined,
      dynamicMinSwitchEdge: 0,
      dynamicMinSwitchConfidence: 0,
      selectorVolatility: 0,
      selectorHitRateDispersion: 0,
      warmupActive: false,
      warmupMinMatches: 0,
      warmupMatchesGained: 0,
      warmupMatchesRemaining: 0,
    };
  }

  return {
    requested,
    applied: requested,
    rationale: `Using explicit ${requested} policy profile.`,
    selectionBasis: "explicit" as const,
    selectorConfidence: 1,
    selectorSampleCount: 0,
    selectorScoreEdge: 0,
    hysteresisLocked: false,
    hysteresisSwitched: false,
    hysteresisHoldSecondsRemaining: 0,
    previousAutoPolicy: undefined,
    dynamicMinSwitchEdge: 0,
    dynamicMinSwitchConfidence: 0,
    selectorVolatility: 0,
    selectorHitRateDispersion: 0,
    warmupActive: false,
    warmupMinMatches: 0,
    warmupMatchesGained: 0,
    warmupMatchesRemaining: 0,
  };
}

export async function buildProbabilityScenario(input: {
  symbol: string;
  horizon?: "scalp" | "intraday" | "swing";
  assetType?: "equity" | "crypto";
  policy?: ProbabilityPolicyProfile;
  profileKey?: string;
  healthSnapshot?: {
    status: "healthy" | "watch" | "critical";
    score: number;
  };
}) {
  const snapshot = await getIntelligenceSnapshot();
  const symbol = normalizeSymbol(input.symbol);
  const horizon = input.horizon || "intraday";
  const healthSnapshot = input.healthSnapshot || getProbabilityCalibrationSummary().health;
  const resolvedPolicy = resolvePolicy({
    requested: input.policy,
    profileKey: input.profileKey,
    horizon,
    health: {
      status: healthSnapshot.status,
      score: healthSnapshot.score,
    },
  });

  const inferredAssetType: "equity" | "crypto" = input.assetType
    ? input.assetType
    : snapshot.cryptoTape.some((row) => row.pair.startsWith(symbol))
      ? "crypto"
      : "equity";

  const flow = scoreCallPutFlow(snapshot.flowTape, symbol);
  const dark = scoreDarkPool(snapshot.darkPoolTape, symbol);
  const crypto = scoreCryptoFlow(snapshot.cryptoTape, symbol);
  const news = scoreNews(snapshot.news, symbol);
  const weights = horizonWeight(horizon);

  const signalBlend = [
    { score: flow.score, baseWeight: weights.flow, reliability: flow.reliability, freshness: flow.freshness },
    { score: dark.score, baseWeight: weights.dark, reliability: dark.reliability, freshness: dark.freshness },
    { score: crypto.score, baseWeight: weights.crypto, reliability: crypto.reliability, freshness: crypto.freshness },
    { score: news.score, baseWeight: weights.news, reliability: news.reliability, freshness: news.freshness },
  ];
  const weightedCoverage = signalBlend.reduce((sum, item) => sum + item.baseWeight * item.reliability, 0);
  const weightBudget = signalBlend.reduce((sum, item) => sum + item.baseWeight, 0) || 1;
  const raw =
    weightedCoverage > 0
      ? signalBlend.reduce(
          (sum, item) => sum + item.score * ((item.baseWeight * item.reliability) / weightedCoverage),
          0,
        )
      : 0;
  const coverageRatio = clamp(weightedCoverage / weightBudget, 0.12, 1);
  const freshnessScore =
    weightedCoverage > 0
      ? clamp(
          signalBlend.reduce((sum, item) => sum + item.freshness * item.baseWeight * item.reliability, 0) / weightedCoverage,
          0,
          1,
        )
      : 0;
  const positivePressure = signalBlend.reduce(
    (sum, item) => sum + Math.max(item.score, 0) * item.baseWeight * item.reliability,
    0,
  );
  const negativePressure = signalBlend.reduce(
    (sum, item) => sum + Math.max(-item.score, 0) * item.baseWeight * item.reliability,
    0,
  );
  const disagreementRatio =
    Math.max(positivePressure, negativePressure) > 0
      ? Math.min(positivePressure, negativePressure) / Math.max(positivePressure, negativePressure)
      : 0;
  const disagreementPenalty = 1 - disagreementRatio * 0.4;

  const patterns = detectPatterns({
    symbol,
    assetType: inferredAssetType,
    flow,
    dark,
    crypto,
    news,
  });

  const adaptive = getAdaptivePatternWeighting({ patterns, horizon });
  const adaptivePatterns = patterns.map((pattern) => {
    const stat = adaptive.patterns.find((item) => item.id === pattern.id);
    return {
      ...pattern,
      adaptiveMultiplier: stat ? Number.parseFloat(stat.multiplier.toFixed(4)) : 1,
      adaptiveStatus: stat?.status || "neutral",
      strength: toPct(pattern.strength * (stat?.multiplier || 1)),
    };
  });

  const sampleCount = flow.samples + dark.samples + crypto.samples + news.samples;
  const sampleDepth = clamp(sampleCount / 16, 0.18, 1);
  const sampleReliability = clamp(sampleDepth * 0.5 + coverageRatio * 0.25 + freshnessScore * 0.25, 0.18, 1);
  const adaptiveBase = clamp(raw * disagreementPenalty + adaptive.netLongDelta * 2.2, -1, 1);
  const curveStrength = 2 + coverageRatio * 0.45 + freshnessScore * 0.35;
  const calibrated = sigmoid(adaptiveBase * curveStrength) * sampleReliability + 0.5 * (1 - sampleReliability);
  const adjustment = getCalibrationAdjustment({
    symbol,
    horizon,
    longProbability: calibrated,
  });
  const policyLong = shapeProbabilityByPolicy({
    longProbability: adjustment.calibratedLongProbability,
    policy: resolvedPolicy.applied,
  });
  const longProbability = toPct(policyLong);
  const shortProbability = toPct(1 - policyLong);
  const confidence = toPct(Math.max(longProbability, shortProbability));
  const bias: ProbabilityDirection = longProbability >= shortProbability ? "long" : "short";

  const drivers: ProbabilityDriver[] = [
    {
      label: "Options Flow Pressure",
      value: toPct((flow.score + 1) / 2),
      polarity: flow.score > 0.08 ? "bullish" : flow.score < -0.08 ? "bearish" : "neutral",
      detail: flow.detail,
    },
    {
      label: "Dark Pool Imbalance",
      value: toPct((dark.score + 1) / 2),
      polarity: dark.score > 0.08 ? "bullish" : dark.score < -0.08 ? "bearish" : "neutral",
      detail: dark.detail,
    },
    {
      label: "Cross-Venue Crypto Pressure",
      value: toPct((crypto.score + 1) / 2),
      polarity: crypto.score > 0.08 ? "bullish" : crypto.score < -0.08 ? "bearish" : "neutral",
      detail: crypto.detail,
    },
    {
      label: "Macro & Catalyst Context",
      value: toPct((news.score + 1) / 2),
      polarity: news.score > 0.08 ? "bullish" : news.score < -0.08 ? "bearish" : "neutral",
      detail: news.detail,
    },
  ];

  const generatedAt = new Date().toISOString();
  const forecast = recordProbabilityForecast({
    symbol,
    horizon,
    providerMode: snapshot.status.simulated ? "simulated" : "live",
    longProbability,
    shortProbability,
    confidence,
    bias,
    patterns: adaptivePatterns,
    generatedAt,
  });

  const scenario: ProbabilityScenario = {
    symbol,
    assetType: inferredAssetType,
    horizon,
    longProbability,
    shortProbability,
    confidence,
    bias,
    drivers,
    patterns: adaptivePatterns,
    generatedAt,
    providerMode: snapshot.status.simulated ? "simulated" : "live",
    qualityBand: toQualityBand(confidence),
    calibration: {
      rawLongProbability: toPct(calibrated),
      delta: Number.parseFloat(adjustment.delta.toFixed(4)),
      sampleCount: adjustment.sampleCount,
      applied: adjustment.applied,
      reason: adjustment.reason,
    },
    adaptation: {
      netLongDelta: Number.parseFloat(adaptive.netLongDelta.toFixed(4)),
      promotedCount: adaptive.promotedCount,
      demotedCount: adaptive.demotedCount,
      halfLifeMinutes: adaptive.halfLifeMinutes,
      cooldownHalfLifeMinutes: adaptive.cooldownHalfLifeMinutes,
    },
    policy: {
      requested: resolvedPolicy.requested,
      applied: resolvedPolicy.applied,
      rationale: resolvedPolicy.rationale,
      impactDelta: Number.parseFloat((policyLong - adjustment.calibratedLongProbability).toFixed(4)),
      selectionBasis: resolvedPolicy.selectionBasis,
      selectorConfidence: resolvedPolicy.selectorConfidence,
      selectorSampleCount: resolvedPolicy.selectorSampleCount,
      selectorScoreEdge: resolvedPolicy.selectorScoreEdge,
      hysteresisLocked: resolvedPolicy.hysteresisLocked,
      hysteresisSwitched: resolvedPolicy.hysteresisSwitched,
      hysteresisHoldSecondsRemaining: resolvedPolicy.hysteresisHoldSecondsRemaining,
      previousAutoPolicy: resolvedPolicy.previousAutoPolicy,
      dynamicMinSwitchEdge: resolvedPolicy.dynamicMinSwitchEdge,
      dynamicMinSwitchConfidence: resolvedPolicy.dynamicMinSwitchConfidence,
      selectorVolatility: resolvedPolicy.selectorVolatility,
      selectorHitRateDispersion: resolvedPolicy.selectorHitRateDispersion,
      warmupActive: resolvedPolicy.warmupActive,
      warmupMinMatches: resolvedPolicy.warmupMinMatches,
      warmupMatchesGained: resolvedPolicy.warmupMatchesGained,
      warmupMatchesRemaining: resolvedPolicy.warmupMatchesRemaining,
    },
    forecastId: forecast.id,
  };

  return scenario;
}

export async function buildTopProbabilitySetups(input?: {
  horizon?: "scalp" | "intraday" | "swing";
  limit?: number;
  policy?: ProbabilityPolicyProfile;
  profileKey?: string;
}) {
  const snapshot = await getIntelligenceSnapshot();
  const horizon = input?.horizon || "intraday";
  const limit = Math.min(12, Math.max(1, Math.floor(input?.limit || 6)));
  const healthSnapshot = getProbabilityCalibrationSummary().health;

  const symbolSet = new Set<string>();
  for (const row of snapshot.flowTape.slice(0, 30)) {
    symbolSet.add(row.symbol);
  }
  for (const row of snapshot.darkPoolTape.slice(0, 30)) {
    symbolSet.add(row.symbol);
  }
  for (const row of snapshot.cryptoTape.slice(0, 30)) {
    symbolSet.add(normalizeSymbol(row.pair.split("/")[0] || ""));
  }

  const symbols = Array.from(symbolSet).filter(Boolean).slice(0, 20);
  const scenarios = await Promise.all(
    symbols.map((symbol) =>
      buildProbabilityScenario({
        symbol,
        horizon,
        policy: input?.policy,
        profileKey: input?.profileKey,
        healthSnapshot,
      })
    ),
  );

  return scenarios
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
