import { event } from "@/lib/analytics";

export type ExperimentName =
  | "home_hero_primary_cta"
  | "landing_hero_primary_cta";

export type ExperimentVariant = "control" | "accelerated";
export type ExperimentPolicyProfile = "aggressive" | "balanced" | "conservative";

export interface ExperimentPolicySettings {
  minRequiredPerVariant: number;
  minDeltaPoints: number;
  minZForAction: number;
  highConfidenceZ: number;
  rampCooldownMs: number;
  rampVelocityWindowMs: number;
  rampMaxShiftPerWindow: number;
  rampPortfolioWindowMs: number;
  rampPortfolioMaxShiftPerWindow: number;
  rampFairnessPenaltyPerRecentAction: number;
  rampExplorationBoostInactivityMs: number;
  rampExplorationBoostScore: number;
  driftHalfLifeMs: number;
  driftShockThreshold: number;
  driftShockHoldMs: number;
  driftRecoveryThresholdRatio: number;
  driftRecoveryConfirmations: number;
  autoswitchConfirmationCount: number;
  autoswitchBandPoints: number;
  autoswitchCoverageBand: number;
  recommendationRolloutTarget: {
    promoteAccelerated: number;
    keepControl: number;
  };
}

export interface ExperimentRollupEntry {
  exposureCount: number;
  goalCount: number;
  weightedGoalValue: number;
  goalsByAction: Record<string, number>;
}

export type ExperimentRollupByVariant = Partial<Record<ExperimentVariant, ExperimentRollupEntry>>;
export type ExperimentRollupSnapshot = Partial<Record<ExperimentName, ExperimentRollupByVariant>>;

export interface ExperimentDecisionSummary {
  experiment: ExperimentName;
  recommendation: "promote_accelerated" | "keep_control" | "monitor" | "insufficient_data";
  confidence: "low" | "medium" | "high";
  deltaCvrPoints: number;
  controlCvr: number;
  acceleratedCvr: number;
  zScore: number;
  minRequiredPerVariant: number;
  minDeltaPoints: number;
  rationale: string;
}

export interface ExperimentGuardrailEvent {
  experiment: ExperimentName;
  previousRollout: number;
  nextRollout: number;
  recommendation: ExperimentDecisionSummary["recommendation"];
  confidence: ExperimentDecisionSummary["confidence"];
  rationale: string;
  timestamp: string;
}

export interface ExperimentRampEvent {
  experiment: ExperimentName;
  previousRollout: number;
  nextRollout: number;
  stepSize: number;
  stride: number;
  profile: ExperimentPolicyProfile;
  velocityWindowUsedBefore: number;
  velocityWindowUsedAfter: number;
  velocityWindowBudget: number;
  portfolioWindowUsedBefore: number;
  portfolioWindowUsedAfter: number;
  portfolioWindowBudget: number;
  opportunityScore: number;
  adjustedOpportunityScore: number;
  recentPortfolioActions: number;
  fairnessBoostApplied: boolean;
  bayesianLiftPoints: number;
  bayesianUncertaintyPoints: number;
  regretPressurePoints: number;
  routeIntentLiftPoints: number;
  routeValueDelta: number;
  routeSignalCoverage: number;
  qualityMemoryIntentLiftPoints: number;
  qualityMemoryValueDelta: number;
  qualityMemorySignalCoverage: number;
  qualityMemoryBoost: number;
  qualityMemoryPhaseWeight: number;
  qualityMemoryHalfLifeMs: number;
  driftScore: number;
  shortDriftScore: number;
  mediumDriftScore: number;
  longDriftScore: number;
  shockMode: boolean;
  driftPhase: "normal" | "shock" | "recovering";
  shockIntensity: number;
  recommendation: ExperimentDecisionSummary["recommendation"];
  confidence: ExperimentDecisionSummary["confidence"];
  rationale: string;
  timestamp: string;
}

interface ExperimentRampVelocityWindowEntry {
  timestamp: string;
  stepSize: number;
}

export interface ExperimentPolicySwitchEvent {
  previousProfile: ExperimentPolicyProfile;
  nextProfile: ExperimentPolicyProfile;
  reason: string;
  timestamp: string;
  meanAbsDeltaCvrPoints: number;
  sufficientCoverage: number;
  smoothedAbsDeltaCvrPoints: number;
  smoothedCoverage: number;
}

export interface ExperimentPolicyRegimeState {
  smoothedAbsDeltaCvrPoints: number;
  smoothedCoverage: number;
  sampleCount: number;
  lastUpdatedAt: string;
}

export interface ExperimentPolicyPendingSwitch {
  pendingProfile: ExperimentPolicyProfile;
  confirmationCount: number;
  requiredConfirmations: number;
  reason: string;
}

export interface ExperimentPolicyDiagnostics {
  cycles: number;
  switchedCount: number;
  noChangeCount: number;
  coverageVetoCount: number;
  signalBandVetoCount: number;
  cooldownVetoCount: number;
  confirmationPendingCount: number;
  lastReason: string;
  lastUpdatedAt: string;
}

export interface ExperimentPolicyAdaptiveState {
  sensitivity: number;
  stability: number;
  lastUpdatedAt: string;
}

export interface ExperimentAllocatorDriftState {
  shortSmoothedAbsDeltaCvrPoints: number;
  shortSmoothedAbsZScore: number;
  smoothedAbsDeltaCvrPoints: number;
  smoothedAbsZScore: number;
  longSmoothedAbsDeltaCvrPoints: number;
  longSmoothedAbsZScore: number;
  driftScore: number;
  shortDriftScore: number;
  mediumDriftScore: number;
  longDriftScore: number;
  shockMode: boolean;
  phase: "normal" | "shock" | "recovering";
  recoveryStreak: number;
  sampleCount: number;
  lastUpdatedAt: string;
  shockUntil?: string;
}

interface ExperimentAllocatorQualityMemoryEntry {
  smoothedRouteIntentLiftPoints: number;
  smoothedRouteValueDelta: number;
  smoothedRouteSignalCoverage: number;
  sampleCount: number;
  lastUpdatedAt: string;
}

type ExperimentAllocatorQualityMemoryState = Partial<Record<ExperimentName, ExperimentAllocatorQualityMemoryEntry>>;

const EXPERIMENT_VARIANTS: Record<ExperimentName, readonly ExperimentVariant[]> = {
  home_hero_primary_cta: ["control", "accelerated"],
  landing_hero_primary_cta: ["control", "accelerated"],
};

const EXP_STORAGE_PREFIX = "thx-exp:";
const EXP_ROLLOUT_PREFIX = "thx-exp-rollout:";
const EXP_EXPOSURE_PREFIX = "thx-exp-exposed:";
const EXP_ROLLUP_STORAGE_KEY = "thx-exp-rollup";
const EXP_GUARDRAIL_LOG_KEY = "thx-exp-guardrail-log";
const EXP_RAMP_LOG_KEY = "thx-exp-ramp-log";
const EXP_RAMP_META_KEY = "thx-exp-ramp-meta";
const EXP_RAMP_VELOCITY_META_KEY = "thx-exp-ramp-velocity-meta";
const EXP_RAMP_PORTFOLIO_META_KEY = "thx-exp-ramp-portfolio-meta";
const EXP_RAMP_DRIFT_STATE_KEY = "thx-exp-ramp-drift-state";
const EXP_RAMP_QUALITY_MEMORY_KEY = "thx-exp-ramp-quality-memory";
const EXP_POLICY_PROFILE_KEY = "thx-exp-policy-profile";
const EXP_POLICY_AUTOSWITCH_KEY = "thx-exp-policy-autoswitch-enabled";
const EXP_POLICY_SWITCH_LOG_KEY = "thx-exp-policy-switch-log";
const EXP_POLICY_META_KEY = "thx-exp-policy-meta";
const EXP_POLICY_REGIME_KEY = "thx-exp-policy-regime";
const EXP_POLICY_DIAGNOSTICS_KEY = "thx-exp-policy-diagnostics";
const EXP_POLICY_ADAPTIVE_KEY = "thx-exp-policy-adaptive";
const EXP_POLICY_ADAPTIVE_ENABLED_KEY = "thx-exp-policy-adaptive-enabled";
const EXP_VISITOR_ID_KEY = "thx-exp-visitor-id";
const EXPERIMENT_NAMES = Object.keys(EXPERIMENT_VARIANTS) as ExperimentName[];
const RAMP_STEPS = [10, 25, 50, 75, 100] as const;
export const EXPERIMENT_POLICY_PROFILES: readonly ExperimentPolicyProfile[] = [
  "aggressive",
  "balanced",
  "conservative",
] as const;

const POLICY_SETTINGS: Record<ExperimentPolicyProfile, ExperimentPolicySettings> = {
  aggressive: {
    minRequiredPerVariant: 20,
    minDeltaPoints: 1.0,
    minZForAction: 1.28,
    highConfidenceZ: 2.33,
    rampCooldownMs: 60 * 1000,
    rampVelocityWindowMs: 12 * 60 * 1000,
    rampMaxShiftPerWindow: 65,
    rampPortfolioWindowMs: 10 * 60 * 1000,
    rampPortfolioMaxShiftPerWindow: 95,
    rampFairnessPenaltyPerRecentAction: 0.3,
    rampExplorationBoostInactivityMs: 6 * 60 * 1000,
    rampExplorationBoostScore: 0.35,
    driftHalfLifeMs: 10 * 60 * 1000,
    driftShockThreshold: 1.9,
    driftShockHoldMs: 3 * 60 * 1000,
    driftRecoveryThresholdRatio: 0.82,
    driftRecoveryConfirmations: 2,
    autoswitchConfirmationCount: 1,
    autoswitchBandPoints: 0.25,
    autoswitchCoverageBand: 0.04,
    recommendationRolloutTarget: {
      promoteAccelerated: 100,
      keepControl: 10,
    },
  },
  balanced: {
    minRequiredPerVariant: 30,
    minDeltaPoints: 1.5,
    minZForAction: 1.64,
    highConfidenceZ: 2.58,
    rampCooldownMs: 2 * 60 * 1000,
    rampVelocityWindowMs: 15 * 60 * 1000,
    rampMaxShiftPerWindow: 45,
    rampPortfolioWindowMs: 12 * 60 * 1000,
    rampPortfolioMaxShiftPerWindow: 70,
    rampFairnessPenaltyPerRecentAction: 0.45,
    rampExplorationBoostInactivityMs: 8 * 60 * 1000,
    rampExplorationBoostScore: 0.5,
    driftHalfLifeMs: 12 * 60 * 1000,
    driftShockThreshold: 1.6,
    driftShockHoldMs: 4 * 60 * 1000,
    driftRecoveryThresholdRatio: 0.76,
    driftRecoveryConfirmations: 3,
    autoswitchConfirmationCount: 2,
    autoswitchBandPoints: 0.35,
    autoswitchCoverageBand: 0.05,
    recommendationRolloutTarget: {
      promoteAccelerated: 75,
      keepControl: 25,
    },
  },
  conservative: {
    minRequiredPerVariant: 45,
    minDeltaPoints: 2.0,
    minZForAction: 1.96,
    highConfidenceZ: 2.8,
    rampCooldownMs: 5 * 60 * 1000,
    rampVelocityWindowMs: 20 * 60 * 1000,
    rampMaxShiftPerWindow: 30,
    rampPortfolioWindowMs: 15 * 60 * 1000,
    rampPortfolioMaxShiftPerWindow: 45,
    rampFairnessPenaltyPerRecentAction: 0.6,
    rampExplorationBoostInactivityMs: 10 * 60 * 1000,
    rampExplorationBoostScore: 0.65,
    driftHalfLifeMs: 15 * 60 * 1000,
    driftShockThreshold: 1.35,
    driftShockHoldMs: 5 * 60 * 1000,
    driftRecoveryThresholdRatio: 0.7,
    driftRecoveryConfirmations: 4,
    autoswitchConfirmationCount: 3,
    autoswitchBandPoints: 0.5,
    autoswitchCoverageBand: 0.06,
    recommendationRolloutTarget: {
      promoteAccelerated: 60,
      keepControl: 40,
    },
  },
};

