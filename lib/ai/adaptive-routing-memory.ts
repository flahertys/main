type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";
type SloProfile = "latency" | "balanced" | "quality";

type AdaptiveRoutingMemoryStorageMode = "memory" | "supabase";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  table: string;
};

export type AdaptiveRoutingOutcome = {
  id: string;
  domain: PredictionDomain;
  model: string;
  sloProfile: SloProfile;
  effectiveSloProfile: SloProfile;
  latencyMs: number;
  qualityScore: number;
  fallbackTriggered: boolean;
  trafficPressure?: "low" | "elevated" | "high";
  benchmarkMaturity?: number;
  timestamp: string;
};

export type AdaptiveRoutingHints = {
  generatedAt: string;
  domain: PredictionDomain;
  sampleSize: number;
  confidence: number;
  preferredModel: string | null;
  avoidModels: string[];
  sloBias: SloProfile;
  tokenMultiplierHint: number;
  temperatureMultiplierHint: number;
  topPMultiplierHint: number;
  reasons: string[];
};

type PersistedOutcomeRow = {
  id: string;
  created_at: string;
  domain: PredictionDomain;
  model: string;
  slo_profile: SloProfile;
  effective_slo_profile: SloProfile;
  latency_ms: number;
  quality_score: number;
  fallback_triggered: boolean;
  traffic_pressure: string;
  benchmark_maturity: number;
  payload: AdaptiveRoutingOutcome;
};

function resolveStorageMode(): AdaptiveRoutingMemoryStorageMode {
  const explicit = String(process.env.TRADEHAX_AI_ROUTING_MEMORY_STORAGE || "")
    .trim()
    .toLowerCase();

  if (explicit === "memory" || explicit === "supabase") {
    return explicit;
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase";
  }

  return "memory";
}

function getSupabaseConfig(): SupabaseConfig | null {
  const baseUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!baseUrl || !serviceKey) {
    return null;
  }

  return {
    baseUrl,
    serviceKey,
    table: String(process.env.TRADEHAX_SUPABASE_AI_ROUTING_MEMORY_TABLE || "ai_routing_memory_events").trim(),
  };
}

function getConfig() {
  const mode = resolveStorageMode();
  const supabase = getSupabaseConfig();

  return {
    mode,
    supabase,
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

    if (response.status === 204) {
      return null as T;
    }

    const text = await response.text();
    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

function getMemoryStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_ADAPTIVE_ROUTING_MEMORY__?: AdaptiveRoutingOutcome[];
  };

  if (!globalRef.__TRADEHAX_ADAPTIVE_ROUTING_MEMORY__) {
    globalRef.__TRADEHAX_ADAPTIVE_ROUTING_MEMORY__ = [];
  }

  return globalRef.__TRADEHAX_ADAPTIVE_ROUTING_MEMORY__;
}

