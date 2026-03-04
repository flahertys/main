type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";
type SloProfile = "latency" | "balanced" | "quality";

type PersonalizedTrajectoryStorageMode = "memory" | "supabase";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  table: string;
};

export type PersonalizedTrajectoryEvent = {
  id: string;
  userId: string;
  domain: PredictionDomain;
  model: string;
  sloProfile: SloProfile;
  effectiveSloProfile: SloProfile;
  latencyMs: number;
  qualityScore: number;
  fallbackTriggered: boolean;
  profileWinRate?: number;
  profileAvgPnlPercent?: number;
  profileConfidenceAvg?: number;
  benchmarkMaturity?: number;
  timestamp: string;
};

export type PersonalizedTrajectorySnapshot = {
  generatedAt: string;
  userId: string;
  sampleSize: number;
  windows: {
    recent: {
      quality: number;
      latencyMs: number;
      fallbackRate: number;
      trajectoryScore: number;
    };
    prior: {
      quality: number;
      latencyMs: number;
      fallbackRate: number;
      trajectoryScore: number;
    };
  };
  trajectoryDelta: number;
  driftState: "improving" | "stable" | "declining";
  liftEstimate: number;
  retrain: {
    shouldTrigger: boolean;
    level: "low" | "medium" | "high";
    reasons: string[];
    suggestedActions: string[];
  };
};

type PersistedRow = {
  id: string;
  created_at: string;
  user_id: string;
  domain: PredictionDomain;
  model: string;
  slo_profile: SloProfile;
  effective_slo_profile: SloProfile;
  latency_ms: number;
  quality_score: number;
  fallback_triggered: boolean;
  benchmark_maturity: number;
  payload: PersonalizedTrajectoryEvent;
};

function parseBooleanEnv(name: string, fallback: boolean) {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function parseNumericEnv(name: string, fallback: number, opts?: { min?: number; max?: number }) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
  let value = Number.isFinite(parsed) ? parsed : fallback;

  if (typeof opts?.min === "number") value = Math.max(opts.min, value);
  if (typeof opts?.max === "number") value = Math.min(opts.max, value);
  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveStorageMode(): PersonalizedTrajectoryStorageMode {
  const explicit = String(process.env.TRADEHAX_PERSONALIZED_TRAJECTORY_STORAGE || "")
    .trim()
    .toLowerCase();

  if (explicit === "memory" || explicit === "supabase") return explicit;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  return "memory";
}

function getSupabaseConfig(): SupabaseConfig | null {
  const baseUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!baseUrl || !serviceKey) return null;

  return {
    baseUrl,
    serviceKey,
    table: String(process.env.TRADEHAX_SUPABASE_AI_TRAJECTORY_TABLE || "ai_personalized_trajectory_events").trim(),
  };
}

function getConfig() {
  const mode = resolveStorageMode();
  const supabase = getSupabaseConfig();

  return {
    mode,
    supabase,
    enabled: parseBooleanEnv("TRADEHAX_PERSONALIZED_TRAJECTORY_ENABLED", true),
    shouldUseSupabase: mode === "supabase" && Boolean(supabase),
  };
}