function isVariantForExperiment(name: ExperimentName, value: string): value is ExperimentVariant {
  return (EXPERIMENT_VARIANTS[name] as readonly string[]).includes(value);
}

export function isExperimentPolicyProfile(value: string): value is ExperimentPolicyProfile {
  return (EXPERIMENT_POLICY_PROFILES as readonly string[]).includes(value);
}

export function getExperimentPolicySettings(
  profile: ExperimentPolicyProfile = "balanced",
): ExperimentPolicySettings {
  const base = POLICY_SETTINGS[profile];
  if (typeof window === "undefined" || !getExperimentPolicyAdaptiveEnabled()) {
    return base;
  }

  const adaptive = getExperimentPolicyAdaptiveState();
  if (!adaptive) {
    return base;
  }

  const stability = Math.max(0.75, Math.min(1.6, adaptive.stability));
  const sensitivity = Math.max(0.7, Math.min(1.4, adaptive.sensitivity));
  const tuningRatio = stability / sensitivity;

  return {
    ...base,
    minRequiredPerVariant: Math.max(10, Math.round(base.minRequiredPerVariant * stability)),
    minDeltaPoints: Number((base.minDeltaPoints * tuningRatio).toFixed(2)),
    minZForAction: Number((base.minZForAction * tuningRatio).toFixed(2)),
    highConfidenceZ: Number((base.highConfidenceZ * tuningRatio).toFixed(2)),
    rampCooldownMs: Math.max(30_000, Math.round(base.rampCooldownMs * stability)),
    rampVelocityWindowMs: Math.max(2 * 60_000, Math.round(base.rampVelocityWindowMs * stability)),
    rampMaxShiftPerWindow: Math.max(15, Math.round(base.rampMaxShiftPerWindow * sensitivity)),
    rampPortfolioWindowMs: Math.max(2 * 60_000, Math.round(base.rampPortfolioWindowMs * stability)),
    rampPortfolioMaxShiftPerWindow: Math.max(20, Math.round(base.rampPortfolioMaxShiftPerWindow * sensitivity)),
    rampFairnessPenaltyPerRecentAction: Number(
      Math.max(0.1, base.rampFairnessPenaltyPerRecentAction * stability).toFixed(3),
    ),
    rampExplorationBoostInactivityMs: Math.max(
      2 * 60_000,
      Math.round(base.rampExplorationBoostInactivityMs * stability),
    ),
    rampExplorationBoostScore: Number(
      Math.max(0.1, base.rampExplorationBoostScore * stability).toFixed(3),
    ),
    driftHalfLifeMs: Math.max(60_000, Math.round(base.driftHalfLifeMs * stability)),
    driftShockThreshold: Number(Math.max(0.8, base.driftShockThreshold * (2 - sensitivity)).toFixed(3)),
    driftShockHoldMs: Math.max(60_000, Math.round(base.driftShockHoldMs * stability)),
    driftRecoveryThresholdRatio: Number(
      Math.max(0.55, Math.min(0.95, base.driftRecoveryThresholdRatio + (stability - 1) * 0.08)).toFixed(3),
    ),
    driftRecoveryConfirmations: Math.max(1, Math.round(base.driftRecoveryConfirmations * stability)),
    autoswitchConfirmationCount: Math.max(1, Math.round(base.autoswitchConfirmationCount * stability)),
    autoswitchBandPoints: Number((base.autoswitchBandPoints * stability).toFixed(3)),
    autoswitchCoverageBand: Number((base.autoswitchCoverageBand * stability).toFixed(3)),
  };
}

function pickRandomVariant(name: ExperimentName): ExperimentVariant {
  const variants = EXPERIMENT_VARIANTS[name];
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex] ?? "control";
}

function experimentStorageKey(name: ExperimentName): string {
  return `${EXP_STORAGE_PREFIX}${name}`;
}

function experimentRolloutStorageKey(name: ExperimentName): string {
  return `${EXP_ROLLOUT_PREFIX}${name}`;
}

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = window.localStorage.getItem(EXP_VISITOR_ID_KEY);
    if (existing) {
      return existing;
    }

    const generated =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    window.localStorage.setItem(EXP_VISITOR_ID_KEY, generated);
    return generated;
  } catch {
    return `${Date.now()}-fallback`;
  }
}

function computeHashBucket(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) % 100;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function readGuardrailLog(): ExperimentGuardrailEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(EXP_GUARDRAIL_LOG_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ExperimentGuardrailEvent => {
      return (
        isObjectRecord(item) &&
        typeof item.experiment === "string" &&
        typeof item.previousRollout === "number" &&
        typeof item.nextRollout === "number" &&
        typeof item.recommendation === "string" &&
        typeof item.confidence === "string" &&
        typeof item.rationale === "string" &&
        typeof item.timestamp === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeGuardrailLog(events: ExperimentGuardrailEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(EXP_GUARDRAIL_LOG_KEY, JSON.stringify(events.slice(0, 20)));
  } catch {
    // Ignore storage failures.
  }
}

function appendGuardrailEvent(eventEntry: ExperimentGuardrailEvent) {
  const existing = readGuardrailLog();
  writeGuardrailLog([eventEntry, ...existing]);
}

function readRampLog(): ExperimentRampEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(EXP_RAMP_LOG_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ExperimentRampEvent => {
      return (
        isObjectRecord(item) &&
        typeof item.experiment === "string" &&
        typeof item.previousRollout === "number" &&
        typeof item.nextRollout === "number" &&
        typeof item.stepSize === "number" &&
        typeof item.stride === "number" &&
        typeof item.profile === "string" &&
        typeof item.velocityWindowUsedBefore === "number" &&
        typeof item.velocityWindowUsedAfter === "number" &&
        typeof item.velocityWindowBudget === "number" &&
        typeof item.portfolioWindowUsedBefore === "number" &&
        typeof item.portfolioWindowUsedAfter === "number" &&
        typeof item.portfolioWindowBudget === "number" &&
        typeof item.opportunityScore === "number" &&
        typeof item.adjustedOpportunityScore === "number" &&
        typeof item.recentPortfolioActions === "number" &&
        typeof item.fairnessBoostApplied === "boolean" &&
        typeof item.bayesianLiftPoints === "number" &&
        typeof item.bayesianUncertaintyPoints === "number" &&
        typeof item.regretPressurePoints === "number" &&
        typeof item.routeIntentLiftPoints === "number" &&
        typeof item.routeValueDelta === "number" &&
        typeof item.routeSignalCoverage === "number" &&
        typeof item.qualityMemoryIntentLiftPoints === "number" &&
        typeof item.qualityMemoryValueDelta === "number" &&
        typeof item.qualityMemorySignalCoverage === "number" &&
        typeof item.qualityMemoryBoost === "number" &&
        typeof item.qualityMemoryPhaseWeight === "number" &&
        typeof item.qualityMemoryHalfLifeMs === "number" &&
        typeof item.driftScore === "number" &&
        typeof item.shortDriftScore === "number" &&
        typeof item.mediumDriftScore === "number" &&
        typeof item.longDriftScore === "number" &&
        typeof item.shockMode === "boolean" &&
        typeof item.driftPhase === "string" &&
        typeof item.shockIntensity === "number" &&
        typeof item.recommendation === "string" &&
        typeof item.confidence === "string" &&
        typeof item.rationale === "string" &&
        typeof item.timestamp === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeRampLog(events: ExperimentRampEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(EXP_RAMP_LOG_KEY, JSON.stringify(events.slice(0, 20)));
  } catch {
    // Ignore storage failures.
  }
}

function appendRampEvent(eventEntry: ExperimentRampEvent) {
  const existing = readRampLog();
  writeRampLog([eventEntry, ...existing]);
}

function readPolicySwitchLog(): ExperimentPolicySwitchEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(EXP_POLICY_SWITCH_LOG_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ExperimentPolicySwitchEvent => {
      return (
        isObjectRecord(item) &&
        typeof item.previousProfile === "string" &&
        typeof item.nextProfile === "string" &&
        typeof item.reason === "string" &&
        typeof item.timestamp === "string" &&
        typeof item.meanAbsDeltaCvrPoints === "number" &&
        typeof item.sufficientCoverage === "number" &&
        typeof item.smoothedAbsDeltaCvrPoints === "number" &&
        typeof item.smoothedCoverage === "number"
      );
    });
  } catch {
    return [];
  }
}

function writePolicySwitchLog(events: ExperimentPolicySwitchEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(EXP_POLICY_SWITCH_LOG_KEY, JSON.stringify(events.slice(0, 20)));
  } catch {
    // Ignore storage failures.
  }
}

function appendPolicySwitchEvent(eventEntry: ExperimentPolicySwitchEvent) {
  const existing = readPolicySwitchLog();
  writePolicySwitchLog([eventEntry, ...existing]);
}

function readPolicyMeta(): {
  lastSwitchAt?: string;
  pendingProfile?: ExperimentPolicyProfile;
  pendingCount?: number;
  pendingReason?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EXP_POLICY_META_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return {};
    }

    return {
      lastSwitchAt: typeof parsed.lastSwitchAt === "string" ? parsed.lastSwitchAt : undefined,
      pendingProfile:
        typeof parsed.pendingProfile === "string" && isExperimentPolicyProfile(parsed.pendingProfile)
          ? parsed.pendingProfile
          : undefined,
      pendingCount: typeof parsed.pendingCount === "number" ? parsed.pendingCount : undefined,
      pendingReason: typeof parsed.pendingReason === "string" ? parsed.pendingReason : undefined,
    };
  } catch {
    return {};
  }
}

function createEmptyPolicyDiagnostics(): ExperimentPolicyDiagnostics {
  return {
    cycles: 0,
    switchedCount: 0,
    noChangeCount: 0,
    coverageVetoCount: 0,
    signalBandVetoCount: 0,
    cooldownVetoCount: 0,
    confirmationPendingCount: 0,
    lastReason: "none",
    lastUpdatedAt: new Date(0).toISOString(),
  };
}

function createDefaultAdaptiveState(): ExperimentPolicyAdaptiveState {
  return {
    sensitivity: 1,
    stability: 1,
    lastUpdatedAt: new Date(0).toISOString(),
  };
}

function readPolicyDiagnostics(): ExperimentPolicyDiagnostics {
  if (typeof window === "undefined") {
    return createEmptyPolicyDiagnostics();
  }

  try {
    const raw = window.localStorage.getItem(EXP_POLICY_DIAGNOSTICS_KEY);
    if (!raw) {
      return createEmptyPolicyDiagnostics();
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return createEmptyPolicyDiagnostics();
    }

    return {
      cycles: typeof parsed.cycles === "number" ? parsed.cycles : 0,
      switchedCount: typeof parsed.switchedCount === "number" ? parsed.switchedCount : 0,
      noChangeCount: typeof parsed.noChangeCount === "number" ? parsed.noChangeCount : 0,
      coverageVetoCount: typeof parsed.coverageVetoCount === "number" ? parsed.coverageVetoCount : 0,
      signalBandVetoCount: typeof parsed.signalBandVetoCount === "number" ? parsed.signalBandVetoCount : 0,
      cooldownVetoCount: typeof parsed.cooldownVetoCount === "number" ? parsed.cooldownVetoCount : 0,
      confirmationPendingCount:
        typeof parsed.confirmationPendingCount === "number" ? parsed.confirmationPendingCount : 0,
      lastReason: typeof parsed.lastReason === "string" ? parsed.lastReason : "none",
      lastUpdatedAt:
        typeof parsed.lastUpdatedAt === "string" ? parsed.lastUpdatedAt : new Date(0).toISOString(),
    };
  } catch {
    return createEmptyPolicyDiagnostics();
  }
}

