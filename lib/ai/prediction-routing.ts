import type { AdaptiveRoutingHints } from "@/lib/ai/adaptive-routing-memory";
import { getTrainingBenchmarkSnapshot } from "@/lib/ai/training-benchmarks";

type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";

type LlmPresetId =
  | "navigator_fast"
  | "operator_exec"
  | "analyst_risk"
  | "creative_growth"
  | "deep_research"
  | "fallback_safe";

type LlmPresetConfig = {
  id: LlmPresetId;
  label: string;
  description: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  responseStyle: "concise" | "coach" | "operator";
};

type LlmPresetResolution = {
  id: LlmPresetId;
  modeSource: "manual" | "auto";
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  responseStyle: "concise" | "coach" | "operator";
  label: string;
};

type DomainSignal = {
  domain: PredictionDomain;
  confidence: number;
  reasons: string[];
};

type PredictionTelemetryRecord = {
  domain: PredictionDomain;
  model: string;
  confidence: number;
  provider: "huggingface" | "kernel";
  fallback: boolean;
  timestamp: string;
};

type PredictionTelemetrySummary = {
  generatedAt: string;
  totalRequests: number;
  domains: Array<{
    domain: PredictionDomain;
    requests: number;
    avgConfidence: number;
    fallbackRate: number;
    providers: {
      huggingface: number;
      kernel: number;
    };
    models: Array<{
      model: string;
      requests: number;
    }>;
  }>;
};

type AdaptiveInferenceTuning = {
  effectiveSloProfile: "latency" | "balanced" | "quality";
  tokenMultiplier: number;
  temperatureMultiplier: number;
  topPMultiplier: number;
  trafficPressure: "low" | "elevated" | "high";
  benchmarkMaturity: number;
  reasons: string[];
};

type ModelPerformance = {
  model: string;
  requests: number;
  avgConfidence: number;
  fallbackRate: number;
};

type DomainRoutingRuntimeState = {
  activeModel: string;
  activeMode: "stable" | "canary";
  promoteStreak: number;
  rollbackStreak: number;
  lastPromotedAt?: string;
  lastRollbackAt?: string;
  cooldownUntil?: string;
  lastReason?: string;
};

type DomainRoutingOverrideMode = "auto" | "stable" | "canary";

type DomainRoutingGovernance = {
  domain: PredictionDomain;
  stableModel: string;
  canaryModel: string | null;
  overrideMode: DomainRoutingOverrideMode;
  modeSource: "auto" | "manual_override";
  activeModel: string;
  activeMode: "stable" | "canary";
  rolloutPercent: number;
  canaryRequestShare: number;
  cooldownUntil: string | null;
  decisions: {
    promoted: boolean;
    rolledBack: boolean;
    reason: string;
  };
  gates: {
    minRequests: number;
    minConfidenceGain: number;
    maxFallbackRate: number;
    maxFallbackDelta: number;
    hysteresis: number;
    cooldownMinutes: number;
    windowSize: number;
    rolloutPercent: number;
    promotionStreak: number;
    rollbackStreak: number;
  };
  memory: {
    promoteStreak: number;
    rollbackStreak: number;
  };
  performance: {
    stable: ModelPerformance | null;
    canary: ModelPerformance | null;
  };
};

const KALSHI_TERMS = [
  "kalshi",
  "event contract",
  "binary contract",
  "yes/no market",
  "yes no market",
  "election market",
  "cpi market",
  "fed cut probability",
  "prediction market",
];

const CRYPTO_TERMS = [
  "crypto",
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "defi",
  "onchain",
  "dex",
  "cex",
  "altcoin",
  "memecoin",
];

const STOCK_TERMS = [
  "stock",
  "equity",
  "ticker",
  "earnings",
  "nasdaq",
  "nyse",
  "spx",
  "spy",
  "option chain",
  "iv",
  "implied volatility",
  "fomc",
  "10y yield",
];

const PRESET_IDS: LlmPresetId[] = [
  "navigator_fast",
  "operator_exec",
  "analyst_risk",
  "creative_growth",
  "deep_research",
  "fallback_safe",
];

function isPresetId(value: unknown): value is LlmPresetId {
  return typeof value === "string" && PRESET_IDS.includes(value as LlmPresetId);
}

