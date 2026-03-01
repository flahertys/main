import { sanitizePlainText } from "@/lib/security";
import type { ProbabilityDirection, ProbabilityPolicyProfile } from "@/lib/intelligence/probability-engine";
import { listResolvedProbabilityOutcomes } from "@/lib/intelligence/probability-calibration";

type PersistedPolicy = Exclude<ProbabilityPolicyProfile, "auto">;

type PolicyPreferenceRecord = {
  profileKey: string;
  policy: PersistedPolicy;
  updatedAt: string;
};

type PolicyDecisionRecord = {
  id: string;
  profileKey: string;
  requested: ProbabilityPolicyProfile;
  applied: PersistedPolicy;
  symbol: string;
  horizon: "scalp" | "intraday" | "swing";
  confidence: number;
  bias: ProbabilityDirection;
  impactDelta: number;
  forecastId?: string;
  generatedAt: string;
};

type PolicyStore = {
  preferences: Map<string, PolicyPreferenceRecord>;
  decisions: PolicyDecisionRecord[];
  autoSelectorState: Map<string, AutoSelectorStateRecord>;
  autoSwitchEvents: AutoPolicySwitchEventRecord[];
  autoSelectorConfig: Map<string, AutoSelectorConfigRecord>;
};

type AutoSelectorConfigRecord = {
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing" | "global";
  preset: AutoSelectorPreset;
  holdMinutes: number;
  minSwitchEdge: number;
  minSwitchConfidence: number;
  warmupMinMatches: number;
  updatedAt: string;
};

type AutoSelectorStateRecord = {
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing";
  policy: PersistedPolicy;
  updatedAt: string;
  holdUntil: string;
  switchCount: number;
  lastBasis: "attribution" | "health";
  lastConfidence: number;
  lastScoreEdge: number;
  warmupBaselineMatchedOutcomes: number;
  warmupMinMatches: number;
};

type AutoPolicySwitchEventRecord = {
  id: string;
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing";
  decision: "initialize" | "stay" | "hold" | "warmup" | "reject" | "switch";
  previousPolicy?: PersistedPolicy;
  recommendedPolicy: PersistedPolicy;
  appliedPolicy: PersistedPolicy;
  basis: "attribution" | "health";
  confidence: number;
  scoreEdge: number;
  minSwitchEdge: number;
  minSwitchConfidence: number;
  volatility: number;
  hitRateDispersion: number;
  warmupActive: boolean;
  warmupMinMatches: number;
  warmupMatchesGained: number;
  warmupMatchesRemaining: number;
  reason: string;
  occurredAt: string;
};

export type PolicyResolution = {
  policy: ProbabilityPolicyProfile;
  source: "explicit" | "stored" | "default";
};

export type ProbabilityPolicyAnalytics = {
  generatedAt: string;
  profileKey: string;
  preference: PolicyPreferenceRecord | null;
  totals: {
    decisions: number;
  };
  requestMix: Array<{ policy: ProbabilityPolicyProfile; count: number }>;
  appliedMix: Array<{ policy: PersistedPolicy; count: number }>;
  byHorizon: Array<{
    horizon: "scalp" | "intraday" | "swing";
    decisions: number;
    avgConfidence: number;
    longBiasRate: number;
    avgImpactDelta: number;
  }>;
  attribution: {
    matchedOutcomes: number;
    byAppliedPolicy: Array<{
      policy: PersistedPolicy;
      decisions: number;
      matchedOutcomes: number;
      hitRate: number;
      avgRealizedReturnPct: number;
      score: number;
    }>;
    byAppliedPolicyAndHorizon: Array<{
      horizon: "scalp" | "intraday" | "swing";
      policy: PersistedPolicy;
      decisions: number;
      matchedOutcomes: number;
      hitRate: number;
      avgRealizedReturnPct: number;
      score: number;
    }>;
    leaderboard: Array<{
      policy: PersistedPolicy;
      matchedOutcomes: number;
      hitRate: number;
      avgRealizedReturnPct: number;
      score: number;
    }>;
  };
  autoSelectorStates: Array<{
    horizon: "scalp" | "intraday" | "swing";
    policy: PersistedPolicy;
    updatedAt: string;
    holdUntil: string;
    holdSecondsRemaining: number;
    switchCount: number;
    lastBasis: "attribution" | "health";
    lastConfidence: number;
    lastScoreEdge: number;
    warmupActive: boolean;
    warmupMinMatches: number;
    warmupMatchesGained: number;
    warmupMatchesRemaining: number;
  }>;
};

export type AutoPolicyRecommendation = {
  policy: PersistedPolicy;
  basis: "attribution" | "health";
  confidence: number;
  matchedOutcomes: number;
  scoreEdge: number;
  horizon: "scalp" | "intraday" | "swing" | "global";
  reason: string;
};

export type AutoPolicyHysteresisResult = {
  policy: PersistedPolicy;
  switched: boolean;
  locked: boolean;
  previousPolicy?: PersistedPolicy;
  holdSecondsRemaining: number;
  minSwitchEdgeUsed: number;
  minSwitchConfidenceUsed: number;
  volatility: number;
  hitRateDispersion: number;
  warmupActive: boolean;
  warmupMinMatches: number;
  warmupMatchesGained: number;
  warmupMatchesRemaining: number;
  reason: string;
};

