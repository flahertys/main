import { sanitizePlainText } from "@/lib/security";

type ProbabilityHorizon = "scalp" | "intraday" | "swing";
type ProbabilityDirection = "long" | "short";

type ForecastPattern = {
  id: string;
  title: string;
  direction: ProbabilityDirection;
  strength: number;
};

type ProbabilityForecast = {
  id: string;
  symbol: string;
  horizon: ProbabilityHorizon;
  generatedAt: string;
  providerMode: "live" | "simulated";
  longProbability: number;
  shortProbability: number;
  confidence: number;
  bias: ProbabilityDirection;
  patterns: ForecastPattern[];
  fingerprint: string;
};

type ProbabilityOutcome = {
  id: string;
  forecastId: string;
  symbol: string;
  horizon: ProbabilityHorizon;
  realizedDirection: ProbabilityDirection;
  realizedReturnPct?: number;
  realizedAt: string;
  recordedAt: string;
};

type CalibrationStore = {
  forecasts: Map<string, ProbabilityForecast>;
  outcomes: Map<string, ProbabilityOutcome>;
  forecastByFingerprint: Map<string, string>;
};

export type ProbabilityCalibrationAdjustment = {
  calibratedLongProbability: number;
  delta: number;
  sampleCount: number;
  applied: boolean;
  reason: string;
};

export type ProbabilityCalibrationSummary = {
  generatedAt: string;
  totals: {
    forecasts: number;
    outcomes: number;
    resolved: number;
  };
  metrics: {
    brierScore: number;
    logLoss: number;
    directionalHitRate: number;
    confidenceDrift: number;
  };
  byHorizon: Array<{
    horizon: ProbabilityHorizon;
    resolved: number;
    hitRate: number;
    brierScore: number;
    avgConfidence: number;
  }>;
  decay: {
    estimatedHalfLifeMinutes: number;
  };
  patternPerformance: Array<{
    id: string;
    title: string;
    occurrences: number;
    hitRate: number;
    avgStrength: number;
    expectancy: number;
  }>;
  health: {
    score: number;
    status: "healthy" | "watch" | "critical";
    alerts: Array<{
      id: string;
      severity: "info" | "warning" | "critical";
      title: string;
      detail: string;
    }>;
    recommendations: Array<{
      id: string;
      priority: "low" | "medium" | "high";
      action: string;
      rationale: string;
    }>;
  };
};

export type ProbabilityAdaptivePattern = {
  id: string;
  title: string;
  occurrences: number;
  weightedOccurrences: number;
  hitRate: number;
  expectancy: number;
  multiplier: number;
  reversion: number;
  minutesSinceLast: number;
  status: "promoted" | "neutral" | "demoted";
};

export type ProbabilityAdaptiveWeighting = {
  patterns: ProbabilityAdaptivePattern[];
  netLongDelta: number;
  promotedCount: number;
  demotedCount: number;
  halfLifeMinutes: number;
  cooldownHalfLifeMinutes: number;
};

export type ResolvedProbabilityOutcomeRecord = {
  forecastId: string;
  symbol: string;
  horizon: ProbabilityHorizon;
  generatedAt: string;
  providerMode: "live" | "simulated";
  forecastBias: ProbabilityDirection;
  forecastLongProbability: number;
  forecastConfidence: number;
  realizedDirection: ProbabilityDirection;
  realizedReturnPct?: number;
  realizedAt: string;
  recordedAt: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nowIso() {
  return new Date().toISOString();
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_PROBABILITY_CALIBRATION__?: CalibrationStore;
  };

  if (!globalRef.__TRADEHAX_PROBABILITY_CALIBRATION__) {
    globalRef.__TRADEHAX_PROBABILITY_CALIBRATION__ = {
      forecasts: new Map(),
      outcomes: new Map(),
      forecastByFingerprint: new Map(),
    };
  }

  return globalRef.__TRADEHAX_PROBABILITY_CALIBRATION__;
}