function writePolicyDiagnostics(diagnostics: ExperimentPolicyDiagnostics) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_DIAGNOSTICS_KEY, JSON.stringify(diagnostics));
  } catch {
    // Ignore storage failures.
  }
}

function readPolicyAdaptiveState(): ExperimentPolicyAdaptiveState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EXP_POLICY_ADAPTIVE_KEY);
    if (!raw) {
      return createDefaultAdaptiveState();
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return createDefaultAdaptiveState();
    }

    return {
      sensitivity: typeof parsed.sensitivity === "number" ? parsed.sensitivity : 1,
      stability: typeof parsed.stability === "number" ? parsed.stability : 1,
      lastUpdatedAt:
        typeof parsed.lastUpdatedAt === "string" ? parsed.lastUpdatedAt : new Date(0).toISOString(),
    };
  } catch {
    return createDefaultAdaptiveState();
  }
}

function writePolicyAdaptiveState(state: ExperimentPolicyAdaptiveState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_ADAPTIVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function updateAdaptivePolicyFromDiagnostics(diagnostics: ExperimentPolicyDiagnostics) {
  if (!getExperimentPolicyAdaptiveEnabled()) {
    return;
  }

  const current = readPolicyAdaptiveState() ?? createDefaultAdaptiveState();
  if (diagnostics.cycles < 6) {
    writePolicyAdaptiveState({
      ...current,
      lastUpdatedAt: new Date().toISOString(),
    });
    return;
  }

  const vetoPressure =
    (diagnostics.coverageVetoCount +
      diagnostics.signalBandVetoCount +
      diagnostics.cooldownVetoCount +
      diagnostics.confirmationPendingCount) /
    Math.max(diagnostics.cycles, 1);
  const switchRate = diagnostics.switchedCount / Math.max(diagnostics.cycles, 1);

  let nextStability = current.stability;
  let nextSensitivity = current.sensitivity;

  if (vetoPressure >= 0.55) {
    nextStability += 0.05;
    nextSensitivity -= 0.03;
  } else if (switchRate <= 0.04 && diagnostics.noChangeCount / Math.max(diagnostics.cycles, 1) > 0.7) {
    nextStability -= 0.03;
    nextSensitivity += 0.05;
  } else {
    nextStability += (1 - nextStability) * 0.15;
    nextSensitivity += (1 - nextSensitivity) * 0.15;
  }

  const next: ExperimentPolicyAdaptiveState = {
    stability: Number(Math.max(0.75, Math.min(1.6, nextStability)).toFixed(3)),
    sensitivity: Number(Math.max(0.7, Math.min(1.4, nextSensitivity)).toFixed(3)),
    lastUpdatedAt: new Date().toISOString(),
  };

  writePolicyAdaptiveState(next);
}

function trackPolicyDiagnostics(reasonCode: string, reasonText: string) {
  const current = readPolicyDiagnostics();
  const nowIso = new Date().toISOString();

  const next: ExperimentPolicyDiagnostics = {
    ...current,
    cycles: current.cycles + 1,
    lastReason: reasonText,
    lastUpdatedAt: nowIso,
  };

  if (reasonCode === "switched") {
    next.switchedCount += 1;
  } else if (reasonCode === "no_change") {
    next.noChangeCount += 1;
  } else if (reasonCode === "coverage_veto") {
    next.coverageVetoCount += 1;
  } else if (reasonCode === "signal_band_veto") {
    next.signalBandVetoCount += 1;
  } else if (reasonCode === "cooldown_veto") {
    next.cooldownVetoCount += 1;
  } else if (reasonCode === "confirmation_pending") {
    next.confirmationPendingCount += 1;
  }

  writePolicyDiagnostics(next);
  updateAdaptivePolicyFromDiagnostics(next);
}

function writePolicyMeta(meta: {
  lastSwitchAt?: string;
  pendingProfile?: ExperimentPolicyProfile;
  pendingCount?: number;
  pendingReason?: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage failures.
  }
}

function readPolicyRegimeState(): ExperimentPolicyRegimeState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EXP_POLICY_REGIME_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return null;
    }

    if (
      typeof parsed.smoothedAbsDeltaCvrPoints !== "number" ||
      typeof parsed.smoothedCoverage !== "number" ||
      typeof parsed.sampleCount !== "number" ||
      typeof parsed.lastUpdatedAt !== "string"
    ) {
      return null;
    }

    return {
      smoothedAbsDeltaCvrPoints: parsed.smoothedAbsDeltaCvrPoints,
      smoothedCoverage: parsed.smoothedCoverage,
      sampleCount: parsed.sampleCount,
      lastUpdatedAt: parsed.lastUpdatedAt,
    };
  } catch {
    return null;
  }
}

function writePolicyRegimeState(state: ExperimentPolicyRegimeState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_REGIME_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function readRampMeta(): Partial<Record<ExperimentName, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EXP_RAMP_META_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return {};
    }

    return EXPERIMENT_NAMES.reduce<Partial<Record<ExperimentName, string>>>((acc, experimentName) => {
      const value = parsed[experimentName];
      if (typeof value === "string") {
        acc[experimentName] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function writeRampMeta(meta: Partial<Record<ExperimentName, string>>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_RAMP_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage failures.
  }
}

function readRampVelocityMeta(): Partial<Record<ExperimentName, ExperimentRampVelocityWindowEntry[]>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EXP_RAMP_VELOCITY_META_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return {};
    }

    return EXPERIMENT_NAMES.reduce<Partial<Record<ExperimentName, ExperimentRampVelocityWindowEntry[]>>>(
      (acc, experimentName) => {
        const value = parsed[experimentName];
        if (!Array.isArray(value)) {
          return acc;
        }

        const entries = value.filter((item): item is ExperimentRampVelocityWindowEntry => {
          return (
            isObjectRecord(item) &&
            typeof item.timestamp === "string" &&
            typeof item.stepSize === "number"
          );
        });

        if (entries.length > 0) {
          acc[experimentName] = entries;
        }

        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
}

function writeRampVelocityMeta(meta: Partial<Record<ExperimentName, ExperimentRampVelocityWindowEntry[]>>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_RAMP_VELOCITY_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage failures.
  }
}

function readRampPortfolioMeta(): ExperimentRampVelocityWindowEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(EXP_RAMP_PORTFOLIO_META_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ExperimentRampVelocityWindowEntry => {
      return (
        isObjectRecord(item) &&
        typeof item.timestamp === "string" &&
        typeof item.stepSize === "number"
      );
    });
  } catch {
    return [];
  }
}

function writeRampPortfolioMeta(entries: ExperimentRampVelocityWindowEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_RAMP_PORTFOLIO_META_KEY, JSON.stringify(entries.slice(-80)));
  } catch {
    // Ignore storage failures.
  }
}

function createDefaultAllocatorDriftState(): ExperimentAllocatorDriftState {
  return {
    shortSmoothedAbsDeltaCvrPoints: 0,
    shortSmoothedAbsZScore: 0,
    smoothedAbsDeltaCvrPoints: 0,
    smoothedAbsZScore: 0,
    longSmoothedAbsDeltaCvrPoints: 0,
    longSmoothedAbsZScore: 0,
    driftScore: 0,
    shortDriftScore: 0,
    mediumDriftScore: 0,
    longDriftScore: 0,
    shockMode: false,
    phase: "normal",
    recoveryStreak: 0,
    sampleCount: 0,
    lastUpdatedAt: new Date(0).toISOString(),
  };
}

function readAllocatorDriftState(): ExperimentAllocatorDriftState {
  if (typeof window === "undefined") {
    return createDefaultAllocatorDriftState();
  }

  try {
    const raw = window.localStorage.getItem(EXP_RAMP_DRIFT_STATE_KEY);
    if (!raw) {
      return createDefaultAllocatorDriftState();
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return createDefaultAllocatorDriftState();
    }

    return {
      shortSmoothedAbsDeltaCvrPoints:
        typeof parsed.shortSmoothedAbsDeltaCvrPoints === "number"
          ? parsed.shortSmoothedAbsDeltaCvrPoints
          : 0,
      shortSmoothedAbsZScore:
        typeof parsed.shortSmoothedAbsZScore === "number" ? parsed.shortSmoothedAbsZScore : 0,
      smoothedAbsDeltaCvrPoints:
        typeof parsed.smoothedAbsDeltaCvrPoints === "number" ? parsed.smoothedAbsDeltaCvrPoints : 0,
      smoothedAbsZScore: typeof parsed.smoothedAbsZScore === "number" ? parsed.smoothedAbsZScore : 0,
      longSmoothedAbsDeltaCvrPoints:
        typeof parsed.longSmoothedAbsDeltaCvrPoints === "number"
          ? parsed.longSmoothedAbsDeltaCvrPoints
          : 0,
      longSmoothedAbsZScore:
        typeof parsed.longSmoothedAbsZScore === "number" ? parsed.longSmoothedAbsZScore : 0,
      driftScore: typeof parsed.driftScore === "number" ? parsed.driftScore : 0,
      shortDriftScore: typeof parsed.shortDriftScore === "number" ? parsed.shortDriftScore : 0,
      mediumDriftScore: typeof parsed.mediumDriftScore === "number" ? parsed.mediumDriftScore : 0,
      longDriftScore: typeof parsed.longDriftScore === "number" ? parsed.longDriftScore : 0,
      shockMode: parsed.shockMode === true,
      phase:
        parsed.phase === "shock" || parsed.phase === "recovering" || parsed.phase === "normal"
          ? parsed.phase
          : "normal",
      recoveryStreak: typeof parsed.recoveryStreak === "number" ? parsed.recoveryStreak : 0,
      sampleCount: typeof parsed.sampleCount === "number" ? parsed.sampleCount : 0,
      lastUpdatedAt:
        typeof parsed.lastUpdatedAt === "string" ? parsed.lastUpdatedAt : new Date(0).toISOString(),
      shockUntil: typeof parsed.shockUntil === "string" ? parsed.shockUntil : undefined,
    };
  } catch {
    return createDefaultAllocatorDriftState();
  }
}

