import type { IngestedInteractionRecord } from "@/lib/ai/data-ingestion";

type BehaviorStorageMode = "memory" | "supabase";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  behaviorTable: string;
  consentTable: string;
  exportTable: string;
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

export type PersistedConsentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  user_key: string;
  analytics_consent: boolean;
  training_consent: boolean;
  metadata: Record<string, unknown>;
};

export type PersistedTrainingExportRow = {
  id: string;
  created_at: string;
  source: string;
  rows: number;
  payload_jsonl: string;
  metadata: Record<string, unknown>;
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
    behaviorTable: String(process.env.TRADEHAX_SUPABASE_AI_BEHAVIOR_TABLE || "ai_behavior_events").trim(),
    consentTable: String(process.env.TRADEHAX_SUPABASE_AI_CONSENT_TABLE || "ai_user_consent").trim(),
    exportTable: String(process.env.TRADEHAX_SUPABASE_AI_EXPORT_TABLE || "ai_training_exports").trim(),
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
    `${config.supabase.behaviorTable}?on_conflict=id`,
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
  let query = `${config.supabase.behaviorTable}?select=*&order=created_at.desc&limit=${limit}`;
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
    behaviorTable: config.supabase?.behaviorTable || "memory_store_only",
    consentTable: config.supabase?.consentTable || "memory_store_only",
    exportTable: config.supabase?.exportTable || "memory_store_only",
    generatedAt: new Date().toISOString(),
  };
}

export async function persistUserConsent(input: {
  userKey: string;
  analyticsConsent: boolean;
  trainingConsent: boolean;
  metadata?: Record<string, unknown>;
}) {
  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return {
      persisted: false,
      mode: "memory" as const,
      reason: "supabase_not_configured",
    };
  }

  const now = new Date().toISOString();
  const row: PersistedConsentRow = {
    id: `cons_${input.userKey}`,
    created_at: now,
    updated_at: now,
    user_key: input.userKey,
    analytics_consent: input.analyticsConsent,
    training_consent: input.trainingConsent,
    metadata: input.metadata || {},
  };

  await requestJson<unknown>(
    config.supabase,
    `${config.supabase.consentTable}?on_conflict=id`,
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

export async function getPersistedUserConsent(userKey: string) {
  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return null as PersistedConsentRow | null;
  }

  const rows = await requestJson<PersistedConsentRow[]>(
    config.supabase,
    `${config.supabase.consentTable}?user_key=${encodeEq(userKey)}&limit=1`,
    { method: "GET" },
  );

  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function listPersistedConsentRecords(limit = 200) {
  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return [] as PersistedConsentRow[];
  }

  const bounded = Math.min(1000, Math.max(1, Math.floor(limit)));
  const rows = await requestJson<PersistedConsentRow[]>(
    config.supabase,
    `${config.supabase.consentTable}?select=*&order=updated_at.desc&limit=${bounded}`,
    { method: "GET" },
  );

  return Array.isArray(rows) ? rows : [];
}

export async function persistTrainingExport(input: {
  source: string;
  rows: number;
  payloadJsonl: string;
  metadata?: Record<string, unknown>;
}) {
  const config = getConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return {
      persisted: false,
      mode: "memory" as const,
      reason: "supabase_not_configured",
    };
  }

  const row: PersistedTrainingExportRow = {
    id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    source: input.source,
    rows: Math.max(0, Math.floor(input.rows)),
    payload_jsonl: input.payloadJsonl,
    metadata: input.metadata || {},
  };

  await requestJson<unknown>(
    config.supabase,
    `${config.supabase.exportTable}?on_conflict=id`,
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
    id: row.id,
  };
}
