import { investorAcademyModules } from "@/lib/investor-academy/modules";
import {
    AcademyProgressSnapshot,
    computeUpdatedStreak,
    createDefaultProgress,
    getCurrentIsoDate,
    mergeProgressSnapshots,
    normalizeProgressSnapshot,
    pickDailyQuest,
} from "@/lib/investor-academy/progress";
import { getUserSnapshot } from "@/lib/monetization/engine";
import { UsageFeature } from "@/lib/monetization/types";

type AcademyStore = {
  progressByUserId: Map<string, AcademyProgressSnapshot>;
  adminAuditLogs: AcademyAdminAuditEntry[];
  adminActionReplay: Map<string, AcademyAdminActionReplayEntry>;
  economyLedgerByUserId: Map<string, AcademyEconomyLedgerEntry[]>;
  lastError?: string;
};

type AcademyStorageMode = "memory" | "supabase";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
  progressTable: string;
  auditTable: string;
  replayTable: string;
  ledgerTable: string;
};

export type AcademyStorageStatus = {
  mode: AcademyStorageMode;
  configured: boolean;
  progressTable: string;
  auditTable: string;
  replayTable: string;
  generatedAt: string;
  fallbackActive: boolean;
  lastError?: string;
};

export type AcademyProgressSample = {
  userId: string;
  completedModuleIds: string[];
  streakDays: number;
  bonusXp: number;
  bonusHax: number;
  dailyQuestCompleted: boolean;
  updatedAt: string;
};

export type AcademyAdminAuditEntry = {
  id: string;
  action: string;
  targetUserId: string | null;
  adminMode: string;
  requestIp: string;
  note: string;
  createdAt: string;
};

export type AcademyAdminActionReplayEntry = {
  key: string;
  action: string;
  targetUserId: string | null;
  status: number;
  responseBody: Record<string, unknown>;
  createdAt: string;
  expiresAtEpochMs: number;
};

export type AcademyReplayHealthStats = {
  mode: "memory" | "supabase";
  activeCount: number;
  expiredCount: number;
  totalCount: number;
  lastPurgeAt: string | null;
  sampledAt: string;
};

export type AcademyReplayPurgeEvent = {
  id: string;
  createdAt: string;
  adminMode: string;
  deletedCount: number;
  source: "cron" | "manual" | "unknown";
  note: string;
};

export type AcademyReplaySloStatus = {
  level: "ok" | "warn" | "critical";
  reasons: string[];
  evaluatedAt: string;
};

export type AcademyReplayAutoRemediationResult = {
  enabled: boolean;
  triggered: boolean;
  cooldownMinutes: number;
  reason: string;
  lastTriggeredAt: string | null;
  result?: {
    mode: "memory" | "supabase";
    deletedCount: number;
    deletedMemoryCount: number;
    purgedAt: string;
  };
};

export type AcademyReplayCriticalDrillResult = {
  simulatedSloLevel: "critical";
  enabled: boolean;
  wouldTrigger: boolean;
  cooldownMinutes: number;
  reason: string;
  lastTriggeredAt: string | null;
  estimatedDeletedCount: number;
  evaluatedAt: string;
};

export type AcademyReadinessItem = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type AcademyReplayReadinessChecklist = {
  ready: boolean;
  score: number;
  maxScore: number;
  items: AcademyReadinessItem[];
  evaluatedAt: string;
};

export type AcademyEnablementGuideStep = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "verify" | "done";
  detail: string;
  actionHint?: string;
};

export type AcademyReplayEnablementGuide = {
  readyToEnable: boolean;
  blockers: number;
  warnings: number;
  summary: string;
  steps: AcademyEnablementGuideStep[];
  generatedAt: string;
};

export type AcademyScoreBreakdown = {
  completedModules: number;
  moduleXp: number;
  moduleHax: number;
  bonusXp: number;
  bonusHax: number;
  totalXp: number;
  totalHax: number;
  streakScore: number;
  questScore: number;
  taskCompletionScore: number;
  compositeScore: number;
};

export type AcademyLeaderboardEntry = {
  rank: number;
  userId: string;
  score: AcademyScoreBreakdown;
  streakDays: number;
  dailyQuestCompleted: boolean;
  updatedAt: string;
};

export type AcademyLeaderboardSeason = "daily" | "weekly" | "all_time";

export type AcademyFeatureCostRule = {
  feature: UsageFeature;
  label: string;
  unitCostHax: number;
};

export type AcademyEconomyLedgerFeature = UsageFeature | "season_reward";

export type AcademyFeatureSpendQuote = AcademyFeatureCostRule & {
  usedToday: number;
  dailyLimit: number;
  projectedCostHax: number;
};

export type AcademyEconomySnapshot = {
  userId: string;
  score: AcademyScoreBreakdown;
  walletHaxEarned: number;
  walletHaxCreditTotal: number;
  walletHaxSpentTotal: number;
  walletHaxSpentToday: number;
  walletHaxAvailable: number;
  featureSpendQuotes: AcademyFeatureSpendQuote[];
  generatedAt: string;
};

export type AcademyEconomyLedgerEntry = {
  id: string;
  userId: string;
  feature: AcademyEconomyLedgerFeature;
  units: number;
  unitCostHax: number;
  totalCostHax: number;
  source: string;
  transactionRef: string;
  createdAt: string;
};

export type AcademyFeatureChargeResult = {
  charged: boolean;
  reason?: string;
  entry?: AcademyEconomyLedgerEntry;
  balance?: AcademyEconomySnapshot;
};

export type AcademySeasonPayoutPlanItem = {
  rank: number;
  rewardHax: number;
};

export type AcademySeasonPayoutCreditResult = {
  userId: string;
  rank: number;
  rewardHax: number;
  transactionRef: string;
  status: "credited" | "already_credited" | "dry_run" | "skipped";
  reason?: string;
  entryId?: string;
};

export type AcademySeasonPayoutResult = {
  season: Exclude<AcademyLeaderboardSeason, "all_time">;
  dryRun: boolean;
  startedAt: string;
  seasonWindowStart: string;
  plan: AcademySeasonPayoutPlanItem[];
  recipients: AcademySeasonPayoutCreditResult[];
  creditedCount: number;
  alreadyCreditedCount: number;
  dryRunCount: number;
  skippedCount: number;
  totalCreditedHax: number;
};

export type AcademySeasonPayoutHistoryEntry = {
  id: string;
  createdAt: string;
  adminMode: string;
  season: "daily" | "weekly";
  dryRun: boolean;
  creditedCount: number;
  alreadyCreditedCount: number;
  totalCreditedHax: number;
  note: string;
};

export type AcademySeasonPayoutOutcomeSummary = {
  hasRun: boolean;
  lastRun?: {
    id: string;
    createdAt: string;
    season: "daily" | "weekly";
    mode: "dry-run" | "execute";
    creditedCount: number;
    alreadyCreditedCount: number;
    totalCreditedHax: number;
    adminMode: string;
  };
  health: "ok" | "warn" | "stale" | "never_run";
  hoursAgo?: number;
  nextRecommendedSeason?: "daily" | "weekly";
  message: string;
};

function getStore(): AcademyStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_ACADEMY_STORE__?: AcademyStore;
  };

  if (!globalRef.__TRADEHAX_ACADEMY_STORE__) {
    globalRef.__TRADEHAX_ACADEMY_STORE__ = {
      progressByUserId: new Map(),
      adminAuditLogs: [],
      adminActionReplay: new Map(),
      economyLedgerByUserId: new Map(),
    };
  }

  return globalRef.__TRADEHAX_ACADEMY_STORE__;
}

function sanitizeUserId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

function nowIso() {
  return new Date().toISOString();
}