export type AutoPolicySwitchEvent = {
  id: string;
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing";
  decision: "initialize" | "stay" | "hold" | "warmup" | "reject" | "switch";
  previousPolicy?: PersistedPolicy;
  recommendedPolicy: PersistedPolicy;
  appliedPolicy: PersistedPolicy;
  basis: "attribution" | "health";
  confidence: number;
  scoreEdge: number;
  minSwitchEdge: number;
  minSwitchConfidence: number;
  volatility: number;
  hitRateDispersion: number;
  warmupActive: boolean;
  warmupMinMatches: number;
  warmupMatchesGained: number;
  warmupMatchesRemaining: number;
  reason: string;
  occurredAt: string;
};

export type AutoSelectorPreset =
  | "balanced"
  | "stabilize"
  | "discovery"
  | "scalp_tight"
  | "swing_stable";

export type AutoSelectorConfig = {
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing" | "global";
  preset: AutoSelectorPreset;
  holdMinutes: number;
  minSwitchEdge: number;
  minSwitchConfidence: number;
  warmupMinMatches: number;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stddev(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getDefaultHoldMinutes(horizon: "scalp" | "intraday" | "swing") {
  if (horizon === "scalp") return 20;
  if (horizon === "swing") return 360;
  return 90;
}

function getDefaultWarmupMatches(horizon: "scalp" | "intraday" | "swing") {
  if (horizon === "scalp") return 4;
  if (horizon === "swing") return 12;
  return 8;
}

function normalizePreset(value: unknown): AutoSelectorPreset {
  const normalized = sanitizePlainText(String(value || ""), 32).toLowerCase();
  if (
    normalized === "stabilize" ||
    normalized === "discovery" ||
    normalized === "scalp_tight" ||
    normalized === "swing_stable"
  ) {
    return normalized;
  }
  return "balanced";
}

function toPresetConfig(input: {
  preset: AutoSelectorPreset;
  horizon: "scalp" | "intraday" | "swing" | "global";
}) {
  const horizonDefault = input.horizon === "global" ? "intraday" : input.horizon;
  const base = {
    holdMinutes: getDefaultHoldMinutes(horizonDefault),
    minSwitchEdge: 0.05,
    minSwitchConfidence: 0.45,
    warmupMinMatches: getDefaultWarmupMatches(horizonDefault),
  };

  if (input.preset === "stabilize") {
    return {
      holdMinutes: Math.round(base.holdMinutes * 1.6),
      minSwitchEdge: 0.085,
      minSwitchConfidence: 0.62,
      warmupMinMatches: Math.round(base.warmupMinMatches * 1.75),
    };
  }

  if (input.preset === "discovery") {
    return {
      holdMinutes: Math.max(5, Math.round(base.holdMinutes * 0.55)),
      minSwitchEdge: 0.03,
      minSwitchConfidence: 0.34,
      warmupMinMatches: Math.max(2, Math.round(base.warmupMinMatches * 0.6)),
    };
  }

  if (input.preset === "scalp_tight") {
    return {
      holdMinutes: input.horizon === "scalp" ? 15 : base.holdMinutes,
      minSwitchEdge: input.horizon === "scalp" ? 0.07 : base.minSwitchEdge,
      minSwitchConfidence: input.horizon === "scalp" ? 0.58 : base.minSwitchConfidence,
      warmupMinMatches: input.horizon === "scalp" ? 7 : base.warmupMinMatches,
    };
  }

  if (input.preset === "swing_stable") {
    return {
      holdMinutes: input.horizon === "swing" ? 540 : base.holdMinutes,
      minSwitchEdge: input.horizon === "swing" ? 0.09 : base.minSwitchEdge,
      minSwitchConfidence: input.horizon === "swing" ? 0.66 : base.minSwitchConfidence,
      warmupMinMatches: input.horizon === "swing" ? 20 : base.warmupMinMatches,
    };
  }

  return base;
}

function toSelectorStateKey(profileKey: string, horizon: "scalp" | "intraday" | "swing") {
  return `${profileKey}:${horizon}`;
}

function toSwitchEventId() {
  return `pps_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function getDynamicSwitchThresholds(input: {
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing";
  baseEdge: number;
  baseConfidence: number;
}) {
  const analytics = getPolicyAnalytics({ profileKey: input.profileKey });
  const horizonRows = analytics.attribution.byAppliedPolicyAndHorizon
    .filter((row) => row.horizon === input.horizon && row.matchedOutcomes > 0);

  if (horizonRows.length <= 1) {
    return {
      edge: input.baseEdge,
      confidence: input.baseConfidence,
      volatility: 0,
      hitRateDispersion: 0,
    };
  }

  const realizedReturns = horizonRows.map((row) => row.avgRealizedReturnPct);
  const hitRates = horizonRows.map((row) => row.hitRate);
  const volatility = stddev(realizedReturns);
  const hitRateDispersion = stddev(hitRates);

  const volatilityNorm = clamp(volatility / 2.25, 0, 1);
  const ambiguityNorm = clamp(1 - hitRateDispersion / 0.22, 0, 1);

  const edge = clamp(input.baseEdge + volatilityNorm * 0.03 + ambiguityNorm * 0.02, 0.01, 0.28);
  const confidence = clamp(input.baseConfidence + volatilityNorm * 0.09 + ambiguityNorm * 0.05, 0.08, 0.995);

  return {
    edge: Number.parseFloat(edge.toFixed(4)),
    confidence: Number.parseFloat(confidence.toFixed(4)),
    volatility: Number.parseFloat(volatility.toFixed(4)),
    hitRateDispersion: Number.parseFloat(hitRateDispersion.toFixed(4)),
  };
}

function scorePolicyFromAttribution(input: {
  hitRate: number;
  avgRealizedReturnPct: number;
  matchedOutcomes: number;
}) {
  const hit = clamp(input.hitRate, 0, 1);
  const returnSignal = Math.tanh((input.avgRealizedReturnPct || 0) / 1.5);
  const returnComponent = (returnSignal + 1) / 2;
  const sampleConfidence = clamp(input.matchedOutcomes / 20, 0.2, 1);
  const blended = hit * 0.72 + returnComponent * 0.28;
  return Number.parseFloat((blended * sampleConfidence).toFixed(4));
}

function fallbackByHealth(health?: {
  status: "healthy" | "watch" | "critical";
  score: number;
}) {
  if (!health) {
    return {
      policy: "balanced" as const,
      basis: "health" as const,
      confidence: 0.35,
      reason: "No attribution signal available; defaulting to balanced profile.",
    };
  }

  if (health.status === "critical") {
    return {
      policy: "conservative" as const,
      basis: "health" as const,
      confidence: 0.9,
      reason: `Calibration health is critical (score ${health.score}), favoring conservative risk posture.`,
    };
  }

  if (health.status === "watch") {
    return {
      policy: "balanced" as const,
      basis: "health" as const,
      confidence: 0.7,
      reason: `Calibration health is watch (score ${health.score}), keeping balanced profile.`,
    };
  }

  return {
    policy: health.score >= 90 ? ("aggressive" as const) : ("balanced" as const),
    basis: "health" as const,
    confidence: clamp(health.score / 100, 0.45, 0.9),
    reason: `Attribution sample depth is insufficient; using health-guided profile from score ${health.score}.`,
  };
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_POLICY_STORE__?: PolicyStore;
  };

  if (!globalRef.__TRADEHAX_POLICY_STORE__) {
    globalRef.__TRADEHAX_POLICY_STORE__ = {
      preferences: new Map(),
      decisions: [],
      autoSelectorState: new Map(),
      autoSwitchEvents: [],
      autoSelectorConfig: new Map(),
    };
  }

  return globalRef.__TRADEHAX_POLICY_STORE__;
}

export function normalizePolicyProfileKey(value: unknown) {
  const normalized = sanitizePlainText(String(value || "default"), 64)
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "");
  return normalized || "default";
}

function toPersistedPolicy(value: unknown): PersistedPolicy {
  const normalized = sanitizePlainText(String(value || ""), 20).toLowerCase();
  if (normalized === "conservative" || normalized === "aggressive") {
    return normalized;
  }
  return "balanced";
}

function toPolicy(value: unknown): ProbabilityPolicyProfile {
  const normalized = sanitizePlainText(String(value || ""), 20).toLowerCase();
  if (normalized === "conservative" || normalized === "balanced" || normalized === "aggressive") {
    return normalized;
  }
  return "auto";
}

export function setStoredPolicyPreference(input: {
  profileKey: string;
  policy: PersistedPolicy;
}) {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input.profileKey);
  const record: PolicyPreferenceRecord = {
    profileKey,
    policy: toPersistedPolicy(input.policy),
    updatedAt: nowIso(),
  };

  store.preferences.set(profileKey, record);
  return record;
}

export function clearStoredPolicyPreference(profileKey: string) {
  const store = getStore();
  store.preferences.delete(normalizePolicyProfileKey(profileKey));
}

export function resolvePolicyPreference(input: {
  profileKey: string;
  explicitPolicy?: ProbabilityPolicyProfile;
}): PolicyResolution {
  const explicit = input.explicitPolicy ? toPolicy(input.explicitPolicy) : undefined;
  if (explicit && explicit !== "auto") {
    return {
      policy: explicit,
      source: "explicit",
    };
  }

  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input.profileKey);
  const preference = store.preferences.get(profileKey);
  if (preference) {
    return {
      policy: preference.policy,
      source: "stored",
    };
  }

  return {
    policy: explicit || "auto",
    source: "default",
  };
}

export function recordPolicyDecision(input: {
  profileKey: string;
  requested: ProbabilityPolicyProfile;
  applied: PersistedPolicy;
  symbol: string;
  horizon: "scalp" | "intraday" | "swing";
  confidence: number;
  bias: ProbabilityDirection;
  impactDelta: number;
  forecastId?: string;
  generatedAt?: string;
}) {
  const store = getStore();
  const row: PolicyDecisionRecord = {
    id: `ppd_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    profileKey: normalizePolicyProfileKey(input.profileKey),
    requested: toPolicy(input.requested),
    applied: toPersistedPolicy(input.applied),
    symbol: sanitizePlainText(String(input.symbol || ""), 20).toUpperCase().replace(/[^A-Z0-9]/g, ""),
    horizon: input.horizon,
    confidence: clamp(Number(input.confidence) || 0, 0, 1),
    bias: input.bias === "short" ? "short" : "long",
    impactDelta: clamp(Number(input.impactDelta) || 0, -1, 1),
    forecastId: sanitizePlainText(String(input.forecastId || ""), 120) || undefined,
    generatedAt: input.generatedAt || nowIso(),
  };

  store.decisions.push(row);
  if (store.decisions.length > 10_000) {
    store.decisions.splice(0, store.decisions.length - 10_000);
  }

  return row;
}

export function getPolicyAnalytics(input?: {
  profileKey?: string;
}): ProbabilityPolicyAnalytics {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input?.profileKey || "default");
  const preference = store.preferences.get(profileKey) || null;
  const rows = store.decisions.filter((row) => row.profileKey === profileKey);

  const requestCounts = new Map<ProbabilityPolicyProfile, number>();
  const appliedCounts = new Map<PersistedPolicy, number>();

  for (const row of rows) {
    requestCounts.set(row.requested, (requestCounts.get(row.requested) || 0) + 1);
    appliedCounts.set(row.applied, (appliedCounts.get(row.applied) || 0) + 1);
  }

  const horizons: Array<"scalp" | "intraday" | "swing"> = ["scalp", "intraday", "swing"];
  const byHorizon = horizons.map((horizon) => {
    const scoped = rows.filter((row) => row.horizon === horizon);
    const count = scoped.length;
    const avgConfidence = count > 0 ? scoped.reduce((acc, row) => acc + row.confidence, 0) / count : 0;
    const longBiasRate = count > 0 ? scoped.filter((row) => row.bias === "long").length / count : 0;
    const avgImpactDelta = count > 0 ? scoped.reduce((acc, row) => acc + row.impactDelta, 0) / count : 0;
    return {
      horizon,
      decisions: count,
      avgConfidence: Number.parseFloat(avgConfidence.toFixed(4)),
      longBiasRate: Number.parseFloat(longBiasRate.toFixed(4)),
      avgImpactDelta: Number.parseFloat(avgImpactDelta.toFixed(4)),
    };
  });

  const requestPolicies: ProbabilityPolicyProfile[] = ["auto", "conservative", "balanced", "aggressive"];
  const requestMix: ProbabilityPolicyAnalytics["requestMix"] = requestPolicies.map((policy) => ({
    policy,
    count: requestCounts.get(policy) || 0,
  }));

  const appliedPolicies: PersistedPolicy[] = ["conservative", "balanced", "aggressive"];
  const appliedMix: ProbabilityPolicyAnalytics["appliedMix"] = appliedPolicies.map((policy) => ({
    policy,
    count: appliedCounts.get(policy) || 0,
  }));

  const resolvedOutcomes = listResolvedProbabilityOutcomes({ limit: 20_000 });
  const outcomeByForecastId = new Map(resolvedOutcomes.map((row) => [row.forecastId, row]));
  const matchedRows = rows
    .map((row) => ({
      row,
      outcome: row.forecastId ? outcomeByForecastId.get(row.forecastId) : undefined,
    }))
    .filter((item) => Boolean(item.outcome));

  const byAppliedPolicy: ProbabilityPolicyAnalytics["attribution"]["byAppliedPolicy"] = appliedPolicies.map((policy) => {
    const scoped = rows.filter((row) => row.applied === policy);
    const scopedMatched = matchedRows.filter((item) => item.row.applied === policy);
    const matchedCount = scopedMatched.length;
    const hitRate = matchedCount > 0
      ? scopedMatched.filter((item) => item.row.bias === item.outcome!.realizedDirection).length / matchedCount
      : 0;
    const avgRealizedReturnPct = matchedCount > 0
      ? scopedMatched.reduce((acc, item) => acc + Number(item.outcome?.realizedReturnPct || 0), 0) / matchedCount
      : 0;
    const score = scorePolicyFromAttribution({
      hitRate,
      avgRealizedReturnPct,
      matchedOutcomes: matchedCount,
    });
    return {
      policy,
      decisions: scoped.length,
      matchedOutcomes: matchedCount,
      hitRate: Number.parseFloat(hitRate.toFixed(4)),
      avgRealizedReturnPct: Number.parseFloat(avgRealizedReturnPct.toFixed(4)),
      score,
    };
  });

  const byAppliedPolicyAndHorizon: ProbabilityPolicyAnalytics["attribution"]["byAppliedPolicyAndHorizon"] = horizons.flatMap((horizon) =>
    appliedPolicies.map((policy) => {
      const scoped = rows.filter((row) => row.horizon === horizon && row.applied === policy);
      const scopedMatched = matchedRows.filter((item) => item.row.horizon === horizon && item.row.applied === policy);
      const matchedCount = scopedMatched.length;
      const hitRate = matchedCount > 0
        ? scopedMatched.filter((item) => item.row.bias === item.outcome!.realizedDirection).length / matchedCount
        : 0;
      const avgRealizedReturnPct = matchedCount > 0
        ? scopedMatched.reduce((acc, item) => acc + Number(item.outcome?.realizedReturnPct || 0), 0) / matchedCount
        : 0;
      const score = scorePolicyFromAttribution({
        hitRate,
        avgRealizedReturnPct,
        matchedOutcomes: matchedCount,
      });
      return {
        horizon,
        policy,
        decisions: scoped.length,
        matchedOutcomes: matchedCount,
        hitRate: Number.parseFloat(hitRate.toFixed(4)),
        avgRealizedReturnPct: Number.parseFloat(avgRealizedReturnPct.toFixed(4)),
        score,
      };
    }),
  );

  const leaderboard = [...byAppliedPolicy]
    .sort((a, b) => b.score - a.score || b.matchedOutcomes - a.matchedOutcomes)
    .map((row) => ({
      policy: row.policy,
      matchedOutcomes: row.matchedOutcomes,
      hitRate: row.hitRate,
      avgRealizedReturnPct: row.avgRealizedReturnPct,
      score: row.score,
    }));

  const nowMs = Date.now();
  const autoSelectorStates = Array.from(store.autoSelectorState.values())
    .filter((state) => state.profileKey === profileKey)
    .map((state) => {
      const holdSecondsRemaining = Math.max(0, Math.ceil((Date.parse(state.holdUntil) - nowMs) / 1000));
      const matchedForHorizon = byAppliedPolicyAndHorizon
        .filter((row) => row.horizon === state.horizon)
        .reduce((acc, row) => acc + row.matchedOutcomes, 0);
      const warmupMatchesGained = Math.max(0, matchedForHorizon - state.warmupBaselineMatchedOutcomes);
      const warmupMatchesRemaining = Math.max(0, state.warmupMinMatches - warmupMatchesGained);
      return {
        horizon: state.horizon,
        policy: state.policy,
        updatedAt: state.updatedAt,
        holdUntil: state.holdUntil,
        holdSecondsRemaining,
        switchCount: state.switchCount,
        lastBasis: state.lastBasis,
        lastConfidence: state.lastConfidence,
        lastScoreEdge: state.lastScoreEdge,
        warmupActive: warmupMatchesRemaining > 0,
        warmupMinMatches: state.warmupMinMatches,
        warmupMatchesGained,
        warmupMatchesRemaining,
      };
    })
    .sort((a, b) => a.horizon.localeCompare(b.horizon));

  return {
    generatedAt: nowIso(),
    profileKey,
    preference,
    totals: {
      decisions: rows.length,
    },
    requestMix,
    appliedMix,
    byHorizon,
    attribution: {
      matchedOutcomes: matchedRows.length,
      byAppliedPolicy,
      byAppliedPolicyAndHorizon,
      leaderboard,
    },
    autoSelectorStates,
  };
}

