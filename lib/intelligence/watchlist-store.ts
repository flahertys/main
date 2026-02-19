import {
  getIntelligenceStorageStatus,
  deletePersistedWatchlistItem,
  insertPersistedAlerts,
  listPersistedAlerts,
  listPersistedWatchlistItems,
  markPersistedAlertsDelivered,
  upsertPersistedWatchlistItem,
} from "@/lib/intelligence/persistence";
import { getIntelligenceSnapshot } from "@/lib/intelligence/provider";
import { recordAlertScanMetric } from "@/lib/intelligence/metrics";
import {
  IntelligenceAlert,
  IntelligenceStorageStatus,
  WatchlistAssetType,
  WatchlistItem,
} from "@/lib/intelligence/types";

type UpsertWatchlistInput = {
  symbol: string;
  assetType?: WatchlistAssetType;
  minFlowPremiumUsd?: number;
  minDarkPoolNotionalUsd?: number;
  minCryptoNotionalUsd?: number;
  minUnusualScore?: number;
  minConfidence?: number;
  notes?: string;
  active?: boolean;
};

type EvaluateAlertsResult = {
  generatedAt: string;
  newAlerts: IntelligenceAlert[];
  alerts: IntelligenceAlert[];
  storage: IntelligenceStorageStatus;
};

type DedupeStore = Map<string, Map<string, number>>;

function getDedupeStore(): DedupeStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_INTELLIGENCE_DEDUPE__?: DedupeStore;
  };
  if (!globalRef.__TRADEHAX_INTELLIGENCE_DEDUPE__) {
    globalRef.__TRADEHAX_INTELLIGENCE_DEDUPE__ = new Map();
  }
  return globalRef.__TRADEHAX_INTELLIGENCE_DEDUPE__;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeUserId(userId: string) {
  return userId.trim().toLowerCase().slice(0, 64);
}

function normalizeSymbol(symbol: string) {
  return symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9/_.\-]/g, "")
    .slice(0, 24);
}

function normalizeNotes(notes: string | undefined) {
  if (!notes) return "";
  return notes.trim().slice(0, 180);
}

function normalizePositiveNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  if (value <= 0 || value > 1) return undefined;
  return value;
}

function createAlertId(prefix = "ialert") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function toDedupeKey(input: {
  source: IntelligenceAlert["source"];
  symbol: string;
  referenceId?: string;
  title?: string;
}) {
  return `${input.source}:${input.symbol}:${input.referenceId || input.title || "unknown"}`;
}

function getUserDedupeMap(userId: string) {
  const store = getDedupeStore();
  const key = normalizeUserId(userId);
  if (!store.has(key)) {
    store.set(key, new Map());
  }
  return store.get(key) || new Map<string, number>();
}

function buildRecentPersistentKeys(alerts: IntelligenceAlert[], nowMs: number) {
  const windowMs = 30 * 60_000;
  const keys = new Set<string>();
  for (const alert of alerts) {
    const parsedTs = Date.parse(alert.triggeredAt);
    if (!Number.isFinite(parsedTs)) continue;
    if (nowMs - parsedTs > windowMs) continue;
    keys.add(
      toDedupeKey({
        source: alert.source,
        symbol: alert.symbol,
        referenceId: alert.referenceId,
        title: alert.title,
      }),
    );
  }
  return keys;
}

function shouldCreateAlert(
  userId: string,
  dedupeKey: string,
  nowMs: number,
  recentPersistentKeys: Set<string>,
) {
  if (recentPersistentKeys.has(dedupeKey)) {
    return false;
  }

  const map = getUserDedupeMap(userId);
  const existingTs = map.get(dedupeKey);
  const windowMs = 30 * 60_000;
  if (typeof existingTs === "number" && nowMs - existingTs < windowMs) {
    return false;
  }
  map.set(dedupeKey, nowMs);

  if (map.size > 2_000) {
    const sortedEntries = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1_400);
    map.clear();
    for (const [key, value] of sortedEntries) {
      map.set(key, value);
    }
  }

  return true;
}

export async function listWatchlist(userId: string) {
  return listPersistedWatchlistItems(normalizeUserId(userId));
}

