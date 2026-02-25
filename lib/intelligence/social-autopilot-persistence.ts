type SocialChannel =
  | "youtube"
  | "discord"
  | "x"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "telegram"
  | "tiktok";

type DraftStatus = "draft" | "pending_approval" | "approved" | "published";
type QueueStatus = "queued" | "running" | "done" | "failed";
type StorageMode = "memory" | "supabase";

export type SocialAutopilotDraft = {
  id: string;
  sourceUrl: string;
  focus: string;
  channels: SocialChannel[];
  content: Record<string, unknown>;
  status: DraftStatus;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  performance: {
    impressions: number;
    engagements: number;
    clicks: number;
    lastUpdatedAt?: string;
  };
};

export type SocialAutopilotQueueJob = {
  id: string;
  draftId: string;
  channel: SocialChannel;
  runAt: string;
  status: QueueStatus;
  attempts: number;
  lastError?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
};

type MemoryStore = {
  drafts: Map<string, SocialAutopilotDraft>;
  queue: Map<string, SocialAutopilotQueueJob>;
  lastError?: string;
};

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  draftsTable: string;
  queueTable: string;
};

function getMemoryStore(): MemoryStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_SOCIAL_AUTOPILOT_PERSISTENCE__?: MemoryStore;
  };

  if (!globalRef.__TRADEHAX_SOCIAL_AUTOPILOT_PERSISTENCE__) {
    globalRef.__TRADEHAX_SOCIAL_AUTOPILOT_PERSISTENCE__ = {
      drafts: new Map(),
      queue: new Map(),
    };
  }

  return globalRef.__TRADEHAX_SOCIAL_AUTOPILOT_PERSISTENCE__;
}

function nowIso() {
  return new Date().toISOString();
}

function resolveStorageMode(): StorageMode {
  const raw = String(process.env.TRADEHAX_SOCIAL_AUTOPILOT_STORAGE || "").trim().toLowerCase();
  if (raw === "memory" || raw === "supabase") {
    return raw as StorageMode;
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
    draftsTable: String(
      process.env.TRADEHAX_SUPABASE_SOCIAL_AUTOPILOT_DRAFTS_TABLE || "tradehax_social_autopilot_drafts",
    ).trim(),
    queueTable: String(
      process.env.TRADEHAX_SUPABASE_SOCIAL_AUTOPILOT_QUEUE_TABLE || "tradehax_social_autopilot_queue",
    ).trim(),
  };
}

function getStorageConfig() {
  const supabase = getSupabaseConfig();
  const mode = resolveStorageMode();
  return {
    mode,
    supabase,
    shouldUseSupabase: mode === "supabase" && Boolean(supabase),
  };
}

let lastSupabaseError = "";

function rememberSupabaseError(message: string) {
  lastSupabaseError = message.slice(0, 600);
  getMemoryStore().lastError = lastSupabaseError;
}

function getSupabaseHeaders(config: SupabaseConfig, extraHeaders?: HeadersInit) {
  return {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };
}

