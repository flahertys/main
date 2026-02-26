import { getFeatureDailyLimit, getPlanDefinition, planOrder } from "@/lib/monetization/plans";
import {
    MonetizationMetrics,
    SubscriptionRecord,
    SubscriptionTier,
    UsageEvent,
    UsageFeature,
    UsageSummary,
} from "@/lib/monetization/types";

type UserRecord = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
};

type MonetizationStore = {
  users: Map<string, UserRecord>;
  subscriptions: Map<string, SubscriptionRecord>;
  usageEvents: UsageEvent[];
};

const DEFAULT_FREE_AI_WEEKLY_MINUTES = 30;
const DEFAULT_AI_UNIT_SECONDS = 20;

function parsePositiveIntEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getStore(): MonetizationStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_MONETIZATION_STORE__?: MonetizationStore;
  };

  if (!globalRef.__TRADEHAX_MONETIZATION_STORE__) {
    globalRef.__TRADEHAX_MONETIZATION_STORE__ = {
      users: new Map(),
      subscriptions: new Map(),
      usageEvents: [],
    };
  }

  return globalRef.__TRADEHAX_MONETIZATION_STORE__;
}

function nowIso() {
  return new Date().toISOString();
}

function createDefaultSubscription(userId: string): SubscriptionRecord {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60_000);
  return {
    userId,
    tier: "free",
    status: "active",
    provider: "none",
    billingCycle: "monthly",
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    updatedAt: now.toISOString(),
  };
}

function ensureUserRecord(userId: string) {
  const store = getStore();
  const timestamp = nowIso();
  const existing = store.users.get(userId);
  if (existing) {
    existing.updatedAt = timestamp;
    store.users.set(userId, existing);
    return existing;
  }

  const created: UserRecord = {
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.users.set(userId, created);
  return created;
}

export function getSubscription(userId: string): SubscriptionRecord {
  ensureUserRecord(userId);
  const store = getStore();
  const existing = store.subscriptions.get(userId);
  if (existing) {
    return existing;
  }
  const created = createDefaultSubscription(userId);
  store.subscriptions.set(userId, created);
  return created;
}

export function setSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
  provider: SubscriptionRecord["provider"],
  metadata?: Record<string, string>,
) {
  ensureUserRecord(userId);
  const store = getStore();
  const prior = getSubscription(userId);
  const now = new Date();
  const cycleMs = prior.billingCycle === "yearly" ? 365 : 30;
  const periodEnd = new Date(now.getTime() + cycleMs * 24 * 60 * 60_000);

  const next: SubscriptionRecord = {
    ...prior,
    tier,
    status: "active",
    provider,
    cancelAtPeriodEnd: false,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    updatedAt: now.toISOString(),
    metadata: {
      ...(prior.metadata ?? {}),
      ...(metadata ?? {}),
    },
  };
  store.subscriptions.set(userId, next);
  return next;
}

export function updateSubscriptionRecord(
  userId: string,
  patch: Partial<SubscriptionRecord>,
) {
  ensureUserRecord(userId);
  const store = getStore();
  const current = getSubscription(userId);
  const next: SubscriptionRecord = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  store.subscriptions.set(userId, next);
  return next;
}

export function cancelSubscriptionAtPeriodEnd(userId: string) {
  return updateSubscriptionRecord(userId, {
    cancelAtPeriodEnd: true,
  });
}

export function reactivateSubscription(userId: string) {
  return updateSubscriptionRecord(userId, {
    cancelAtPeriodEnd: false,
    status: "active",
  });
}

export function recordUsageEvent(
  userId: string,
  feature: UsageFeature,
  units: number,
  source: string,
  metadata?: Record<string, string>,
) {
  ensureUserRecord(userId);
  const store = getStore();
  const event: UsageEvent = {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    feature,
    units: Math.max(1, Math.floor(units)),
    source: source.slice(0, 64),
    timestamp: nowIso(),
    metadata,
  };
  store.usageEvents.push(event);

  // Keep memory bounded for server runtimes.
  if (store.usageEvents.length > 25_000) {
    store.usageEvents = store.usageEvents.slice(-20_000);
  }
  return event;
}

function getUtcDayBounds(date = new Date()) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { start, end };
}