function headers(config: SupabaseConfig, extra?: HeadersInit) {
  return {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

async function requestJson<T>(config: SupabaseConfig, path: string, init: RequestInit, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
      ...init,
      headers: headers(config, init.headers),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase ${response.status}: ${text.slice(0, 280)}`);
    }

    if (response.status === 204) return null as T;

    const text = await response.text();
    if (!text) return null as T;
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_PERSONALIZED_TRAJECTORY__?: PersonalizedTrajectoryEvent[];
  };

  if (!globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY__) {
    globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY__ = [];
  }

  return globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY__;
}

function getHydrationState() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_PERSONALIZED_TRAJECTORY_HYDRATED__?: boolean;
  };

  if (typeof globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY_HYDRATED__ !== "boolean") {
    globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY_HYDRATED__ = false;
  }

  return {
    get hydrated() {
      return Boolean(globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY_HYDRATED__);
    },
    set hydrated(value: boolean) {
      globalRef.__TRADEHAX_PERSONALIZED_TRAJECTORY_HYDRATED__ = value;
    },
  };
}

function normalize(input: Omit<PersonalizedTrajectoryEvent, "id" | "timestamp"> & { id?: string; timestamp?: string }) {
  return {
    id: input.id || `ptm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: String(input.userId || "anonymous").slice(0, 100).toLowerCase(),
    domain: input.domain,
    model: String(input.model || "unknown").slice(0, 160),
    sloProfile: input.sloProfile,
    effectiveSloProfile: input.effectiveSloProfile,
    latencyMs: Math.max(1, Math.floor(input.latencyMs)),
    qualityScore: clamp(Math.round(input.qualityScore), 0, 100),
    fallbackTriggered: Boolean(input.fallbackTriggered),
    profileWinRate: typeof input.profileWinRate === "number" ? clamp(input.profileWinRate, 0, 1) : undefined,
    profileAvgPnlPercent:
      typeof input.profileAvgPnlPercent === "number" ? clamp(input.profileAvgPnlPercent, -100, 100) : undefined,
    profileConfidenceAvg:
      typeof input.profileConfidenceAvg === "number" ? clamp(input.profileConfidenceAvg, 0, 1) : undefined,
    benchmarkMaturity:
      typeof input.benchmarkMaturity === "number" ? clamp(input.benchmarkMaturity, 0, 1) : undefined,
    timestamp: input.timestamp || new Date().toISOString(),
  } satisfies PersonalizedTrajectoryEvent;
}

function push(event: PersonalizedTrajectoryEvent) {
  const store = getStore();
  store.push(event);
  if (store.length > 12000) {
    store.splice(0, store.length - 12000);
  }
}

async function hydrateIfNeeded() {
  const config = getConfig();
  const hydration = getHydrationState();
  if (hydration.hydrated || !config.shouldUseSupabase || !config.supabase) return;

  try {
    const rows = await requestJson<PersistedRow[]>(
      config.supabase,
      `${config.supabase.table}?select=payload&order=created_at.desc&limit=2500`,
      { method: "GET" },
    );

    const parsed = (rows || [])
      .map((row) => row?.payload)
      .filter((row): row is PersonalizedTrajectoryEvent => Boolean(row && typeof row === "object"))
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const store = getStore();
    store.splice(0, store.length, ...parsed.slice(-7000));
  } catch {
    // Non-fatal: continue in memory mode.
  } finally {
    hydration.hydrated = true;
  }
}

export async function recordPersonalizedTrajectoryEvent(
  input: Omit<PersonalizedTrajectoryEvent, "id" | "timestamp"> & { id?: string; timestamp?: string },
) {
  const config = getConfig();
  if (!config.enabled) {
    return {
      persisted: false,
      mode: "memory" as const,
      disabled: true,
    };
  }

  const event = normalize(input);
  push(event);

  if (!config.shouldUseSupabase || !config.supabase) {
    return {
      persisted: false,
      mode: "memory" as const,
      id: event.id,
    };
  }

  const row: PersistedRow = {
    id: event.id,
    created_at: event.timestamp,
    user_id: event.userId,
    domain: event.domain,
    model: event.model,
    slo_profile: event.sloProfile,
    effective_slo_profile: event.effectiveSloProfile,
    latency_ms: event.latencyMs,
    quality_score: event.qualityScore,
    fallback_triggered: event.fallbackTriggered,
    benchmark_maturity: typeof event.benchmarkMaturity === "number" ? event.benchmarkMaturity : 0,
    payload: event,
  };

  await requestJson<unknown>(config.supabase, `${config.supabase.table}?on_conflict=id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  });

  return {
    persisted: true,
    mode: "supabase" as const,
    id: event.id,
  };
}

function toWindowStats(rows: PersonalizedTrajectoryEvent[]) {
  if (rows.length === 0) {
    return {
      quality: 0,
      latencyMs: 0,
      fallbackRate: 0,
      trajectoryScore: 0,
    };
  }

  const quality = rows.reduce((sum, row) => sum + row.qualityScore, 0) / rows.length;
  const latencyMs = rows.reduce((sum, row) => sum + row.latencyMs, 0) / rows.length;
  const fallbackRate = rows.filter((row) => row.fallbackTriggered).length / rows.length;
  const trajectoryScore = quality * 0.56 + (1 - fallbackRate) * 28 - latencyMs / 260;

  return {
    quality: Number.parseFloat(quality.toFixed(2)),
    latencyMs: Math.round(latencyMs),
    fallbackRate: Number.parseFloat((fallbackRate * 100).toFixed(2)),
    trajectoryScore: Number.parseFloat(trajectoryScore.toFixed(2)),
  };
}

function computeLiftEstimate(rows: PersonalizedTrajectoryEvent[]) {
  if (rows.length === 0) return 0;

  const avgQuality = rows.reduce((sum, row) => sum + row.qualityScore, 0) / rows.length;
  const avgWinRate =
    rows.filter((row) => typeof row.profileWinRate === "number").reduce((sum, row) => sum + (row.profileWinRate || 0), 0) /
    Math.max(1, rows.filter((row) => typeof row.profileWinRate === "number").length);
  const avgPnl =
    rows.filter((row) => typeof row.profileAvgPnlPercent === "number").reduce((sum, row) => sum + (row.profileAvgPnlPercent || 0), 0) /
    Math.max(1, rows.filter((row) => typeof row.profileAvgPnlPercent === "number").length);

  const lift = (avgQuality / 100 - 0.5) + (avgWinRate - 0.5) + avgPnl / 100;
  return Number.parseFloat(lift.toFixed(4));
}

function buildRetrainDecision(input: {
  sampleSize: number;
  recentScore: number;
  priorScore: number;
  recentFallbackRate: number;
  recentQuality: number;
}) {
  const reasons: string[] = [];
  const actions: string[] = [];

  const delta = input.recentScore - input.priorScore;
  const minSamples = Math.round(parseNumericEnv("TRADEHAX_TRAJECTORY_MIN_SAMPLES", 14, { min: 5, max: 300 }));

  if (input.sampleSize < minSamples) {
    return {
      shouldTrigger: false,
      level: "low" as const,
      reasons: ["insufficient_samples"],
      suggestedActions: ["collect_more_user_events"],
    };
  }

  if (delta <= -8) {
    reasons.push("trajectory_score_decline");
    actions.push("increase_recent_domain_examples");
  }
  if (input.recentFallbackRate >= 28) {
    reasons.push("fallback_rate_elevated");
    actions.push("revisit_model_rankings_and_retrieval_context");
  }
  if (input.recentQuality <= 62) {
    reasons.push("quality_floor_breach");
    actions.push("inject_more_operator_grade_training_rows");
  }

  if (reasons.length >= 2) {
    return {
      shouldTrigger: true,
      level: "high" as const,
      reasons,
      suggestedActions: actions,
    };
  }

  if (reasons.length === 1) {
    return {
      shouldTrigger: true,
      level: "medium" as const,
      reasons,
      suggestedActions: actions,
    };
  }

  return {
    shouldTrigger: false,
    level: "low" as const,
    reasons: ["trajectory_healthy"],
    suggestedActions: ["continue_online_learning"],
  };
}

export async function getPersonalizedTrajectorySnapshot(input: {
  userId: string;
  horizonHours?: number;
}) {
  await hydrateIfNeeded();

  const horizonHours = Math.round(parseNumericEnv("TRADEHAX_TRAJECTORY_HORIZON_HOURS", input.horizonHours || 72, {
    min: 6,
    max: 24 * 21,
  }));

  const cutoff = Date.now() - horizonHours * 60 * 60_000;
  const userId = String(input.userId || "anonymous").toLowerCase();

  const rows = getStore()
    .filter((row) => row.userId === userId && Date.parse(row.timestamp) >= cutoff)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  const split = Math.max(1, Math.floor(rows.length / 2));
  const priorRows = rows.slice(0, split);
  const recentRows = rows.slice(split);

  const prior = toWindowStats(priorRows);
  const recent = toWindowStats(recentRows);
  const delta = Number.parseFloat((recent.trajectoryScore - prior.trajectoryScore).toFixed(2));

  const driftState: PersonalizedTrajectorySnapshot["driftState"] =
    delta >= 3 ? "improving" : delta <= -3 ? "declining" : "stable";

  const retrain = buildRetrainDecision({
    sampleSize: rows.length,
    recentScore: recent.trajectoryScore,
    priorScore: prior.trajectoryScore,
    recentFallbackRate: recent.fallbackRate,
    recentQuality: recent.quality,
  });

  return {
    generatedAt: new Date().toISOString(),
    userId,
    sampleSize: rows.length,
    windows: {
      recent,
      prior,
    },
    trajectoryDelta: delta,
    driftState,
    liftEstimate: computeLiftEstimate(rows),
    retrain,
  } satisfies PersonalizedTrajectorySnapshot;
}

export async function getPersonalizedTrajectorySystemSummary() {
  await hydrateIfNeeded();

  const rows = getStore();
  const userIds = Array.from(new Set(rows.map((row) => row.userId))).slice(0, 250);
  const snapshots = await Promise.all(userIds.map((userId) => getPersonalizedTrajectorySnapshot({ userId })));

  const highRetrain = snapshots.filter((row) => row.retrain.shouldTrigger && row.retrain.level === "high").length;
  const mediumRetrain = snapshots.filter((row) => row.retrain.shouldTrigger && row.retrain.level === "medium").length;
  const improving = snapshots.filter((row) => row.driftState === "improving").length;
  const declining = snapshots.filter((row) => row.driftState === "declining").length;

  return {
    generatedAt: new Date().toISOString(),
    usersTracked: snapshots.length,
    totalEvents: rows.length,
    retrainPressure: {
      high: highRetrain,
      medium: mediumRetrain,
      low: Math.max(0, snapshots.length - highRetrain - mediumRetrain),
    },
    drift: {
      improving,
      stable: Math.max(0, snapshots.length - improving - declining),
      declining,
    },
    topAttentionUsers: snapshots
      .filter((row) => row.retrain.shouldTrigger)
      .sort((a, b) => {
        const levelWeight = (level: string) => (level === "high" ? 2 : level === "medium" ? 1 : 0);
        return levelWeight(b.retrain.level) - levelWeight(a.retrain.level) || a.trajectoryDelta - b.trajectoryDelta;
      })
      .slice(0, 12)
      .map((row) => ({
        userId: row.userId,
        sampleSize: row.sampleSize,
        driftState: row.driftState,
        trajectoryDelta: row.trajectoryDelta,
        retrain: row.retrain,
      })),
  };
}