function writeAllocatorDriftState(state: ExperimentAllocatorDriftState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_RAMP_DRIFT_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function readAllocatorQualityMemoryState(): ExperimentAllocatorQualityMemoryState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EXP_RAMP_QUALITY_MEMORY_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return {};
    }

    return EXPERIMENT_NAMES.reduce<ExperimentAllocatorQualityMemoryState>((acc, experiment) => {
      const value = parsed[experiment];
      if (!isObjectRecord(value)) {
        return acc;
      }

      const entry: ExperimentAllocatorQualityMemoryEntry = {
        smoothedRouteIntentLiftPoints:
          typeof value.smoothedRouteIntentLiftPoints === "number" ? value.smoothedRouteIntentLiftPoints : 0,
        smoothedRouteValueDelta:
          typeof value.smoothedRouteValueDelta === "number" ? value.smoothedRouteValueDelta : 0,
        smoothedRouteSignalCoverage:
          typeof value.smoothedRouteSignalCoverage === "number" ? value.smoothedRouteSignalCoverage : 0,
        sampleCount: typeof value.sampleCount === "number" ? value.sampleCount : 0,
        lastUpdatedAt:
          typeof value.lastUpdatedAt === "string" ? value.lastUpdatedAt : new Date(0).toISOString(),
      };

      acc[experiment] = entry;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function writeAllocatorQualityMemoryState(state: ExperimentAllocatorQualityMemoryState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_RAMP_QUALITY_MEMORY_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function updateAllocatorQualityMemory(
  experiment: ExperimentName,
  input: {
    routeIntentLiftPoints: number;
    routeValueDelta: number;
    routeSignalCoverage: number;
  },
  policy: ExperimentPolicySettings,
  driftPhase: ExperimentAllocatorDriftState["phase"],
  shockIntensity: number,
  nowMs: number,
  state: ExperimentAllocatorQualityMemoryState,
): {
  memoryIntentLiftPoints: number;
  memoryValueDelta: number;
  memorySignalCoverage: number;
  memoryBoost: number;
  memoryPhaseWeight: number;
  memoryHalfLifeMs: number;
} {
  const prior = state[experiment];
  const phaseHalfLifeMultiplier =
    driftPhase === "shock" ? 0.45 : driftPhase === "recovering" ? 0.75 : 1.25;
  const qualityHalfLifeMs = Math.max(60_000, Math.round(policy.driftHalfLifeMs * phaseHalfLifeMultiplier));
  const priorUpdatedMs = prior ? Date.parse(prior.lastUpdatedAt) : 0;
  const elapsedMs = Number.isFinite(priorUpdatedMs) ? Math.max(0, nowMs - priorUpdatedMs) : 0;

  const decay = Math.exp(-elapsedMs / qualityHalfLifeMs);
  const blend = 1 - decay;

  const smoothedRouteIntentLiftPoints = prior
    ? prior.smoothedRouteIntentLiftPoints * decay + input.routeIntentLiftPoints * blend
    : input.routeIntentLiftPoints;
  const smoothedRouteValueDelta = prior
    ? prior.smoothedRouteValueDelta * decay + input.routeValueDelta * blend
    : input.routeValueDelta;
  const smoothedRouteSignalCoverage = prior
    ? prior.smoothedRouteSignalCoverage * decay + input.routeSignalCoverage * blend
    : input.routeSignalCoverage;

  const sampleCount = (prior?.sampleCount ?? 0) + 1;
  const confidenceWeight = Math.max(0.2, Math.min(1, smoothedRouteSignalCoverage));
  const memoryMaturity = Math.max(0.25, Math.min(1, sampleCount / 8));
  const phaseWeight =
    driftPhase === "shock" ? 0.35 : driftPhase === "recovering" ? 0.7 : 1;
  const shockDamping = Math.max(0.35, 1 - Math.max(0, Math.min(1, shockIntensity)) * 0.55);
  const memoryBoost =
    (smoothedRouteIntentLiftPoints * 0.08 + smoothedRouteValueDelta * 0.16) *
    confidenceWeight *
    memoryMaturity *
    phaseWeight *
    shockDamping;

  state[experiment] = {
    smoothedRouteIntentLiftPoints: Number(smoothedRouteIntentLiftPoints.toFixed(3)),
    smoothedRouteValueDelta: Number(smoothedRouteValueDelta.toFixed(3)),
    smoothedRouteSignalCoverage: Number(smoothedRouteSignalCoverage.toFixed(3)),
    sampleCount,
    lastUpdatedAt: new Date(nowMs).toISOString(),
  };

  return {
    memoryIntentLiftPoints: state[experiment]?.smoothedRouteIntentLiftPoints ?? 0,
    memoryValueDelta: state[experiment]?.smoothedRouteValueDelta ?? 0,
    memorySignalCoverage: state[experiment]?.smoothedRouteSignalCoverage ?? 0,
    memoryBoost: Number(memoryBoost.toFixed(3)),
    memoryPhaseWeight: Number((phaseWeight * shockDamping).toFixed(3)),
    memoryHalfLifeMs: qualityHalfLifeMs,
  };
}

function updateAllocatorDriftState(
  snapshot: ExperimentRollupSnapshot,
  policy: ExperimentPolicySettings,
): ExperimentAllocatorDriftState {
  const prior = readAllocatorDriftState();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const decisions = EXPERIMENT_NAMES.map((experiment) =>
    evaluateExperimentDecision(experiment, snapshot, { profile: "balanced" }),
  ).filter((decision) => decision.recommendation !== "insufficient_data");

  const currentAbsDelta =
    decisions.length > 0
      ? decisions.reduce((acc, decision) => acc + Math.abs(decision.deltaCvrPoints), 0) / decisions.length
      : 0;
  const currentAbsZ =
    decisions.length > 0
      ? decisions.reduce((acc, decision) => acc + Math.abs(decision.zScore), 0) / decisions.length
      : 0;

  const lastUpdatedMs = Date.parse(prior.lastUpdatedAt);
  const elapsedMs = Number.isFinite(lastUpdatedMs) ? Math.max(0, now - lastUpdatedMs) : 0;
  const shortHalfLife = Math.max(30_000, Math.round(policy.driftHalfLifeMs * 0.5));
  const mediumHalfLife = Math.max(30_000, policy.driftHalfLifeMs);
  const longHalfLife = Math.max(30_000, Math.round(policy.driftHalfLifeMs * 2));

  const shortDecay = Math.exp(-elapsedMs / shortHalfLife);
  const mediumDecay = Math.exp(-elapsedMs / mediumHalfLife);
  const longDecay = Math.exp(-elapsedMs / longHalfLife);

  const shortBlend = 1 - shortDecay;
  const mediumBlend = 1 - mediumDecay;
  const longBlend = 1 - longDecay;

  const shortSmoothedAbsDeltaCvrPoints =
    prior.sampleCount > 0
      ? prior.shortSmoothedAbsDeltaCvrPoints * shortDecay + currentAbsDelta * shortBlend
      : currentAbsDelta;
  const shortSmoothedAbsZScore =
    prior.sampleCount > 0
      ? prior.shortSmoothedAbsZScore * shortDecay + currentAbsZ * shortBlend
      : currentAbsZ;

  const smoothedAbsDeltaCvrPoints =
    prior.sampleCount > 0
      ? prior.smoothedAbsDeltaCvrPoints * mediumDecay + currentAbsDelta * mediumBlend
      : currentAbsDelta;
  const smoothedAbsZScore =
    prior.sampleCount > 0
      ? prior.smoothedAbsZScore * mediumDecay + currentAbsZ * mediumBlend
      : currentAbsZ;

  const longSmoothedAbsDeltaCvrPoints =
    prior.sampleCount > 0
      ? prior.longSmoothedAbsDeltaCvrPoints * longDecay + currentAbsDelta * longBlend
      : currentAbsDelta;
  const longSmoothedAbsZScore =
    prior.sampleCount > 0
      ? prior.longSmoothedAbsZScore * longDecay + currentAbsZ * longBlend
      : currentAbsZ;

  const shortDriftScore =
    Math.abs(currentAbsDelta - shortSmoothedAbsDeltaCvrPoints) +
    0.6 * Math.abs(currentAbsZ - shortSmoothedAbsZScore);
  const mediumDriftScore =
    Math.abs(currentAbsDelta - smoothedAbsDeltaCvrPoints) +
    0.6 * Math.abs(currentAbsZ - smoothedAbsZScore);
  const longDriftScore =
    Math.abs(currentAbsDelta - longSmoothedAbsDeltaCvrPoints) +
    0.6 * Math.abs(currentAbsZ - longSmoothedAbsZScore);

  const driftScore = shortDriftScore * 0.5 + mediumDriftScore * 0.3 + longDriftScore * 0.2;

  const recoveryThreshold = policy.driftShockThreshold * policy.driftRecoveryThresholdRatio;

  const priorShockUntilMs = prior.shockUntil ? Date.parse(prior.shockUntil) : 0;
  const priorShockActive = Number.isFinite(priorShockUntilMs) && priorShockUntilMs > now;
  const triggeredShock = driftScore >= policy.driftShockThreshold;
  const shockUntilMs = triggeredShock
    ? now + policy.driftShockHoldMs
    : priorShockActive
      ? priorShockUntilMs
      : 0;

  const shockMode = shockUntilMs > now;
  const priorPhase = prior.phase ?? "normal";

  let phase: ExperimentAllocatorDriftState["phase"] = "normal";
  let recoveryStreak = 0;

  if (shockMode) {
    phase = "shock";
  } else {
    const recoveringPath = prior.shockMode || priorPhase === "recovering";
    if (recoveringPath) {
      const belowRecoveryThreshold = driftScore <= recoveryThreshold;
      const nextRecoveryStreak = belowRecoveryThreshold ? (prior.recoveryStreak ?? 0) + 1 : 0;
      if (nextRecoveryStreak >= policy.driftRecoveryConfirmations) {
        phase = "normal";
        recoveryStreak = 0;
      } else {
        phase = "recovering";
        recoveryStreak = nextRecoveryStreak;
      }
    }
  }

  const next: ExperimentAllocatorDriftState = {
    shortSmoothedAbsDeltaCvrPoints: Number(shortSmoothedAbsDeltaCvrPoints.toFixed(3)),
    shortSmoothedAbsZScore: Number(shortSmoothedAbsZScore.toFixed(3)),
    smoothedAbsDeltaCvrPoints: Number(smoothedAbsDeltaCvrPoints.toFixed(3)),
    smoothedAbsZScore: Number(smoothedAbsZScore.toFixed(3)),
    longSmoothedAbsDeltaCvrPoints: Number(longSmoothedAbsDeltaCvrPoints.toFixed(3)),
    longSmoothedAbsZScore: Number(longSmoothedAbsZScore.toFixed(3)),
    driftScore: Number(driftScore.toFixed(3)),
    shortDriftScore: Number(shortDriftScore.toFixed(3)),
    mediumDriftScore: Number(mediumDriftScore.toFixed(3)),
    longDriftScore: Number(longDriftScore.toFixed(3)),
    shockMode,
    phase,
    recoveryStreak,
    sampleCount: prior.sampleCount + 1,
    lastUpdatedAt: nowIso,
    shockUntil: shockUntilMs > now ? new Date(shockUntilMs).toISOString() : undefined,
  };

  writeAllocatorDriftState(next);
  return next;
}

function computeWindowVelocityUsage(
  entries: ExperimentRampVelocityWindowEntry[],
  windowMs: number,
  nowMs: number,
): {
  filtered: ExperimentRampVelocityWindowEntry[];
  usedShift: number;
} {
  const filtered = entries.filter((entry) => {
    const timestampMs = Date.parse(entry.timestamp);
    if (!Number.isFinite(timestampMs)) {
      return false;
    }

    return nowMs - timestampMs <= windowMs;
  });

  const usedShift = filtered.reduce((acc, item) => acc + Math.max(0, item.stepSize), 0);
  return { filtered, usedShift };
}

function getNextRampTarget(current: number): number | null {
  const sorted = [...RAMP_STEPS];
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index] > current) {
      return sorted[index];
    }
  }
  return null;
}

function getPreviousRampTarget(current: number): number | null {
  const sorted = [...RAMP_STEPS].reverse();
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index] < current) {
      return sorted[index];
    }
  }
  return null;
}

function getRampIndex(current: number): number {
  return RAMP_STEPS.findIndex((step) => step === current);
}

function getRampTargetByStride(
  current: number,
  direction: "up" | "down",
  stride: number,
): number | null {
  const currentIndex = getRampIndex(current);
  if (currentIndex < 0) {
    return null;
  }

  const moveBy = Math.max(1, Math.round(stride));
  const nextIndex =
    direction === "up"
      ? Math.min(RAMP_STEPS.length - 1, currentIndex + moveBy)
      : Math.max(0, currentIndex - moveBy);

  if (nextIndex === currentIndex) {
    return null;
  }

  return RAMP_STEPS[nextIndex] ?? null;
}

function getRampTargetWithinStepBudget(
  current: number,
  direction: "up" | "down",
  stride: number,
  maxStepSize: number,
): number | null {
  const currentIndex = getRampIndex(current);
  if (currentIndex < 0 || maxStepSize <= 0) {
    return null;
  }

  let bestTarget: number | null = null;
  let index = currentIndex;

  for (let move = 0; move < Math.max(1, stride); move += 1) {
    const nextIndex = direction === "up" ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex >= RAMP_STEPS.length) {
      break;
    }

    const candidate = RAMP_STEPS[nextIndex];
    const candidateStep = Math.abs(candidate - current);
    if (candidateStep > maxStepSize) {
      break;
    }

    bestTarget = candidate;
    index = nextIndex;
  }

  return bestTarget;
}

