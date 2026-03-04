import type { PersonalizedIntelligenceContext } from "@/lib/ai/individualized-intelligence";

type SloProfile = "latency" | "balanced" | "quality";

type ComplexityMode = "direct" | "structured" | "deep";

export type ComplexProblemPlan = {
  generatedAt: string;
  complexityScore: number;
  mode: ComplexityMode;
  stepBudget: number;
  suggestedSloProfile: SloProfile;
  tokenMultiplier: number;
  temperatureMultiplier: number;
  topPMultiplier: number;
  styleBias: "concise" | "operator" | "coach";
  directives: string[];
  reasons: string[];
};

type PlannerEvent = {
  timestamp: string;
  mode: ComplexityMode;
  complexityScore: number;
  qualityScore?: number;
  latencyMs?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseBooleanEnv(name: string, fallback: boolean) {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_COMPLEX_PLANNER_EVENTS__?: PlannerEvent[];
  };

  if (!globalRef.__TRADEHAX_COMPLEX_PLANNER_EVENTS__) {
    globalRef.__TRADEHAX_COMPLEX_PLANNER_EVENTS__ = [];
  }

  return globalRef.__TRADEHAX_COMPLEX_PLANNER_EVENTS__;
}

function countRegex(text: string, regex: RegExp) {
  const match = text.match(regex);
  return match ? match.length : 0;
}

export function resolveComplexProblemPlan(input: {
  prompt: string;
  objective?: string;
  contextText?: string;
  conversationDepth?: number;
  requestedSloProfile: SloProfile;
  personalizedContext?: PersonalizedIntelligenceContext | null;
}) {
  const enabled = parseBooleanEnv("TRADEHAX_COMPLEX_PROBLEM_ENGINE_ENABLED", true);
  if (!enabled) {
    return null as ComplexProblemPlan | null;
  }

  const text = `${input.prompt || ""}\n${input.objective || ""}\n${input.contextText || ""}`.toLowerCase();

  const longPromptPoints = Math.floor(Math.min(18, Math.max(0, (input.prompt?.length || 0) - 280) / 110));
  const multiConstraintPoints = countRegex(text, /(constraint|trade-?off|versus|vs\.?|compare|multi-?factor|dependent)/g) * 3;
  const planningPoints = countRegex(text, /(plan|strategy|architecture|framework|workflow|roadmap|system design)/g) * 3;
  const uncertaintyPoints = countRegex(text, /(uncertain|ambiguous|edge case|failure mode|fallback|risk)/g) * 2;
  const depthPoints = Math.max(0, (input.conversationDepth || 0) - 4) * 1.2;

  const baseScore = 28 + longPromptPoints + multiConstraintPoints + planningPoints + uncertaintyPoints + depthPoints;
  let complexityScore = clamp(Math.round(baseScore), 0, 100);

  const reasons: string[] = [];
  if (longPromptPoints > 8) reasons.push("long_problem_statement");
  if (multiConstraintPoints >= 6) reasons.push("multi_constraint_problem");
  if (planningPoints >= 6) reasons.push("strategy_or_architecture_intent");
  if (uncertaintyPoints >= 4) reasons.push("risk_uncertainty_detected");

  if (input.personalizedContext?.profile.riskProfile === "conservative") {
    complexityScore = clamp(complexityScore - 4, 0, 100);
    reasons.push("risk_profile_conservative_tightening");
  }

  let mode: ComplexityMode = "direct";
  let stepBudget = 3;
  let suggestedSloProfile: SloProfile = input.requestedSloProfile;
  let tokenMultiplier = 1;
  let temperatureMultiplier = 1;
  let topPMultiplier = 1;
  let styleBias: "concise" | "operator" | "coach" = "operator";

  if (complexityScore >= 72) {
    mode = "deep";
    stepBudget = 7;
    suggestedSloProfile = input.requestedSloProfile === "latency" ? "balanced" : "quality";
    tokenMultiplier *= 1.18;
    temperatureMultiplier *= 0.94;
    topPMultiplier *= 0.98;
    styleBias = "operator";
    reasons.push("complexity_deep_mode");
  } else if (complexityScore >= 48) {
    mode = "structured";
    stepBudget = 5;
    suggestedSloProfile = input.requestedSloProfile === "latency" ? "latency" : "balanced";
    tokenMultiplier *= 1.08;
    temperatureMultiplier *= 0.97;
    styleBias = "operator";
    reasons.push("complexity_structured_mode");
  } else {
    mode = "direct";
    stepBudget = 3;
    tokenMultiplier *= 0.95;
    styleBias = "concise";
    reasons.push("complexity_direct_mode");
  }

  const directives: string[] = [
    `Solve using ${mode.toUpperCase()} mode with a max of ${stepBudget} explicit reasoning steps.`,
    "State assumptions first, then produce decision-ready output.",
    "Include at least one failure mode and one fallback path.",
  ];

  if (mode !== "direct") {
    directives.push("Decompose into: objective, constraints, plan, risks, final recommendation.");
  }

  return {
    generatedAt: new Date().toISOString(),
    complexityScore,
    mode,
    stepBudget,
    suggestedSloProfile,
    tokenMultiplier: clamp(tokenMultiplier, 0.8, 1.3),
    temperatureMultiplier: clamp(temperatureMultiplier, 0.82, 1.08),
    topPMultiplier: clamp(topPMultiplier, 0.88, 1.05),
    styleBias,
    directives,
    reasons,
  } satisfies ComplexProblemPlan;
}

export function recordComplexProblemPlannerEvent(input: {
  plan: ComplexProblemPlan | null;
  qualityScore?: number;
  latencyMs?: number;
}) {
  if (!input.plan) return;

  const store = getStore();
  store.push({
    timestamp: new Date().toISOString(),
    mode: input.plan.mode,
    complexityScore: input.plan.complexityScore,
    qualityScore: input.qualityScore,
    latencyMs: input.latencyMs,
  });

  if (store.length > 3000) {
    store.splice(0, store.length - 3000);
  }
}

export function getComplexProblemPlannerSummary() {
  const store = getStore();

  const byMode = {
    direct: store.filter((e) => e.mode === "direct").length,
    structured: store.filter((e) => e.mode === "structured").length,
    deep: store.filter((e) => e.mode === "deep").length,
  };

  const avgComplexity =
    store.length > 0
      ? Number.parseFloat((store.reduce((sum, e) => sum + e.complexityScore, 0) / store.length).toFixed(2))
      : 0;

  const qualityRows = store.filter((e) => typeof e.qualityScore === "number");
  const avgQuality =
    qualityRows.length > 0
      ? Number.parseFloat((qualityRows.reduce((sum, e) => sum + Number(e.qualityScore || 0), 0) / qualityRows.length).toFixed(2))
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    events: store.length,
    modeDistribution: byMode,
    avgComplexity,
    avgQuality,
  };
}