function createAuditId() {
  return `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeReplayKey(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9:_\-./]/g, "").slice(0, 120);
}

function resolveStorageMode(): AcademyStorageMode {
  const raw = String(process.env.TRADEHAX_ACADEMY_STORAGE || "").trim().toLowerCase();
  if (raw === "memory" || raw === "supabase") {
    return raw as AcademyStorageMode;
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
    progressTable: String(
      process.env.TRADEHAX_SUPABASE_ACADEMY_TABLE || "tradehax_investor_academy_progress",
    ).trim(),
    auditTable: String(
      process.env.TRADEHAX_SUPABASE_ACADEMY_AUDIT_TABLE || "tradehax_investor_academy_admin_audit",
    ).trim(),
    replayTable: String(
      process.env.TRADEHAX_SUPABASE_ACADEMY_REPLAY_TABLE || "tradehax_investor_academy_admin_replay",
    ).trim(),
    ledgerTable: String(
      process.env.TRADEHAX_SUPABASE_ACADEMY_LEDGER_TABLE || "tradehax_investor_academy_economy_ledger",
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
  getStore().lastError = lastSupabaseError;
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

async function requestSupabaseCount(
  config: SupabaseConfig,
  path: string,
  timeoutMs = 8_000,
): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${config.baseUrl}/rest/v1/${path}`;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: getSupabaseHeaders(config, {
        Prefer: "count=exact",
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase count ${response.status}: ${text.slice(0, 220)}`);
    }

    const contentRange = response.headers.get("content-range") || "";
    const totalRaw = contentRange.split("/").pop() || "0";
    const total = Number(totalRaw);
    return Number.isFinite(total) ? total : 0;
  } catch (error) {
    rememberSupabaseError(error instanceof Error ? error.message : "Supabase count request failed.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function encodeEq(value: string) {
  return `eq.${encodeURIComponent(value)}`;
}

function mapIncomingSnapshotRow(row: Record<string, unknown>) {
  return row.snapshot_json;
}

function toProgressSample(snapshot: AcademyProgressSnapshot): AcademyProgressSample {
  return {
    userId: snapshot.userId,
    completedModuleIds: snapshot.completedModuleIds,
    streakDays: snapshot.streakDays,
    bonusXp: snapshot.bonusXp,
    bonusHax: snapshot.bonusHax,
    dailyQuestCompleted: snapshot.dailyQuest.completed,
    updatedAt: snapshot.updatedAt,
  };
}

function parseDeletedCountFromNote(note: string) {
  const matched = note.match(/deleted=(\d+)/i);
  if (!matched) {
    return 0;
  }
  const parsed = Number(matched[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createLedgerId() {
  return `ledger_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getTodayUtcBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { start, end };
}

function isTsInTodayUtc(iso: string) {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) {
    return false;
  }
  const { start, end } = getTodayUtcBounds();
  return ts >= start.getTime() && ts < end.getTime();
}

function getSeasonStartIso(season: AcademyLeaderboardSeason) {
  if (season === "all_time") {
    return null;
  }

  const now = new Date();
  if (season === "daily") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  }

  const utcDay = now.getUTCDay();
  const mondayOffset = (utcDay + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset));
  return monday.toISOString();
}

function getAcademySeasonPayoutPlan(season: Exclude<AcademyLeaderboardSeason, "all_time">): AcademySeasonPayoutPlanItem[] {
  const defaultPlan =
    season === "daily"
      ? [
          { rank: 1, rewardHax: 12 },
          { rank: 2, rewardHax: 8 },
          { rank: 3, rewardHax: 5 },
        ]
      : [
          { rank: 1, rewardHax: 40 },
          { rank: 2, rewardHax: 25 },
          { rank: 3, rewardHax: 15 },
          { rank: 4, rewardHax: 10 },
          { rank: 5, rewardHax: 6 },
        ];

  const raw = String(
    season === "daily"
      ? process.env.TRADEHAX_ACADEMY_DAILY_PAYOUT_PLAN
      : process.env.TRADEHAX_ACADEMY_WEEKLY_PAYOUT_PLAN,
  ).trim();

  if (!raw) {
    return defaultPlan;
  }

  const parsed = raw
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [rankRaw, rewardRaw] = chunk.split(":");
      const rank = Number(rankRaw);
      const rewardHax = Number(rewardRaw);
      return {
        rank: Number.isFinite(rank) && rank > 0 ? Math.floor(rank) : 0,
        rewardHax: Number.isFinite(rewardHax) && rewardHax > 0 ? Math.floor(rewardHax) : 0,
      };
    })
    .filter((item) => item.rank > 0 && item.rewardHax > 0)
    .sort((a, b) => a.rank - b.rank);

  return parsed.length > 0 ? parsed : defaultPlan;
}

async function persistAcademyLedgerEntry(entry: AcademyEconomyLedgerEntry) {
  const store = getStore();
  const existingEntries = store.economyLedgerByUserId.get(entry.userId) || [];
  store.economyLedgerByUserId.set(entry.userId, [entry, ...existingEntries].slice(0, 1000));

  const config = getStorageConfig();
  if (config.shouldUseSupabase && config.supabase) {
    try {
      await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.ledgerTable}?on_conflict=transaction_ref`,
        {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify([
            {
              id: entry.id,
              user_id: entry.userId,
              feature: entry.feature,
              units: entry.units,
              unit_cost_hax: entry.unitCostHax,
              total_cost_hax: entry.totalCostHax,
              source: entry.source,
              transaction_ref: entry.transactionRef,
              created_at: entry.createdAt,
            },
          ]),
        },
      );
    } catch {
      // keep memory entry even if supabase write fails
    }
  }
}

function memoryGetProgress(userId: string) {
  const store = getStore();
  const existing = store.progressByUserId.get(userId);

  if (existing) {
    const normalized = normalizeProgressSnapshot(existing, investorAcademyModules);
    store.progressByUserId.set(userId, normalized);
    return normalized;
  }

  const created = {
    ...createDefaultProgress(investorAcademyModules),
    userId,
  };
  store.progressByUserId.set(userId, created);
  return created;
}

function memoryUpsertProgress(userId: string, input: unknown) {
  const prior = memoryGetProgress(userId);
  const incoming = normalizeProgressSnapshot(input, investorAcademyModules);
  const merged = mergeProgressSnapshots(
    {
      ...prior,
      userId,
    },
    {
      ...incoming,
      userId,
    },
    investorAcademyModules,
  );

  const store = getStore();
  store.progressByUserId.set(userId, merged);
  return merged;
}

export async function getAcademyProgressForUser(userId: string) {
  const sanitizedUserId = sanitizeUserId(userId);
  const config = getStorageConfig();

  if (!config.shouldUseSupabase || !config.supabase) {
    return memoryGetProgress(sanitizedUserId);
  }

  try {
    const rows = await requestSupabaseJson<Record<string, unknown>[]>(
      config.supabase,
      `${config.supabase.progressTable}?user_id=${encodeEq(sanitizedUserId)}&limit=1`,
      { method: "GET" },
    );

    if (Array.isArray(rows) && rows[0]) {
      const remoteSnapshot = normalizeProgressSnapshot(
        mapIncomingSnapshotRow(rows[0]),
        investorAcademyModules,
      );
      const merged = mergeProgressSnapshots(
        {
          ...memoryGetProgress(sanitizedUserId),
          userId: sanitizedUserId,
        },
        {
          ...remoteSnapshot,
          userId: sanitizedUserId,
        },
        investorAcademyModules,
      );
      memoryUpsertProgress(sanitizedUserId, merged);
      return merged;
    }
  } catch {
    return memoryGetProgress(sanitizedUserId);
  }

  const created = memoryGetProgress(sanitizedUserId);

  try {
    await requestSupabaseJson<Record<string, unknown>[]>(
      config.supabase,
      `${config.supabase.progressTable}?on_conflict=user_id`,
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify([
          {
            user_id: sanitizedUserId,
            snapshot_json: created,
            updated_at: nowIso(),
          },
        ]),
      },
    );
  } catch {
    // local fallback already in place
  }

  return created;
}

export async function getAcademyStorageStatus(): Promise<AcademyStorageStatus> {
  const config = getStorageConfig();
  return {
    mode: config.shouldUseSupabase ? "supabase" : "memory",
    configured: Boolean(config.supabase),
    progressTable: config.supabase?.progressTable || "memory_academy_progress",
    auditTable: config.supabase?.auditTable || "memory_academy_admin_audit",
    replayTable: config.supabase?.replayTable || "memory_academy_admin_replay",
    generatedAt: nowIso(),
    fallbackActive: config.mode === "supabase" && !config.shouldUseSupabase,
    lastError: lastSupabaseError || getStore().lastError,
  };
}

export async function listAcademyProgressSamples(limit = 12): Promise<AcademyProgressSample[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const config = getStorageConfig();

  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.progressTable}?order=updated_at.desc&limit=${safeLimit}`,
        { method: "GET" },
      );

      const samples = (rows || [])
        .map((row) => normalizeProgressSnapshot(mapIncomingSnapshotRow(row), investorAcademyModules))
        .map((snapshot) => toProgressSample(snapshot));

      if (samples.length > 0) {
        return samples;
      }
    } catch {
      // fallback to memory below
    }
  }

  const memorySamples = Array.from(getStore().progressByUserId.values())
    .map((entry) => normalizeProgressSnapshot(entry, investorAcademyModules))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, safeLimit)
    .map((snapshot) => toProgressSample(snapshot));

  return memorySamples;
}

