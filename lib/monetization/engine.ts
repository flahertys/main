import { getFeatureDailyLimit, getPlanDefinition, isSubscriptionTier } from "@/lib/monetization/plans";
import {
    getSubscription,
    getUsageCountForCurrentWeek,
    getUsageCountForRecentWindow,
    getUsageCountForToday,
    getUsageSummaryForUser,
    recordUsageEvent,
    setSubscriptionTier,
} from "@/lib/monetization/store";
import {
    AllowanceResult,
    BillingProvider,
    MonetizationSnapshot,
    SubscriptionTier,
    UsageFeature,
} from "@/lib/monetization/types";

const DEFAULT_FREE_AI_WEEKLY_MINUTES = 30;
const DEFAULT_AI_UNIT_SECONDS = 20;
const DEFAULT_AI_BURST_WINDOW_SECONDS = 300;
const DEFAULT_AI_BURST_MAX_REQUESTS = 30;
const DEFAULT_IDEMPOTENCY_TTL_SECONDS = 180;

type IdempotentUsageRecord = {
  allowance: AllowanceResult;
  event: ReturnType<typeof recordUsageEvent>;
  scope: string;
  expiresAt: number;
};

function getUsageIdempotencyStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_USAGE_IDEMPOTENCY__?: Map<string, IdempotentUsageRecord>;
  };

  if (!globalRef.__TRADEHAX_USAGE_IDEMPOTENCY__) {
    globalRef.__TRADEHAX_USAGE_IDEMPOTENCY__ = new Map<string, IdempotentUsageRecord>();
  }

  return globalRef.__TRADEHAX_USAGE_IDEMPOTENCY__;
}

function cleanupUsageIdempotencyStore(nowMs: number) {
  const store = getUsageIdempotencyStore();
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= nowMs) {
      store.delete(key);
    }
  }
}

function sanitizeIdempotencyKey(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return "";
  if (!/^[a-zA-Z0-9:_\-.]+$/.test(trimmed)) return "";
  return trimmed;
}

function normalizeIdempotencyScope(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 512);
}

function parsePositiveIntEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function getUserSnapshot(userId: string): MonetizationSnapshot {
  const subscription = getSubscription(userId);
  return {
    userId,
    subscription,
    plan: getPlanDefinition(subscription.tier),
    usage: getUsageSummaryForUser(userId),
  };
}

export function canConsumeFeature(
  userId: string,
  feature: UsageFeature,
  requestedUnits = 1,
): AllowanceResult {
  const subscription = getSubscription(userId);
  const dailyLimit = getFeatureDailyLimit(subscription.tier, feature);
  const usedToday = getUsageCountForToday(userId, feature);
  const normalizedUnits = Math.max(1, Math.floor(requestedUnits));
  const remainingToday = Math.max(0, dailyLimit - usedToday);

  if (feature === "ai_chat") {
    const burstWindowSeconds = parsePositiveIntEnv(
      process.env.TRADEHAX_AI_BURST_WINDOW_SECONDS,
      DEFAULT_AI_BURST_WINDOW_SECONDS,
    );
    const burstMaxRequests = parsePositiveIntEnv(
      process.env.TRADEHAX_AI_BURST_MAX_REQUESTS,
      DEFAULT_AI_BURST_MAX_REQUESTS,
    );
    const usedRecent = getUsageCountForRecentWindow(userId, feature, burstWindowSeconds * 1_000);
    if (usedRecent + normalizedUnits > burstMaxRequests) {
      return {
        allowed: false,
        feature,
        requestedUnits: normalizedUnits,
        usedToday,
        dailyLimit,
        remainingToday,
        reason: `Burst limit reached (${burstMaxRequests} requests / ${burstWindowSeconds}s). Please wait and retry.`,
      };
    }
  }

  if (subscription.tier === "free" && feature === "ai_chat") {
    const weeklyMinutes = parsePositiveIntEnv(
      process.env.TRADEHAX_FREE_AI_MINUTES_WEEKLY,
      DEFAULT_FREE_AI_WEEKLY_MINUTES,
    );
    const unitDurationSeconds = parsePositiveIntEnv(
      process.env.TRADEHAX_AI_EST_SECONDS_PER_REQUEST,
      DEFAULT_AI_UNIT_SECONDS,
    );
    const weeklyLimit = Math.max(1, Math.floor((weeklyMinutes * 60) / unitDurationSeconds));
    const usedThisWeek = getUsageCountForCurrentWeek(userId, feature);
    const remainingThisWeek = Math.max(0, weeklyLimit - usedThisWeek);

    if (usedThisWeek + normalizedUnits > weeklyLimit) {
      return {
        allowed: false,
        feature,
        requestedUnits: normalizedUnits,
        usedToday,
        dailyLimit,
        remainingToday,
        usedThisWeek,
        weeklyLimit,
        remainingThisWeek,
        unitDurationSeconds,
        weeklyMinutes,
        reason: `Weekly free AI allowance reached (${weeklyMinutes} minutes/week). Upgrade to continue instantly.`,
      };
    }

    if (dailyLimit > 0 && usedToday + normalizedUnits > dailyLimit) {
      return {
        allowed: false,
        feature,
        requestedUnits: normalizedUnits,
        usedToday,
        dailyLimit,
        remainingToday,
        usedThisWeek,
        weeklyLimit,
        remainingThisWeek,
        unitDurationSeconds,
        weeklyMinutes,
        reason: "Daily usage limit reached for this feature.",
      };
    }

    return {
      allowed: true,
      feature,
      requestedUnits: normalizedUnits,
      usedToday,
      dailyLimit,
      remainingToday: Math.max(0, dailyLimit - (usedToday + normalizedUnits)),
      usedThisWeek,
      weeklyLimit,
      remainingThisWeek: Math.max(0, weeklyLimit - (usedThisWeek + normalizedUnits)),
      unitDurationSeconds,
      weeklyMinutes,
    };
  }

  if (dailyLimit <= 0) {
    return {
      allowed: false,
      feature,
      requestedUnits: normalizedUnits,
      usedToday,
      dailyLimit,
      remainingToday,
      reason: "Feature is not included in current tier.",
    };
  }

  if (usedToday + normalizedUnits > dailyLimit) {
    return {
      allowed: false,
      feature,
      requestedUnits: normalizedUnits,
      usedToday,
      dailyLimit,
      remainingToday,
      reason: "Daily usage limit reached for this feature.",
    };
  }

  return {
    allowed: true,
    feature,
    requestedUnits: normalizedUnits,
    usedToday,
    dailyLimit,
    remainingToday: dailyLimit - (usedToday + normalizedUnits),
  };
}

