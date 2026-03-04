/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import type { AccuracyGovernorPlan } from "@/lib/ai/accuracy-governor";
import type { ComplexProblemPlan } from "@/lib/ai/complex-problem-planner";

type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";

export type AdversarialVerifierPlan = {
  generatedAt: string;
  rigor: "baseline" | "strict" | "max";
  minScore: number;
  directives: string[];
  reasons: string[];
};

export type AdversarialVerifierResult = {
  generatedAt: string;
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  flags: string[];
  checks: {
    unsupportedClaims: boolean;
    contradictionSignals: boolean;
    missingActionability: boolean;
    missingUncertaintyBounds: boolean;
    overconfidentLanguage: boolean;
  };
  remediationChecklist: string[];
  appendix: string | null;
};

type VerifierEvent = {
  timestamp: string;
  rigor: AdversarialVerifierPlan["rigor"];
  score: number;
  riskLevel: AdversarialVerifierResult["riskLevel"];
  flags: number;
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
    __TRADEHAX_RESPONSE_VERIFIER_EVENTS__?: VerifierEvent[];
  };

  if (!globalRef.__TRADEHAX_RESPONSE_VERIFIER_EVENTS__) {
    globalRef.__TRADEHAX_RESPONSE_VERIFIER_EVENTS__ = [];
  }

  return globalRef.__TRADEHAX_RESPONSE_VERIFIER_EVENTS__;
}

export function resolveAdversarialVerifierPlan(input: {
  domain: PredictionDomain;
  prompt: string;
  objective?: string;
  complexityPlan?: ComplexProblemPlan | null;
  accuracyPlan?: AccuracyGovernorPlan | null;
}) {
  const enabled = parseBooleanEnv("TRADEHAX_RESPONSE_VERIFIER_ENABLED", true);
  if (!enabled) return null as AdversarialVerifierPlan | null;

  const text = `${input.prompt || ""}\n${input.objective || ""}`.toLowerCase();
  let rigor: AdversarialVerifierPlan["rigor"] = "baseline";
  let minScore = 70;
  const reasons: string[] = [];

  const highStakesHits = (text.match(/capital|position|risk|entry|exit|allocate|sizing|leverage|hedge|probability/g) || []).length;
  if (highStakesHits >= 2) {
    rigor = "strict";
    minScore = 76;
    reasons.push("high_stakes_prompt_detected");
  }

  if (input.complexityPlan?.mode === "deep") {
    rigor = "max";
    minScore = 82;
    reasons.push("deep_complexity_verification_required");
  }

  if (input.accuracyPlan?.strictness === "critical") {
    rigor = "max";
    minScore = 84;
    reasons.push("critical_accuracy_plan_escalation");
  }

  if ((input.domain === "stock" || input.domain === "crypto" || input.domain === "kalshi") && rigor === "baseline") {
    rigor = "strict";
    minScore = Math.max(minScore, 74);
    reasons.push("market_domain_guardrails");
  }

  return {
    generatedAt: new Date().toISOString(),
    rigor,
    minScore,
    directives: [
      "Verify internal consistency before final answer.",
      "Flag uncertainty and avoid absolute claims without evidence.",
      "Ensure at least one executable next action exists.",
    ],
    reasons,
  } satisfies AdversarialVerifierPlan;
}

function resolveRiskLevel(score: number): AdversarialVerifierResult["riskLevel"] {
  if (score >= 85) return "low";
  if (score >= 70) return "medium";
  if (score >= 55) return "high";
  return "critical";
}