export function getAutoPolicyRecommendation(input: {
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing";
  health?: {
    status: "healthy" | "watch" | "critical";
    score: number;
  };
  minHorizonMatches?: number;
  minGlobalMatches?: number;
  minScoreEdge?: number;
}): AutoPolicyRecommendation {
  const profileKey = normalizePolicyProfileKey(input.profileKey || "default");
  const horizon = input.horizon || "intraday";
  const minHorizonMatches = Math.max(3, Math.floor(input.minHorizonMatches ?? 6));
  const minGlobalMatches = Math.max(6, Math.floor(input.minGlobalMatches ?? 12));
  const minScoreEdge = clamp(input.minScoreEdge ?? 0.035, 0.005, 0.25);

  const analytics = getPolicyAnalytics({ profileKey });
  const horizonRows = analytics.attribution.byAppliedPolicyAndHorizon
    .filter((row) => row.horizon === horizon)
    .sort((a, b) => b.score - a.score || b.matchedOutcomes - a.matchedOutcomes);
  const globalRows = [...analytics.attribution.byAppliedPolicy]
    .sort((a, b) => b.score - a.score || b.matchedOutcomes - a.matchedOutcomes);

  const bestHorizon = horizonRows[0];
  const runnerHorizon = horizonRows[1];
  if (bestHorizon && bestHorizon.matchedOutcomes >= minHorizonMatches) {
    const edge = bestHorizon.score - (runnerHorizon?.score || 0);
    if (edge >= minScoreEdge || !runnerHorizon) {
      return {
        policy: bestHorizon.policy,
        basis: "attribution",
        confidence: clamp(bestHorizon.score + Math.min(0.2, edge), 0.25, 0.98),
        matchedOutcomes: bestHorizon.matchedOutcomes,
        scoreEdge: Number.parseFloat(edge.toFixed(4)),
        horizon,
        reason: `Attribution leaderboard selected ${bestHorizon.policy} on ${horizon} horizon (score ${bestHorizon.score.toFixed(3)}, edge ${edge.toFixed(3)}, n=${bestHorizon.matchedOutcomes}).`,
      };
    }
  }

  const bestGlobal = globalRows[0];
  const runnerGlobal = globalRows[1];
  if (bestGlobal && bestGlobal.matchedOutcomes >= minGlobalMatches) {
    const edge = bestGlobal.score - (runnerGlobal?.score || 0);
    if (edge >= minScoreEdge || !runnerGlobal) {
      return {
        policy: bestGlobal.policy,
        basis: "attribution",
        confidence: clamp(bestGlobal.score + Math.min(0.16, edge), 0.25, 0.96),
        matchedOutcomes: bestGlobal.matchedOutcomes,
        scoreEdge: Number.parseFloat(edge.toFixed(4)),
        horizon: "global",
        reason: `Attribution leaderboard selected ${bestGlobal.policy} globally (score ${bestGlobal.score.toFixed(3)}, edge ${edge.toFixed(3)}, n=${bestGlobal.matchedOutcomes}).`,
      };
    }
  }

  const healthFallback = fallbackByHealth(input.health);
  return {
    policy: healthFallback.policy,
    basis: healthFallback.basis,
    confidence: healthFallback.confidence,
    matchedOutcomes: analytics.attribution.matchedOutcomes,
    scoreEdge: 0,
    horizon: "global",
    reason: healthFallback.reason,
  };
}

