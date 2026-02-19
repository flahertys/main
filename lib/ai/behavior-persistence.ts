import type { IngestedInteractionRecord } from "@/lib/ai/data-ingestion";

type BehaviorStorageMode = "memory" | "supabase";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  table: string;
};

type PersistedBehaviorRow = {
  id: string;
  created_at: string;
  event_timestamp: string;
  source: string;
  category: string;
  user_key: string;
  session_id: string | null;
  route: string | null;
  prompt: string;
  response: string;
  metadata: Record<string, unknown>;
  training_eligible: boolean;
};

function resolveStorageMode(): BehaviorStorageMode {
  const raw = String(process.env.TRADEHAX_AI_BEHAVIOR_STORAGE || "")
    .trim()
    .toLowerCase();
  if (raw === "memory" || raw === "supabase") {
    return raw;
  }
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase";
  }
  return "memory";
}

function getSupabaseConfig(): SupabaseConfig | null {
  const baseUrl = String(process.env.SUPABASE_URL || "").trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!baseUrl || !serviceKey) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    serviceKey,
    table: String(process.env.TRADEHAX_SUPABASE_AI_BEHAVIOR_TABLE || "ai_behavior_events").trim(),
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

async function requestJson<T>(
  config: SupabaseConfig,
  path: string,
  init: RequestInit,
  timeoutMs = 8_000,
) {
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

function encodeEq(value: string) {
  return `eq.${encodeURIComponent(value)}`;
}

function toPersistedRow(record: IngestedInteractionRecord): PersistedBehaviorRow {
  const metadata = record.metadata || {};
  const route = typeof metadata.route === "string" ? metadata.route : null;
  const sessionId = typeof metadata.session_id === "string" ? metadata.session_id : null;

  return {
    id: record.id,
    created_at: record.ingestedAt,
    event_timestamp: record.timestamp,
    source: record.source,
    category: record.category,
    user_key: record.userKey,
    session_id: sessionId,
    route,
    prompt: record.prompt,
    response: record.response,
    metadata,
    training_eligible: record.trainingEligible,
  };
}

export async function persistBehaviorRecord(record: IngestedInteractionRecord) {
  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return {
      persisted: false,
      mode: "memory" as const,
      reason: "supabase_not_configured",
    };
  }

  const row = toPersistedRow(record);
  await requestJson<unknown>(
    config.supabase,
    `${config.supabase.table}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([row]),
    },
  );

  return {
    persisted: true,
    mode: "supabase" as const,
  };
}

export async function listPersistedBehaviorRecords(input?: {
  limit?: number;
  userKey?: string;
}) {
  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return [] as PersistedBehaviorRow[];
  }

  const limit = Math.min(1000, Math.max(1, Math.floor(input?.limit || 200)));
  let query = `${config.supabase.table}?select=*&order=created_at.desc&limit=${limit}`;
  if (input?.userKey) {
    query += `&user_key=${encodeEq(input.userKey)}`;
  }

  const rows = await requestJson<PersistedBehaviorRow[]>(
    config.supabase,
    query,
    { method: "GET" },
  );

  return Array.isArray(rows) ? rows : [];
}

export async function getBehaviorPersistenceStatus() {
  const config = getConfig();
  return {
    mode: config.mode,
    configured: Boolean(config.supabase),
    shouldUseSupabase: config.shouldUseSupabase,
    table: config.supabase?.table || "memory_store_only",
    generatedAt: new Date().toISOString(),
  };
}
