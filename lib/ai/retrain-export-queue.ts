type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";
type SloProfile = "latency" | "balanced" | "quality";
type QueueStorageMode = "memory" | "supabase";

export type RetrainExportQueueItem = {
  id: string;
  userId: string;
  domain: PredictionDomain;
  model: string;
  sloProfile: SloProfile;
  effectiveSloProfile: SloProfile;
  qualityScore: number;
  verifierScore?: number;
  verifierRisk?: "low" | "medium" | "high" | "critical";
  retrainLevel?: "low" | "medium" | "high";
  reasons: string[];
  promptSnippet?: string;
  responseSnippet?: string;
  createdAt: string;
  status: "queued" | "exported" | "dismissed";
};

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  table: string;
};

type PersistedRow = {
  id: string;
  created_at: string;
  user_id: string;
  domain: PredictionDomain;
  model: string;
  slo_profile: SloProfile;
  effective_slo_profile: SloProfile;
  quality_score: number;
  verifier_score: number | null;
  verifier_risk: string | null;
  retrain_level: string | null;
  reasons: string[];
  prompt_snippet: string | null;
  response_snippet: string | null;
  status: string;
  payload: RetrainExportQueueItem;
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

function resolveStorageMode(): QueueStorageMode {
  const explicit = String(process.env.TRADEHAX_RETRAIN_EXPORT_QUEUE_STORAGE || "").trim().toLowerCase();
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
    table: String(process.env.TRADEHAX_SUPABASE_AI_RETRAIN_QUEUE_TABLE || "ai_retrain_export_queue").trim(),
  };
}

function getConfig() {
  const mode = resolveStorageMode();
  const supabase = getSupabaseConfig();

  return {
    enabled: parseBooleanEnv("TRADEHAX_RETRAIN_EXPORT_QUEUE_ENABLED", true),
    mode,
    supabase,
    shouldUseSupabase: mode === "supabase" && Boolean(supabase),
  };
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_RETRAIN_EXPORT_QUEUE__?: RetrainExportQueueItem[];
  };

  if (!globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE__) {
    globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE__ = [];
  }

  return globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE__;
}