export function verifyResponseAdversarially(input: {
  plan: AdversarialVerifierPlan | null;
  prompt: string;
  objective?: string;
  response: string;
}) {
  if (!input.plan) return null as AdversarialVerifierResult | null;

  const prompt = (input.prompt || "").toLowerCase();
  const objective = (input.objective || "").toLowerCase();
  const response = (input.response || "").toLowerCase();

  let score = 100;
  const flags: string[] = [];

  const overconfidentLanguage = /\b(guaranteed|certain|always|never fails|risk[- ]?free|sure thing)\b/.test(response);
  if (overconfidentLanguage) {
    score -= 14;
    flags.push("overconfident_language");
  }

  const contradictionSignals =
    (/\b(low risk|minimal risk|risk[- ]?free)\b/.test(response) && /\b(high risk|significant risk|major drawdown)\b/.test(response)) ||
    (/\b(always)\b/.test(response) && /\b(uncertain|depends|not guaranteed)\b/.test(response));
  if (contradictionSignals) {
    score -= 16;
    flags.push("contradiction_signals");
  }

  const wantsProbability = /\b(probability|confidence|odds|likelihood)\b/.test(prompt) || /\b(probability|confidence|odds|likelihood)\b/.test(objective);
  const hasUncertaintyBounds = /\b\d{1,3}%\b/.test(response) || /\b(base|bull|bear|scenario|range)\b/.test(response);
  const missingUncertaintyBounds = wantsProbability && !hasUncertaintyBounds;
  if (missingUncertaintyBounds) {
    score -= 11;
    flags.push("missing_uncertainty_bounds");
  }

  const wantsAction = /\b(plan|steps|execute|strategy|next action|runbook)\b/.test(prompt) || /\b(plan|steps|execute|strategy|next action|runbook)\b/.test(objective);
  const hasActionability = /\b(next action|step 1|checklist|execute|monitor|invalidation|position size)\b/.test(response);
  const missingActionability = wantsAction && !hasActionability;
  if (missingActionability) {
    score -= 13;
    flags.push("missing_actionability");
  }

  const responseLength = input.response.trim().length;
  const unsupportedClaims = responseLength < 90;
  if (unsupportedClaims) {
    score -= 10;
    flags.push("insufficient_supporting_detail");
  }

  score = clamp(score, 0, 100);
  const riskLevel = resolveRiskLevel(score);

  const remediationChecklist: string[] = [];
  if (flags.includes("overconfident_language")) remediationChecklist.push("Replace absolutes with bounded confidence statements.");
  if (flags.includes("contradiction_signals")) remediationChecklist.push("Remove conflicting claims and keep one coherent risk narrative.");
  if (flags.includes("missing_uncertainty_bounds")) remediationChecklist.push("Add scenario ranges or explicit confidence percentages.");
  if (flags.includes("missing_actionability")) remediationChecklist.push("Include one specific next action with trigger and invalidation.");
  if (flags.includes("insufficient_supporting_detail")) remediationChecklist.push("Add concise evidence and assumptions behind recommendation.");

  const appendix =
    riskLevel === "high" || riskLevel === "critical"
      ? [
          "Verification note:",
          "- Confidence is provisional due to elevated uncertainty signals.",
          "- Validate assumptions with current market data before execution.",
          "- Use strict position sizing and explicit invalidation thresholds.",
        ].join("\n")
      : null;

  return {
    generatedAt: new Date().toISOString(),
    score,
    riskLevel,
    flags,
    checks: {
      unsupportedClaims,
      contradictionSignals,
      missingActionability,
      missingUncertaintyBounds,
      overconfidentLanguage,
    },
    remediationChecklist,
    appendix,
  } satisfies AdversarialVerifierResult;
}

export function recordAdversarialVerifierEvent(input: {
  plan: AdversarialVerifierPlan | null;
  result: AdversarialVerifierResult | null;
}) {
  if (!input.plan || !input.result) return;

  const store = getStore();
  store.push({
    timestamp: new Date().toISOString(),
    rigor: input.plan.rigor,
    score: input.result.score,
    riskLevel: input.result.riskLevel,
    flags: input.result.flags.length,
  });

  if (store.length > 3000) {
    store.splice(0, store.length - 3000);
  }
}

export function getAdversarialVerifierSummary() {
  const store = getStore();

  const avgScore =
    store.length > 0
      ? Number.parseFloat((store.reduce((sum, row) => sum + row.score, 0) / store.length).toFixed(2))
      : 0;

  const riskDistribution = {
    low: store.filter((row) => row.riskLevel === "low").length,
    medium: store.filter((row) => row.riskLevel === "medium").length,
    high: store.filter((row) => row.riskLevel === "high").length,
    critical: store.filter((row) => row.riskLevel === "critical").length,
  };

  const rigor = {
    baseline: store.filter((row) => row.rigor === "baseline").length,
    strict: store.filter((row) => row.rigor === "strict").length,
    max: store.filter((row) => row.rigor === "max").length,
  };

  const avgFlags =
    store.length > 0
      ? Number.parseFloat((store.reduce((sum, row) => sum + row.flags, 0) / store.length).toFixed(2))
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    events: store.length,
    avgScore,
    avgFlags,
    riskDistribution,
    rigor,
  };
}