function resolveRampStride(
  decision: ExperimentDecisionSummary,
  profile: ExperimentPolicyProfile,
  regime: ExperimentPolicyRegimeState | null,
  adaptive: ExperimentPolicyAdaptiveState | null,
): {
  stride: number;
  rationale: string;
} {
  let score = 1;
  const reasons: string[] = ["base stride 1"];

  if (decision.confidence === "high") {
    score += 0.75;
    reasons.push("high confidence");
  } else if (decision.confidence === "medium") {
    score += 0.35;
    reasons.push("medium confidence");
  }

  const z = Math.abs(decision.zScore);
  if (z >= 3) {
    score += 0.55;
    reasons.push("very strong z-score");
  } else if (z >= 2.2) {
    score += 0.25;
    reasons.push("strong z-score");
  }

  const absDelta = Math.abs(decision.deltaCvrPoints);
  if (absDelta >= 3) {
    score += 0.4;
    reasons.push("large CVR delta");
  } else if (absDelta < 1.2) {
    score -= 0.2;
    reasons.push("small CVR delta");
  }

  if (profile === "aggressive") {
    score += 0.3;
    reasons.push("aggressive profile");
  } else if (profile === "conservative") {
    score -= 0.3;
    reasons.push("conservative profile");
  }

  if (regime) {
    if (regime.smoothedCoverage >= 0.72) {
      score += 0.3;
      reasons.push("high regime coverage");
    } else if (regime.smoothedCoverage <= 0.5) {
      score -= 0.25;
      reasons.push("limited regime coverage");
    }

    if (regime.smoothedAbsDeltaCvrPoints >= 3.2) {
      score += 0.3;
      reasons.push("strong regime signal");
    }
  }

  if (getExperimentPolicyAdaptiveEnabled() && adaptive) {
    if (adaptive.sensitivity >= 1.08) {
      score += 0.2;
      reasons.push("adaptive sensitivity boost");
    }
    if (adaptive.stability >= 1.18) {
      score -= 0.2;
      reasons.push("adaptive stability brake");
    }
  }

  const stride = Math.max(1, Math.min(3, Math.round(score)));
  return {
    stride,
    rationale: `Ramp stride ${stride} (${reasons.join(", ")}).`,
  };
}

function computeConversionRate(entry?: ExperimentRollupEntry): number {
  if (!entry || entry.exposureCount <= 0) {
    return 0;
  }

  return entry.goalCount / entry.exposureCount;
}

function createEmptyRollupEntry(): ExperimentRollupEntry {
  return {
    exposureCount: 0,
    goalCount: 0,
    weightedGoalValue: 0,
    goalsByAction: {},
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRollupEntry(value: unknown): ExperimentRollupEntry {
  if (!isObjectRecord(value)) {
    return createEmptyRollupEntry();
  }

  const exposureCount = typeof value.exposureCount === "number" ? value.exposureCount : 0;
  const goalCount = typeof value.goalCount === "number" ? value.goalCount : 0;
  const weightedGoalValue = typeof value.weightedGoalValue === "number" ? value.weightedGoalValue : 0;

  const goalsByAction = isObjectRecord(value.goalsByAction)
    ? Object.entries(value.goalsByAction).reduce<Record<string, number>>((acc, [action, count]) => {
        if (typeof count === "number") {
          acc[action] = count;
        }
        return acc;
      }, {})
    : {};

  return {
    exposureCount,
    goalCount,
    weightedGoalValue,
    goalsByAction,
  };
}

function normalizeRollupSnapshot(rawValue: unknown): ExperimentRollupSnapshot {
  if (!isObjectRecord(rawValue)) {
    return {};
  }

  return EXPERIMENT_NAMES.reduce<ExperimentRollupSnapshot>((snapshot, name) => {
    const rawExperimentValue = rawValue[name];
    if (!rawExperimentValue || !isObjectRecord(rawExperimentValue)) {
      return snapshot;
    }

    if (typeof rawExperimentValue.variant === "string") {
      const legacyVariant = rawExperimentValue.variant;
      if (isVariantForExperiment(name, legacyVariant)) {
        snapshot[name] = {
          [legacyVariant]: normalizeRollupEntry(rawExperimentValue),
        };
      }
      return snapshot;
    }

    const byVariant: ExperimentRollupByVariant = {};
    EXPERIMENT_VARIANTS[name].forEach((variant) => {
      const rawVariantValue = rawExperimentValue[variant];
      if (rawVariantValue) {
        byVariant[variant] = normalizeRollupEntry(rawVariantValue);
      }
    });

    if (Object.keys(byVariant).length > 0) {
      snapshot[name] = byVariant;
    }

    return snapshot;
  }, {});
}

function readRollupSnapshot(): ExperimentRollupSnapshot {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(EXP_ROLLUP_STORAGE_KEY);
    if (!raw) return {};
    return normalizeRollupSnapshot(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeRollupSnapshot(snapshot: ExperimentRollupSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(EXP_ROLLUP_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures.
  }
}

function upsertRollup(
  name: ExperimentName,
  variant: ExperimentVariant,
  update: (entry: ExperimentRollupEntry) => ExperimentRollupEntry,
) {
  const snapshot = readRollupSnapshot();
  const experimentSnapshot = snapshot[name] ?? {};
  const currentVariantEntry = experimentSnapshot[variant] ?? createEmptyRollupEntry();

  snapshot[name] = {
    ...experimentSnapshot,
    [variant]: update(currentVariantEntry),
  };

  writeRollupSnapshot(snapshot);
}

export function resolveExperimentVariant(
  name: ExperimentName,
  fallback: ExperimentVariant = "control",
): ExperimentVariant {
  if (typeof window === "undefined") {
    return fallback;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const override = searchParams.get(`exp_${name}`);

  if (override && isVariantForExperiment(name, override)) {
    try {
      window.localStorage.setItem(experimentStorageKey(name), override);
    } catch {
      // Ignore storage failures and keep runtime override.
    }
    return override;
  }

  try {
    const stored = window.localStorage.getItem(experimentStorageKey(name));
    if (stored && isVariantForExperiment(name, stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access issues.
  }

  const rolloutTarget = getExperimentRolloutTarget(name);
  if (rolloutTarget !== null) {
    const visitorId = getOrCreateVisitorId();
    const bucket = computeHashBucket(`${name}:${visitorId}`);
    const assignedFromRollout: ExperimentVariant = bucket < rolloutTarget ? "accelerated" : "control";

    try {
      window.localStorage.setItem(experimentStorageKey(name), assignedFromRollout);
    } catch {
      // Ignore storage failures.
    }

    return assignedFromRollout;
  }

  const assigned = pickRandomVariant(name);

  try {
    window.localStorage.setItem(experimentStorageKey(name), assigned);
  } catch {
    // Ignore storage failures.
  }

  return assigned;
}

export function trackExperimentExposure(
  name: ExperimentName,
  variant: ExperimentVariant,
  surface: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  const exposureKey = `${EXP_EXPOSURE_PREFIX}${name}:${variant}:${surface}`;

  try {
    const alreadyTracked = window.sessionStorage.getItem(exposureKey);
    if (alreadyTracked === "1") {
      return;
    }

    window.sessionStorage.setItem(exposureKey, "1");
  } catch {
    // If sessionStorage fails, continue and emit event once per invocation.
  }

  event({
    action: "experiment_exposure",
    category: "experiments",
    label: `${name}:${variant}:${surface}`,
    value: 1,
  });

  upsertRollup(name, variant, (entry) => ({
    ...entry,
    exposureCount: entry.exposureCount + 1,
  }));
}

export function trackExperimentGoal(
  name: ExperimentName,
  variant: ExperimentVariant,
  goalAction: string,
  surface: string,
  value: number,
) {
  if (typeof window === "undefined") {
    return;
  }

  event({
    action: "experiment_goal",
    category: "experiments",
    label: `${name}:${variant}:${goalAction}:${surface}`,
    value,
  });

  upsertRollup(name, variant, (entry) => ({
    ...entry,
    goalCount: entry.goalCount + 1,
    weightedGoalValue: entry.weightedGoalValue + value,
    goalsByAction: {
      ...entry.goalsByAction,
      [goalAction]: (entry.goalsByAction[goalAction] ?? 0) + 1,
    },
  }));
}

export function getExperimentSessionRollup(): ExperimentRollupSnapshot {
  return readRollupSnapshot();
}

export function clearExperimentSessionRollup() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(EXP_ROLLUP_STORAGE_KEY);

    const exposureKeys: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(EXP_EXPOSURE_PREFIX)) {
        exposureKeys.push(key);
      }
    }

    exposureKeys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore storage failures.
  }
}

export function listAssignedExperimentVariants(): Partial<Record<ExperimentName, ExperimentVariant>> {
  if (typeof window === "undefined") {
    return {};
  }

  return EXPERIMENT_NAMES.reduce<Partial<Record<ExperimentName, ExperimentVariant>>>(
    (acc, experimentName) => {
      const storedVariant = window.localStorage.getItem(experimentStorageKey(experimentName));

      if (
        storedVariant &&
        EXPERIMENT_VARIANTS[experimentName].includes(storedVariant as ExperimentVariant)
      ) {
        acc[experimentName] = storedVariant as ExperimentVariant;
      }

      return acc;
    },
    {},
  );
}

export function listExperimentNames(): ExperimentName[] {
  return [...EXPERIMENT_NAMES];
}

export function setAssignedExperimentVariant(name: ExperimentName, variant: ExperimentVariant) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(experimentStorageKey(name), variant);
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_lock_variant",
    category: "experiments",
    label: `${name}:${variant}`,
    value: 1,
  });
}

export function clearAssignedExperimentVariant(name: ExperimentName) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(experimentStorageKey(name));
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_unlock_variant",
    category: "experiments",
    label: name,
    value: 1,
  });
}

export function getExperimentRolloutTarget(name: ExperimentName): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(experimentRolloutStorageKey(name));
    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return clampPercentage(parsed);
  } catch {
    return null;
  }
}

export function listExperimentRolloutTargets(): Partial<Record<ExperimentName, number>> {
  if (typeof window === "undefined") {
    return {};
  }

  return EXPERIMENT_NAMES.reduce<Partial<Record<ExperimentName, number>>>((acc, experimentName) => {
    const target = getExperimentRolloutTarget(experimentName);
    if (target !== null) {
      acc[experimentName] = target;
    }
    return acc;
  }, {});
}

export function setExperimentRolloutTarget(name: ExperimentName, acceleratedPercent: number) {
  if (typeof window === "undefined") {
    return;
  }

  const sanitized = clampPercentage(acceleratedPercent);

  try {
    window.localStorage.setItem(experimentRolloutStorageKey(name), String(sanitized));
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_set_rollout",
    category: "experiments",
    label: `${name}:${sanitized}`,
    value: sanitized,
  });
}

export function clearExperimentRolloutTarget(name: ExperimentName) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(experimentRolloutStorageKey(name));
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_clear_rollout",
    category: "experiments",
    label: name,
    value: 1,
  });
}

export function listExperimentGuardrailEvents(): ExperimentGuardrailEvent[] {
  return readGuardrailLog();
}

export function clearExperimentGuardrailEvents() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(EXP_GUARDRAIL_LOG_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function listExperimentRampEvents(): ExperimentRampEvent[] {
  return readRampLog();
}

export function clearExperimentRampEvents() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(EXP_RAMP_LOG_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getExperimentPolicyProfile(): ExperimentPolicyProfile {
  if (typeof window === "undefined") {
    return "balanced";
  }

  try {
    const raw = window.localStorage.getItem(EXP_POLICY_PROFILE_KEY);
    if (raw && isExperimentPolicyProfile(raw)) {
      return raw;
    }
  } catch {
    // Ignore storage failures.
  }

  return "balanced";
}

export function setExperimentPolicyProfile(profile: ExperimentPolicyProfile, source: "manual" | "auto" = "manual") {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_PROFILE_KEY, profile);
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_set_policy_profile",
    category: "experiments",
    label: `${source}:${profile}`,
    value: 1,
  });
}

export function getExperimentPolicyAutoswitchEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(EXP_POLICY_AUTOSWITCH_KEY) === "1";
  } catch {
    return false;
  }
}

export function setExperimentPolicyAutoswitchEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_AUTOSWITCH_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_policy_autoswitch_toggle",
    category: "experiments",
    label: enabled ? "on" : "off",
    value: enabled ? 1 : 0,
  });
}

export function listExperimentPolicySwitchEvents(): ExperimentPolicySwitchEvent[] {
  return readPolicySwitchLog();
}

export function clearExperimentPolicySwitchEvents() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(EXP_POLICY_SWITCH_LOG_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getExperimentPolicyRegimeState(): ExperimentPolicyRegimeState | null {
  return readPolicyRegimeState();
}

export function getExperimentPolicyDiagnostics(): ExperimentPolicyDiagnostics {
  return readPolicyDiagnostics();
}

export function getExperimentPolicyAdaptiveState(): ExperimentPolicyAdaptiveState | null {
  return readPolicyAdaptiveState();
}

export function getExperimentAllocatorDriftState(): ExperimentAllocatorDriftState {
  return readAllocatorDriftState();
}

export function getExperimentPolicyAdaptiveEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(EXP_POLICY_ADAPTIVE_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setExperimentPolicyAdaptiveEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXP_POLICY_ADAPTIVE_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }

  event({
    action: "experiment_policy_adaptive_toggle",
    category: "experiments",
    label: enabled ? "on" : "off",
    value: enabled ? 1 : 0,
  });
}