export async function upsertWatchlistItem(userId: string, input: UpsertWatchlistInput) {
  const symbol = normalizeSymbol(String(input.symbol || ""));
  if (!symbol) {
    return { ok: false as const, error: "Symbol is required." };
  }

  const normalizedUserId = normalizeUserId(userId);
  const assetType: WatchlistAssetType =
    input.assetType === "crypto" || symbol.includes("/") ? "crypto" : "equity";
  const existingItems = await listPersistedWatchlistItems(normalizedUserId);
  const existing = existingItems.find(
    (item) => item.symbol === symbol && item.assetType === assetType,
  );
  const timestamp = nowIso();

  const item: WatchlistItem = {
    id: existing?.id || createAlertId("watch"),
    userId: normalizedUserId,
    symbol,
    assetType,
    minFlowPremiumUsd: normalizePositiveNumber(input.minFlowPremiumUsd),
    minDarkPoolNotionalUsd: normalizePositiveNumber(input.minDarkPoolNotionalUsd),
    minCryptoNotionalUsd: normalizePositiveNumber(input.minCryptoNotionalUsd),
    minUnusualScore: normalizePositiveNumber(input.minUnusualScore),
    minConfidence: normalizeConfidence(input.minConfidence),
    notes: normalizeNotes(input.notes),
    active: input.active !== false,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };

  const persisted = await upsertPersistedWatchlistItem(item);
  return { ok: true as const, item: persisted };
}

export async function removeWatchlistItem(
  userId: string,
  symbol: string,
  assetType?: WatchlistAssetType,
) {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) {
    return { ok: false as const, error: "Symbol is required." };
  }

  const removed = await deletePersistedWatchlistItem(userId, normalizedSymbol, assetType);
  return {
    ok: true as const,
    removed,
  };
}

export async function listAlerts(userId: string, limit = 60) {
  return listPersistedAlerts(normalizeUserId(userId), limit);
}

export async function markAlertsDeliveredToDiscord(
  userId: string,
  alertIds: string[],
  deliveredAt: string,
) {
  await markPersistedAlertsDelivered(normalizeUserId(userId), alertIds, deliveredAt);
}