export function applyAutoPolicyHysteresis(input: {
  profileKey?: string;
  horizon: "scalp" | "intraday" | "swing";
  recommendation: AutoPolicyRecommendation;
  holdMinutes?: number;
  minSwitchEdge?: number;
  minSwitchConfidence?: number;
  warmupMinMatches?: number;
}): AutoPolicyHysteresisResult {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input.profileKey || "default");
  const horizon = input.horizon;
  const now = Date.now();
  const configured = resolveAutoSelectorConfig({ profileKey, horizon });
  const holdMinutes = Math.max(5, Math.floor(input.holdMinutes ?? configured.holdMinutes));
  const holdMs = holdMinutes * 60_000;
  const minSwitchEdge = clamp(input.minSwitchEdge ?? configured.minSwitchEdge, 0.005, 0.3);
  const minSwitchConfidence = clamp(input.minSwitchConfidence ?? configured.minSwitchConfidence, 0.05, 0.99);
  const warmupMinMatches = Math.max(0, Math.floor(input.warmupMinMatches ?? configured.warmupMinMatches));
  const dynamicThresholds = getDynamicSwitchThresholds({
    profileKey,
    horizon,
    baseEdge: minSwitchEdge,
    baseConfidence: minSwitchConfidence,
  });
  const minSwitchEdgeUsed = dynamicThresholds.edge;
  const minSwitchConfidenceUsed = dynamicThresholds.confidence;
  const key = toSelectorStateKey(profileKey, horizon);
  const previous = store.autoSelectorState.get(key);

  const baseline = previous?.warmupBaselineMatchedOutcomes ?? input.recommendation.matchedOutcomes;
  const warmupMatchesGained = Math.max(0, input.recommendation.matchedOutcomes - baseline);
  const warmupMatchesRemaining = Math.max(0, warmupMinMatches - warmupMatchesGained);
  const warmupActive = warmupMatchesRemaining > 0;

  const pushEvent = (event: Omit<AutoPolicySwitchEventRecord, "id" | "occurredAt">) => {
    const row: AutoPolicySwitchEventRecord = {
      id: toSwitchEventId(),
      occurredAt: new Date(now).toISOString(),
      ...event,
    };
    store.autoSwitchEvents.push(row);
    if (store.autoSwitchEvents.length > 5_000) {
      store.autoSwitchEvents.splice(0, store.autoSwitchEvents.length - 5_000);
    }
    return row;
  };

  const upsertState = (nextPolicy: PersistedPolicy, switchCount: number, resetWarmup: boolean) => {
    const nextWarmupBaseline = resetWarmup
      ? input.recommendation.matchedOutcomes
      : previous?.warmupBaselineMatchedOutcomes ?? input.recommendation.matchedOutcomes;
    const next: AutoSelectorStateRecord = {
      profileKey,
      horizon,
      policy: nextPolicy,
      updatedAt: new Date(now).toISOString(),
      holdUntil: new Date(now + holdMs).toISOString(),
      switchCount,
      lastBasis: input.recommendation.basis,
      lastConfidence: Number.parseFloat(input.recommendation.confidence.toFixed(4)),
      lastScoreEdge: Number.parseFloat(input.recommendation.scoreEdge.toFixed(4)),
      warmupBaselineMatchedOutcomes: nextWarmupBaseline,
      warmupMinMatches,
    };
    store.autoSelectorState.set(key, next);
    return next;
  };

  if (!previous) {
    upsertState(input.recommendation.policy, 0, true);
    pushEvent({
      profileKey,
      horizon,
      decision: "initialize",
      previousPolicy: undefined,
      recommendedPolicy: input.recommendation.policy,
      appliedPolicy: input.recommendation.policy,
      basis: input.recommendation.basis,
      confidence: input.recommendation.confidence,
      scoreEdge: input.recommendation.scoreEdge,
      minSwitchEdge: minSwitchEdgeUsed,
      minSwitchConfidence: minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive: true,
      warmupMinMatches,
      warmupMatchesGained: 0,
      warmupMatchesRemaining: warmupMinMatches,
      reason: `Initialized hysteresis state for ${horizon} with ${input.recommendation.policy}. ${input.recommendation.reason}`,
    });
    return {
      policy: input.recommendation.policy,
      switched: false,
      locked: false,
      holdSecondsRemaining: holdMinutes * 60,
      minSwitchEdgeUsed,
      minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive: true,
      warmupMinMatches,
      warmupMatchesGained: 0,
      warmupMatchesRemaining: warmupMinMatches,
      reason: `Initialized hysteresis state for ${horizon} with ${input.recommendation.policy}. ${input.recommendation.reason}`,
    };
  }

  const holdUntilMs = Date.parse(previous.holdUntil) || now;
  const locked = holdUntilMs > now;
  const holdSecondsRemaining = Math.max(0, Math.ceil((holdUntilMs - now) / 1000));

  if (input.recommendation.policy === previous.policy) {
    upsertState(previous.policy, previous.switchCount, false);
    pushEvent({
      profileKey,
      horizon,
      decision: "stay",
      previousPolicy: previous.policy,
      recommendedPolicy: input.recommendation.policy,
      appliedPolicy: previous.policy,
      basis: input.recommendation.basis,
      confidence: input.recommendation.confidence,
      scoreEdge: input.recommendation.scoreEdge,
      minSwitchEdge: minSwitchEdgeUsed,
      minSwitchConfidence: minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Recommendation confirms existing ${previous.policy} policy; hysteresis window refreshed.`,
    });
    return {
      policy: previous.policy,
      switched: false,
      locked,
      holdSecondsRemaining,
      minSwitchEdgeUsed,
      minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Recommendation confirms existing ${previous.policy} policy; hysteresis window refreshed.`,
    };
  }

  if (locked) {
    pushEvent({
      profileKey,
      horizon,
      decision: "hold",
      previousPolicy: previous.policy,
      recommendedPolicy: input.recommendation.policy,
      appliedPolicy: previous.policy,
      basis: input.recommendation.basis,
      confidence: input.recommendation.confidence,
      scoreEdge: input.recommendation.scoreEdge,
      minSwitchEdge: minSwitchEdgeUsed,
      minSwitchConfidence: minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Holding ${previous.policy} for ${holdSecondsRemaining}s to avoid policy churn. Candidate ${input.recommendation.policy} deferred.`,
    });
    return {
      policy: previous.policy,
      switched: false,
      locked: true,
      previousPolicy: previous.policy,
      holdSecondsRemaining,
      minSwitchEdgeUsed,
      minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Holding ${previous.policy} for ${holdSecondsRemaining}s to avoid policy churn. Candidate ${input.recommendation.policy} deferred.`,
    };
  }

  if (warmupActive) {
    upsertState(previous.policy, previous.switchCount, false);
    pushEvent({
      profileKey,
      horizon,
      decision: "warmup",
      previousPolicy: previous.policy,
      recommendedPolicy: input.recommendation.policy,
      appliedPolicy: previous.policy,
      basis: input.recommendation.basis,
      confidence: input.recommendation.confidence,
      scoreEdge: input.recommendation.scoreEdge,
      minSwitchEdge: minSwitchEdgeUsed,
      minSwitchConfidence: minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Warm-up active: need ${warmupMatchesRemaining} more matched outcomes before allowing policy switches.`,
    });
    return {
      policy: previous.policy,
      switched: false,
      locked: false,
      previousPolicy: previous.policy,
      holdSecondsRemaining: holdMinutes * 60,
      minSwitchEdgeUsed,
      minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Warm-up active: need ${warmupMatchesRemaining} more matched outcomes before allowing policy switches.`,
    };
  }

  if (input.recommendation.scoreEdge < minSwitchEdgeUsed || input.recommendation.confidence < minSwitchConfidenceUsed) {
    upsertState(previous.policy, previous.switchCount, false);
    pushEvent({
      profileKey,
      horizon,
      decision: "reject",
      previousPolicy: previous.policy,
      recommendedPolicy: input.recommendation.policy,
      appliedPolicy: previous.policy,
      basis: input.recommendation.basis,
      confidence: input.recommendation.confidence,
      scoreEdge: input.recommendation.scoreEdge,
      minSwitchEdge: minSwitchEdgeUsed,
      minSwitchConfidence: minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Switch criteria not met (edge ${input.recommendation.scoreEdge.toFixed(3)} / ${minSwitchEdgeUsed.toFixed(3)}, confidence ${input.recommendation.confidence.toFixed(3)} / ${minSwitchConfidenceUsed.toFixed(3)}).`,
    });
    return {
      policy: previous.policy,
      switched: false,
      locked: false,
      previousPolicy: previous.policy,
      holdSecondsRemaining: holdMinutes * 60,
      minSwitchEdgeUsed,
      minSwitchConfidenceUsed,
      volatility: dynamicThresholds.volatility,
      hitRateDispersion: dynamicThresholds.hitRateDispersion,
      warmupActive,
      warmupMinMatches,
      warmupMatchesGained,
      warmupMatchesRemaining,
      reason: `Switch criteria not met (edge ${input.recommendation.scoreEdge.toFixed(3)} / ${minSwitchEdgeUsed.toFixed(3)}, confidence ${input.recommendation.confidence.toFixed(3)} / ${minSwitchConfidenceUsed.toFixed(3)}).`,
    };
  }

  upsertState(input.recommendation.policy, previous.switchCount + 1, true);
  pushEvent({
    profileKey,
    horizon,
    decision: "switch",
    previousPolicy: previous.policy,
    recommendedPolicy: input.recommendation.policy,
    appliedPolicy: input.recommendation.policy,
    basis: input.recommendation.basis,
    confidence: input.recommendation.confidence,
    scoreEdge: input.recommendation.scoreEdge,
    minSwitchEdge: minSwitchEdgeUsed,
    minSwitchConfidence: minSwitchConfidenceUsed,
    volatility: dynamicThresholds.volatility,
    hitRateDispersion: dynamicThresholds.hitRateDispersion,
    warmupActive: false,
    warmupMinMatches,
    warmupMatchesGained,
    warmupMatchesRemaining: 0,
    reason: `Switched policy ${previous.policy} → ${input.recommendation.policy} (edge ${input.recommendation.scoreEdge.toFixed(3)}, confidence ${input.recommendation.confidence.toFixed(3)}).`,
  });
  return {
    policy: input.recommendation.policy,
    switched: true,
    locked: false,
    previousPolicy: previous.policy,
    holdSecondsRemaining: holdMinutes * 60,
    minSwitchEdgeUsed,
    minSwitchConfidenceUsed,
    volatility: dynamicThresholds.volatility,
    hitRateDispersion: dynamicThresholds.hitRateDispersion,
    warmupActive: false,
    warmupMinMatches,
    warmupMatchesGained,
    warmupMatchesRemaining: 0,
    reason: `Switched policy ${previous.policy} → ${input.recommendation.policy} (edge ${input.recommendation.scoreEdge.toFixed(3)}, confidence ${input.recommendation.confidence.toFixed(3)}).`,
  };
}

export function listAutoPolicySwitchEvents(input?: {
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing";
  limit?: number;
}): AutoPolicySwitchEvent[] {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input?.profileKey || "default");
  const limit = Math.max(1, Math.min(200, Math.floor(input?.limit ?? 40)));
  const horizon = input?.horizon;

  const rows = store.autoSwitchEvents
    .filter((row) => row.profileKey === profileKey)
    .filter((row) => (horizon ? row.horizon === horizon : true))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      profileKey: row.profileKey,
      horizon: row.horizon,
      decision: row.decision,
      previousPolicy: row.previousPolicy,
      recommendedPolicy: row.recommendedPolicy,
      appliedPolicy: row.appliedPolicy,
      basis: row.basis,
      confidence: Number.parseFloat(row.confidence.toFixed(4)),
      scoreEdge: Number.parseFloat(row.scoreEdge.toFixed(4)),
      minSwitchEdge: Number.parseFloat(row.minSwitchEdge.toFixed(4)),
      minSwitchConfidence: Number.parseFloat(row.minSwitchConfidence.toFixed(4)),
      volatility: Number.parseFloat(row.volatility.toFixed(4)),
      hitRateDispersion: Number.parseFloat(row.hitRateDispersion.toFixed(4)),
      warmupActive: row.warmupActive,
      warmupMinMatches: row.warmupMinMatches,
      warmupMatchesGained: row.warmupMatchesGained,
      warmupMatchesRemaining: row.warmupMatchesRemaining,
      reason: row.reason,
      occurredAt: row.occurredAt,
    }));

  return rows;
}

export function resetAutoPolicySelector(input?: {
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing";
  clearEvents?: boolean;
}) {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input?.profileKey || "default");
  const horizon = input?.horizon;
  const clearEvents = Boolean(input?.clearEvents);

  const stateKeys = Array.from(store.autoSelectorState.keys());
  let clearedStates = 0;
  for (const key of stateKeys) {
    const row = store.autoSelectorState.get(key);
    if (!row || row.profileKey !== profileKey) {
      continue;
    }
    if (horizon && row.horizon !== horizon) {
      continue;
    }
    store.autoSelectorState.delete(key);
    clearedStates += 1;
  }

  let clearedEvents = 0;
  if (clearEvents) {
    const before = store.autoSwitchEvents.length;
    store.autoSwitchEvents = store.autoSwitchEvents.filter((row) => {
      if (row.profileKey !== profileKey) {
        return true;
      }
      if (horizon && row.horizon !== horizon) {
        return true;
      }
      return false;
    });
    clearedEvents = Math.max(0, before - store.autoSwitchEvents.length);
  }

  return {
    ok: true,
    profileKey,
    horizon: horizon || "all",
    clearEvents,
    clearedStates,
    clearedEvents,
    generatedAt: nowIso(),
  };
}

function toConfigKey(profileKey: string, horizon: "scalp" | "intraday" | "swing" | "global") {
  return `${profileKey}:${horizon}`;
}

export function setAutoSelectorPreset(input: {
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing" | "global";
  preset?: AutoSelectorPreset;
}) {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input.profileKey || "default");
  const horizon = input.horizon || "global";
  const preset = normalizePreset(input.preset || "balanced");
  const config = toPresetConfig({ preset, horizon });

  const record: AutoSelectorConfigRecord = {
    profileKey,
    horizon,
    preset,
    holdMinutes: config.holdMinutes,
    minSwitchEdge: Number.parseFloat(config.minSwitchEdge.toFixed(4)),
    minSwitchConfidence: Number.parseFloat(config.minSwitchConfidence.toFixed(4)),
    warmupMinMatches: config.warmupMinMatches,
    updatedAt: nowIso(),
  };

  store.autoSelectorConfig.set(toConfigKey(profileKey, horizon), record);
  return record;
}

export function clearAutoSelectorPreset(input?: {
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing" | "global";
}) {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input?.profileKey || "default");
  const horizon = input?.horizon || "global";
  store.autoSelectorConfig.delete(toConfigKey(profileKey, horizon));
}

export function resolveAutoSelectorConfig(input?: {
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing";
}): AutoSelectorConfig {
  const store = getStore();
  const profileKey = normalizePolicyProfileKey(input?.profileKey || "default");
  const horizon = input?.horizon || "intraday";

  const specific = store.autoSelectorConfig.get(toConfigKey(profileKey, horizon));
  const global = store.autoSelectorConfig.get(toConfigKey(profileKey, "global"));
  const resolved = specific || global;

  if (resolved) {
    return {
      profileKey,
      horizon,
      preset: resolved.preset,
      holdMinutes: resolved.holdMinutes,
      minSwitchEdge: resolved.minSwitchEdge,
      minSwitchConfidence: resolved.minSwitchConfidence,
      warmupMinMatches: resolved.warmupMinMatches,
      updatedAt: resolved.updatedAt,
    };
  }

  return {
    profileKey,
    horizon,
    preset: "balanced",
    holdMinutes: getDefaultHoldMinutes(horizon),
    minSwitchEdge: 0.05,
    minSwitchConfidence: 0.45,
    warmupMinMatches: getDefaultWarmupMatches(horizon),
    updatedAt: nowIso(),
  };
}