function getHydrationState() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_ADAPTIVE_ROUTING_HYDRATED__?: boolean;
  };

  if (typeof globalRef.__TRADEHAX_ADAPTIVE_ROUTING_HYDRATED__ !== "boolean") {
    globalRef.__TRADEHAX_ADAPTIVE_ROUTING_HYDRATED__ = false;
  }

  return {
    get hydrated() {
      return Boolean(globalRef.__TRADEHAX_ADAPTIVE_ROUTING_HYDRATED__);
    },
    set hydrated(value: boolean) {
      globalRef.__TRADEHAX_ADAPTIVE_ROUTING_HYDRATED__ = value;
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeOutcome(input: Omit<AdaptiveRoutingOutcome, "id" | "timestamp"> & { id?: string; timestamp?: string }) {
  return {
    id: input.id || `arm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    domain: input.domain,
    model: String(input.model || "unknown").slice(0, 160),
    sloProfile: input.sloProfile,
    effectiveSloProfile: input.effectiveSloProfile,
    latencyMs: Math.max(1, Math.floor(input.latencyMs)),
    qualityScore: clamp(Math.round(input.qualityScore), 0, 100),
    fallbackTriggered: Boolean(input.fallbackTriggered),
    trafficPressure: input.trafficPressure,
    benchmarkMaturity:
      typeof input.benchmarkMaturity === "number" ? clamp(input.benchmarkMaturity, 0, 1) : undefined,
    timestamp: input.timestamp || new Date().toISOString(),
  } satisfies AdaptiveRoutingOutcome;
}

function pushMemory(outcome: AdaptiveRoutingOutcome) {
  const memory = getMemoryStore();
  memory.push(outcome);
  if (memory.length > 6000) {
    memory.splice(0, memory.length - 6000);
  }
}

async function hydrateFromSupabaseIfNeeded() {
  const config = getConfig();
  const hydration = getHydrationState();

  if (hydration.hydrated || !config.shouldUseSupabase || !config.supabase) {
    return;
  }

  try {
    const rows = await requestJson<PersistedOutcomeRow[]>(
      config.supabase,
      `${config.supabase.table}?select=payload&order=created_at.desc&limit=1200`,
      { method: "GET" },
    );

    const parsed = (rows || [])
      .map((row) => row?.payload)
      .filter((item): item is AdaptiveRoutingOutcome => Boolean(item && typeof item === "object"))
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const memory = getMemoryStore();
    memory.splice(0, memory.length, ...parsed.slice(-3000));
  } catch {
    // Hydration failures are non-fatal; memory mode continues.
  } finally {
    hydration.hydrated = true;
  }
}

export async function recordAdaptiveRoutingOutcome(
  input: Omit<AdaptiveRoutingOutcome, "id" | "timestamp"> & { id?: string; timestamp?: string },
) {
  const outcome = normalizeOutcome(input);
  pushMemory(outcome);

  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return {
      persisted: false,
      mode: "memory" as const,
      id: outcome.id,
    };
  }

  const row: PersistedOutcomeRow = {
    id: outcome.id,
    created_at: outcome.timestamp,
    domain: outcome.domain,
    model: outcome.model,
    slo_profile: outcome.sloProfile,
    effective_slo_profile: outcome.effectiveSloProfile,
    latency_ms: outcome.latencyMs,
    quality_score: outcome.qualityScore,
    fallback_triggered: outcome.fallbackTriggered,
    traffic_pressure: outcome.trafficPressure || "unknown",
    benchmark_maturity: typeof outcome.benchmarkMaturity === "number" ? outcome.benchmarkMaturity : 0,
    payload: outcome,
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
    id: outcome.id,
  };
}

export async function getAdaptiveRoutingHints(input: {
  domain: PredictionDomain;
  horizonMinutes?: number;
  candidateModels?: string[];
}) {
  await hydrateFromSupabaseIfNeeded();

  const horizonMinutes = Math.min(24 * 60, Math.max(5, Math.floor(input.horizonMinutes || 240)));
  const cutoff = Date.now() - horizonMinutes * 60_000;
  const candidates = new Set((input.candidateModels || []).filter(Boolean));

  const scopedRows = getMemoryStore().filter((row) => {
    if (row.domain !== input.domain) return false;
    if (Date.parse(row.timestamp) < cutoff) return false;
    if (candidates.size === 0) return true;
    return candidates.has(row.model);
  });

  if (scopedRows.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      domain: input.domain,
      sampleSize: 0,
      confidence: 0,
      preferredModel: null,
      avoidModels: [],
      sloBias: "balanced",
      tokenMultiplierHint: 1,
      temperatureMultiplierHint: 1,
      topPMultiplierHint: 1,
      reasons: ["no_recent_adaptive_samples"],
    } satisfies AdaptiveRoutingHints;
  }

  const byModel = new Map<string, AdaptiveRoutingOutcome[]>();
  for (const row of scopedRows) {
    const bucket = byModel.get(row.model) || [];
    bucket.push(row);
    byModel.set(row.model, bucket);
  }

  const modelScores = Array.from(byModel.entries()).map(([model, rows]) => {
    const samples = rows.length;
    const fallbackRate = rows.filter((r) => r.fallbackTriggered).length / samples;
    const avgLatency = rows.reduce((sum, r) => sum + r.latencyMs, 0) / samples;
    const avgQuality = rows.reduce((sum, r) => sum + r.qualityScore, 0) / samples;
    const score = (1 - fallbackRate) * 56 + avgQuality * 0.5 - avgLatency / 180;

    return {
      model,
      samples,
      fallbackRate,
      avgLatency,
      avgQuality,
      score,
    };
  });

  modelScores.sort((a, b) => b.score - a.score);
  const preferred = modelScores[0] || null;

  const avoidModels = modelScores
    .filter((entry) => entry.samples >= 8 && (entry.fallbackRate >= 0.34 || entry.avgLatency > 7_500))
    .map((entry) => entry.model)
    .slice(0, 4);

  const avgLatencyAll = scopedRows.reduce((sum, row) => sum + row.latencyMs, 0) / scopedRows.length;
  const avgQualityAll = scopedRows.reduce((sum, row) => sum + row.qualityScore, 0) / scopedRows.length;

  let sloBias: SloProfile = "balanced";
  let tokenMultiplierHint = 1;
  let temperatureMultiplierHint = 1;
  let topPMultiplierHint = 1;
  const reasons: string[] = [];

  if (avgLatencyAll > 6_000) {
    sloBias = "latency";
    tokenMultiplierHint *= 0.88;
    temperatureMultiplierHint *= 0.95;
    reasons.push("adaptive_memory_latency_guard");
  } else if (avgQualityAll >= 86 && avgLatencyAll < 4_200) {
    sloBias = "quality";
    tokenMultiplierHint *= 1.08;
    topPMultiplierHint *= 1.02;
    reasons.push("adaptive_memory_quality_expand");
  }

  if (scopedRows.length < 20) {
    reasons.push("adaptive_memory_low_sample_caution");
  }

  const confidence = clamp(Math.round(Math.min(95, Math.sqrt(scopedRows.length) * 8)), 12, 95);

  return {
    generatedAt: new Date().toISOString(),
    domain: input.domain,
    sampleSize: scopedRows.length,
    confidence,
    preferredModel: preferred?.model || null,
    avoidModels,
    sloBias,
    tokenMultiplierHint: clamp(tokenMultiplierHint, 0.75, 1.2),
    temperatureMultiplierHint: clamp(temperatureMultiplierHint, 0.8, 1.15),
    topPMultiplierHint: clamp(topPMultiplierHint, 0.85, 1.08),
    reasons,
  } satisfies AdaptiveRoutingHints;
}

export async function getAdaptiveRoutingMemorySummary() {
  await hydrateFromSupabaseIfNeeded();
  const memory = getMemoryStore();

  const domains: PredictionDomain[] = ["stock", "crypto", "kalshi", "general"];

  return {
    generatedAt: new Date().toISOString(),
    records: memory.length,
    domains: domains.map((domain) => {
      const rows = memory.filter((row) => row.domain === domain);
      const requests = rows.length;
      const avgLatencyMs =
        requests > 0 ? Math.round(rows.reduce((sum, row) => sum + row.latencyMs, 0) / requests) : 0;
      const avgQuality =
        requests > 0
          ? Number.parseFloat((rows.reduce((sum, row) => sum + row.qualityScore, 0) / requests).toFixed(1))
          : 0;
      const fallbackRate =
        requests > 0
          ? Number.parseFloat(((rows.filter((row) => row.fallbackTriggered).length / requests) * 100).toFixed(1))
          : 0;

      return {
        domain,
        requests,
        avgLatencyMs,
        avgQuality,
        fallbackRate,
      };
    }),
  };
}