function getUtcWeekBounds(date = new Date()) {
  const dayStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayOfWeek = dayStart.getUTCDay();
  const offsetToMonday = (dayOfWeek + 6) % 7;
  const start = new Date(dayStart.getTime() - offsetToMonday * 24 * 60 * 60_000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60_000);
  return { start, end };
}

export function getUsageCountForToday(userId: string, feature: UsageFeature): number {
  const store = getStore();
  const { start, end } = getUtcDayBounds();
  const startMs = start.getTime();
  const endMs = end.getTime();

  return store.usageEvents
    .filter((event) => {
      if (event.userId !== userId || event.feature !== feature) {
        return false;
      }
      const ts = Date.parse(event.timestamp);
      return ts >= startMs && ts < endMs;
    })
    .reduce((total, event) => total + event.units, 0);
}

export function getUsageCountForCurrentWeek(userId: string, feature: UsageFeature): number {
  const store = getStore();
  const { start, end } = getUtcWeekBounds();
  const startMs = start.getTime();
  const endMs = end.getTime();

  return store.usageEvents
    .filter((event) => {
      if (event.userId !== userId || event.feature !== feature) {
        return false;
      }
      const ts = Date.parse(event.timestamp);
      return ts >= startMs && ts < endMs;
    })
    .reduce((total, event) => total + event.units, 0);
}

export function getUsageCountForRecentWindow(
  userId: string,
  feature: UsageFeature,
  windowMs: number,
): number {
  const safeWindowMs = Math.max(1_000, Math.floor(windowMs));
  const startMs = Date.now() - safeWindowMs;
  const store = getStore();

  return store.usageEvents
    .filter((event) => {
      if (event.userId !== userId || event.feature !== feature) {
        return false;
      }
      const ts = Date.parse(event.timestamp);
      return ts >= startMs;
    })
    .reduce((total, event) => total + event.units, 0);
}

export function getUsageSummaryForUser(userId: string): UsageSummary[] {
  const subscription = getSubscription(userId);
  const tier = subscription.tier;
  const features: UsageFeature[] = [
    "ai_chat",
    "hax_runner",
    "signal_alert",
    "bot_create",
  ];

  return features.map((feature) => {
    const usedToday = getUsageCountForToday(userId, feature);
    const dailyLimit = getFeatureDailyLimit(tier, feature);

    if (tier === "free" && feature === "ai_chat") {
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

      return {
        feature,
        usedToday,
        dailyLimit,
        remainingToday: Math.max(0, dailyLimit - usedToday),
        usedThisWeek,
        weeklyLimit,
        remainingThisWeek: Math.max(0, weeklyLimit - usedThisWeek),
        weeklyMinutes,
        unitDurationSeconds,
      };
    }

    return {
      feature,
      usedToday,
      dailyLimit,
      remainingToday: Math.max(0, dailyLimit - usedToday),
    };
  });
}

export function getMonetizationMetrics(): MonetizationMetrics {
  const store = getStore();
  const activeSubscriptions = Array.from(store.subscriptions.values()).filter(
    (subscription) =>
      subscription.status === "active" || subscription.status === "trialing",
  );

  const tierBreakdown: Record<SubscriptionTier, number> = {
    free: 0,
    basic: 0,
    pro: 0,
    elite: 0,
  };

  let mrrUsd = 0;
  for (const subscription of activeSubscriptions) {
    tierBreakdown[subscription.tier] += 1;
    const plan = getPlanDefinition(subscription.tier);
    if (subscription.billingCycle === "yearly") {
      mrrUsd += plan.yearlyPriceUsd / 12;
    } else {
      mrrUsd += plan.monthlyPriceUsd;
    }
  }

  const paidCount = planOrder
    .filter((tier) => tier !== "free")
    .reduce((count, tier) => count + tierBreakdown[tier], 0);

  return {
    generatedAt: nowIso(),
    activeSubscribers: activeSubscriptions.length,
    mrrUsd: Number(mrrUsd.toFixed(2)),
    arrUsd: Number((mrrUsd * 12).toFixed(2)),
    arpuUsd: Number((paidCount > 0 ? mrrUsd / paidCount : 0).toFixed(2)),
    totalUsers: store.users.size,
    tierBreakdown,
  };
}
