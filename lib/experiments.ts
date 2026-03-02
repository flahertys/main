import { event } from "@/lib/analytics";

export type ExperimentName =
  | "home_hero_primary_cta"
  | "landing_hero_primary_cta";

export type ExperimentVariant = "control" | "accelerated";

const EXPERIMENT_VARIANTS: Record<ExperimentName, readonly ExperimentVariant[]> = {
  home_hero_primary_cta: ["control", "accelerated"],
  landing_hero_primary_cta: ["control", "accelerated"],
};

const EXP_STORAGE_PREFIX = "thx-exp:";
const EXP_EXPOSURE_PREFIX = "thx-exp-exposed:";
const EXP_ROLLUP_STORAGE_KEY = "thx-exp-rollup";
const EXPERIMENT_NAMES = Object.keys(EXPERIMENT_VARIANTS) as ExperimentName[];

interface ExperimentRollupEntry {
  variant: ExperimentVariant;
  exposureCount: number;
  goalCount: number;
  weightedGoalValue: number;
  goalsByAction: Record<string, number>;
}

type ExperimentRollupSnapshot = Partial<Record<ExperimentName, ExperimentRollupEntry>>;

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

function readRollupSnapshot(): ExperimentRollupSnapshot {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(EXP_ROLLUP_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ExperimentRollupSnapshot;
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
  const current =
    snapshot[name] ??
    ({
      variant,
      exposureCount: 0,
      goalCount: 0,
      weightedGoalValue: 0,
      goalsByAction: {},
    } satisfies ExperimentRollupEntry);

  const normalizedCurrent =
    current.variant === variant
      ? current
      : {
          variant,
          exposureCount: 0,
          goalCount: 0,
          weightedGoalValue: 0,
          goalsByAction: {},
        };

  snapshot[name] = update(normalizedCurrent);
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