async function requestSupabaseJson<T>(
  config: SupabaseConfig,
  path: string,
  init: RequestInit = {},
  timeoutMs = 8_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${config.baseUrl}/rest/v1/${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: getSupabaseHeaders(config, init.headers),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase ${response.status}: ${text.slice(0, 220)}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    const text = await response.text();
    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    rememberSupabaseError(error instanceof Error ? error.message : "Supabase request failed.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeChannels(input: unknown): SocialChannel[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item).toLowerCase())
    .filter(
      (item): item is SocialChannel =>
        item === "youtube" ||
        item === "discord" ||
        item === "x" ||
        item === "linkedin" ||
        item === "instagram" ||
        item === "facebook" ||
        item === "telegram" ||
        item === "tiktok",
    )
    .slice(0, 8);
}

function mapDraftRow(row: Record<string, unknown>): SocialAutopilotDraft {
  const performanceRaw = row.performance;
  const performance =
    performanceRaw && typeof performanceRaw === "object"
      ? (performanceRaw as Record<string, unknown>)
      : {};

  return {
    id: String(row.id || ""),
    sourceUrl: String(row.source_url || ""),
    focus: String(row.focus || "cross-platform growth"),
    channels: normalizeChannels(row.channels),
    content: row.content && typeof row.content === "object" ? (row.content as Record<string, unknown>) : {},
    status:
      row.status === "pending_approval" || row.status === "approved" || row.status === "published"
        ? row.status
        : "draft",
    scheduledAt: typeof row.scheduled_at === "string" ? row.scheduled_at : undefined,
    createdAt: String(row.created_at || nowIso()),
    updatedAt: String(row.updated_at || nowIso()),
    performance: {
      impressions: Math.max(0, Number(performance.impressions || 0)),
      engagements: Math.max(0, Number(performance.engagements || 0)),
      clicks: Math.max(0, Number(performance.clicks || 0)),
      lastUpdatedAt: typeof performance.lastUpdatedAt === "string" ? performance.lastUpdatedAt : undefined,
    },
  };
}

function mapQueueRow(row: Record<string, unknown>): SocialAutopilotQueueJob {
  const channel = String(row.channel || "discord").toLowerCase();

  return {
    id: String(row.id || ""),
    draftId: String(row.draft_id || ""),
    channel:
      channel === "youtube" ||
      channel === "discord" ||
      channel === "x" ||
      channel === "linkedin" ||
      channel === "instagram" ||
      channel === "facebook" ||
      channel === "telegram" ||
      channel === "tiktok"
        ? (channel as SocialChannel)
        : "discord",
    runAt: String(row.run_at || nowIso()),
    status:
      row.status === "running" || row.status === "done" || row.status === "failed"
        ? row.status
        : "queued",
    attempts: Math.max(0, Number(row.attempts || 0)),
    lastError: typeof row.last_error === "string" ? row.last_error : undefined,
    result: typeof row.result === "string" ? row.result : undefined,
    createdAt: String(row.created_at || nowIso()),
    updatedAt: String(row.updated_at || nowIso()),
  };
}

function draftToSupabaseRow(draft: SocialAutopilotDraft) {
  return {
    id: draft.id,
    source_url: draft.sourceUrl,
    focus: draft.focus,
    channels: draft.channels,
    content: draft.content,
    status: draft.status,
    scheduled_at: draft.scheduledAt || null,
    created_at: draft.createdAt,
    updated_at: draft.updatedAt,
    performance: draft.performance,
  };
}

function queueToSupabaseRow(job: SocialAutopilotQueueJob) {
  return {
    id: job.id,
    draft_id: job.draftId,
    channel: job.channel,
    run_at: job.runAt,
    status: job.status,
    attempts: job.attempts,
    last_error: job.lastError || null,
    result: job.result || null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

function encodeEq(value: string) {
  return `eq.${encodeURIComponent(value)}`;
}

export async function listAutopilotDrafts() {
  const config = getStorageConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    const rows = Array.from(getMemoryStore().drafts.values());
    return rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  try {
    const rows = await requestSupabaseJson<Record<string, unknown>[]>(
      config.supabase,
      `${config.supabase.draftsTable}?order=updated_at.desc`,
      { method: "GET" },
    );
    return (rows || []).map((row) => mapDraftRow(row));
  } catch {
    const rows = Array.from(getMemoryStore().drafts.values());
    return rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
}

export async function getAutopilotDraft(draftId: string) {
  const normalizedId = draftId.trim();
  const config = getStorageConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    return getMemoryStore().drafts.get(normalizedId) || null;
  }

  try {
    const rows = await requestSupabaseJson<Record<string, unknown>[]>(
      config.supabase,
      `${config.supabase.draftsTable}?id=${encodeEq(normalizedId)}&limit=1`,
      { method: "GET" },
    );
    if (Array.isArray(rows) && rows[0]) {
      return mapDraftRow(rows[0]);
    }
  } catch {
    // fallback below
  }

  return getMemoryStore().drafts.get(normalizedId) || null;
}

export async function upsertAutopilotDraft(draft: SocialAutopilotDraft) {
  const normalized = {
    ...draft,
    id: draft.id.trim(),
    focus: draft.focus.trim().slice(0, 120),
    sourceUrl: draft.sourceUrl.trim().slice(0, 320),
  };

  const config = getStorageConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    getMemoryStore().drafts.set(normalized.id, normalized);
    return normalized;
  }

  try {
    const rows = await requestSupabaseJson<Record<string, unknown>[]>(
      config.supabase,
      `${config.supabase.draftsTable}?on_conflict=id`,
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify([draftToSupabaseRow(normalized)]),
      },
    );

    if (Array.isArray(rows) && rows[0]) {
      const mapped = mapDraftRow(rows[0]);
      getMemoryStore().drafts.set(mapped.id, mapped);
      return mapped;
    }
  } catch {
    // fallback below
  }

  getMemoryStore().drafts.set(normalized.id, normalized);
  return normalized;
}

export async function listAutopilotQueueJobs() {
  const config = getStorageConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    const rows = Array.from(getMemoryStore().queue.values());
    return rows.sort((a, b) => Date.parse(a.runAt) - Date.parse(b.runAt));
  }

  try {
    const rows = await requestSupabaseJson<Record<string, unknown>[]>(
      config.supabase,
      `${config.supabase.queueTable}?order=run_at.asc`,
      { method: "GET" },
    );
    return (rows || []).map((row) => mapQueueRow(row));
  } catch {
    const rows = Array.from(getMemoryStore().queue.values());
    return rows.sort((a, b) => Date.parse(a.runAt) - Date.parse(b.runAt));
  }
}

export async function upsertAutopilotQueueJobs(jobs: SocialAutopilotQueueJob[]) {
  if (jobs.length === 0) return;

  const normalized = jobs.map((job) => ({
    ...job,
    id: job.id.trim(),
    draftId: job.draftId.trim(),
    attempts: Math.max(0, Math.floor(job.attempts)),
  }));

  const config = getStorageConfig();
  if (!config.shouldUseSupabase || !config.supabase) {
    for (const job of normalized) {
      getMemoryStore().queue.set(job.id, job);
    }
    return;
  }

  try {
    await requestSupabaseJson<unknown>(
      config.supabase,
      `${config.supabase.queueTable}?on_conflict=id`,
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(normalized.map((job) => queueToSupabaseRow(job))),
      },
    );
  } catch {
    // fallback below
  }

  for (const job of normalized) {
    getMemoryStore().queue.set(job.id, job);
  }
}

export async function getSocialAutopilotPersistenceStatus() {
  const config = getStorageConfig();
  return {
    mode: config.shouldUseSupabase ? "supabase" : "memory",
    configured: Boolean(config.supabase),
    draftsTable: config.supabase?.draftsTable || "memory_social_autopilot_drafts",
    queueTable: config.supabase?.queueTable || "memory_social_autopilot_queue",
    generatedAt: nowIso(),
    fallbackActive: config.mode === "supabase" && !config.shouldUseSupabase,
    lastError: lastSupabaseError || getMemoryStore().lastError,
  };
}