function buildPresetCatalog(): Record<LlmPresetId, LlmPresetConfig> {
  const fallbackModel = process.env.HF_MODEL_ID || "Qwen/Qwen2.5-7B-Instruct";

  return {
    navigator_fast: {
      id: "navigator_fast",
      label: "Navigator Fast",
      description: "Low-latency route guidance and next clicks.",
      modelId: process.env.TRADEHAX_PRESET_NAVIGATOR_MODEL || fallbackModel,
      temperature: parseNumericEnv("TRADEHAX_PRESET_NAVIGATOR_TEMP", 0.35, { min: 0, max: 2 }),
      maxTokens: Math.round(parseNumericEnv("TRADEHAX_PRESET_NAVIGATOR_MAXTOKENS", 320, { min: 64, max: 4096 })),
      topP: parseNumericEnv("TRADEHAX_PRESET_NAVIGATOR_TOPP", 0.9, { min: 0.1, max: 1 }),
      responseStyle: "concise",
    },
    operator_exec: {
      id: "operator_exec",
      label: "Operator / Execution",
      description: "Checklist-driven execution plans and SOP outputs.",
      modelId: process.env.TRADEHAX_PRESET_OPERATOR_MODEL || fallbackModel,
      temperature: parseNumericEnv("TRADEHAX_PRESET_OPERATOR_TEMP", 0.5, { min: 0, max: 2 }),
      maxTokens: Math.round(parseNumericEnv("TRADEHAX_PRESET_OPERATOR_MAXTOKENS", 700, { min: 64, max: 4096 })),
      topP: parseNumericEnv("TRADEHAX_PRESET_OPERATOR_TOPP", 0.92, { min: 0.1, max: 1 }),
      responseStyle: "operator",
    },
    analyst_risk: {
      id: "analyst_risk",
      label: "Analyst / Risk",
      description: "Conservative market framing with explicit invalidations.",
      modelId: process.env.TRADEHAX_PRESET_ANALYST_MODEL || fallbackModel,
      temperature: parseNumericEnv("TRADEHAX_PRESET_ANALYST_TEMP", 0.25, { min: 0, max: 2 }),
      maxTokens: Math.round(parseNumericEnv("TRADEHAX_PRESET_ANALYST_MAXTOKENS", 820, { min: 64, max: 4096 })),
      topP: parseNumericEnv("TRADEHAX_PRESET_ANALYST_TOPP", 0.86, { min: 0.1, max: 1 }),
      responseStyle: "operator",
    },
    creative_growth: {
      id: "creative_growth",
      label: "Creative / Growth",
      description: "Ideation and marketing/content expansion workflows.",
      modelId: process.env.TRADEHAX_PRESET_CREATIVE_MODEL || fallbackModel,
      temperature: parseNumericEnv("TRADEHAX_PRESET_CREATIVE_TEMP", 0.85, { min: 0, max: 2 }),
      maxTokens: Math.round(parseNumericEnv("TRADEHAX_PRESET_CREATIVE_MAXTOKENS", 900, { min: 64, max: 4096 })),
      topP: parseNumericEnv("TRADEHAX_PRESET_CREATIVE_TOPP", 0.97, { min: 0.1, max: 1 }),
      responseStyle: "coach",
    },
    deep_research: {
      id: "deep_research",
      label: "Deep Research",
      description: "Long-form comparative reasoning and tradeoff analysis.",
      modelId: process.env.TRADEHAX_PRESET_RESEARCH_MODEL || fallbackModel,
      temperature: parseNumericEnv("TRADEHAX_PRESET_RESEARCH_TEMP", 0.45, { min: 0, max: 2 }),
      maxTokens: Math.round(parseNumericEnv("TRADEHAX_PRESET_RESEARCH_MAXTOKENS", 1300, { min: 64, max: 4096 })),
      topP: parseNumericEnv("TRADEHAX_PRESET_RESEARCH_TOPP", 0.9, { min: 0.1, max: 1 }),
      responseStyle: "coach",
    },
    fallback_safe: {
      id: "fallback_safe",
      label: "Fallback Safe",
      description: "Reliable low-cost fallback behavior when providers degrade.",
      modelId: process.env.TRADEHAX_PRESET_FALLBACK_MODEL || fallbackModel,
      temperature: parseNumericEnv("TRADEHAX_PRESET_FALLBACK_TEMP", 0.2, { min: 0, max: 2 }),
      maxTokens: Math.round(parseNumericEnv("TRADEHAX_PRESET_FALLBACK_MAXTOKENS", 260, { min: 64, max: 4096 })),
      topP: parseNumericEnv("TRADEHAX_PRESET_FALLBACK_TOPP", 0.8, { min: 0.1, max: 1 }),
      responseStyle: "concise",
    },
  };
}