export async function evaluateWatchlistAlerts(userId: string): Promise<EvaluateAlertsResult> {
  const normalizedUserId = normalizeUserId(userId);
  const watchlist = (await listPersistedWatchlistItems(normalizedUserId)).filter((item) => item.active);
  const snapshot = await getIntelligenceSnapshot();
  const nowMs = Date.now();
  const timestamp = new Date(nowMs).toISOString();
  const newAlerts: IntelligenceAlert[] = [];
  const recentAlerts = await listPersistedAlerts(normalizedUserId, 260);
  const recentPersistentKeys = buildRecentPersistentKeys(recentAlerts, nowMs);

  for (const item of watchlist) {
    if (item.assetType === "equity") {
      const minFlowPremium = item.minFlowPremiumUsd ?? 700_000;
      const minDarkPool = item.minDarkPoolNotionalUsd ?? 14_000_000;
      const minScore = item.minUnusualScore ?? 75;

      const flowMatches = snapshot.flowTape.filter(
        (trade) =>
          trade.symbol === item.symbol &&
          trade.premiumUsd >= minFlowPremium &&
          trade.unusualScore >= minScore,
      );
      for (const trade of flowMatches) {
        const dedupeKey = toDedupeKey({
          source: "flow",
          symbol: item.symbol,
          referenceId: trade.id,
        });
        if (!shouldCreateAlert(normalizedUserId, dedupeKey, nowMs, recentPersistentKeys)) {
          continue;
        }
        newAlerts.push({
          id: createAlertId(),
          userId: normalizedUserId,
          symbol: item.symbol,
          assetType: "equity",
          source: "flow",
          severity: trade.unusualScore >= 90 ? "urgent" : "watch",
          title: `${item.symbol} options flow spike`,
          summary: `${trade.side.toUpperCase()} premium $${trade.premiumUsd.toLocaleString()} with unusual score ${trade.unusualScore}.`,
          triggeredAt: timestamp,
          route: "/intelligence/flow",
          referenceId: trade.id,
          deliveredToDiscordAt: null,
        });
      }

      const darkPoolMatches = snapshot.darkPoolTape.filter(
        (trade) =>
          trade.symbol === item.symbol &&
          trade.notionalUsd >= minDarkPool &&
          trade.unusualScore >= minScore,
      );
      for (const trade of darkPoolMatches) {
        const dedupeKey = toDedupeKey({
          source: "dark_pool",
          symbol: item.symbol,
          referenceId: trade.id,
        });
        if (!shouldCreateAlert(normalizedUserId, dedupeKey, nowMs, recentPersistentKeys)) {
          continue;
        }
        newAlerts.push({
          id: createAlertId(),
          userId: normalizedUserId,
          symbol: item.symbol,
          assetType: "equity",
          source: "dark_pool",
          severity: trade.notionalUsd >= minDarkPool * 2 ? "urgent" : "watch",
          title: `${item.symbol} dark pool print`,
          summary: `Block notional $${trade.notionalUsd.toLocaleString()} on ${trade.venue} (${trade.sideEstimate}).`,
          triggeredAt: timestamp,
          route: "/intelligence/dark-pool",
          referenceId: trade.id,
          deliveredToDiscordAt: null,
        });
      }

      const newsMatches = snapshot.news.filter(
        (news) =>
          news.symbol === item.symbol && (news.impact === "high" || news.impact === "medium"),
      );
      for (const news of newsMatches) {
        const dedupeKey = toDedupeKey({
          source: "news",
          symbol: item.symbol,
          referenceId: news.id,
        });
        if (!shouldCreateAlert(normalizedUserId, dedupeKey, nowMs, recentPersistentKeys)) {
          continue;
        }
        newAlerts.push({
          id: createAlertId(),
          userId: normalizedUserId,
          symbol: item.symbol,
          assetType: "equity",
          source: "news",
          severity: news.impact === "high" ? "urgent" : "info",
          title: `${item.symbol} catalyst headline`,
          summary: news.title,
          triggeredAt: timestamp,
          route: "/intelligence/news",
          referenceId: news.id,
          deliveredToDiscordAt: null,
        });
      }
    } else {
      const minCryptoNotional = item.minCryptoNotionalUsd ?? 500_000;
      const minConfidence = item.minConfidence ?? 0.65;
      const minScore = item.minUnusualScore ?? 0;

      const matches = snapshot.cryptoTape.filter((trade) => {
        if (trade.pair !== item.symbol) return false;
        if (trade.notionalUsd < minCryptoNotional) return false;
        if (trade.confidence < minConfidence) return false;
        if (minScore > 0 && trade.confidence * 100 < minScore) return false;
        return true;
      });

      for (const trade of matches) {
        const dedupeKey = toDedupeKey({
          source: "crypto",
          symbol: item.symbol,
          referenceId: trade.id,
        });
        if (!shouldCreateAlert(normalizedUserId, dedupeKey, nowMs, recentPersistentKeys)) {
          continue;
        }
        newAlerts.push({
          id: createAlertId(),
          userId: normalizedUserId,
          symbol: item.symbol,
          assetType: "crypto",
          source: "crypto",
          severity: trade.confidence >= 0.82 ? "urgent" : "watch",
          title: `${item.symbol} crypto flow trigger`,
          summary: `${trade.side} notional $${trade.notionalUsd.toLocaleString()} on ${trade.exchange} with ${(trade.confidence * 100).toFixed(0)}% confidence.`,
          triggeredAt: timestamp,
          route: "/intelligence/crypto-flow",
          referenceId: trade.id,
          deliveredToDiscordAt: null,
        });
      }
    }
  }

  if (newAlerts.length > 0) {
    await insertPersistedAlerts(newAlerts);
  }

  recordAlertScanMetric({
    generated: newAlerts.length,
  });

  return {
    generatedAt: timestamp,
    newAlerts,
    alerts: await listPersistedAlerts(normalizedUserId, 80),
    storage: await getIntelligenceStorageStatus(),
  };
}

export async function getWatchlistStorageStatus() {
  return getIntelligenceStorageStatus();
}