function getHydrationState() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_RETRAIN_EXPORT_QUEUE_HYDRATED__?: boolean;
  };

  if (typeof globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE_HYDRATED__ !== "boolean") {
    globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE_HYDRATED__ = false;
  }

  return {
    get hydrated() {
      return Boolean(globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE_HYDRATED__);
    },
    set hydrated(value: boolean) {
      globalRef.__TRADEHAX_RETRAIN_EXPORT_QUEUE_HYDRATED__ = value;
    },
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

function normalize(
  input: Omit<RetrainExportQueueItem, "id" | "createdAt" | "status"> &
    Partial<Pick<RetrainExportQueueItem, "id" | "createdAt" | "status">>,
) {
  return {
    id: input.id || `rtq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: String(input.userId || "anonymous").slice(0, 120).toLowerCase(),
    domain: input.domain,
    model: String(input.model || "unknown").slice(0, 180),
    sloProfile: input.sloProfile,
    effectiveSloProfile: input.effectiveSloProfile,
    qualityScore: clamp(Math.round(input.qualityScore), 0, 100),
    verifierScore: typeof input.verifierScore === "number" ? clamp(Math.round(input.verifierScore), 0, 100) : undefined,
    verifierRisk: input.verifierRisk,
    retrainLevel: input.retrainLevel,
    reasons: Array.isArray(input.reasons) ? input.reasons.filter(Boolean).slice(0, 12) : [],
    promptSnippet: typeof input.promptSnippet === "string" ? input.promptSnippet.slice(0, 380) : undefined,
    responseSnippet: typeof input.responseSnippet === "string" ? input.responseSnippet.slice(0, 380) : undefined,
    createdAt: input.createdAt || new Date().toISOString(),
    status: input.status === "dismissed" || input.status === "exported" ? input.status : "queued",
  } satisfies RetrainExportQueueItem;
}

function push(item: RetrainExportQueueItem) {
  const store = getStore();
  const duplicate = store.find(
    (row) =>
      row.userId === item.userId &&
      row.domain === item.domain &&
      row.status === "queued" &&
      Date.parse(item.createdAt) - Date.parse(row.createdAt) < 3 * 60 * 60_000,
  );

  if (duplicate) {
    return duplicate;
  }

  store.push(item);
  if (store.length > 6000) {
    store.splice(0, store.length - 6000);
  }

  return item;
}

function toRow(item: RetrainExportQueueItem): PersistedRow {
  return {
    id: item.id,
    created_at: item.createdAt,
    user_id: item.userId,
    domain: item.domain,
    model: item.model,
    slo_profile: item.sloProfile,
    effective_slo_profile: item.effectiveSloProfile,
    quality_score: item.qualityScore,
    verifier_score: typeof item.verifierScore === "number" ? item.verifierScore : null,
    verifier_risk: item.verifierRisk || null,
    retrain_level: item.retrainLevel || null,
    reasons: item.reasons,
    prompt_snippet: item.promptSnippet || null,
    response_snippet: item.responseSnippet || null,
    status: item.status,
    payload: item,
  };
}

async function hydrateIfNeeded() {
  const config = getConfig();
  const hydration = getHydrationState();
  if (hydration.hydrated || !config.shouldUseSupabase || !config.supabase) return;

  try {
    const rows = await requestJson<PersistedRow[]>(
      config.supabase,
      `${config.supabase.table}?select=payload&order=created_at.desc&limit=2000`,
      { method: "GET" },
    );

    const parsed = (rows || [])
      .map((row) => row?.payload)
      .filter((row): row is RetrainExportQueueItem => Boolean(row && typeof row === "object"))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    const store = getStore();
    store.splice(0, store.length, ...parsed.slice(-5000));
  } catch {
    // Non-fatal: continue in memory mode.
  } finally {
    hydration.hydrated = true;
  }
}

export async function enqueueRetrainExportCandidate(
  input: Omit<RetrainExportQueueItem, "id" | "createdAt" | "status">,
) {
  const config = getConfig();
  if (!config.enabled) {
    return {
      queued: false,
      reason: "disabled",
      mode: config.mode,
    } as const;
  }

  const normalized = normalize(input);
  const queued = push(normalized);

  if (!config.shouldUseSupabase || !config.supabase) {
    return {
      queued: true,
      mode: "memory" as const,
      id: queued.id,
    };
  }

  await requestJson<unknown>(config.supabase, `${config.supabase.table}?on_conflict=id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([toRow(queued)]),
  }).catch(() => {
    // Non-fatal; memory queue already contains the candidate.
  });

  return {
    queued: true,
    mode: "supabase" as const,
    id: queued.id,
  };
}

export async function getRetrainExportQueueSummary() {
  await hydrateIfNeeded();

  const store = getStore();
  const queued = store.filter((row) => row.status === "queued");

  return {
    generatedAt: new Date().toISOString(),
    total: store.length,
    queued: queued.length,
    byRisk: {
      low: queued.filter((row) => row.verifierRisk === "low").length,
      medium: queued.filter((row) => row.verifierRisk === "medium").length,
      high: queued.filter((row) => row.verifierRisk === "high").length,
      critical: queued.filter((row) => row.verifierRisk === "critical").length,
      unknown: queued.filter((row) => !row.verifierRisk).length,
    },
    byRetrainLevel: {
      low: queued.filter((row) => row.retrainLevel === "low").length,
      medium: queued.filter((row) => row.retrainLevel === "medium").length,
      high: queued.filter((row) => row.retrainLevel === "high").length,
      unknown: queued.filter((row) => !row.retrainLevel).length,
    },
    topCandidates: queued
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 12)
      .map((row) => ({
        id: row.id,
        userId: row.userId,
        domain: row.domain,
        verifierRisk: row.verifierRisk || "unknown",
        retrainLevel: row.retrainLevel || "unknown",
        qualityScore: row.qualityScore,
        verifierScore: row.verifierScore ?? null,
        reasons: row.reasons,
        createdAt: row.createdAt,
      })),
  };
}