function inferPresetFromMessage(inputMessage: string, context?: unknown): LlmPresetId {
  const text = `${inputMessage} ${normalizeContext(context)}`.toLowerCase();

  if (/\b(content|copy|post|thread|marketing|campaign|hook|headline|creative|brand)\b/.test(text)) {
    return "creative_growth";
  }
  if (/\b(sop|checklist|execute|implementation|deploy|rollout|operator|runbook)\b/.test(text)) {
    return "operator_exec";
  }
  if (/\b(risk|portfolio|trade|prediction|signal|volatility|invalidation|position size)\b/.test(text)) {
    return "analyst_risk";
  }
  if (/\b(compare|comprehensive|research|deep dive|long-form|tradeoffs?)\b/.test(text)) {
    return "deep_research";
  }

  return "navigator_fast";
}

function keywordScore(text: string, terms: string[]) {
  let score = 0;
  const reasons: string[] = [];

  for (const term of terms) {
    if (text.includes(term)) {
      score += term.includes(" ") ? 2 : 1;
      reasons.push(term);
    }
  }

  return { score, reasons };
}

function normalizeContext(context: unknown): string {
  if (!context) return "";
  if (typeof context === "string") return context.toLowerCase();

  try {
    return JSON.stringify(context).toLowerCase();
  } catch {
    return "";
  }
}

function getTelemetryStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_PREDICTION_TELEMETRY__?: PredictionTelemetryRecord[];
  };

  if (!globalRef.__TRADEHAX_PREDICTION_TELEMETRY__) {
    globalRef.__TRADEHAX_PREDICTION_TELEMETRY__ = [];
  }

  return globalRef.__TRADEHAX_PREDICTION_TELEMETRY__;
}

function getRoutingStateStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_ROUTING_STATE__?: Partial<Record<PredictionDomain, DomainRoutingRuntimeState>>;
  };

  if (!globalRef.__TRADEHAX_ROUTING_STATE__) {
    globalRef.__TRADEHAX_ROUTING_STATE__ = {};
  }

  return globalRef.__TRADEHAX_ROUTING_STATE__;
}

function getRoutingOverrideStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_ROUTING_OVERRIDES__?: Partial<Record<PredictionDomain, DomainRoutingOverrideMode>>;
  };

  if (!globalRef.__TRADEHAX_ROUTING_OVERRIDES__) {
    globalRef.__TRADEHAX_ROUTING_OVERRIDES__ = {};
  }

  return globalRef.__TRADEHAX_ROUTING_OVERRIDES__;
}

function parseNumericEnv(name: string, fallback: number, opts?: { min?: number; max?: number }) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
  let value = Number.isFinite(parsed) ? parsed : fallback;

  if (typeof opts?.min === "number") {
    value = Math.max(opts.min, value);
  }
  if (typeof opts?.max === "number") {
    value = Math.min(opts.max, value);
  }

  return value;
}

