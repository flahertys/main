import { event } from "@/lib/analytics";

export type ExperimentName =
  | "home_hero_primary_cta"
  | "landing_hero_primary_cta";

export type ExperimentVariant = "control" | "accelerated";

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
  recommendation: ExperimentDecisionSummary["recommendation"];
  confidence: ExperimentDecisionSummary["confidence"];
  rationale: string;
  timestamp: string;
}

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
const EXP_VISITOR_ID_KEY = "thx-exp-visitor-id";
const EXPERIMENT_NAMES = Object.keys(EXPERIMENT_VARIANTS) as ExperimentName[];
const RAMP_STEPS = [10, 25, 50, 75, 100] as const;

function isVariantForExperiment(name: ExperimentName, value: string): value is ExperimentVariant {
  return (EXPERIMENT_VARIANTS[name] as readonly string[]).includes(value);
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

export function applyExperimentRecommendation(
  decision: ExperimentDecisionSummary,
  options?: { clearCurrentAssignment?: boolean },
) {
  if (decision.recommendation === "promote_accelerated") {
    setExperimentRolloutTarget(decision.experiment, 75);
    if (options?.clearCurrentAssignment) {
      clearAssignedExperimentVariant(decision.experiment);
    }
    return;
  }

  if (decision.recommendation === "keep_control") {
    setExperimentRolloutTarget(decision.experiment, 25);
    if (options?.clearCurrentAssignment) {
      clearAssignedExperimentVariant(decision.experiment);
    }
  }
}

export function runExperimentGuardrailAutoRollback(
  snapshot: ExperimentRollupSnapshot,
  options?: { clearCurrentAssignment?: boolean },
): ExperimentGuardrailEvent[] {
  const rollbacks: ExperimentGuardrailEvent[] = [];

  EXPERIMENT_NAMES.forEach((experiment) => {
    const rolloutTarget = getExperimentRolloutTarget(experiment);
    if (rolloutTarget === null || rolloutTarget <= 50) {
      return;
    }

    const decision = evaluateExperimentDecision(experiment, snapshot);
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

export function runExperimentRampAutopilot(
  snapshot: ExperimentRollupSnapshot,
  options?: { clearCurrentAssignment?: boolean; cooldownMs?: number },
): ExperimentRampEvent[] {
  const cooldownMs = options?.cooldownMs ?? 2 * 60 * 1000;
  const now = Date.now();
  const meta = readRampMeta();
  const actions: ExperimentRampEvent[] = [];

  EXPERIMENT_NAMES.forEach((experiment) => {
    const rolloutTarget = getExperimentRolloutTarget(experiment);
    if (rolloutTarget === null) {
      return;
    }

    const decision = evaluateExperimentDecision(experiment, snapshot);
    const lastActionIso = meta[experiment];
    const lastActionMs = lastActionIso ? Date.parse(lastActionIso) : 0;

    if (lastActionMs && Number.isFinite(lastActionMs) && now - lastActionMs < cooldownMs) {
      return;
    }

    let nextRollout: number | null = null;

    if (
      decision.recommendation === "promote_accelerated" &&
      (decision.confidence === "medium" || decision.confidence === "high")
    ) {
      nextRollout = getNextRampTarget(rolloutTarget);
    }

    if (
      decision.recommendation === "keep_control" &&
      (decision.confidence === "medium" || decision.confidence === "high") &&
      nextRollout === null
    ) {
      const previousTarget = getPreviousRampTarget(rolloutTarget);
      if (previousTarget !== null && previousTarget >= 25) {
        nextRollout = previousTarget;
      }
    }

    if (nextRollout === null || nextRollout === rolloutTarget) {
      return;
    }

    setExperimentRolloutTarget(experiment, nextRollout);
    if (options?.clearCurrentAssignment) {
      clearAssignedExperimentVariant(experiment);
    }

    const timestamp = new Date().toISOString();
    meta[experiment] = timestamp;

    const rampEvent: ExperimentRampEvent = {
      experiment,
      previousRollout: rolloutTarget,
      nextRollout,
      recommendation: decision.recommendation,
      confidence: decision.confidence,
      rationale: decision.rationale,
      timestamp,
    };

    appendRampEvent(rampEvent);

    event({
      action: "experiment_ramp_autopilot",
      category: "experiments",
      label: `${experiment}:${rolloutTarget}->${nextRollout}`,
      value: nextRollout,
    });

    actions.push(rampEvent);
  });

  if (actions.length > 0) {
    writeRampMeta(meta);
  }

  return actions;
}

export function evaluateExperimentDecision(
  experiment: ExperimentName,
  snapshot: ExperimentRollupSnapshot,
): ExperimentDecisionSummary {
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

  const minRequiredPerVariant = 30;
  const minDeltaPoints = 1.5;
  const minZForAction = 1.64;

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
      confidence: zScore >= 2.58 ? "high" : "medium",
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
      confidence: zScore <= -2.58 ? "high" : "medium",
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