export async function upsertAcademyProgressForUser(userId: string, input: unknown) {
  const sanitizedUserId = sanitizeUserId(userId);
  const merged = memoryUpsertProgress(sanitizedUserId, input);
  const config = getStorageConfig();

  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.progressTable}?on_conflict=user_id`,
        {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify([
            {
              user_id: sanitizedUserId,
              snapshot_json: merged,
              updated_at: nowIso(),
            },
          ]),
        },
      );

      if (Array.isArray(rows) && rows[0]) {
        const normalized = normalizeProgressSnapshot(
          mapIncomingSnapshotRow(rows[0]),
          investorAcademyModules,
        );
        const finalSnapshot = {
          ...normalized,
          userId: sanitizedUserId,
        };
        memoryUpsertProgress(sanitizedUserId, finalSnapshot);
        return finalSnapshot;
      }
    } catch {
      // fallback already captured in memory
    }
  }

  return merged;
}

export function clearAcademyMemoryCache(userId?: string) {
  const store = getStore();
  if (typeof userId === "string" && userId.trim().length > 0) {
    const sanitizedUserId = sanitizeUserId(userId);
    const existed = store.progressByUserId.delete(sanitizedUserId);
    return {
      clearedCount: existed ? 1 : 0,
      scope: "user" as const,
      userId: sanitizedUserId,
    };
  }

  const clearedCount = store.progressByUserId.size;
  store.progressByUserId.clear();
  return {
    clearedCount,
    scope: "all" as const,
  };
}

export async function resetAcademyDailyQuestForUser(userId: string) {
  const sanitizedUserId = sanitizeUserId(userId);
  const snapshot = await getAcademyProgressForUser(sanitizedUserId);
  const todayIso = getCurrentIsoDate();

  return upsertAcademyProgressForUser(sanitizedUserId, {
    ...snapshot,
    userId: sanitizedUserId,
    dailyQuest: pickDailyQuest(investorAcademyModules, todayIso),
    lastActiveDate: todayIso,
    updatedAt: nowIso(),
  });
}

export async function recomputeAcademyStreakForUser(userId: string) {
  const sanitizedUserId = sanitizeUserId(userId);
  const snapshot = await getAcademyProgressForUser(sanitizedUserId);
  const todayIso = getCurrentIsoDate();

  return upsertAcademyProgressForUser(sanitizedUserId, {
    ...snapshot,
    userId: sanitizedUserId,
    streakDays: computeUpdatedStreak(snapshot.lastActiveDate, snapshot.streakDays, todayIso),
    lastActiveDate: todayIso,
    updatedAt: nowIso(),
  });
}

export async function recordAcademyAdminAudit(input: {
  action: string;
  targetUserId?: string | null;
  adminMode?: string;
  requestIp?: string;
  note?: string;
}) {
  const entry: AcademyAdminAuditEntry = {
    id: createAuditId(),
    action: String(input.action || "unknown").slice(0, 80),
    targetUserId: input.targetUserId ? sanitizeUserId(input.targetUserId) : null,
    adminMode: String(input.adminMode || "none").slice(0, 40),
    requestIp: String(input.requestIp || "unknown").slice(0, 120),
    note: String(input.note || "").slice(0, 200),
    createdAt: nowIso(),
  };

  const store = getStore();
  store.adminAuditLogs.unshift(entry);
  if (store.adminAuditLogs.length > 150) {
    store.adminAuditLogs.length = 150;
  }

  const config = getStorageConfig();
  if (config.shouldUseSupabase && config.supabase) {
    try {
      await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        config.supabase.auditTable,
        {
          method: "POST",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify([
            {
              id: entry.id,
              action: entry.action,
              target_user_id: entry.targetUserId,
              admin_mode: entry.adminMode,
              request_ip: entry.requestIp,
              note: entry.note,
              created_at: entry.createdAt,
            },
          ]),
        },
      );
    } catch {
      // memory fallback already captured
    }
  }

  return entry;
}

export async function listAcademyAdminAuditLogs(limit = 20): Promise<AcademyAdminAuditEntry[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const config = getStorageConfig();

  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.auditTable}?order=created_at.desc&limit=${safeLimit}`,
        { method: "GET" },
      );

      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((row) => ({
          id: String(row.id || ""),
          action: String(row.action || "unknown"),
          targetUserId: row.target_user_id ? sanitizeUserId(String(row.target_user_id)) : null,
          adminMode: String(row.admin_mode || "none"),
          requestIp: String(row.request_ip || "unknown"),
          note: String(row.note || ""),
          createdAt: String(row.created_at || nowIso()),
        }));
      }
    } catch {
      // fallback to memory below
    }
  }

  return getStore().adminAuditLogs.slice(0, safeLimit);
}

export async function getAcademyAdminActionReplay(key: string) {
  const normalizedKey = normalizeReplayKey(key);
  if (!normalizedKey) {
    return null;
  }

  const config = getStorageConfig();
  if (config.shouldUseSupabase && config.supabase) {
    try {
      const nowIsoValue = nowIso();
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.replayTable}?replay_key=${encodeEq(normalizedKey)}&expires_at=gt.${encodeURIComponent(nowIsoValue)}&limit=1`,
        { method: "GET" },
      );

      if (Array.isArray(rows) && rows[0]) {
        const row = rows[0];
        return {
          key: normalizedKey,
          action: String(row.action || "unknown"),
          targetUserId: row.target_user_id ? sanitizeUserId(String(row.target_user_id)) : null,
          status: Number(row.status_code || 200),
          responseBody:
            row.response_body && typeof row.response_body === "object"
              ? (row.response_body as Record<string, unknown>)
              : {},
          createdAt: String(row.created_at || nowIsoValue),
          expiresAtEpochMs: Date.parse(String(row.expires_at || nowIsoValue)) || Date.now() + 60_000,
        } satisfies AcademyAdminActionReplayEntry;
      }
    } catch {
      // fallback to memory below
    }
  }

  const store = getStore();
  const now = Date.now();
  const existing = store.adminActionReplay.get(normalizedKey);
  if (!existing) {
    return null;
  }

  if (existing.expiresAtEpochMs <= now) {
    store.adminActionReplay.delete(normalizedKey);
    return null;
  }

  return existing;
}

export async function rememberAcademyAdminActionReplay(input: {
  key: string;
  action: string;
  targetUserId?: string | null;
  status: number;
  responseBody: Record<string, unknown>;
  ttlMs?: number;
}) {
  const normalizedKey = normalizeReplayKey(input.key);
  if (!normalizedKey) {
    return null;
  }

  const store = getStore();
  const now = Date.now();
  const ttlMs = Math.max(5_000, Math.min(10 * 60_000, input.ttlMs ?? 60_000));

  for (const [mapKey, entry] of store.adminActionReplay.entries()) {
    if (entry.expiresAtEpochMs <= now) {
      store.adminActionReplay.delete(mapKey);
    }
  }

  const replay: AcademyAdminActionReplayEntry = {
    key: normalizedKey,
    action: String(input.action || "unknown").slice(0, 80),
    targetUserId: input.targetUserId ? sanitizeUserId(input.targetUserId) : null,
    status: Number.isFinite(input.status) ? input.status : 200,
    responseBody: input.responseBody,
    createdAt: nowIso(),
    expiresAtEpochMs: now + ttlMs,
  };

  store.adminActionReplay.set(normalizedKey, replay);

  const config = getStorageConfig();
  if (config.shouldUseSupabase && config.supabase) {
    try {
      await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.replayTable}?on_conflict=replay_key`,
        {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify([
            {
              replay_key: replay.key,
              action: replay.action,
              target_user_id: replay.targetUserId,
              status_code: replay.status,
              response_body: replay.responseBody,
              created_at: replay.createdAt,
              expires_at: new Date(replay.expiresAtEpochMs).toISOString(),
              updated_at: nowIso(),
            },
          ]),
        },
      );
    } catch {
      // fallback already in memory
    }
  }

  if (store.adminActionReplay.size > 300) {
    const keys = Array.from(store.adminActionReplay.keys());
    for (const staleKey of keys.slice(0, store.adminActionReplay.size - 300)) {
      store.adminActionReplay.delete(staleKey);
    }
  }

  return replay;
}

