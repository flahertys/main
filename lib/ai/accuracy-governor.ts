import type { ComplexProblemPlan } from "@/lib/ai/complex-problem-planner";
import type { PersonalizedIntelligenceContext } from "@/lib/ai/individualized-intelligence";
import type { PersonalizedTrajectorySnapshot } from "@/lib/ai/personalized-trajectory-memory";

type SloProfile = "latency" | "balanced" | "quality";
type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";

export type AccuracyGovernorPlan = {
  generatedAt: string;
  strictness: "standard" | "high" | "critical";
  suggestedSloProfile: SloProfile;
  tokenMultiplier: number;
  temperatureMultiplier: number;
  topPMultiplier: number;
  styleBias: "concise" | "operator" | "coach";
  confidenceAdjustment: number;
  directives: string[];
  reasons: string[];
};

type AccuracyEvent = {
  timestamp: string;
  strictness: AccuracyGovernorPlan["strictness"];
  qualityScore?: number;
  latencyMs?: number;
  adjustedConfidence?: number;
};

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

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_ACCURACY_GOVERNOR_EVENTS__?: AccuracyEvent[];
  };

  if (!globalRef.__TRADEHAX_ACCURACY_GOVERNOR_EVENTS__) {
    globalRef.__TRADEHAX_ACCURACY_GOVERNOR_EVENTS__ = [];
  }

  return globalRef.__TRADEHAX_ACCURACY_GOVERNOR_EVENTS__;
}

export function resolveAccuracyGovernorPlan(input: {
  domain: PredictionDomain;
  requestedSloProfile: SloProfile;
  prompt: string;
  objective?: string;
  complexityPlan?: ComplexProblemPlan | null;
  personalizedContext?: PersonalizedIntelligenceContext | null;
  trajectorySnapshot?: PersonalizedTrajectorySnapshot | null;
}) {
  const enabled = parseBooleanEnv("TRADEHAX_ACCURACY_GOVERNOR_ENABLED", true);
  if (!enabled) {
    return null as AccuracyGovernorPlan | null;
  }

  const text = `${input.prompt || ""}\n${input.objective || ""}`.toLowerCase();
  const reasons: string[] = [];

  let strictness: AccuracyGovernorPlan["strictness"] = "standard";
  let suggestedSloProfile: SloProfile = input.requestedSloProfile;
  let tokenMultiplier = 1;
  let temperatureMultiplier = 1;
  let topPMultiplier = 1;
  let styleBias: AccuracyGovernorPlan["styleBias"] = "operator";
  let confidenceAdjustment = 0;

  const uncertaintyHits = (text.match(/uncertain|unknown|estimate|probability|assumption|edge case|risk/g) || []).length;
  if (uncertaintyHits >= 2) {
    strictness = "high";
    reasons.push("prompt_uncertainty_detected");
  }

  if (input.complexityPlan?.mode === "deep") {
    strictness = strictness === "high" ? "critical" : "high";
    reasons.push("deep_mode_requires_accuracy_controls");
  }

  if (input.trajectorySnapshot?.driftState === "declining") {
    strictness = "critical";
    reasons.push("trajectory_decline_guard");
  }

  if (input.trajectorySnapshot?.retrain.shouldTrigger) {
    strictness = input.trajectorySnapshot.retrain.level === "high" ? "critical" : "high";
    reasons.push("retrain_pressure_detected");
  }

  if (input.personalizedContext?.profile.riskProfile === "conservative") {
    strictness = strictness === "critical" ? "critical" : "high";
    reasons.push("conservative_profile_accuracy_bias");
  }

  if (strictness === "critical") {
    suggestedSloProfile = "quality";
    tokenMultiplier *= 1.12;
    temperatureMultiplier *= 0.88;
    topPMultiplier *= 0.93;
    styleBias = "operator";
    confidenceAdjustment = -10;
  } else if (strictness === "high") {
    suggestedSloProfile = input.requestedSloProfile === "latency" ? "balanced" : input.requestedSloProfile;
    tokenMultiplier *= 1.05;
    temperatureMultiplier *= 0.93;
    topPMultiplier *= 0.96;
    styleBias = "operator";
    confidenceAdjustment = -6;
  } else {
    tokenMultiplier *= 1;
    temperatureMultiplier *= 0.98;
    topPMultiplier *= 0.99;
    styleBias = "coach";
    confidenceAdjustment = -2;
  }

  const directives = [
    "Accuracy protocol: do not fabricate facts; label assumptions and uncertainty explicitly.",
    "Include a concise verification checklist before final recommendation.",
    "When evidence is weak, provide bounded scenarios and state what would invalidate each scenario.",
  ];

  if (input.domain === "stock" || input.domain === "crypto" || input.domain === "kalshi") {
    directives.push("For market outputs, include risk controls, invalidation levels, and confidence qualifiers.");
  }

  return {
    generatedAt: new Date().toISOString(),
    strictness,
    suggestedSloProfile,
    tokenMultiplier: clamp(tokenMultiplier, 0.9, 1.22),
    temperatureMultiplier: clamp(temperatureMultiplier, 0.82, 1.02),
    topPMultiplier: clamp(topPMultiplier, 0.88, 1),
    styleBias,
    confidenceAdjustment,
    directives,
    reasons,
  } satisfies AccuracyGovernorPlan;
}

export function applyAccuracyConfidenceAdjustment(baseConfidence: number, plan: AccuracyGovernorPlan | null) {
  if (!plan) return clamp(Math.round(baseConfidence), 0, 100);
  return clamp(Math.round(baseConfidence + plan.confidenceAdjustment), 0, 100);
}

export function recordAccuracyGovernorEvent(input: {
  plan: AccuracyGovernorPlan | null;
  qualityScore?: number;
  latencyMs?: number;
  adjustedConfidence?: number;
}) {
  if (!input.plan) return;

  const store = getStore();
  store.push({
    timestamp: new Date().toISOString(),
    strictness: input.plan.strictness,
    qualityScore: input.qualityScore,
    latencyMs: input.latencyMs,
    adjustedConfidence: input.adjustedConfidence,
  });

  if (store.length > 3000) {
    store.splice(0, store.length - 3000);
  }
}

export function getAccuracyGovernorSummary() {
  const store = getStore();

  const strictness = {
    standard: store.filter((row) => row.strictness === "standard").length,
    high: store.filter((row) => row.strictness === "high").length,
    critical: store.filter((row) => row.strictness === "critical").length,
  };

  const avgQuality =
    store.filter((row) => typeof row.qualityScore === "number").length > 0
      ? Number.parseFloat(
          (
            store
              .filter((row) => typeof row.qualityScore === "number")
              .reduce((sum, row) => sum + Number(row.qualityScore || 0), 0)
            /
            store.filter((row) => typeof row.qualityScore === "number").length
          ).toFixed(2),
        )
      : 0;

  const avgAdjustedConfidence =
    store.filter((row) => typeof row.adjustedConfidence === "number").length > 0
      ? Number.parseFloat(
          (
            store
              .filter((row) => typeof row.adjustedConfidence === "number")
              .reduce((sum, row) => sum + Number(row.adjustedConfidence || 0), 0)
            /
            store.filter((row) => typeof row.adjustedConfidence === "number").length
          ).toFixed(2),
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    events: store.length,
    strictness,
    avgQuality,
    avgAdjustedConfidence,
  };
}