function normalizeSymbol(value: unknown) {
  return sanitizePlainText(String(value || ""), 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function toHorizon(value: unknown): ProbabilityHorizon {
  const normalized = sanitizePlainText(String(value || ""), 20).toLowerCase();
  if (normalized === "scalp" || normalized === "swing") {
    return normalized;
  }
  return "intraday";
}

function toDirection(value: unknown): ProbabilityDirection {
  const normalized = sanitizePlainText(String(value || ""), 10).toLowerCase();
  return normalized === "short" ? "short" : "long";
}

function toProbability(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 0, 1);
}

function resolvedPairs() {
  const store = getStore();
  const pairs: Array<{ forecast: ProbabilityForecast; outcome: ProbabilityOutcome }> = [];
  for (const outcome of store.outcomes.values()) {
    const forecast = store.forecasts.get(outcome.forecastId);
    if (!forecast) continue;
    pairs.push({ forecast, outcome });
  }
  return pairs;
}

function brier(predLong: number, realizedLong: 0 | 1) {
  const error = predLong - realizedLong;
  return error * error;
}

function logLoss(predLong: number, realizedLong: 0 | 1) {
  const eps = 1e-6;
  const p = clamp(predLong, eps, 1 - eps);
  return -(realizedLong * Math.log(p) + (1 - realizedLong) * Math.log(1 - p));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function parseIsoMs(value: string) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : Date.now();
}

function computeHalfLifeMinutes(pairs: Array<{ forecast: ProbabilityForecast; outcome: ProbabilityOutcome }>) {
  if (pairs.length < 20) return 0;

  const bins = [0, 15, 30, 60, 120, 240, 480];
  const grouped = bins.slice(0, -1).map((start, index) => ({
    start,
    end: bins[index + 1] as number,
    hits: 0,
    total: 0,
  }));

  for (const pair of pairs) {
    const ageMinutes = Math.max(0, (parseIsoMs(pair.outcome.realizedAt) - parseIsoMs(pair.forecast.generatedAt)) / 60_000);
    const hit = pair.forecast.bias === pair.outcome.realizedDirection ? 1 : 0;
    const bucket = grouped.find((row) => ageMinutes >= row.start && ageMinutes < row.end);
    if (!bucket) continue;
    bucket.total += 1;
    bucket.hits += hit;
  }

  const first = grouped.find((row) => row.total >= 5);
  if (!first) return 0;
  const initialRate = first.hits / first.total;
  if (initialRate <= 0.05) return 0;
  const halfTarget = initialRate / 2;

  for (const bucket of grouped) {
    if (bucket.total < 5) continue;
    const rate = bucket.hits / bucket.total;
    if (rate <= halfTarget) {
      return bucket.end;
    }
  }

  return bins[bins.length - 1] as number;
}

function computePatternStats(pairs: Array<{ forecast: ProbabilityForecast; outcome: ProbabilityOutcome }>) {
  const patternStats = new Map<string, {
    id: string;
    title: string;
    occurrences: number;
    hits: number;
    strengthSum: number;
    expectancySum: number;
  }>();

  for (const pair of pairs) {
    for (const pattern of pair.forecast.patterns) {
      const key = pattern.id;
      const hit = pattern.direction === pair.outcome.realizedDirection ? 1 : 0;
      const expectancy = typeof pair.outcome.realizedReturnPct === "number"
        ? (hit ? pair.outcome.realizedReturnPct : -Math.abs(pair.outcome.realizedReturnPct))
        : hit;

      const current = patternStats.get(key) || {
        id: pattern.id,
        title: pattern.title,
        occurrences: 0,
        hits: 0,
        strengthSum: 0,
        expectancySum: 0,
      };

      current.occurrences += 1;
      current.hits += hit;
      current.strengthSum += pattern.strength;
      current.expectancySum += expectancy;
      patternStats.set(key, current);
    }
  }

  return patternStats;
}

function deriveCalibrationHealth(input: {
  resolved: number;
  metrics: {
    brierScore: number;
    directionalHitRate: number;
    confidenceDrift: number;
  };
  halfLifeMinutes: number;
  patternPerformance: Array<{
    occurrences: number;
    hitRate: number;
    expectancy: number;
    title: string;
  }>;
}) {
  const alerts: Array<{
    id: string;
    severity: "info" | "warning" | "critical";
    title: string;
    detail: string;
  }> = [];

  if (input.resolved < 20) {
    alerts.push({
      id: "low_sample_size",
      severity: "info",
      title: "Limited outcome sample",
      detail: "Calibration has low sample coverage; confidence in drift diagnostics is still maturing.",
    });
  }

  const driftAbs = Math.abs(input.metrics.confidenceDrift);
  if (input.resolved >= 20 && driftAbs >= 0.2) {
    alerts.push({
      id: "confidence_drift_critical",
      severity: "critical",
      title: "Severe confidence drift",
      detail: "Forecast probabilities are materially miscalibrated versus realized outcomes.",
    });
  } else if (input.resolved >= 20 && driftAbs >= 0.12) {
    alerts.push({
      id: "confidence_drift_watch",
      severity: "warning",
      title: "Confidence drift elevated",
      detail: "Calibration drift is rising and should be monitored for re-weighting adjustments.",
    });
  }

  if (input.resolved >= 30 && input.metrics.directionalHitRate <= 0.46) {
    alerts.push({
      id: "directional_edge_critical",
      severity: "critical",
      title: "Directional edge degraded",
      detail: "Directional hit rate is underperforming materially below breakeven thresholds.",
    });
  } else if (input.resolved >= 30 && input.metrics.directionalHitRate <= 0.5) {
    alerts.push({
      id: "directional_edge_watch",
      severity: "warning",
      title: "Directional edge weakening",
      detail: "Directional edge has softened and may require pattern/driver rebalance.",
    });
  }

  if (input.resolved >= 20 && input.metrics.brierScore >= 0.34) {
    alerts.push({
      id: "brier_critical",
      severity: "critical",
      title: "Probability quality degraded",
      detail: "Brier score indicates low probability quality and poor calibration sharpness.",
    });
  } else if (input.resolved >= 20 && input.metrics.brierScore >= 0.28) {
    alerts.push({
      id: "brier_watch",
      severity: "warning",
      title: "Probability quality slipping",
      detail: "Brier score has moved into a weaker range; monitor model confidence discipline.",
    });
  }

  if (input.resolved >= 20 && input.halfLifeMinutes > 0 && input.halfLifeMinutes < 45) {
    alerts.push({
      id: "signal_decay_fast",
      severity: "warning",
      title: "Signal decay is fast",
      detail: "Predictive edge decays quickly; favor shorter execution windows and tighter latency budgets.",
    });
  }

  const weakPatterns = input.patternPerformance.filter((item) => item.occurrences >= 8 && item.hitRate < 0.45);
  if (weakPatterns.length >= 2) {
    alerts.push({
      id: "pattern_set_degraded",
      severity: "warning",
      title: "Pattern set degradation",
      detail: `Multiple mature patterns are underperforming (e.g., ${weakPatterns[0]?.title || "top pattern"}).`,
    });
  }

  let score = 100;
  for (const alert of alerts) {
    if (alert.severity === "critical") score -= 30;
    else if (alert.severity === "warning") score -= 15;
    else score -= 5;
  }
  score = clamp(score, 0, 100);

  const status: "healthy" | "watch" | "critical" = score >= 75 ? "healthy" : score >= 50 ? "watch" : "critical";

  const recommendations = new Map<string, {
    id: string;
    priority: "low" | "medium" | "high";
    action: string;
    rationale: string;
  }>();

  const addRecommendation = (item: {
    id: string;
    priority: "low" | "medium" | "high";
    action: string;
    rationale: string;
  }) => {
    const existing = recommendations.get(item.id);
    if (!existing) {
      recommendations.set(item.id, item);
      return;
    }
    const rank = { low: 1, medium: 2, high: 3 } as const;
    if (rank[item.priority] > rank[existing.priority]) {
      recommendations.set(item.id, item);
    }
  };

  for (const alert of alerts) {
    if (alert.id === "confidence_drift_critical" || alert.id === "confidence_drift_watch") {
      addRecommendation({
        id: "recalibrate_confidence",
        priority: alert.severity === "critical" ? "high" : "medium",
        action: "Tighten confidence scaling and increase calibration weight.",
        rationale: "Drift indicates probability outputs are over/under-confident versus realized outcomes.",
      });
    }

    if (alert.id === "directional_edge_critical" || alert.id === "directional_edge_watch") {
      addRecommendation({
        id: "reduce_directional_risk",
        priority: alert.severity === "critical" ? "high" : "medium",
        action: "Reduce directional sizing or require stronger confluence before execution.",
        rationale: "Directional hit-rate degradation implies weaker edge persistence.",
      });
    }

    if (alert.id === "brier_critical" || alert.id === "brier_watch") {
      addRecommendation({
        id: "cap_probability_extremes",
        priority: alert.severity === "critical" ? "high" : "medium",
        action: "Clamp extreme probability outputs and favor mid-confidence regimes.",
        rationale: "Poor Brier quality suggests low calibration sharpness and potential overfitting.",
      });
    }

    if (alert.id === "signal_decay_fast") {
      addRecommendation({
        id: "shorten_execution_window",
        priority: "medium",
        action: "Shorten signal TTL and prioritize low-latency execution windows.",
        rationale: "Fast half-life means edge decays quickly after signal generation.",
      });
    }

    if (alert.id === "pattern_set_degraded") {
      addRecommendation({
        id: "demote_weak_patterns",
        priority: "medium",
        action: "Demote weak mature patterns and increase minimum weighted-occurrence thresholds.",
        rationale: "Several mature patterns are underperforming and should contribute less to final bias.",
      });
    }

    if (alert.id === "low_sample_size") {
      addRecommendation({
        id: "collect_more_outcomes",
        priority: "low",
        action: "Accumulate more resolved outcomes before tightening adaptive multipliers.",
        rationale: "Sample depth is currently too shallow for aggressive adaptation.",
      });
    }
  }

  if (alerts.length === 0) {
    addRecommendation({
      id: "maintain_current_policy",
      priority: "low",
      action: "Maintain current calibration policy and continue monitoring rolling diagnostics.",
      rationale: "No significant calibration risks are currently detected.",
    });
  }

  if (status === "critical") {
    addRecommendation({
      id: "activate_defensive_mode",
      priority: "high",
      action: "Activate defensive mode: lower risk budgets and require stricter confirmation gates.",
      rationale: "Overall calibration health is critical and requires risk containment.",
    });
  }

  return {
    score,
    status,
    alerts,
    recommendations: Array.from(recommendations.values()).sort((a, b) => {
      const rank = { low: 1, medium: 2, high: 3 } as const;
      return rank[b.priority] - rank[a.priority];
    }),
  };
}

export function getAdaptivePatternWeighting(input: {
  patterns: Array<{ id: string; title: string; direction: ProbabilityDirection; strength: number }>;
  horizon?: ProbabilityHorizon;
}): ProbabilityAdaptiveWeighting {
  const nowMs = Date.now();
  const horizon = toHorizon(input.horizon);
  const halfLifeMinutes = horizon === "scalp" ? 240 : horizon === "swing" ? 4_320 : 1_440;
  const cooldownHalfLifeMinutes = horizon === "scalp" ? 180 : horizon === "swing" ? 2_880 : 960;
  const pairs = resolvedPairs();
  const patternStats = computePatternStats(pairs);

  const weightedStats = new Map<string, {
    weightedOccurrences: number;
    weightedHits: number;
    weightedExpectancy: number;
    latestMs: number;
  }>();

  for (const pair of pairs) {
    const realizedMs = parseIsoMs(pair.outcome.realizedAt);
    const ageMinutes = Math.max(0, (nowMs - realizedMs) / 60_000);
    const recencyWeight = clamp(Math.pow(0.5, ageMinutes / halfLifeMinutes), 0.08, 1);

    for (const pattern of pair.forecast.patterns) {
      const hit = pattern.direction === pair.outcome.realizedDirection ? 1 : 0;
      const expectancy = typeof pair.outcome.realizedReturnPct === "number"
        ? (hit ? pair.outcome.realizedReturnPct : -Math.abs(pair.outcome.realizedReturnPct))
        : hit;

      const current = weightedStats.get(pattern.id) || {
        weightedOccurrences: 0,
        weightedHits: 0,
        weightedExpectancy: 0,
        latestMs: 0,
      };

      current.weightedOccurrences += recencyWeight;
      current.weightedHits += hit * recencyWeight;
      current.weightedExpectancy += expectancy * recencyWeight;
      if (realizedMs > current.latestMs) current.latestMs = realizedMs;
      weightedStats.set(pattern.id, current);
    }
  }

  let promotedCount = 0;
  let demotedCount = 0;
  let weightedDirectional = 0;
  let weightedBase = 0;

  const patterns: ProbabilityAdaptivePattern[] = input.patterns.map((pattern) => {
    const stats = patternStats.get(pattern.id);
    const wStats = weightedStats.get(pattern.id);
    const weightedOccurrences = wStats?.weightedOccurrences || 0;
    const minutesSinceLast = wStats?.latestMs ? Math.max(0, (nowMs - wStats.latestMs) / 60_000) : Number.POSITIVE_INFINITY;

    if (!stats || stats.occurrences < 8 || weightedOccurrences < 4) {
      weightedBase += pattern.strength;
      return {
        id: pattern.id,
        title: pattern.title,
        occurrences: stats?.occurrences || 0,
        weightedOccurrences: Number.parseFloat(weightedOccurrences.toFixed(3)),
        hitRate: wStats && weightedOccurrences > 0 ? wStats.weightedHits / weightedOccurrences : 0,
        expectancy: wStats && weightedOccurrences > 0 ? wStats.weightedExpectancy / weightedOccurrences : 0,
        multiplier: 1,
        reversion: 1,
        minutesSinceLast: Number.isFinite(minutesSinceLast) ? Number.parseFloat(minutesSinceLast.toFixed(1)) : 0,
        status: "neutral",
      };
    }

    const hitRate = wStats && weightedOccurrences > 0 ? wStats.weightedHits / weightedOccurrences : 0.5;
    const expectancy = wStats && weightedOccurrences > 0 ? wStats.weightedExpectancy / weightedOccurrences : 0;
    const hitEdge = (hitRate - 0.5) * 2;
    const expectancyEdge = clamp(expectancy / 2, -1, 1);
    const rawMultiplier = clamp(1 + hitEdge * 0.22 + expectancyEdge * 0.12, 0.72, 1.3);
    const reversion = clamp(Math.pow(0.5, minutesSinceLast / cooldownHalfLifeMinutes), 0, 1);
    const multiplier = clamp(1 + (rawMultiplier - 1) * reversion, 0.84, 1.2);
    const status: "promoted" | "neutral" | "demoted" = multiplier > 1.05
      ? "promoted"
      : multiplier < 0.95
        ? "demoted"
        : "neutral";

    if (status === "promoted") promotedCount += 1;
    if (status === "demoted") demotedCount += 1;

    const directionSign = pattern.direction === "long" ? 1 : -1;
    weightedDirectional += directionSign * pattern.strength * (multiplier - 1);
    weightedBase += pattern.strength;

    return {
      id: pattern.id,
      title: pattern.title,
      occurrences: stats.occurrences,
      weightedOccurrences: Number.parseFloat(weightedOccurrences.toFixed(3)),
      hitRate,
      expectancy,
      multiplier,
      reversion: Number.parseFloat(reversion.toFixed(4)),
      minutesSinceLast: Number.isFinite(minutesSinceLast) ? Number.parseFloat(minutesSinceLast.toFixed(1)) : 0,
      status,
    };
  });

  const directionalRatio = weightedBase > 0 ? weightedDirectional / weightedBase : 0;
  const netLongDelta = clamp(directionalRatio * 0.06, -0.05, 0.05);

  return {
    patterns,
    netLongDelta,
    promotedCount,
    demotedCount,
    halfLifeMinutes,
    cooldownHalfLifeMinutes,
  };
}

export function recordProbabilityForecast(input: {
  symbol: string;
  horizon: ProbabilityHorizon;
  providerMode: "live" | "simulated";
  longProbability: number;
  shortProbability: number;
  confidence: number;
  bias: ProbabilityDirection;
  patterns: ForecastPattern[];
  generatedAt?: string;
}) {
  const store = getStore();
  const symbol = normalizeSymbol(input.symbol);
  const horizon = toHorizon(input.horizon);
  const generatedAt = input.generatedAt || nowIso();
  const minuteBucket = generatedAt.slice(0, 16);
  const fingerprint = `${symbol}:${horizon}:${input.providerMode}:${minuteBucket}`;

  const existingId = store.forecastByFingerprint.get(fingerprint);
  if (existingId) {
    const existing = store.forecasts.get(existingId);
    if (existing) return existing;
  }

  const forecast: ProbabilityForecast = {
    id: `pf_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    symbol,
    horizon,
    generatedAt,
    providerMode: input.providerMode,
    longProbability: toProbability(input.longProbability, 0.5),
    shortProbability: toProbability(input.shortProbability, 0.5),
    confidence: toProbability(input.confidence, 0.5),
    bias: toDirection(input.bias),
    patterns: Array.isArray(input.patterns)
      ? input.patterns
          .map((item) => ({
            id: sanitizePlainText(String(item.id || ""), 80),
            title: sanitizePlainText(String(item.title || ""), 120),
            direction: toDirection(item.direction),
            strength: toProbability(item.strength, 0.5),
          }))
          .filter((item) => item.id)
          .slice(0, 10)
      : [],
    fingerprint,
  };

  store.forecasts.set(forecast.id, forecast);
  store.forecastByFingerprint.set(fingerprint, forecast.id);

  if (store.forecasts.size > 8_000) {
    const oldestKey = store.forecasts.keys().next().value;
    if (oldestKey) {
      const oldForecast = store.forecasts.get(oldestKey);
      if (oldForecast) {
        store.forecastByFingerprint.delete(oldForecast.fingerprint);
      }
      store.forecasts.delete(oldestKey);
    }
  }

  return forecast;
}

export function recordProbabilityOutcome(input: {
  forecastId?: string;
  symbol?: string;
  horizon?: ProbabilityHorizon;
  realizedDirection: ProbabilityDirection;
  realizedReturnPct?: number;
  realizedAt?: string;
}) {
  const store = getStore();
  let forecast: ProbabilityForecast | undefined;

  if (input.forecastId) {
    forecast = store.forecasts.get(input.forecastId);
  }

  if (!forecast && input.symbol) {
    const symbol = normalizeSymbol(input.symbol);
    const horizon = input.horizon ? toHorizon(input.horizon) : undefined;
    const candidates = Array.from(store.forecasts.values())
      .filter((item) => item.symbol === symbol && (horizon ? item.horizon === horizon : true))
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    forecast = candidates[0];
  }

  if (!forecast) {
    throw new Error("Forecast not found for outcome recording.");
  }

  const outcome: ProbabilityOutcome = {
    id: `po_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    forecastId: forecast.id,
    symbol: forecast.symbol,
    horizon: forecast.horizon,
    realizedDirection: toDirection(input.realizedDirection),
    realizedReturnPct:
      typeof input.realizedReturnPct === "number" && Number.isFinite(input.realizedReturnPct)
        ? input.realizedReturnPct
        : undefined,
    realizedAt: input.realizedAt || nowIso(),
    recordedAt: nowIso(),
  };

  store.outcomes.set(outcome.id, outcome);
  if (store.outcomes.size > 8_000) {
    const oldestKey = store.outcomes.keys().next().value;
    if (oldestKey) store.outcomes.delete(oldestKey);
  }

  return {
    forecast,
    outcome,
  };
}

export function getCalibrationAdjustment(input: {
  symbol: string;
  horizon: ProbabilityHorizon;
  longProbability: number;
}) {
  const symbol = normalizeSymbol(input.symbol);
  const horizon = toHorizon(input.horizon);
  const longProbability = toProbability(input.longProbability, 0.5);

  const pairs = resolvedPairs().filter(
    (pair) => pair.forecast.symbol === symbol && pair.forecast.horizon === horizon,
  );

  if (pairs.length < 12) {
    return {
      calibratedLongProbability: longProbability,
      delta: 0,
      sampleCount: pairs.length,
      applied: false,
      reason: "insufficient_samples",
    } satisfies ProbabilityCalibrationAdjustment;
  }

  const bin = Math.floor(clamp(longProbability, 0, 0.9999) * 10);
  const lower = bin / 10;
  const upper = lower + 0.1;

  const inBin = pairs.filter((pair) => pair.forecast.longProbability >= lower && pair.forecast.longProbability < upper);
  if (inBin.length < 6) {
    return {
      calibratedLongProbability: longProbability,
      delta: 0,
      sampleCount: pairs.length,
      applied: false,
      reason: "insufficient_bin_samples",
    } satisfies ProbabilityCalibrationAdjustment;
  }

  const avgPred = average(inBin.map((pair) => pair.forecast.longProbability));
  const empirical = average(inBin.map((pair) => (pair.outcome.realizedDirection === "long" ? 1 : 0)));
  const drift = empirical - avgPred;
  const delta = clamp(drift * 0.35, -0.08, 0.08);
  const calibratedLongProbability = clamp(longProbability + delta, 0.02, 0.98);

  return {
    calibratedLongProbability,
    delta,
    sampleCount: pairs.length,
    applied: true,
    reason: "bin_empirical_adjustment",
  } satisfies ProbabilityCalibrationAdjustment;
}

export function getProbabilityCalibrationSummary(): ProbabilityCalibrationSummary {
  const store = getStore();
  const pairs = resolvedPairs();
  const resolved = pairs.length;

  const brierScore = resolved > 0
    ? average(
        pairs.map((pair) => brier(pair.forecast.longProbability, pair.outcome.realizedDirection === "long" ? 1 : 0)),
      )
    : 0;
  const logLossValue = resolved > 0
    ? average(
        pairs.map((pair) => logLoss(pair.forecast.longProbability, pair.outcome.realizedDirection === "long" ? 1 : 0)),
      )
    : 0;
  const directionalHitRate = resolved > 0
    ? average(pairs.map((pair) => (pair.forecast.bias === pair.outcome.realizedDirection ? 1 : 0)))
    : 0;
  const confidenceDrift = resolved > 0
    ? average(
        pairs.map((pair) => {
          const realized = pair.outcome.realizedDirection === "long" ? 1 : 0;
          return pair.forecast.longProbability - realized;
        }),
      )
    : 0;

  const horizons: ProbabilityHorizon[] = ["scalp", "intraday", "swing"];
  const byHorizon = horizons.map((horizon) => {
    const scoped = pairs.filter((pair) => pair.forecast.horizon === horizon);
    const count = scoped.length;
    return {
      horizon,
      resolved: count,
      hitRate: count > 0 ? average(scoped.map((pair) => (pair.forecast.bias === pair.outcome.realizedDirection ? 1 : 0))) : 0,
      brierScore:
        count > 0
          ? average(
              scoped.map((pair) => brier(pair.forecast.longProbability, pair.outcome.realizedDirection === "long" ? 1 : 0)),
            )
          : 0,
      avgConfidence: count > 0 ? average(scoped.map((pair) => pair.forecast.confidence)) : 0,
    };
  });

  const patternStats = computePatternStats(pairs);

  const patternPerformance = Array.from(patternStats.values())
    .map((item) => ({
      id: item.id,
      title: item.title,
      occurrences: item.occurrences,
      hitRate: item.occurrences > 0 ? item.hits / item.occurrences : 0,
      avgStrength: item.occurrences > 0 ? item.strengthSum / item.occurrences : 0,
      expectancy: item.occurrences > 0 ? item.expectancySum / item.occurrences : 0,
    }))
    .sort((a, b) => b.hitRate - a.hitRate)
    .slice(0, 12);

  const halfLife = computeHalfLifeMinutes(pairs);
  const roundedMetrics = {
    brierScore: Number.parseFloat(brierScore.toFixed(4)),
    directionalHitRate: Number.parseFloat(directionalHitRate.toFixed(4)),
    confidenceDrift: Number.parseFloat(confidenceDrift.toFixed(4)),
  };
  const roundedPatternPerformance = patternPerformance.map((item) => ({
    ...item,
    hitRate: Number.parseFloat(item.hitRate.toFixed(4)),
    avgStrength: Number.parseFloat(item.avgStrength.toFixed(4)),
    expectancy: Number.parseFloat(item.expectancy.toFixed(4)),
  }));
  const health = deriveCalibrationHealth({
    resolved,
    metrics: roundedMetrics,
    halfLifeMinutes: halfLife,
    patternPerformance: roundedPatternPerformance,
  });

  return {
    generatedAt: nowIso(),
    totals: {
      forecasts: store.forecasts.size,
      outcomes: store.outcomes.size,
      resolved,
    },
    metrics: {
      brierScore: roundedMetrics.brierScore,
      logLoss: Number.parseFloat(logLossValue.toFixed(4)),
      directionalHitRate: roundedMetrics.directionalHitRate,
      confidenceDrift: roundedMetrics.confidenceDrift,
    },
    byHorizon: byHorizon.map((item) => ({
      ...item,
      hitRate: Number.parseFloat(item.hitRate.toFixed(4)),
      brierScore: Number.parseFloat(item.brierScore.toFixed(4)),
      avgConfidence: Number.parseFloat(item.avgConfidence.toFixed(4)),
    })),
    decay: {
      estimatedHalfLifeMinutes: halfLife,
    },
    patternPerformance: roundedPatternPerformance,
    health,
  };
}

export function listResolvedProbabilityOutcomes(options?: {
  limit?: number;
}) {
  const pairs = resolvedPairs();
  const limit = Math.max(1, Math.min(20_000, Math.floor(options?.limit || 10_000)));

  return pairs
    .slice(-limit)
    .map((pair) => ({
      forecastId: pair.forecast.id,
      symbol: pair.forecast.symbol,
      horizon: pair.forecast.horizon,
      generatedAt: pair.forecast.generatedAt,
      providerMode: pair.forecast.providerMode,
      forecastBias: pair.forecast.bias,
      forecastLongProbability: Number.parseFloat(pair.forecast.longProbability.toFixed(4)),
      forecastConfidence: Number.parseFloat(pair.forecast.confidence.toFixed(4)),
      realizedDirection: pair.outcome.realizedDirection,
      realizedReturnPct:
        typeof pair.outcome.realizedReturnPct === "number"
          ? Number.parseFloat(pair.outcome.realizedReturnPct.toFixed(4))
          : undefined,
      realizedAt: pair.outcome.realizedAt,
      recordedAt: pair.outcome.recordedAt,
    })) satisfies ResolvedProbabilityOutcomeRecord[];
}