export async function purgeExpiredAcademyAdminReplay() {
  const nowEpoch = Date.now();
  const nowIsoValue = nowIso();
  let deletedMemoryCount = 0;

  const store = getStore();
  for (const [key, entry] of store.adminActionReplay.entries()) {
    if (entry.expiresAtEpochMs <= nowEpoch) {
      store.adminActionReplay.delete(key);
      deletedMemoryCount += 1;
    }
  }

  const config = getStorageConfig();
  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.replayTable}?expires_at=lte.${encodeURIComponent(nowIsoValue)}&select=replay_key`,
        {
          method: "DELETE",
          headers: {
            Prefer: "return=representation",
          },
        },
      );

      return {
        mode: "supabase" as const,
        deletedCount: Array.isArray(rows) ? rows.length : 0,
        deletedMemoryCount,
        purgedAt: nowIsoValue,
      };
    } catch {
      return {
        mode: "memory" as const,
        deletedCount: deletedMemoryCount,
        deletedMemoryCount,
        purgedAt: nowIsoValue,
      };
    }
  }

  return {
    mode: "memory" as const,
    deletedCount: deletedMemoryCount,
    deletedMemoryCount,
    purgedAt: nowIsoValue,
  };
}

export async function getAcademyReplayHealthStats(): Promise<AcademyReplayHealthStats> {
  const sampledAt = nowIso();
  const config = getStorageConfig();

  if (config.shouldUseSupabase && config.supabase) {
    try {
      const [activeCount, expiredCount, purgeRows] = await Promise.all([
        requestSupabaseCount(
          config.supabase,
          `${config.supabase.replayTable}?select=replay_key&expires_at=gt.${encodeURIComponent(sampledAt)}`,
        ),
        requestSupabaseCount(
          config.supabase,
          `${config.supabase.replayTable}?select=replay_key&expires_at=lte.${encodeURIComponent(sampledAt)}`,
        ),
        requestSupabaseJson<Record<string, unknown>[]>(
          config.supabase,
          `${config.supabase.auditTable}?select=created_at&action=${encodeEq("purge-replay-expired")}&order=created_at.desc&limit=1`,
          { method: "GET" },
        ),
      ]);

      return {
        mode: "supabase",
        activeCount,
        expiredCount,
        totalCount: activeCount + expiredCount,
        lastPurgeAt: Array.isArray(purgeRows) && purgeRows[0] ? String(purgeRows[0].created_at || "") || null : null,
        sampledAt,
      };
    } catch {
      // fallback to memory stats below
    }
  }

  const nowEpoch = Date.now();
  const replayEntries = Array.from(getStore().adminActionReplay.values());
  const activeCount = replayEntries.filter((entry) => entry.expiresAtEpochMs > nowEpoch).length;
  const expiredCount = replayEntries.length - activeCount;
  const lastPurgeEntry = getStore().adminAuditLogs.find((entry) => entry.action === "purge-replay-expired");

  return {
    mode: "memory",
    activeCount,
    expiredCount,
    totalCount: replayEntries.length,
    lastPurgeAt: lastPurgeEntry?.createdAt || null,
    sampledAt,
  };
}

export async function listAcademyReplayPurgeEvents(limit = 12): Promise<AcademyReplayPurgeEvent[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const config = getStorageConfig();

  const mapAuditToEvent = (entry: AcademyAdminAuditEntry): AcademyReplayPurgeEvent => ({
    id: entry.id,
    createdAt: entry.createdAt,
    adminMode: entry.adminMode,
    deletedCount: parseDeletedCountFromNote(entry.note),
    source: entry.adminMode === "cron" ? "cron" : entry.adminMode && entry.adminMode !== "none" ? "manual" : "unknown",
    note: entry.note,
  });

  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.auditTable}?action=${encodeEq("purge-replay-expired")}&order=created_at.desc&limit=${safeLimit}`,
        { method: "GET" },
      );

      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((row) =>
          mapAuditToEvent({
            id: String(row.id || ""),
            action: String(row.action || "purge-replay-expired"),
            targetUserId: null,
            adminMode: String(row.admin_mode || "none"),
            requestIp: String(row.request_ip || "unknown"),
            note: String(row.note || ""),
            createdAt: String(row.created_at || nowIso()),
          }),
        );
      }
    } catch {
      // fallback to memory below
    }
  }

  return getStore().adminAuditLogs
    .filter((entry) => entry.action === "purge-replay-expired")
    .slice(0, safeLimit)
    .map((entry) => mapAuditToEvent(entry));
}

export function getAcademyReplaySloStatus(
  stats: AcademyReplayHealthStats,
  purges: AcademyReplayPurgeEvent[],
): AcademyReplaySloStatus {
  const evaluatedAt = nowIso();
  const reasons: string[] = [];

  const expiredRatio = stats.totalCount > 0 ? stats.expiredCount / stats.totalCount : 0;
  const totalRecentDeleted = purges.slice(0, 5).reduce((sum, event) => sum + event.deletedCount, 0);
  const recentDeletedAvg = purges.length > 0 ? totalRecentDeleted / Math.min(5, purges.length) : 0;

  const now = Date.now();
  const lastPurgeAgeMinutes = stats.lastPurgeAt
    ? Math.max(0, Math.round((now - Date.parse(stats.lastPurgeAt)) / 60_000))
    : Number.POSITIVE_INFINITY;

  if (stats.expiredCount >= 120) {
    reasons.push("Expired replay backlog is critically high (>=120).");
  } else if (stats.expiredCount >= 40) {
    reasons.push("Expired replay backlog is elevated (>=40).");
  }

  if (stats.totalCount >= 25 && expiredRatio >= 0.5) {
    reasons.push("Expired replay ratio is critically high (>=50%).");
  } else if (stats.totalCount >= 25 && expiredRatio >= 0.25) {
    reasons.push("Expired replay ratio is elevated (>=25%).");
  }

  if (Number.isFinite(lastPurgeAgeMinutes) && lastPurgeAgeMinutes >= 360) {
    reasons.push("Replay purge appears stale (last purge >= 6h ago).");
  } else if (Number.isFinite(lastPurgeAgeMinutes) && lastPurgeAgeMinutes >= 120) {
    reasons.push("Replay purge cadence is behind (last purge >= 2h ago).");
  }

  if (recentDeletedAvg >= 80) {
    reasons.push("Recent replay purge deletions are critically high (avg >=80).");
  } else if (recentDeletedAvg >= 25) {
    reasons.push("Recent replay purge deletions are elevated (avg >=25).");
  }

  const critical = reasons.some((reason) =>
    /critically|>=120|>=50%|>= 6h/i.test(reason),
  );
  const level: AcademyReplaySloStatus["level"] = critical ? "critical" : reasons.length > 0 ? "warn" : "ok";

  return {
    level,
    reasons: reasons.length > 0 ? reasons : ["Replay operations are healthy and within thresholds."],
    evaluatedAt,
  };
}