export function consumeFeatureUsage(
  userId: string,
  feature: UsageFeature,
  units = 1,
  source = "unknown",
  metadata?: Record<string, string>,
) {
  return recordUsageEvent(userId, feature, units, source, metadata);
}

export function tryConsumeFeatureUsage(
  userId: string,
  feature: UsageFeature,
  units = 1,
  source = "unknown",
  metadata?: Record<string, string>,
) {
  const allowance = canConsumeFeature(userId, feature, units);
  if (!allowance.allowed) {
    return {
      ok: false as const,
      allowance,
    };
  }

  const event = recordUsageEvent(userId, feature, units, source, metadata);
  return {
    ok: true as const,
    allowance,
    event,
  };
}

export function tryConsumeFeatureUsageSecure(
  userId: string,
  feature: UsageFeature,
  units = 1,
  options?: {
    source?: string;
    metadata?: Record<string, string>;
    idempotencyKey?: unknown;
    idempotencyScope?: unknown;
    idempotencyTtlSeconds?: number;
  },
) {
  const source = options?.source ?? "unknown";
  const metadata = options?.metadata;
  const cleanKey = sanitizeIdempotencyKey(options?.idempotencyKey);
  const scope = normalizeIdempotencyScope(options?.idempotencyScope);

  if (cleanKey) {
    const nowMs = Date.now();
    cleanupUsageIdempotencyStore(nowMs);

    const storageKey = `${userId}|${feature}|${cleanKey}`;
    const store = getUsageIdempotencyStore();
    const existing = store.get(storageKey);
    if (existing && existing.scope === scope && existing.expiresAt > nowMs) {
      return {
        ok: true as const,
        allowance: existing.allowance,
        event: existing.event,
        replayed: true,
      };
    }

    const committed = tryConsumeFeatureUsage(userId, feature, units, source, metadata);
    if (!committed.ok) {
      return {
        ...committed,
        replayed: false,
      };
    }

    const ttlSeconds = parsePositiveIntEnv(
      typeof options?.idempotencyTtlSeconds === "number"
        ? String(options.idempotencyTtlSeconds)
        : process.env.TRADEHAX_USAGE_IDEMPOTENCY_TTL_SECONDS,
      DEFAULT_IDEMPOTENCY_TTL_SECONDS,
    );

    store.set(storageKey, {
      allowance: committed.allowance,
      event: committed.event,
      scope,
      expiresAt: nowMs + ttlSeconds * 1_000,
    });

    return {
      ...committed,
      replayed: false,
    };
  }

  const committed = tryConsumeFeatureUsage(userId, feature, units, source, metadata);
  return {
    ...committed,
    replayed: false,
  };
}

export function tierSupportsNeuralMode(
  userId: string,
  neuralTier: "STANDARD" | "UNCENSORED" | "OVERCLOCK" | "HFT_SIGNAL" | "GUITAR_LESSON",
) {
  const subscription = getSubscription(userId);
  const entitlements = getPlanDefinition(subscription.tier).entitlements;

  if (neuralTier === "UNCENSORED") {
    return entitlements.uncensoredAi;
  }
  if (neuralTier === "OVERCLOCK" || neuralTier === "HFT_SIGNAL") {
    return entitlements.overclockAi;
  }
  return true;
}

export function setTierForUser(
  userId: string,
  tier: SubscriptionTier,
  provider: BillingProvider,
  metadata?: Record<string, string>,
) {
  return setSubscriptionTier(userId, tier, provider, metadata);
}

export function parseTierOrDefault(value: unknown, fallback: SubscriptionTier = "free") {
  return isSubscriptionTier(value) ? value : fallback;
}