export function clearExperimentPolicyAdaptiveState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(EXP_POLICY_ADAPTIVE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function clearExperimentPolicyDiagnostics() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(EXP_POLICY_DIAGNOSTICS_KEY);
    window.localStorage.removeItem(EXP_POLICY_ADAPTIVE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getExperimentPolicyPendingSwitch(): ExperimentPolicyPendingSwitch | null {
  const meta = readPolicyMeta();
  if (!meta.pendingProfile || !meta.pendingCount || !meta.pendingReason) {
    return null;
  }

  const requiredConfirmations =
    getExperimentPolicySettings(getExperimentPolicyProfile()).autoswitchConfirmationCount;

  return {
    pendingProfile: meta.pendingProfile,
    confirmationCount: meta.pendingCount,
    requiredConfirmations,
    reason: meta.pendingReason,
  };
}

export function runExperimentPolicyAutoswitch(
  snapshot: ExperimentRollupSnapshot,
  options?: { cooldownMs?: number },
): ExperimentPolicySwitchEvent | null {
  const decisions = EXPERIMENT_NAMES.map((experiment) =>
    evaluateExperimentDecision(experiment, snapshot, { profile: "balanced" }),
  );

  const sufficientDecisions = decisions.filter((decision) => decision.recommendation !== "insufficient_data");
  const sufficientCoverage = decisions.length > 0 ? sufficientDecisions.length / decisions.length : 0;
  const meanAbsDeltaCvrPoints =
    sufficientDecisions.length > 0
      ? sufficientDecisions.reduce((acc, decision) => acc + Math.abs(decision.deltaCvrPoints), 0) /
        sufficientDecisions.length
      : 0;

  const priorRegime = readPolicyRegimeState();
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const halfLifeMs = 30 * 60 * 1000;

  let smoothedAbsDeltaCvrPoints = meanAbsDeltaCvrPoints;
  let smoothedCoverage = sufficientCoverage;
  let sampleCount = 1;

  if (priorRegime) {
    const lastUpdatedMs = Date.parse(priorRegime.lastUpdatedAt);
    const elapsedMs = Number.isFinite(lastUpdatedMs) ? Math.max(0, nowMs - lastUpdatedMs) : 0;
    const decay = Math.exp(-elapsedMs / halfLifeMs);
    const blending = 1 - decay;

    smoothedAbsDeltaCvrPoints =
      priorRegime.smoothedAbsDeltaCvrPoints * decay + meanAbsDeltaCvrPoints * blending;
    smoothedCoverage = priorRegime.smoothedCoverage * decay + sufficientCoverage * blending;
    sampleCount = priorRegime.sampleCount + 1;
  }

  writePolicyRegimeState({
    smoothedAbsDeltaCvrPoints,
    smoothedCoverage,
    sampleCount,
    lastUpdatedAt: nowIso,
  });

  let nextProfile: ExperimentPolicyProfile = "balanced";
  let reason = "Data is mixed; balanced mode remains optimal.";
  let reasonCode = "no_change";

  if (smoothedCoverage < 0.5) {
    nextProfile = "conservative";
    reason = "Coverage is persistently low; prioritize safety until sample depth improves.";
    reasonCode = "coverage_veto";
  } else if (smoothedAbsDeltaCvrPoints >= 3) {
    nextProfile = "aggressive";
    reason = "Directional edge is sustained; accelerate exploitation.";
  } else if (smoothedAbsDeltaCvrPoints <= 1.0) {
    nextProfile = "conservative";
    reason = "Signal remains weak over time; hold conservative policy.";
  }

  const currentProfile = getExperimentPolicyProfile();
  const activePolicy = getExperimentPolicySettings(currentProfile);
  const bandPoints = activePolicy.autoswitchBandPoints;
  const coverageBand = activePolicy.autoswitchCoverageBand;

  const upperAggressiveThreshold = 3 + bandPoints;
  const lowerConservativeThreshold = 1 - bandPoints;
  const lowerBalancedThreshold = 1 + bandPoints;
  const upperBalancedThreshold = 3 - bandPoints;
  const lowCoverageThreshold = 0.5 - coverageBand;
  const healthyCoverageThreshold = 0.5 + coverageBand;

  if (smoothedCoverage < lowCoverageThreshold) {
    nextProfile = "conservative";
    reason = "Coverage trend breached safety band; vetoing aggressive modes.";
    reasonCode = "coverage_veto";
  } else if (smoothedAbsDeltaCvrPoints >= upperAggressiveThreshold) {
    nextProfile = "aggressive";
    reason = "Signal exceeded aggressive confidence band across sessions.";
    reasonCode = "no_change";
  } else if (smoothedAbsDeltaCvrPoints <= lowerConservativeThreshold) {
    nextProfile = "conservative";
    reason = "Signal remained below conservative band across sessions.";
    reasonCode = "no_change";
  } else if (
    smoothedCoverage >= healthyCoverageThreshold &&
    smoothedAbsDeltaCvrPoints >= lowerBalancedThreshold &&
    smoothedAbsDeltaCvrPoints <= upperBalancedThreshold
  ) {
    nextProfile = "balanced";
    reason = "Regime has stabilized inside balanced confidence bands.";
    reasonCode = "no_change";
  } else {
    nextProfile = currentProfile;
    reason = "Within veto band; waiting for stronger confirmation before switching.";
    reasonCode = "signal_band_veto";
  }

  if (currentProfile === nextProfile) {
    writePolicyMeta({
      ...readPolicyMeta(),
      pendingProfile: undefined,
      pendingCount: undefined,
      pendingReason: undefined,
    });
    trackPolicyDiagnostics(reasonCode, reason);
    return null;
  }

  const cooldownMs = options?.cooldownMs ?? 5 * 60 * 1000;
  const meta = readPolicyMeta();
  const lastSwitchMs = meta.lastSwitchAt ? Date.parse(meta.lastSwitchAt) : 0;
  const now = Date.now();

  if (lastSwitchMs && Number.isFinite(lastSwitchMs) && now - lastSwitchMs < cooldownMs) {
    trackPolicyDiagnostics("cooldown_veto", "Autoswitch blocked by cooldown window.");
    return null;
  }

  const metaBeforeConfirm = readPolicyMeta();
  const priorPendingProfile = metaBeforeConfirm.pendingProfile;
  const priorPendingCount = metaBeforeConfirm.pendingCount ?? 0;
  const requiredConfirmations = activePolicy.autoswitchConfirmationCount;

  const confirmationCount = priorPendingProfile === nextProfile ? priorPendingCount + 1 : 1;

  if (confirmationCount < requiredConfirmations) {
    writePolicyMeta({
      ...metaBeforeConfirm,
      pendingProfile: nextProfile,
      pendingCount: confirmationCount,
      pendingReason: reason,
    });

    trackPolicyDiagnostics("confirmation_pending", `Awaiting confirmation for ${nextProfile} profile.`);

    return null;
  }

  setExperimentPolicyProfile(nextProfile, "auto");
  const timestamp = new Date().toISOString();
  writePolicyMeta({
    lastSwitchAt: timestamp,
    pendingProfile: undefined,
    pendingCount: undefined,
    pendingReason: undefined,
  });

  const switchEvent: ExperimentPolicySwitchEvent = {
    previousProfile: currentProfile,
    nextProfile,
    reason,
    timestamp,
    meanAbsDeltaCvrPoints,
    sufficientCoverage,
    smoothedAbsDeltaCvrPoints,
    smoothedCoverage,
  };

  appendPolicySwitchEvent(switchEvent);

  event({
    action: "experiment_policy_autoswitch",
    category: "experiments",
    label: `${currentProfile}->${nextProfile}`,
    value: Math.round(smoothedAbsDeltaCvrPoints * 100),
  });

  trackPolicyDiagnostics("switched", reason);

  return switchEvent;
}

export function applyExperimentRecommendation(
  decision: ExperimentDecisionSummary,
  options?: { clearCurrentAssignment?: boolean; profile?: ExperimentPolicyProfile },
) {
  const policy = getExperimentPolicySettings(options?.profile ?? "balanced");

  if (decision.recommendation === "promote_accelerated") {
    setExperimentRolloutTarget(
      decision.experiment,
      policy.recommendationRolloutTarget.promoteAccelerated,
    );
    if (options?.clearCurrentAssignment) {
      clearAssignedExperimentVariant(decision.experiment);
    }
    return;
  }

  if (decision.recommendation === "keep_control") {
    setExperimentRolloutTarget(decision.experiment, policy.recommendationRolloutTarget.keepControl);
    if (options?.clearCurrentAssignment) {
      clearAssignedExperimentVariant(decision.experiment);
    }
  }
}

export function runExperimentGuardrailAutoRollback(
  snapshot: ExperimentRollupSnapshot,
  options?: { clearCurrentAssignment?: boolean; profile?: ExperimentPolicyProfile },
): ExperimentGuardrailEvent[] {
  const rollbacks: ExperimentGuardrailEvent[] = [];
  const profile = options?.profile ?? "balanced";

  EXPERIMENT_NAMES.forEach((experiment) => {
    const rolloutTarget = getExperimentRolloutTarget(experiment);
    if (rolloutTarget === null || rolloutTarget <= 50) {
      return;
    }

    const decision = evaluateExperimentDecision(experiment, snapshot, { profile });
    const shouldRollback =
      decision.recommendation === "keep_control" &&
      (decision.confidence === "medium" || decision.confidence === "high");

    if (!shouldRollback) {
      return;
    }

    const nextRollout = 50;
    setExperimentRolloutTarget(experiment, nextRollout);
    if (options?.clearCurrentAssignment) {
      clearAssignedExperimentVariant(experiment);
    }

    const rollbackEvent: ExperimentGuardrailEvent = {
      experiment,
      previousRollout: rolloutTarget,
      nextRollout,
      recommendation: decision.recommendation,
      confidence: decision.confidence,
      rationale: decision.rationale,
      timestamp: new Date().toISOString(),
    };

    appendGuardrailEvent(rollbackEvent);

    event({
      action: "experiment_guardrail_rollback",
      category: "experiments",
      label: `${experiment}:${rolloutTarget}->${nextRollout}`,
      value: nextRollout,
    });

    rollbacks.push(rollbackEvent);
  });

  return rollbacks;
}

function scoreRampOpportunity(decision: ExperimentDecisionSummary): number {
  const confidenceWeight = decision.confidence === "high" ? 1 : decision.confidence === "medium" ? 0.5 : 0;
  const safetyWeight = decision.recommendation === "keep_control" ? 0.15 : 0;

  return (
    Math.abs(decision.deltaCvrPoints) * 0.5 +
    Math.abs(decision.zScore) * 0.35 +
    confidenceWeight +
    safetyWeight
  );
}

function summarizeRouteIntent(entry?: ExperimentRollupEntry): {
  routeGoalCount: number;
  intentDensity: number;
  averageGoalValue: number;
} {
  if (!entry) {
    return {
      routeGoalCount: 0,
      intentDensity: 0,
      averageGoalValue: 0,
    };
  }

  const routeGoalCount = Object.entries(entry.goalsByAction).reduce((acc, [action, count]) => {
    if (!action.includes(":route_")) {
      return acc;
    }

    return acc + Math.max(0, count);
  }, 0);

  return {
    routeGoalCount,
    intentDensity: entry.exposureCount > 0 ? routeGoalCount / entry.exposureCount : 0,
    averageGoalValue: entry.goalCount > 0 ? entry.weightedGoalValue / entry.goalCount : 0,
  };
}

function computeBayesianAllocatorSignals(
  experiment: ExperimentName,
  snapshot: ExperimentRollupSnapshot,
  rolloutTarget: number,
  decision: ExperimentDecisionSummary,
): {
  weightedOpportunityScore: number;
  bayesianLiftPoints: number;
  bayesianUncertaintyPoints: number;
  regretPressurePoints: number;
  routeIntentLiftPoints: number;
  routeValueDelta: number;
  routeSignalCoverage: number;
} {
  const byVariant = snapshot[experiment] ?? {};
  const control = byVariant.control;
  const accelerated = byVariant.accelerated;

  const controlExposure = Math.max(0, control?.exposureCount ?? 0);
  const controlGoals = Math.max(0, control?.goalCount ?? 0);
  const acceleratedExposure = Math.max(0, accelerated?.exposureCount ?? 0);
  const acceleratedGoals = Math.max(0, accelerated?.goalCount ?? 0);

  const controlAlpha = controlGoals + 1;
  const controlBeta = Math.max(0, controlExposure - controlGoals) + 1;
  const acceleratedAlpha = acceleratedGoals + 1;
  const acceleratedBeta = Math.max(0, acceleratedExposure - acceleratedGoals) + 1;

  const controlMean = controlAlpha / (controlAlpha + controlBeta);
  const acceleratedMean = acceleratedAlpha / (acceleratedAlpha + acceleratedBeta);
  const bayesianLiftPoints = (acceleratedMean - controlMean) * 100;

  const controlVariance =
    (controlAlpha * controlBeta) /
    (((controlAlpha + controlBeta) ** 2) * (controlAlpha + controlBeta + 1));
  const acceleratedVariance =
    (acceleratedAlpha * acceleratedBeta) /
    (((acceleratedAlpha + acceleratedBeta) ** 2) * (acceleratedAlpha + acceleratedBeta + 1));

  const bayesianUncertaintyPoints = Math.sqrt(controlVariance + acceleratedVariance) * 100;

  const regretPressurePoints =
    decision.recommendation === "promote_accelerated"
      ? Math.max(0, bayesianLiftPoints) * ((100 - rolloutTarget) / 100)
      : decision.recommendation === "keep_control"
        ? Math.max(0, -bayesianLiftPoints) * (rolloutTarget / 100)
        : Math.abs(bayesianLiftPoints) * 0.2;

  const confidenceFactor = Math.max(0.45, Math.min(1.25, 1.2 - bayesianUncertaintyPoints / 15));
  const baseOpportunity = scoreRampOpportunity(decision);

  const controlRouteIntent = summarizeRouteIntent(control);
  const acceleratedRouteIntent = summarizeRouteIntent(accelerated);
  const routeIntentLiftPoints = (acceleratedRouteIntent.intentDensity - controlRouteIntent.intentDensity) * 100;
  const routeValueDelta = acceleratedRouteIntent.averageGoalValue - controlRouteIntent.averageGoalValue;
  const routeSignalCoverage =
    (acceleratedRouteIntent.routeGoalCount + controlRouteIntent.routeGoalCount) /
    Math.max(1, acceleratedGoals + controlGoals);
  const qualitySignalWeight = Math.max(0.2, Math.min(1, routeSignalCoverage));
  const routeQualityAdjustment =
    routeIntentLiftPoints * 0.12 * qualitySignalWeight + routeValueDelta * 0.18 * qualitySignalWeight;

  const weightedOpportunityScore =
    baseOpportunity * confidenceFactor +
    regretPressurePoints * 0.6 +
    Math.max(0, bayesianLiftPoints) * 0.2 +
    routeQualityAdjustment;

  return {
    weightedOpportunityScore,
    bayesianLiftPoints,
    bayesianUncertaintyPoints,
    regretPressurePoints,
    routeIntentLiftPoints,
    routeValueDelta,
    routeSignalCoverage,
  };
}

export function runExperimentRampAutopilot(
  snapshot: ExperimentRollupSnapshot,
  options?: { clearCurrentAssignment?: boolean; cooldownMs?: number; profile?: ExperimentPolicyProfile },
): ExperimentRampEvent[] {
  const profile = options?.profile ?? "balanced";
  const policy = getExperimentPolicySettings(profile);
  const cooldownMs = options?.cooldownMs ?? policy.rampCooldownMs;
  const now = Date.now();
  const qualityMemoryState = readAllocatorQualityMemoryState();
  let qualityMemoryUpdated = false;
  const meta = readRampMeta();
  const velocityMeta = readRampVelocityMeta();
  const actions: ExperimentRampEvent[] = [];
  const regime = getExperimentPolicyRegimeState();
  const adaptive = getExperimentPolicyAdaptiveState();
  const driftState = updateAllocatorDriftState(snapshot, policy);
  const shockIntensity =
    driftState.phase === "shock" ? 1 : driftState.phase === "recovering" ? 0.45 : 0;
  const portfolioWindowMs = policy.rampPortfolioWindowMs;
  const portfolioBudget = policy.rampPortfolioMaxShiftPerWindow;

  const priorPortfolioEntries = readRampPortfolioMeta();
  const portfolioWindow = computeWindowVelocityUsage(priorPortfolioEntries, portfolioWindowMs, now);
  let portfolioUsed = portfolioWindow.usedShift;
  let portfolioRemaining = Math.max(0, portfolioBudget - portfolioUsed);
  const nextPortfolioEntries = [...portfolioWindow.filtered];

  interface RampCandidate {
    experiment: ExperimentName;
    rolloutTarget: number;
    direction: "up" | "down";
    stride: number;
    decision: ExperimentDecisionSummary;
    velocityWindowUsedBefore: number;
    velocityWindowBudget: number;
    availableVelocity: number;
    velocityFilteredEntries: ExperimentRampVelocityWindowEntry[];
    strideRationale: string;
    opportunityScore: number;
    adjustedOpportunityScore: number;
    recentPortfolioActions: number;
    fairnessBoostApplied: boolean;
    bayesianLiftPoints: number;
    bayesianUncertaintyPoints: number;
    regretPressurePoints: number;
    routeIntentLiftPoints: number;
    routeValueDelta: number;
    routeSignalCoverage: number;
    qualityMemoryIntentLiftPoints: number;
    qualityMemoryValueDelta: number;
    qualityMemorySignalCoverage: number;
    qualityMemoryBoost: number;
    qualityMemoryPhaseWeight: number;
    qualityMemoryHalfLifeMs: number;
  }

  const candidates: RampCandidate[] = [];
  const recentPortfolioActionCounts = readRampLog()
    .filter((entry) => {
      const entryMs = Date.parse(entry.timestamp);
      return Number.isFinite(entryMs) && now - entryMs <= portfolioWindowMs;
    })
    .reduce<Partial<Record<ExperimentName, number>>>((acc, entry) => {
      acc[entry.experiment] = (acc[entry.experiment] ?? 0) + 1;
      return acc;
    }, {});

  EXPERIMENT_NAMES.forEach((experiment) => {
    const rolloutTarget = getExperimentRolloutTarget(experiment);
    if (rolloutTarget === null) {
      return;
    }

    const decision = evaluateExperimentDecision(experiment, snapshot, { profile });
    const lastActionIso = meta[experiment];
    const lastActionMs = lastActionIso ? Date.parse(lastActionIso) : 0;
    const velocityWindowMs = policy.rampVelocityWindowMs;
    const velocityWindowBudget = policy.rampMaxShiftPerWindow;

    const priorVelocityEntries = velocityMeta[experiment] ?? [];
    const velocityWindow = computeWindowVelocityUsage(priorVelocityEntries, velocityWindowMs, now);
    const velocityWindowUsedBefore = velocityWindow.usedShift;
    const availableVelocity = Math.max(0, velocityWindowBudget - velocityWindowUsedBefore);

    if (lastActionMs && Number.isFinite(lastActionMs) && now - lastActionMs < cooldownMs) {
      return;
    }

    if (availableVelocity <= 0) {
      return;
    }

    let direction: "up" | "down" | null = null;
    let rampStride = 1;
    let rampStrideRationale = "Ramp stride 1 (default).";

    if (
      decision.recommendation === "promote_accelerated" &&
      (decision.confidence === "medium" || decision.confidence === "high")
    ) {
      const strideDecision = resolveRampStride(decision, profile, regime, adaptive);
      rampStride = strideDecision.stride;
      rampStrideRationale = strideDecision.rationale;
      direction = "up";
    }

    if (
      decision.recommendation === "keep_control" &&
      (decision.confidence === "medium" || decision.confidence === "high")
    ) {
      const strideDecision = resolveRampStride(decision, profile, regime, adaptive);
      rampStride = Math.max(1, Math.min(2, strideDecision.stride));
      rampStrideRationale = `${strideDecision.rationale} Rollback stride capped for safety.`;
      direction = "down";
    }

    if (!direction) {
      return;
    }

    const candidateTarget = getRampTargetWithinStepBudget(rolloutTarget, direction, rampStride, availableVelocity);
    if (candidateTarget === null || candidateTarget === rolloutTarget) {
      return;
    }

    if (direction === "down" && candidateTarget < 25) {
      return;
    }

    const bayesianSignals = computeBayesianAllocatorSignals(experiment, snapshot, rolloutTarget, decision);
    const qualityMemory = updateAllocatorQualityMemory(
      experiment,
      {
        routeIntentLiftPoints: bayesianSignals.routeIntentLiftPoints,
        routeValueDelta: bayesianSignals.routeValueDelta,
        routeSignalCoverage: bayesianSignals.routeSignalCoverage,
      },
      policy,
      driftState.phase,
      shockIntensity,
      now,
      qualityMemoryState,
    );
    qualityMemoryUpdated = true;

    const opportunityScore =
      (bayesianSignals.weightedOpportunityScore + qualityMemory.memoryBoost) * (1 - 0.12 * shockIntensity);
    const recentPortfolioActions = recentPortfolioActionCounts[experiment] ?? 0;
    const fairnessPenalty = recentPortfolioActions * policy.rampFairnessPenaltyPerRecentAction;
    const isInactiveEnough =
      !lastActionMs ||
      !Number.isFinite(lastActionMs) ||
      now - lastActionMs >= policy.rampExplorationBoostInactivityMs;
    const explorationBoost = isInactiveEnough ? policy.rampExplorationBoostScore : 0;
    const uncertaintyPenalty = bayesianSignals.bayesianUncertaintyPoints * (0.05 + 0.1 * shockIntensity);

    candidates.push({
      experiment,
      rolloutTarget,
      direction,
      stride: rampStride,
      decision,
      velocityWindowUsedBefore,
      velocityWindowBudget,
      availableVelocity,
      velocityFilteredEntries: velocityWindow.filtered,
      strideRationale: rampStrideRationale,
      opportunityScore,
      adjustedOpportunityScore: Math.max(0, opportunityScore - fairnessPenalty + explorationBoost - uncertaintyPenalty),
      recentPortfolioActions,
      fairnessBoostApplied: explorationBoost > 0,
      bayesianLiftPoints: bayesianSignals.bayesianLiftPoints,
      bayesianUncertaintyPoints: bayesianSignals.bayesianUncertaintyPoints,
      regretPressurePoints: bayesianSignals.regretPressurePoints,
      routeIntentLiftPoints: bayesianSignals.routeIntentLiftPoints,
      routeValueDelta: bayesianSignals.routeValueDelta,
      routeSignalCoverage: bayesianSignals.routeSignalCoverage,
      qualityMemoryIntentLiftPoints: qualityMemory.memoryIntentLiftPoints,
      qualityMemoryValueDelta: qualityMemory.memoryValueDelta,
      qualityMemorySignalCoverage: qualityMemory.memorySignalCoverage,
      qualityMemoryBoost: qualityMemory.memoryBoost,
      qualityMemoryPhaseWeight: qualityMemory.memoryPhaseWeight,
      qualityMemoryHalfLifeMs: qualityMemory.memoryHalfLifeMs,
    });
  });

  const rankedCandidates = [...candidates].sort((left, right) => {
    if (right.adjustedOpportunityScore !== left.adjustedOpportunityScore) {
      return right.adjustedOpportunityScore - left.adjustedOpportunityScore;
    }

    return right.opportunityScore - left.opportunityScore;
  });

  const explorationFirst = rankedCandidates.find((candidate) => candidate.fairnessBoostApplied);
  const dispatchQueue = explorationFirst
    ? [explorationFirst, ...rankedCandidates.filter((candidate) => candidate !== explorationFirst)]
    : rankedCandidates;

  dispatchQueue.forEach((candidate) => {
      if (portfolioRemaining <= 0) {
        return;
      }

      const allowedBudget = Math.min(
        candidate.availableVelocity,
        portfolioRemaining,
        driftState.phase === "shock"
          ? 25
          : driftState.phase === "recovering"
            ? 35
            : Number.MAX_SAFE_INTEGER,
      );
      const nextRollout = getRampTargetWithinStepBudget(
        candidate.rolloutTarget,
        candidate.direction,
        driftState.phase === "normal" ? candidate.stride : Math.min(candidate.stride, 2),
        allowedBudget,
      );

      if (nextRollout === null || nextRollout === candidate.rolloutTarget) {
        return;
      }

      const stepSize = Math.abs(nextRollout - candidate.rolloutTarget);
      if (stepSize <= 0 || stepSize > allowedBudget) {
        return;
      }

      if (candidate.direction === "down" && nextRollout < 25) {
        return;
      }

      setExperimentRolloutTarget(candidate.experiment, nextRollout);
      if (options?.clearCurrentAssignment) {
        clearAssignedExperimentVariant(candidate.experiment);
      }

      const timestamp = new Date().toISOString();
      meta[candidate.experiment] = timestamp;

      const nextVelocityEntries = [...candidate.velocityFilteredEntries, { timestamp, stepSize }];
      velocityMeta[candidate.experiment] = nextVelocityEntries;
      const velocityWindowUsedAfter = candidate.velocityWindowUsedBefore + stepSize;

      const portfolioWindowUsedBefore = portfolioUsed;
      portfolioUsed += stepSize;
      portfolioRemaining = Math.max(0, portfolioBudget - portfolioUsed);
      nextPortfolioEntries.push({ timestamp, stepSize });

      const rampEvent: ExperimentRampEvent = {
        experiment: candidate.experiment,
        previousRollout: candidate.rolloutTarget,
        nextRollout,
        stepSize,
        stride: candidate.stride,
        profile,
        velocityWindowUsedBefore: candidate.velocityWindowUsedBefore,
        velocityWindowUsedAfter,
        velocityWindowBudget: candidate.velocityWindowBudget,
        portfolioWindowUsedBefore,
        portfolioWindowUsedAfter: portfolioUsed,
        portfolioWindowBudget: portfolioBudget,
        opportunityScore: Number(candidate.opportunityScore.toFixed(3)),
        adjustedOpportunityScore: Number(candidate.adjustedOpportunityScore.toFixed(3)),
        recentPortfolioActions: candidate.recentPortfolioActions,
        fairnessBoostApplied: candidate.fairnessBoostApplied,
        bayesianLiftPoints: Number(candidate.bayesianLiftPoints.toFixed(3)),
        bayesianUncertaintyPoints: Number(candidate.bayesianUncertaintyPoints.toFixed(3)),
        regretPressurePoints: Number(candidate.regretPressurePoints.toFixed(3)),
        routeIntentLiftPoints: Number(candidate.routeIntentLiftPoints.toFixed(3)),
        routeValueDelta: Number(candidate.routeValueDelta.toFixed(3)),
        routeSignalCoverage: Number(candidate.routeSignalCoverage.toFixed(3)),
        qualityMemoryIntentLiftPoints: Number(candidate.qualityMemoryIntentLiftPoints.toFixed(3)),
        qualityMemoryValueDelta: Number(candidate.qualityMemoryValueDelta.toFixed(3)),
        qualityMemorySignalCoverage: Number(candidate.qualityMemorySignalCoverage.toFixed(3)),
        qualityMemoryBoost: Number(candidate.qualityMemoryBoost.toFixed(3)),
        qualityMemoryPhaseWeight: Number(candidate.qualityMemoryPhaseWeight.toFixed(3)),
        qualityMemoryHalfLifeMs: Math.round(candidate.qualityMemoryHalfLifeMs),
        driftScore: driftState.driftScore,
        shortDriftScore: driftState.shortDriftScore,
        mediumDriftScore: driftState.mediumDriftScore,
        longDriftScore: driftState.longDriftScore,
        shockMode: driftState.shockMode,
        driftPhase: driftState.phase,
        shockIntensity: Number(shockIntensity.toFixed(3)),
        recommendation: candidate.decision.recommendation,
        confidence: candidate.decision.confidence,
        rationale: `${candidate.decision.rationale} ${candidate.strideRationale} Velocity window ${velocityWindowUsedAfter}/${candidate.velocityWindowBudget} points used. Portfolio window ${portfolioUsed}/${portfolioBudget} points used. Fairness adjusted score ${candidate.adjustedOpportunityScore.toFixed(2)} (weighted ${candidate.opportunityScore.toFixed(2)}, recent ${candidate.recentPortfolioActions}, boost ${candidate.fairnessBoostApplied ? "on" : "off"}). Bayesian lift ${candidate.bayesianLiftPoints.toFixed(2)} pts, uncertainty ${candidate.bayesianUncertaintyPoints.toFixed(2)} pts, regret ${candidate.regretPressurePoints.toFixed(2)} pts. Route intent lift ${candidate.routeIntentLiftPoints.toFixed(2)} pts, value Δ ${candidate.routeValueDelta.toFixed(2)}, coverage ${(candidate.routeSignalCoverage * 100).toFixed(0)}%. Memory intent ${candidate.qualityMemoryIntentLiftPoints.toFixed(2)} pts, memory value ${candidate.qualityMemoryValueDelta.toFixed(2)}, memory coverage ${(candidate.qualityMemorySignalCoverage * 100).toFixed(0)}%, memory boost ${candidate.qualityMemoryBoost.toFixed(2)}, gate ${candidate.qualityMemoryPhaseWeight.toFixed(2)}, half-life ${Math.round(candidate.qualityMemoryHalfLifeMs / 1000)}s. Drift fused ${driftState.driftScore.toFixed(2)} [S ${driftState.shortDriftScore.toFixed(2)} · M ${driftState.mediumDriftScore.toFixed(2)} · L ${driftState.longDriftScore.toFixed(2)}] · phase ${driftState.phase} · shock ${driftState.shockMode ? "on" : "off"}.`,
        timestamp,
      };

      appendRampEvent(rampEvent);

      event({
        action: "experiment_ramp_autopilot",
        category: "experiments",
        label: `${candidate.experiment}:${candidate.rolloutTarget}->${nextRollout}`,
        value: nextRollout,
      });

      actions.push(rampEvent);
    });

  if (qualityMemoryUpdated) {
    writeAllocatorQualityMemoryState(qualityMemoryState);
  }

  if (actions.length > 0) {
    writeRampMeta(meta);
    writeRampVelocityMeta(velocityMeta);
    writeRampPortfolioMeta(nextPortfolioEntries);
  }

  return actions;
}

export function evaluateExperimentDecision(
  experiment: ExperimentName,
  snapshot: ExperimentRollupSnapshot,
  options?: { profile?: ExperimentPolicyProfile },
): ExperimentDecisionSummary {
  const profile = options?.profile ?? "balanced";
  const policy = getExperimentPolicySettings(profile);
  const byVariant = snapshot[experiment] ?? {};
  const control = byVariant.control;
  const accelerated = byVariant.accelerated;

  const controlCvr = computeConversionRate(control);
  const acceleratedCvr = computeConversionRate(accelerated);
  const deltaCvrPoints = (acceleratedCvr - controlCvr) * 100;

  const controlExposure = control?.exposureCount ?? 0;
  const acceleratedExposure = accelerated?.exposureCount ?? 0;
  const controlGoals = control?.goalCount ?? 0;
  const acceleratedGoals = accelerated?.goalCount ?? 0;

  const minRequiredPerVariant = policy.minRequiredPerVariant;
  const minDeltaPoints = policy.minDeltaPoints;
  const minZForAction = policy.minZForAction;

  if (controlExposure < minRequiredPerVariant || acceleratedExposure < minRequiredPerVariant) {
    return {
      experiment,
      recommendation: "insufficient_data",
      confidence: "low",
      deltaCvrPoints,
      controlCvr,
      acceleratedCvr,
      zScore: 0,
      minRequiredPerVariant,
      minDeltaPoints,
      rationale: "Need at least 30 exposures per variant before actioning.",
    };
  }

  const pooledRate =
    (controlGoals + acceleratedGoals) / Math.max(controlExposure + acceleratedExposure, 1);
  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / Math.max(controlExposure, 1) + 1 / Math.max(acceleratedExposure, 1)),
  );
  const zScore = standardError > 0 ? (acceleratedCvr - controlCvr) / standardError : 0;

  if (deltaCvrPoints >= minDeltaPoints && zScore >= minZForAction) {
    return {
      experiment,
      recommendation: "promote_accelerated",
      confidence: zScore >= policy.highConfidenceZ ? "high" : "medium",
      deltaCvrPoints,
      controlCvr,
      acceleratedCvr,
      zScore,
      minRequiredPerVariant,
      minDeltaPoints,
      rationale: "Accelerated is outperforming control with directional significance.",
    };
  }

  if (deltaCvrPoints <= -minDeltaPoints && zScore <= -minZForAction) {
    return {
      experiment,
      recommendation: "keep_control",
      confidence: zScore <= -policy.highConfidenceZ ? "high" : "medium",
      deltaCvrPoints,
      controlCvr,
      acceleratedCvr,
      zScore,
      minRequiredPerVariant,
      minDeltaPoints,
      rationale: "Control is outperforming accelerated with directional significance.",
    };
  }

  return {
    experiment,
    recommendation: "monitor",
    confidence: "low",
    deltaCvrPoints,
    controlCvr,
    acceleratedCvr,
    zScore,
    minRequiredPerVariant,
    minDeltaPoints,
    rationale: "No decisive edge yet; continue data collection.",
  };
}