function parseBooleanEnv(value: string | undefined, defaultValue = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return defaultValue;
  }
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parsePositiveIntEnv(value: string | undefined, defaultValue: number) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : defaultValue;
}

async function getLastReplayAutoRemediationAt(): Promise<string | null> {
  const config = getStorageConfig();
  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.auditTable}?select=created_at&action=${encodeEq("auto-purge-replay-critical")}&order=created_at.desc&limit=1`,
        { method: "GET" },
      );
      if (Array.isArray(rows) && rows[0]) {
        return String(rows[0].created_at || "") || null;
      }
    } catch {
      // fallback to memory below
    }
  }

  const memoryEntry = getStore().adminAuditLogs.find((entry) => entry.action === "auto-purge-replay-critical");
  return memoryEntry?.createdAt || null;
}

export async function maybeAutoPurgeAcademyReplayOnCritical(input: {
  slo: AcademyReplaySloStatus;
}): Promise<AcademyReplayAutoRemediationResult> {
  const enabled = parseBooleanEnv(process.env.TRADEHAX_ACADEMY_ENABLE_AUTO_PURGE_ON_CRITICAL, false);
  const cooldownMinutes = parsePositiveIntEnv(
    process.env.TRADEHAX_ACADEMY_AUTO_PURGE_COOLDOWN_MINUTES,
    30,
  );

  if (!enabled) {
    return {
      enabled: false,
      triggered: false,
      cooldownMinutes,
      reason: "Auto-remediation disabled by configuration.",
      lastTriggeredAt: await getLastReplayAutoRemediationAt(),
    };
  }

  const lastTriggeredAt = await getLastReplayAutoRemediationAt();
  if (input.slo.level !== "critical") {
    return {
      enabled: true,
      triggered: false,
      cooldownMinutes,
      reason: "Replay SLO is not critical.",
      lastTriggeredAt,
    };
  }

  if (lastTriggeredAt) {
    const elapsedMs = Date.now() - Date.parse(lastTriggeredAt);
    const cooldownMs = cooldownMinutes * 60_000;
    if (Number.isFinite(elapsedMs) && elapsedMs < cooldownMs) {
      return {
        enabled: true,
        triggered: false,
        cooldownMinutes,
        reason: "Cooldown active; skipping auto-remediation.",
        lastTriggeredAt,
      };
    }
  }

  const result = await purgeExpiredAcademyAdminReplay();
  await recordAcademyAdminAudit({
    action: "auto-purge-replay-critical",
    targetUserId: null,
    adminMode: "system",
    requestIp: "internal",
    note: `Auto remediation from critical SLO deleted=${result.deletedCount} mode=${result.mode}`,
  });

  return {
    enabled: true,
    triggered: true,
    cooldownMinutes,
    reason: "Auto-remediation triggered for critical replay SLO.",
    lastTriggeredAt: result.purgedAt,
    result,
  };
}

export async function runAcademyReplayCriticalDrill(): Promise<AcademyReplayCriticalDrillResult> {
  const enabled = parseBooleanEnv(process.env.TRADEHAX_ACADEMY_ENABLE_AUTO_PURGE_ON_CRITICAL, false);
  const cooldownMinutes = parsePositiveIntEnv(
    process.env.TRADEHAX_ACADEMY_AUTO_PURGE_COOLDOWN_MINUTES,
    30,
  );
  const lastTriggeredAt = await getLastReplayAutoRemediationAt();
  const stats = await getAcademyReplayHealthStats();

  let reason = "Auto-remediation is disabled; drill confirms no action would run.";
  let wouldTrigger = false;

  if (enabled) {
    reason = "Drill indicates auto-remediation would trigger under critical SLO.";
    wouldTrigger = true;

    if (lastTriggeredAt) {
      const elapsedMs = Date.now() - Date.parse(lastTriggeredAt);
      const cooldownMs = cooldownMinutes * 60_000;
      if (Number.isFinite(elapsedMs) && elapsedMs < cooldownMs) {
        wouldTrigger = false;
        reason = "Drill indicates cooldown would block auto-remediation right now.";
      }
    }
  }

  return {
    simulatedSloLevel: "critical",
    enabled,
    wouldTrigger,
    cooldownMinutes,
    reason,
    lastTriggeredAt,
    estimatedDeletedCount: stats.expiredCount,
    evaluatedAt: nowIso(),
  };
}

export async function getAcademyReplayReadinessChecklist(input: {
  slo: AcademyReplaySloStatus;
  autoRemediation: AcademyReplayAutoRemediationResult;
  replayPurges: AcademyReplayPurgeEvent[];
}): Promise<AcademyReplayReadinessChecklist> {
  const evaluatedAt = nowIso();
  const items: AcademyReadinessItem[] = [];

  const autoEnabled = parseBooleanEnv(process.env.TRADEHAX_ACADEMY_ENABLE_AUTO_PURGE_ON_CRITICAL, false);
  items.push({
    key: "auto-enabled",
    label: "Auto remediation enabled",
    status: autoEnabled ? "pass" : "warn",
    detail: autoEnabled
      ? "Auto-purge on critical SLO is enabled."
      : "Auto-purge on critical SLO is disabled.",
  });

  const cooldownMinutes = parsePositiveIntEnv(process.env.TRADEHAX_ACADEMY_AUTO_PURGE_COOLDOWN_MINUTES, 30);
  items.push({
    key: "cooldown-range",
    label: "Cooldown configuration",
    status: cooldownMinutes <= 120 ? "pass" : cooldownMinutes <= 360 ? "warn" : "fail",
    detail: `Cooldown is ${cooldownMinutes} minutes.`,
  });

  const lastDrillEntry = getStore().adminAuditLogs.find((entry) => entry.action === "simulate-critical-drill");
  const drillAgeHours = lastDrillEntry
    ? Math.max(0, (Date.now() - Date.parse(lastDrillEntry.createdAt)) / 3_600_000)
    : Number.POSITIVE_INFINITY;

  items.push({
    key: "critical-drill",
    label: "Recent critical drill",
    status: Number.isFinite(drillAgeHours) && drillAgeHours <= 24 ? "pass" : "warn",
    detail: Number.isFinite(drillAgeHours)
      ? `Last critical drill was ${Math.round(drillAgeHours)}h ago.`
      : "No critical drill recorded yet.",
  });

  const lastCronPurge = input.replayPurges.find((entry) => entry.source === "cron");
  const cronAgeHours = lastCronPurge
    ? Math.max(0, (Date.now() - Date.parse(lastCronPurge.createdAt)) / 3_600_000)
    : Number.POSITIVE_INFINITY;
  items.push({
    key: "cron-cadence",
    label: "Replay cleanup cron cadence",
    status: Number.isFinite(cronAgeHours) && cronAgeHours <= 2 ? "pass" : "warn",
    detail: Number.isFinite(cronAgeHours)
      ? `Last cron cleanup was ${Math.round(cronAgeHours)}h ago.`
      : "No cron-driven replay cleanup recorded yet.",
  });

  items.push({
    key: "slo-health",
    label: "Current replay SLO level",
    status: input.slo.level === "ok" ? "pass" : input.slo.level === "warn" ? "warn" : "fail",
    detail: `Current level is ${input.slo.level}.`,
  });

  items.push({
    key: "auto-state",
    label: "Auto-remediation runtime state",
    status: input.autoRemediation.enabled ? "pass" : "warn",
    detail: input.autoRemediation.reason,
  });

  const score = items.filter((item) => item.status === "pass").length;
  const maxScore = items.length;
  const hasFail = items.some((item) => item.status === "fail");
  const ready = !hasFail && score >= Math.ceil(maxScore * 0.67);

  return {
    ready,
    score,
    maxScore,
    items,
    evaluatedAt,
  };
}

export function getAcademyReplayEnablementGuide(input: {
  readiness: AcademyReplayReadinessChecklist;
  slo: AcademyReplaySloStatus;
  stats: AcademyReplayHealthStats;
  replayPurges: AcademyReplayPurgeEvent[];
  autoRemediation: AcademyReplayAutoRemediationResult;
  drill?: AcademyReplayCriticalDrillResult | null;
}): AcademyReplayEnablementGuide {
  const generatedAt = nowIso();
  const steps: AcademyEnablementGuideStep[] = [];

  const autoEnabled = parseBooleanEnv(process.env.TRADEHAX_ACADEMY_ENABLE_AUTO_PURGE_ON_CRITICAL, false);
  if (!autoEnabled) {
    steps.push({
      id: "enable-auto-remediation",
      title: "Enable auto-remediation",
      priority: "high",
      status: "todo",
      detail: "Critical replay recovery is disabled. Enable automatic purge on critical SLO before hard launch.",
      actionHint: "Set TRADEHAX_ACADEMY_ENABLE_AUTO_PURGE_ON_CRITICAL=true and redeploy.",
    });
  } else {
    steps.push({
      id: "auto-remediation-enabled",
      title: "Auto-remediation flag",
      priority: "low",
      status: "done",
      detail: "Auto-remediation feature flag is enabled.",
    });
  }

  const cooldownMinutes = parsePositiveIntEnv(process.env.TRADEHAX_ACADEMY_AUTO_PURGE_COOLDOWN_MINUTES, 30);
  if (cooldownMinutes > 360) {
    steps.push({
      id: "cooldown-tune",
      title: "Tune cooldown to safer range",
      priority: "high",
      status: "todo",
      detail: `Cooldown is ${cooldownMinutes} minutes, which may delay incident recovery too long.`,
      actionHint: "Set TRADEHAX_ACADEMY_AUTO_PURGE_COOLDOWN_MINUTES to 30-120.",
    });
  } else if (cooldownMinutes > 120) {
    steps.push({
      id: "cooldown-review",
      title: "Review cooldown window",
      priority: "medium",
      status: "verify",
      detail: `Cooldown is ${cooldownMinutes} minutes. Consider reducing to tighten recovery loops.`,
      actionHint: "Recommended: 30-120 minutes.",
    });
  } else {
    steps.push({
      id: "cooldown-ok",
      title: "Cooldown configuration",
      priority: "low",
      status: "done",
      detail: `Cooldown is ${cooldownMinutes} minutes and within expected range.`,
    });
  }

  if (input.slo.level === "critical") {
    steps.push({
      id: "critical-now",
      title: "Address critical replay SLO immediately",
      priority: "high",
      status: "todo",
      detail: "Replay SLO is currently critical. Resolve backlog before enablement.",
      actionHint: "Run 'Purge Expired Replay Keys', then refresh diagnostics.",
    });
  } else if (input.slo.level === "warn") {
    steps.push({
      id: "warn-review",
      title: "Resolve replay SLO warnings",
      priority: "medium",
      status: "verify",
      detail: "Replay SLO is warning; stabilizing first lowers launch risk.",
    });
  } else {
    steps.push({
      id: "slo-ok",
      title: "Replay SLO health",
      priority: "low",
      status: "done",
      detail: "Replay SLO is healthy.",
    });
  }

  const latestCron = input.replayPurges.find((entry) => entry.source === "cron");
  const cronAgeHours = latestCron
    ? Math.max(0, (Date.now() - Date.parse(latestCron.createdAt)) / 3_600_000)
    : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(cronAgeHours) || cronAgeHours > 6) {
    steps.push({
      id: "cron-verify",
      title: "Verify replay cleanup cron",
      priority: "high",
      status: "todo",
      detail: "No recent cron cleanup event detected. Scheduled replay maintenance may be inactive.",
      actionHint: "Verify Vercel cron execution and CRON secret configuration.",
    });
  } else if (cronAgeHours > 2) {
    steps.push({
      id: "cron-watch",
      title: "Watch replay cleanup cadence",
      priority: "medium",
      status: "verify",
      detail: `Last cron cleanup was ${Math.round(cronAgeHours)}h ago.`,
    });
  } else {
    steps.push({
      id: "cron-ok",
      title: "Replay cleanup cadence",
      priority: "low",
      status: "done",
      detail: "Replay cleanup cron cadence looks healthy.",
    });
  }

  if (!input.drill) {
    steps.push({
      id: "drill-run",
      title: "Run critical drill before enablement",
      priority: "medium",
      status: "todo",
      detail: "No drill result included in this check.",
      actionHint: "Run 'Simulate Critical Drill (Dry Run)' from Admin Actions.",
    });
  } else if (input.drill.enabled && !input.drill.wouldTrigger) {
    steps.push({
      id: "drill-cooldown",
      title: "Confirm cooldown behavior",
      priority: "medium",
      status: "verify",
      detail: input.drill.reason,
    });
  } else {
    steps.push({
      id: "drill-ok",
      title: "Critical drill behavior",
      priority: "low",
      status: "done",
      detail: input.drill.reason,
    });
  }

  if (input.stats.expiredCount >= 40) {
    steps.push({
      id: "backlog-reduce",
      title: "Reduce expired replay backlog",
      priority: "high",
      status: "todo",
      detail: `Expired replay keys are elevated (${input.stats.expiredCount}).`,
      actionHint: "Purge expired keys and monitor SLO trend for 15-30 minutes.",
    });
  }

  if (!input.autoRemediation.enabled) {
    steps.push({
      id: "auto-runtime",
      title: "Auto-remediation runtime state",
      priority: "medium",
      status: "verify",
      detail: input.autoRemediation.reason,
    });
  }

  const blockers = steps.filter((step) => step.status === "todo" && step.priority === "high").length;
  const warnings = steps.filter((step) => step.status === "verify").length;
  const readyToEnable = blockers === 0 && input.readiness.ready && input.slo.level !== "critical";

  const summary = readyToEnable
    ? "Enablement guardrails look healthy. Safe to proceed with staged rollout."
    : blockers > 0
      ? `Enablement blocked by ${blockers} high-priority item${blockers === 1 ? "" : "s"}.`
      : "Enablement needs verification steps before proceeding.";

  return {
    readyToEnable,
    blockers,
    warnings,
    summary,
    steps,
    generatedAt,
  };
}

function getModuleRewardTotals(completedModuleIds: string[]) {
  const moduleMap = new Map(investorAcademyModules.map((module) => [module.id, module]));
  let moduleXp = 0;
  let moduleHax = 0;

  for (const moduleId of completedModuleIds) {
    const moduleItem = moduleMap.get(moduleId);
    if (!moduleItem) {
      continue;
    }
    moduleXp += moduleItem.xpReward;
    moduleHax += moduleItem.haxReward;
  }

  return { moduleXp, moduleHax };
}

export function getAcademyFeatureCostRules(): AcademyFeatureCostRule[] {
  return [
    {
      feature: "ai_chat",
      label: "AI Chat",
      unitCostHax: parsePositiveIntEnv(process.env.TRADEHAX_COST_AI_CHAT_HAX, 2),
    },
    {
      feature: "hax_runner",
      label: "Hax Runner",
      unitCostHax: parsePositiveIntEnv(process.env.TRADEHAX_COST_HAX_RUNNER_HAX, 1),
    },
    {
      feature: "signal_alert",
      label: "Signal Alert",
      unitCostHax: parsePositiveIntEnv(process.env.TRADEHAX_COST_SIGNAL_ALERT_HAX, 3),
    },
    {
      feature: "bot_create",
      label: "Bot Create",
      unitCostHax: parsePositiveIntEnv(process.env.TRADEHAX_COST_BOT_CREATE_HAX, 12),
    },
  ];
}

export async function listAcademyEconomyLedgerEntriesForUser(userId: string, limit = 100) {
  const sanitizedUserId = sanitizeUserId(userId);
  const safeLimit = Math.min(250, Math.max(1, Math.floor(limit)));
  const config = getStorageConfig();

  if (config.shouldUseSupabase && config.supabase) {
    try {
      const rows = await requestSupabaseJson<Record<string, unknown>[]>(
        config.supabase,
        `${config.supabase.ledgerTable}?user_id=${encodeEq(sanitizedUserId)}&order=created_at.desc&limit=${safeLimit}`,
        { method: "GET" },
      );

      if (Array.isArray(rows)) {
        const normalized = rows.map((row) => ({
          id: String(row.id || ""),
          userId: sanitizedUserId,
          feature: String(row.feature || "ai_chat") as AcademyEconomyLedgerFeature,
          units: Number(row.units || 1),
          unitCostHax: Number(row.unit_cost_hax || 0),
          totalCostHax: Number(row.total_cost_hax || 0),
          source: String(row.source || "unknown"),
          transactionRef: String(row.transaction_ref || ""),
          createdAt: String(row.created_at || nowIso()),
        })) as AcademyEconomyLedgerEntry[];
        getStore().economyLedgerByUserId.set(sanitizedUserId, normalized);
        return normalized;
      }
    } catch {
      // fallback to memory below
    }
  }

  const entries = getStore().economyLedgerByUserId.get(sanitizedUserId) || [];
  return entries.slice(0, safeLimit);
}

export async function chargeAcademyFeatureUsage(input: {
  userId: string;
  feature: UsageFeature;
  units?: number;
  source?: string;
  transactionRef?: string;
}): Promise<AcademyFeatureChargeResult> {
  const sanitizedUserId = sanitizeUserId(input.userId);
  const units = Math.max(1, Math.floor(input.units ?? 1));
  const source = String(input.source || "feature_usage").slice(0, 64);
  const transactionRef = String(input.transactionRef || createLedgerId()).trim().slice(0, 160);

  const costRule = getAcademyFeatureCostRules().find((rule) => rule.feature === input.feature);
  if (!costRule) {
    return {
      charged: false,
      reason: "Feature is not mapped to an academy economy cost rule.",
    };
  }

  const priorLedger = await listAcademyEconomyLedgerEntriesForUser(sanitizedUserId, 250);
  const existing = priorLedger.find((entry) => entry.transactionRef === transactionRef);
  if (existing) {
    const balance = await getAcademyEconomySnapshotForUser(sanitizedUserId);
    return {
      charged: true,
      entry: existing,
      balance,
    };
  }

  const latestBalance = await getAcademyEconomySnapshotForUser(sanitizedUserId);
  const totalCostHax = units * costRule.unitCostHax;
  if (latestBalance.walletHaxAvailable < totalCostHax) {
    return {
      charged: false,
      reason: `Insufficient HAX balance. Required=${totalCostHax}, available=${latestBalance.walletHaxAvailable}.`,
      balance: latestBalance,
    };
  }

  const entry: AcademyEconomyLedgerEntry = {
    id: createLedgerId(),
    userId: sanitizedUserId,
    feature: input.feature,
    units,
    unitCostHax: costRule.unitCostHax,
    totalCostHax,
    source,
    transactionRef,
    createdAt: nowIso(),
  };

  await persistAcademyLedgerEntry(entry);

  const balance = await getAcademyEconomySnapshotForUser(sanitizedUserId);
  return {
    charged: true,
    entry,
    balance,
  };
}

export async function runAcademySeasonPayout(input: {
  season: Exclude<AcademyLeaderboardSeason, "all_time">;
  dryRun?: boolean;
  source?: string;
  transactionRefPrefix?: string;
}): Promise<AcademySeasonPayoutResult> {
  const season = input.season;
  const dryRun = Boolean(input.dryRun);
  const startedAt = nowIso();
  const seasonWindowStart = getSeasonStartIso(season) || startedAt;
  const plan = getAcademySeasonPayoutPlan(season);
  const source = String(input.source || `season_payout_${season}`).slice(0, 64);
  const transactionRefPrefix = String(input.transactionRefPrefix || "academy:season_payout").slice(0, 100);

  const leaderboard = await listAcademyLeaderboard(Math.max(25, plan.length * 3), season);
  const recipients: AcademySeasonPayoutCreditResult[] = [];

  for (const payout of plan) {
    const winner = leaderboard.find((entry) => entry.rank === payout.rank);
    if (!winner) {
      recipients.push({
        userId: "",
        rank: payout.rank,
        rewardHax: payout.rewardHax,
        transactionRef: "",
        status: "skipped",
        reason: "No leaderboard user for this rank.",
      });
      continue;
    }

    const transactionRef = `${transactionRefPrefix}:${season}:${seasonWindowStart.slice(0, 10)}:${winner.userId}:r${payout.rank}`;
    const priorLedger = await listAcademyEconomyLedgerEntriesForUser(winner.userId, 350);
    const existing = priorLedger.find((entry) => entry.transactionRef === transactionRef);

    if (existing) {
      recipients.push({
        userId: winner.userId,
        rank: payout.rank,
        rewardHax: payout.rewardHax,
        transactionRef,
        status: "already_credited",
        reason: "Season payout already recorded for this winner and window.",
        entryId: existing.id,
      });
      continue;
    }

    if (dryRun) {
      recipients.push({
        userId: winner.userId,
        rank: payout.rank,
        rewardHax: payout.rewardHax,
        transactionRef,
        status: "dry_run",
      });
      continue;
    }

    const creditEntry: AcademyEconomyLedgerEntry = {
      id: createLedgerId(),
      userId: winner.userId,
      feature: "season_reward",
      units: 1,
      unitCostHax: -payout.rewardHax,
      totalCostHax: -payout.rewardHax,
      source,
      transactionRef,
      createdAt: nowIso(),
    };

    await persistAcademyLedgerEntry(creditEntry);

    recipients.push({
      userId: winner.userId,
      rank: payout.rank,
      rewardHax: payout.rewardHax,
      transactionRef,
      status: "credited",
      entryId: creditEntry.id,
    });
  }

  const creditedCount = recipients.filter((entry) => entry.status === "credited").length;
  const alreadyCreditedCount = recipients.filter((entry) => entry.status === "already_credited").length;
  const dryRunCount = recipients.filter((entry) => entry.status === "dry_run").length;
  const skippedCount = recipients.filter((entry) => entry.status === "skipped").length;
  const totalCreditedHax = recipients
    .filter((entry) => entry.status === "credited")
    .reduce((sum, entry) => sum + entry.rewardHax, 0);

  return {
    season,
    dryRun,
    startedAt,
    seasonWindowStart,
    plan,
    recipients,
    creditedCount,
    alreadyCreditedCount,
    dryRunCount,
    skippedCount,
    totalCreditedHax,
  };
}

function parseSeasonPayoutHistoryFromNote(note: string) {
  const seasonMatch = note.match(/^(daily|weekly)\s+payout/i);
  if (!seasonMatch) {
    return null;
  }

  const dryRunMatch = note.match(/dryRun=(true|false)/i);
  const creditedMatch = note.match(/credited=(\d+)/i);
  const alreadyMatch = note.match(/already=(\d+)/i);
  const totalHaxMatch = note.match(/totalHax=(\d+)/i);

  return {
    season: seasonMatch[1].toLowerCase() as "daily" | "weekly",
    dryRun: String(dryRunMatch?.[1] || "true").toLowerCase() === "true",
    creditedCount: Number(creditedMatch?.[1] || 0),
    alreadyCreditedCount: Number(alreadyMatch?.[1] || 0),
    totalCreditedHax: Number(totalHaxMatch?.[1] || 0),
  };
}

export async function listAcademySeasonPayoutHistory(limit = 12): Promise<AcademySeasonPayoutHistoryEntry[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const logs = await listAcademyAdminAuditLogs(Math.max(25, safeLimit * 4));

  return logs
    .filter((log) => log.action === "run-season-payout")
    .map((log) => {
      const parsed = parseSeasonPayoutHistoryFromNote(log.note);
      if (!parsed) {
        return null;
      }
      return {
        id: log.id,
        createdAt: log.createdAt,
        adminMode: log.adminMode,
        season: parsed.season,
        dryRun: parsed.dryRun,
        creditedCount: parsed.creditedCount,
        alreadyCreditedCount: parsed.alreadyCreditedCount,
        totalCreditedHax: parsed.totalCreditedHax,
        note: log.note,
      } satisfies AcademySeasonPayoutHistoryEntry;
    })
    .filter((entry): entry is AcademySeasonPayoutHistoryEntry => Boolean(entry))
    .slice(0, safeLimit);
}

export async function getAcademySeasonPayoutOutcomeSummary(): Promise<AcademySeasonPayoutOutcomeSummary> {
  const history = await listAcademySeasonPayoutHistory(1);
  const now = Date.now();

  if (history.length === 0) {
    return {
      hasRun: false,
      health: "never_run",
      nextRecommendedSeason: "daily",
      message: "No season payout runs recorded yet. Start with a Daily dry run.",
    };
  }

  const last = history[0];
  const lastRunMs = Date.parse(last.createdAt);
  const hoursAgo = Number.isFinite(lastRunMs) ? Math.round((now - lastRunMs) / 3_600_000) : 0;

  let health: "ok" | "warn" | "stale" = "ok";
  let nextRecommendedSeason: "daily" | "weekly" = "daily";
  let message = "";

  if (last.season === "weekly" && hoursAgo >= 168) {
    health = "warn";
    message = `Weekly payout is ${hoursAgo}h old. Consider running Daily or Weekly again.`;
    nextRecommendedSeason = "daily";
  } else if (last.season === "weekly" && hoursAgo >= 72) {
    health = "warn";
    nextRecommendedSeason = "daily";
    message = `Weekly payout is ${hoursAgo}h old. Daily payouts may be overdue.`;
  } else if (last.season === "daily" && hoursAgo >= 48) {
    health = "warn";
    nextRecommendedSeason = "weekly";
    message = `Daily payout is ${hoursAgo}h old. Weekly payout catchup recommended.`;
  } else if (hoursAgo >= 24) {
    health = "ok";
    nextRecommendedSeason = last.season === "weekly" ? "daily" : "weekly";
    message = `Last payout (${last.season}) was ${hoursAgo}h ago. Nominal cadence.`;
  } else {
    health = "ok";
    nextRecommendedSeason = last.season === "weekly" ? "daily" : "weekly";
    message = `Last payout (${last.season}) was ${hoursAgo}h ago. Healthy.`;
  }

  if (last.dryRun) {
    message += ` [Note: Last run was a dry run. Execute next time.]`;
    if (health === "ok") {
      health = "warn";
    }
  }

  return {
    hasRun: true,
    lastRun: {
      id: last.id,
      createdAt: last.createdAt,
      season: last.season,
      mode: last.dryRun ? "dry-run" : "execute",
      creditedCount: last.creditedCount,
      alreadyCreditedCount: last.alreadyCreditedCount,
      totalCreditedHax: last.totalCreditedHax,
      adminMode: last.adminMode,
    },
    health,
    hoursAgo,
    nextRecommendedSeason,
    message,
  };
}

export function getAcademyScoreBreakdown(input: AcademyProgressSample): AcademyScoreBreakdown {
  const moduleRewards = getModuleRewardTotals(input.completedModuleIds);
  const totalXp = moduleRewards.moduleXp + input.bonusXp;
  const totalHax = moduleRewards.moduleHax + input.bonusHax;
  const streakScore = input.streakDays * 25;
  const questScore = input.dailyQuestCompleted ? 120 : 0;
  const taskCompletionScore = input.completedModuleIds.length * 50;
  const compositeScore = totalXp + totalHax * 30 + streakScore + questScore + taskCompletionScore;

  return {
    completedModules: input.completedModuleIds.length,
    moduleXp: moduleRewards.moduleXp,
    moduleHax: moduleRewards.moduleHax,
    bonusXp: input.bonusXp,
    bonusHax: input.bonusHax,
    totalXp,
    totalHax,
    streakScore,
    questScore,
    taskCompletionScore,
    compositeScore,
  };
}

export async function listAcademyLeaderboard(
  limit = 20,
  season: AcademyLeaderboardSeason = "all_time",
): Promise<AcademyLeaderboardEntry[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const samples = await listAcademyProgressSamples(Math.min(50, Math.max(safeLimit * 3, 24)));
  const seasonStartIso = getSeasonStartIso(season);
  const seasonStartEpoch = seasonStartIso ? Date.parse(seasonStartIso) : 0;

  const scopedSamples = seasonStartIso
    ? samples.filter((sample) => {
        const ts = Date.parse(sample.updatedAt);
        return Number.isFinite(ts) && ts >= seasonStartEpoch;
      })
    : samples;

  return scopedSamples
    .map((sample) => ({
      userId: sample.userId,
      score: getAcademyScoreBreakdown(sample),
      streakDays: sample.streakDays,
      dailyQuestCompleted: sample.dailyQuestCompleted,
      updatedAt: sample.updatedAt,
    }))
    .sort((a, b) => {
      if (b.score.compositeScore !== a.score.compositeScore) {
        return b.score.compositeScore - a.score.compositeScore;
      }
      if (b.score.totalHax !== a.score.totalHax) {
        return b.score.totalHax - a.score.totalHax;
      }
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    })
    .slice(0, safeLimit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
}

export async function getAcademyEconomySnapshotForUser(userId: string): Promise<AcademyEconomySnapshot> {
  const sanitizedUserId = sanitizeUserId(userId);
  const progress = await getAcademyProgressForUser(sanitizedUserId);
  const sample = toProgressSample(progress);
  const score = getAcademyScoreBreakdown(sample);
  const monetization = getUserSnapshot(sanitizedUserId);
  const featureCostRules = getAcademyFeatureCostRules();

  const featureSpendQuotes: AcademyFeatureSpendQuote[] = featureCostRules.map((rule) => {
    const usage = monetization.usage.find((item) => item.feature === rule.feature);
    const usedToday = usage?.usedToday ?? 0;
    return {
      ...rule,
      usedToday,
      dailyLimit: usage?.dailyLimit ?? 0,
      projectedCostHax: usedToday * rule.unitCostHax,
    };
  });

  const walletHaxEarned = score.totalHax;
  const ledgerEntries = await listAcademyEconomyLedgerEntriesForUser(sanitizedUserId, 250);
  const walletHaxSpentTotal = ledgerEntries
    .filter((entry) => entry.totalCostHax > 0)
    .reduce((sum, entry) => sum + entry.totalCostHax, 0);
  const walletHaxCreditTotal = ledgerEntries
    .filter((entry) => entry.totalCostHax < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.totalCostHax), 0);
  const walletHaxSpentToday = ledgerEntries
    .filter((entry) => isTsInTodayUtc(entry.createdAt) && entry.totalCostHax > 0)
    .reduce((sum, entry) => sum + entry.totalCostHax, 0);

  return {
    userId: sanitizedUserId,
    score,
    walletHaxEarned,
    walletHaxCreditTotal,
    walletHaxSpentTotal,
    walletHaxSpentToday,
    walletHaxAvailable: Math.max(0, walletHaxEarned - ledgerEntries.reduce((sum, entry) => sum + entry.totalCostHax, 0)),
    featureSpendQuotes,
    generatedAt: nowIso(),
  };
}