function parseBooleanEnv(name: string, fallback: boolean) {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveBenchmarkMaturity() {
  if (!parseBooleanEnv("TRADEHAX_BENCHMARK_GOVERNANCE_ENABLED", true)) {
    return 0.5;
  }

  try {
    const snapshot = getTrainingBenchmarkSnapshot();
    return clamp(Number(snapshot?.overallScore || 0.5), 0, 1);
  } catch {
    return 0.5;
  }
}

function getRoutingGates() {
  const benchmarkMaturity = resolveBenchmarkMaturity();

  const confidenceOffset = benchmarkMaturity >= 0.85 ? -0.6 : benchmarkMaturity <= 0.45 ? 0.8 : 0;
  const promoOffset = benchmarkMaturity >= 0.85 ? -1 : benchmarkMaturity <= 0.4 ? 1 : 0;
  const rollbackOffset = benchmarkMaturity >= 0.85 ? 1 : 0;

  return {
    minRequests: Math.round(parseNumericEnv("TRADEHAX_CANARY_MIN_REQUESTS", 40, { min: 5, max: 1000 })),
    minConfidenceGain: clamp(
      parseNumericEnv("TRADEHAX_CANARY_MIN_CONFIDENCE_GAIN", 3, { min: 0, max: 30 }) + confidenceOffset,
      0,
      30,
    ),
    maxFallbackRate: parseNumericEnv("TRADEHAX_CANARY_MAX_FALLBACK_RATE", 18, { min: 0, max: 100 }),
    maxFallbackDelta: parseNumericEnv("TRADEHAX_CANARY_MAX_FALLBACK_DELTA", 5, { min: 0, max: 100 }),
    hysteresis: parseNumericEnv("TRADEHAX_CANARY_HYSTERESIS", 1.5, { min: 0, max: 30 }),
    cooldownMinutes: Math.round(parseNumericEnv("TRADEHAX_CANARY_COOLDOWN_MINUTES", 30, { min: 0, max: 60 * 24 })),
    windowSize: Math.round(parseNumericEnv("TRADEHAX_CANARY_WINDOW_SIZE", 240, { min: 20, max: 3000 })),
    rolloutPercent: Math.round(parseNumericEnv("TRADEHAX_CANARY_ROLLOUT_PERCENT", 15, { min: 0, max: 100 })),
    promotionStreak: Math.round(
      clamp(parseNumericEnv("TRADEHAX_CANARY_PROMOTION_STREAK", 3, { min: 1, max: 10 }) + promoOffset, 1, 10),
    ),
    rollbackStreak: Math.round(
      clamp(parseNumericEnv("TRADEHAX_CANARY_ROLLBACK_STREAK", 2, { min: 1, max: 10 }) + rollbackOffset, 1, 10),
    ),
  };
}

function getRecentTrafficPressure() {
  const store = getTelemetryStore();
  if (store.length === 0) return "low" as const;

  const windowMinutes = Math.round(parseNumericEnv("TRADEHAX_SMARTNESS_TRAFFIC_WINDOW_MIN", 5, { min: 1, max: 60 }));
  const highThreshold = Math.round(parseNumericEnv("TRADEHAX_SMARTNESS_TRAFFIC_HIGH_RPM", 120, { min: 10, max: 5000 }));
  const elevatedThreshold = Math.round(parseNumericEnv("TRADEHAX_SMARTNESS_TRAFFIC_ELEVATED_RPM", 60, { min: 5, max: 5000 }));

  const cutoff = Date.now() - windowMinutes * 60_000;
  const recent = store.filter((row) => Date.parse(row.timestamp) >= cutoff);
  const rpm = recent.length / windowMinutes;

  if (rpm >= highThreshold) return "high" as const;
  if (rpm >= elevatedThreshold) return "elevated" as const;
  return "low" as const;
}

export function resolveAdaptiveInferenceTuning(input: {
  domain: PredictionDomain;
  presetId?: LlmPresetId;
  sloProfile: "latency" | "balanced" | "quality";
  routingHints?: AdaptiveRoutingHints | null;
}) : AdaptiveInferenceTuning {
  const benchmarkMaturity = resolveBenchmarkMaturity();
  const pressure = getRecentTrafficPressure();
  const reasons: string[] = [];

  let effectiveSloProfile: "latency" | "balanced" | "quality" = input.sloProfile;
  let tokenMultiplier = 1;
  let temperatureMultiplier = 1;
  let topPMultiplier = 1;

  if (pressure === "high" && input.sloProfile !== "quality") {
    effectiveSloProfile = "latency";
    tokenMultiplier *= 0.78;
    temperatureMultiplier *= 0.94;
    topPMultiplier *= 0.96;
    reasons.push("traffic_high_latency_bias");
  } else if (pressure === "elevated" && input.sloProfile === "balanced") {
    tokenMultiplier *= 0.9;
    reasons.push("traffic_elevated_token_trim");
  }

  if (benchmarkMaturity >= 0.85 && input.sloProfile === "quality") {
    tokenMultiplier *= 1.12;
    topPMultiplier *= 1.02;
    reasons.push("benchmark_high_quality_expand");
  } else if (benchmarkMaturity <= 0.4) {
    tokenMultiplier *= 0.88;
    temperatureMultiplier *= 0.93;
    reasons.push("benchmark_low_stability_guard");
  }

  if (input.presetId === "deep_research" && pressure !== "high") {
    tokenMultiplier *= 1.08;
    reasons.push("preset_deep_research_bonus");
  }

  if (input.routingHints) {
    tokenMultiplier *= input.routingHints.tokenMultiplierHint;
    temperatureMultiplier *= input.routingHints.temperatureMultiplierHint;
    topPMultiplier *= input.routingHints.topPMultiplierHint;

    if (input.routingHints.sloBias === "latency" && effectiveSloProfile !== "quality") {
      effectiveSloProfile = "latency";
      reasons.push("routing_memory_latency_bias");
    } else if (input.routingHints.sloBias === "quality" && pressure === "low") {
      effectiveSloProfile = "quality";
      reasons.push("routing_memory_quality_bias");
    }

    reasons.push(...input.routingHints.reasons.slice(0, 3));
  }

  return {
    effectiveSloProfile,
    tokenMultiplier: clamp(tokenMultiplier, 0.6, 1.35),
    temperatureMultiplier: clamp(temperatureMultiplier, 0.7, 1.2),
    topPMultiplier: clamp(topPMultiplier, 0.8, 1.08),
    trafficPressure: pressure,
    benchmarkMaturity: Number.parseFloat(benchmarkMaturity.toFixed(3)),
    reasons,
  };
}

function getCanaryModel(domain: PredictionDomain): string | null {
  if (domain === "stock") {
    return process.env.TRADEHAX_MODEL_STOCK_CANARY || null;
  }
  if (domain === "crypto") {
    return process.env.TRADEHAX_MODEL_CRYPTO_CANARY || null;
  }
  if (domain === "kalshi") {
    return process.env.TRADEHAX_MODEL_KALSHI_CANARY || null;
  }

  return process.env.TRADEHAX_MODEL_GENERAL_CANARY || null;
}

function getRecentDomainRows(domain: PredictionDomain, windowSize: number) {
  const store = getTelemetryStore();
  const rows = store.filter((row) => row.domain === domain);
  return rows.slice(-windowSize);
}

function modelPerformance(rows: PredictionTelemetryRecord[], model: string): ModelPerformance | null {
  const scoped = rows.filter((row) => row.model === model);
  const requests = scoped.length;
  if (requests === 0) {
    return null;
  }

  const avgConfidence = Number.parseFloat(
    (scoped.reduce((sum, row) => sum + row.confidence, 0) / requests).toFixed(1),
  );
  const fallbackRate = Number.parseFloat(
    ((scoped.filter((row) => row.fallback).length / requests) * 100).toFixed(1),
  );

  return {
    model,
    requests,
    avgConfidence,
    fallbackRate,
  };
}

function resolveDomainGovernance(domain: PredictionDomain): DomainRoutingGovernance {
  const stableModel = resolveStablePredictionModel(domain);
  const canaryModel = getCanaryModel(domain);
  const overrides = getRoutingOverrideStore();
  const overrideMode = overrides[domain] || "auto";
  const gates = getRoutingGates();
  const stateStore = getRoutingStateStore();
  const prior = stateStore[domain];
  const now = Date.now();

  if (!canaryModel || canaryModel === stableModel) {
    const settledState: DomainRoutingRuntimeState = {
      activeModel: stableModel,
      activeMode: "stable",
      promoteStreak: 0,
      rollbackStreak: 0,
      lastReason: "canary_not_configured",
    };
    stateStore[domain] = settledState;
    return {
      domain,
      stableModel,
      canaryModel: null,
      overrideMode,
      modeSource: overrideMode === "auto" ? "auto" : "manual_override",
      activeModel: stableModel,
      activeMode: "stable",
      rolloutPercent: 0,
      canaryRequestShare: 0,
      cooldownUntil: null,
      decisions: {
        promoted: false,
        rolledBack: false,
        reason: overrideMode === "canary" ? "override_canary_unavailable" : "canary_not_configured",
      },
      gates,
      memory: {
        promoteStreak: 0,
        rollbackStreak: 0,
      },
      performance: {
        stable: null,
        canary: null,
      },
    };
  }

  const recentRows = getRecentDomainRows(domain, gates.windowSize);
  const stablePerf = modelPerformance(recentRows, stableModel);
  const canaryPerf = modelPerformance(recentRows, canaryModel);

  const total = recentRows.length;
  const canaryRequestShare =
    total > 0 && canaryPerf ? Number.parseFloat(((canaryPerf.requests / total) * 100).toFixed(1)) : 0;

  const defaultState: DomainRoutingRuntimeState = {
    activeModel: stableModel,
    activeMode: "stable",
    promoteStreak: 0,
    rollbackStreak: 0,
    lastReason: "default_stable",
  };
  const state: DomainRoutingRuntimeState = prior
    ? { ...prior }
    : defaultState;

  const cooldownUntilMs = state.cooldownUntil ? Date.parse(state.cooldownUntil) : Number.NaN;
  const onCooldown = Number.isFinite(cooldownUntilMs) && now < cooldownUntilMs;

  let promoted = false;
  let rolledBack = false;
  let reason = state.lastReason || "stable_mode";

  if (overrideMode === "stable") {
    state.activeMode = "stable";
    state.activeModel = stableModel;
    state.lastReason = "manual_override_stable";
    state.promoteStreak = 0;
    state.rollbackStreak = 0;
    reason = state.lastReason;
    stateStore[domain] = state;
    return {
      domain,
      stableModel,
      canaryModel,
      overrideMode,
      modeSource: "manual_override",
      activeModel: state.activeModel,
      activeMode: state.activeMode,
      rolloutPercent: gates.rolloutPercent,
      canaryRequestShare,
      cooldownUntil: state.cooldownUntil || null,
      decisions: {
        promoted,
        rolledBack,
        reason,
      },
      gates,
      memory: {
        promoteStreak: state.promoteStreak,
        rollbackStreak: state.rollbackStreak,
      },
      performance: {
        stable: stablePerf,
        canary: canaryPerf,
      },
    };
  }

  if (overrideMode === "canary" && canaryModel) {
    state.activeMode = "canary";
    state.activeModel = canaryModel;
    state.lastReason = "manual_override_canary";
    state.promoteStreak = 0;
    state.rollbackStreak = 0;
    reason = state.lastReason;
    stateStore[domain] = state;
    return {
      domain,
      stableModel,
      canaryModel,
      overrideMode,
      modeSource: "manual_override",
      activeModel: state.activeModel,
      activeMode: state.activeMode,
      rolloutPercent: gates.rolloutPercent,
      canaryRequestShare,
      cooldownUntil: state.cooldownUntil || null,
      decisions: {
        promoted,
        rolledBack,
        reason,
      },
      gates,
      memory: {
        promoteStreak: state.promoteStreak,
        rollbackStreak: state.rollbackStreak,
      },
      performance: {
        stable: stablePerf,
        canary: canaryPerf,
      },
    };
  }

  if (state.activeMode === "canary") {
    const fallbackBreach =
      Boolean(canaryPerf) && canaryPerf.fallbackRate > gates.maxFallbackRate + gates.hysteresis;
    const confidenceRegression =
      Boolean(canaryPerf) &&
      Boolean(stablePerf) &&
      canaryPerf.avgConfidence + gates.hysteresis < stablePerf.avgConfidence;

    if (fallbackBreach || confidenceRegression) {
      state.rollbackStreak += 1;
    } else {
      state.rollbackStreak = Math.max(0, state.rollbackStreak - 1);
    }

    if (state.rollbackStreak >= gates.rollbackStreak) {
      state.activeMode = "stable";
      state.activeModel = stableModel;
      state.lastRollbackAt = new Date().toISOString();
      state.cooldownUntil = new Date(now + gates.cooldownMinutes * 60_000).toISOString();
      state.lastReason = fallbackBreach
        ? "rollback_guardrail_fallback"
        : "rollback_guardrail_confidence";
      rolledBack = true;
      reason = state.lastReason;
      state.promoteStreak = 0;
      state.rollbackStreak = 0;
    } else {
      state.activeModel = canaryModel;
      state.lastReason = fallbackBreach || confidenceRegression ? "canary_warning_hold" : "canary_active";
      reason = state.lastReason;
    }
  }

  if (state.activeMode === "stable" && !rolledBack) {
    if (onCooldown) {
      state.lastReason = "cooldown_active";
      reason = state.lastReason;
    } else {
      const hasSamples =
        Boolean(stablePerf) &&
        Boolean(canaryPerf) &&
        stablePerf.requests >= gates.minRequests &&
        canaryPerf.requests >= gates.minRequests;

      if (!hasSamples) {
        state.lastReason = "insufficient_canary_samples";
        reason = state.lastReason;
        state.promoteStreak = Math.max(0, state.promoteStreak - 1);
      } else {
        const confidenceGain = canaryPerf.avgConfidence - stablePerf.avgConfidence;
        const fallbackDelta = canaryPerf.fallbackRate - stablePerf.fallbackRate;
        const meetsConfidence = confidenceGain >= gates.minConfidenceGain;
        const meetsFallback = canaryPerf.fallbackRate <= gates.maxFallbackRate;
        const meetsDelta = fallbackDelta <= gates.maxFallbackDelta;

        if (meetsConfidence && meetsFallback && meetsDelta) {
          state.promoteStreak += 1;
        } else {
          state.promoteStreak = Math.max(0, state.promoteStreak - 1);
        }

        if (state.promoteStreak >= gates.promotionStreak) {
          state.activeMode = "canary";
          state.activeModel = canaryModel;
          state.lastPromotedAt = new Date().toISOString();
          state.lastReason = "promoted_canary_beats_stable";
          promoted = true;
          reason = state.lastReason;
          state.promoteStreak = 0;
          state.rollbackStreak = 0;
        } else {
          state.lastReason = meetsConfidence && meetsFallback && meetsDelta
            ? "promotion_streak_building"
            : "canary_not_meeting_gates";
          reason = state.lastReason;
        }
      }
    }
  }

  if (state.activeMode === "stable") {
    state.activeModel = stableModel;
  }

  stateStore[domain] = state;

  return {
    domain,
    stableModel,
    canaryModel,
    overrideMode,
    modeSource: "auto",
    activeModel: state.activeModel,
    activeMode: state.activeMode,
    rolloutPercent: gates.rolloutPercent,
    canaryRequestShare,
    cooldownUntil: state.cooldownUntil || null,
    decisions: {
      promoted,
      rolledBack,
      reason,
    },
    gates,
    memory: {
      promoteStreak: state.promoteStreak,
      rollbackStreak: state.rollbackStreak,
    },
    performance: {
      stable: stablePerf,
      canary: canaryPerf,
    },
  };
}

function resolveStablePredictionModel(domain: PredictionDomain): string {
  const fallback = process.env.HF_MODEL_ID || "Qwen/Qwen2.5-7B-Instruct";

  if (domain === "stock") {
    return process.env.TRADEHAX_MODEL_STOCK || fallback;
  }
  if (domain === "crypto") {
    return process.env.TRADEHAX_MODEL_CRYPTO || fallback;
  }
  if (domain === "kalshi") {
    return process.env.TRADEHAX_MODEL_KALSHI || fallback;
  }

  return process.env.TRADEHAX_MODEL_GENERAL || fallback;
}

function shouldRouteCanarySample(percent: number) {
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  return Math.random() * 100 < percent;
}

export function inferPredictionDomain(inputMessage: string, context?: unknown): DomainSignal {
  const text = `${inputMessage} ${normalizeContext(context)}`.toLowerCase();

  const kalshi = keywordScore(text, KALSHI_TERMS);
  const crypto = keywordScore(text, CRYPTO_TERMS);
  const stock = keywordScore(text, STOCK_TERMS);

  const candidates: Array<{ domain: PredictionDomain; score: number; reasons: string[] }> = [
    { domain: "kalshi", score: kalshi.score, reasons: kalshi.reasons },
    { domain: "crypto", score: crypto.score, reasons: crypto.reasons },
    { domain: "stock", score: stock.score, reasons: stock.reasons },
  ];

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  if (!best || best.score <= 0) {
    return {
      domain: "general",
      confidence: 38,
      reasons: ["no_domain_keywords"],
    };
  }

  const confidence = Math.max(42, Math.min(95, 45 + best.score * 10));
  return {
    domain: best.domain,
    confidence,
    reasons: best.reasons.slice(0, 5),
  };
}

export function resolvePredictionModel(domain: PredictionDomain): string {
  const governance = resolveDomainGovernance(domain);

  if (!governance.canaryModel) {
    return governance.stableModel;
  }

  if (governance.activeMode === "canary") {
    return governance.canaryModel;
  }

  if (shouldRouteCanarySample(governance.rolloutPercent)) {
    return governance.canaryModel;
  }

  return governance.stableModel;
}

export function getLlmPresetCatalog(): Record<LlmPresetId, LlmPresetConfig> {
  return buildPresetCatalog();
}

export function resolveLlmPreset(input: {
  inputMessage: string;
  context?: unknown;
  requestedPreset?: unknown;
  tier?: string;
}): LlmPresetResolution {
  const catalog = buildPresetCatalog();
  const requested = isPresetId(input.requestedPreset) ? input.requestedPreset : null;
  const tier = typeof input.tier === "string" ? input.tier.toUpperCase().trim() : "STANDARD";

  let resolvedId: LlmPresetId;
  let modeSource: "manual" | "auto" = "auto";

  if (requested) {
    resolvedId = requested;
    modeSource = "manual";
  } else {
    resolvedId = inferPresetFromMessage(input.inputMessage, input.context);
  }

  if (tier === "STANDARD" && resolvedId === "deep_research") {
    resolvedId = "operator_exec";
  }

  const preset = catalog[resolvedId] || catalog.navigator_fast;

  return {
    id: preset.id,
    modeSource,
    modelId: preset.modelId,
    temperature: preset.temperature,
    maxTokens: preset.maxTokens,
    topP: preset.topP,
    responseStyle: preset.responseStyle,
    label: preset.label,
  };
}

export function recordPredictionTelemetry(input: {
  domain: PredictionDomain;
  model: string;
  confidence: number;
  provider: "huggingface" | "kernel";
  fallback: boolean;
}) {
  const store = getTelemetryStore();
  store.push({
    domain: input.domain,
    model: input.model,
    confidence: Math.max(0, Math.min(100, Math.round(input.confidence))),
    provider: input.provider,
    fallback: Boolean(input.fallback),
    timestamp: new Date().toISOString(),
  });

  if (store.length > 2000) {
    store.splice(0, store.length - 2000);
  }
}

export function getPredictionTelemetrySummary(): PredictionTelemetrySummary {
  const store = getTelemetryStore();
  const domains: PredictionDomain[] = ["stock", "crypto", "kalshi", "general"];

  const summaryDomains = domains.map((domain) => {
    const rows = store.filter((row) => row.domain === domain);
    const requests = rows.length;
    const avgConfidence =
      requests > 0
        ? Number.parseFloat((rows.reduce((sum, row) => sum + row.confidence, 0) / requests).toFixed(1))
        : 0;
    const fallbackRate =
      requests > 0
        ? Number.parseFloat(((rows.filter((row) => row.fallback).length / requests) * 100).toFixed(1))
        : 0;

    const providers = {
      huggingface: rows.filter((row) => row.provider === "huggingface").length,
      kernel: rows.filter((row) => row.provider === "kernel").length,
    };

    const modelCounts = new Map<string, number>();
    for (const row of rows) {
      modelCounts.set(row.model, (modelCounts.get(row.model) || 0) + 1);
    }

    const models = Array.from(modelCounts.entries())
      .map(([model, count]) => ({ model, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 6);

    return {
      domain,
      requests,
      avgConfidence,
      fallbackRate,
      providers,
      models,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalRequests: store.length,
    domains: summaryDomains,
  };
}

export function getPredictionRoutingGovernanceSummary() {
  const domains: PredictionDomain[] = ["stock", "crypto", "kalshi", "general"];
  return {
    generatedAt: new Date().toISOString(),
    domains: domains.map((domain) => resolveDomainGovernance(domain)),
  };
}

export function setPredictionRoutingOverride(input: {
  domain: PredictionDomain;
  mode: DomainRoutingOverrideMode;
}) {
  const overrides = getRoutingOverrideStore();
  overrides[input.domain] = input.mode;
}

export function getPredictionRoutingOverrides() {
  const overrides = getRoutingOverrideStore();
  const domains: PredictionDomain[] = ["stock", "crypto", "kalshi", "general"];
  return domains.reduce<Record<PredictionDomain, DomainRoutingOverrideMode>>((acc, domain) => {
    acc[domain] = overrides[domain] || "auto";
    return acc;
  }, {
    stock: "auto",
    crypto: "auto",
    kalshi: "auto",
    general: "auto",
  });
}

export type {
    AdaptiveInferenceTuning,
    DomainRoutingGovernance, DomainRoutingOverrideMode, DomainSignal,
    LlmPresetConfig,
    LlmPresetId,
    LlmPresetResolution,
    PredictionDomain,
    PredictionTelemetrySummary
};

