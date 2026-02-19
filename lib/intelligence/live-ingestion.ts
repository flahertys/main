import {
  DarkPoolTrade,
  FlowTrade,
  IntelligenceLiveEvent,
  IntelligenceLiveStatus,
  IntelligenceNewsItem,
} from "@/lib/intelligence/types";
import { recordLiveMetric } from "@/lib/intelligence/metrics";

type OverlayState = {
  premiumUsd?: number;
  unusualScore?: number;
  side?: FlowTrade["side"];
  openedAt?: string;
};

type DarkOverlayState = {
  notionalUsd?: number;
  unusualScore?: number;
  sideEstimate?: DarkPoolTrade["sideEstimate"];
  executedAt?: string;
};

type LiveStore = {
  enabled: boolean;
  started: boolean;
  connected: boolean;
  provider: "websocket" | "disabled";
  urlConfigured: boolean;
  reconnectCount: number;
  receivedEvents: number;
  droppedEvents: number;
  lastConnectedAt?: string;
  lastMessageAt?: string;
  lastError?: string;
  seq: number;
  events: IntelligenceLiveEvent[];
  flowOverlay: Map<string, OverlayState>;
  darkOverlay: Map<string, DarkOverlayState>;
  newsOverlay: IntelligenceNewsItem[];
  socket?: WebSocket;
  reconnectTimer?: ReturnType<typeof setTimeout>;
};

type ApplyOverlayInput = {
  flowTape: FlowTrade[];
  darkPoolTape: DarkPoolTrade[];
  news: IntelligenceNewsItem[];
};

type ApplyOverlayResult = ApplyOverlayInput & {
  overlayInfo: {
    flowSymbols: number;
    darkSymbols: number;
    newsItems: number;
    recentEvents: number;
  };
};

function getStore(): LiveStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_INTELLIGENCE_LIVE__?: LiveStore;
  };
  if (!globalRef.__TRADEHAX_INTELLIGENCE_LIVE__) {
    globalRef.__TRADEHAX_INTELLIGENCE_LIVE__ = {
      enabled: false,
      started: false,
      connected: false,
      provider: "disabled",
      urlConfigured: false,
      reconnectCount: 0,
      receivedEvents: 0,
      droppedEvents: 0,
      seq: 0,
      events: [],
      flowOverlay: new Map(),
      darkOverlay: new Map(),
      newsOverlay: [],
    };
  }
  return globalRef.__TRADEHAX_INTELLIGENCE_LIVE__;
}

function nowIso() {
  return new Date().toISOString();
}

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return fallback;
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

function normalizeSymbol(value: unknown) {
  return asString(value, "")
    .toUpperCase()
    .replace(/[^A-Z0-9/_.\-]/g, "")
    .slice(0, 24);
}

function toIsoTimestamp(value: unknown) {
  const raw = asString(value, "");
  if (!raw) return nowIso();
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return nowIso();
  return new Date(parsed).toISOString();
}

function toFlowSide(value: unknown): FlowTrade["side"] {
  const normalized = asString(value, "").toLowerCase();
  return normalized.includes("put") ? "put" : "call";
}

function toDarkSide(value: unknown): DarkPoolTrade["sideEstimate"] {
  const normalized = asString(value, "").toLowerCase();
  if (normalized.includes("buy")) return "buy";
  if (normalized.includes("sell")) return "sell";
  return "mixed";
}

function pushLiveEvent(event: Omit<IntelligenceLiveEvent, "seq" | "timestamp">) {
  const store = getStore();
  store.seq += 1;
  store.events.push({
    seq: store.seq,
    timestamp: nowIso(),
    ...event,
  });
  if (store.events.length > 800) {
    const removed = store.events.length - 700;
    store.events.splice(0, removed);
    store.droppedEvents += removed;
  }
}

function reconnectDelayMs() {
  const configured = Number.parseInt(
    String(process.env.TRADEHAX_INTELLIGENCE_WS_RECONNECT_MS || "4000"),
    10,
  );
  if (!Number.isFinite(configured) || configured < 1_000) return 4_000;
  return Math.min(60_000, configured);
}

function maxOverlayAgeMs() {
  return 25 * 60_000;
}

function isOverlayFresh(timestamp: string | undefined) {
  if (!timestamp) return false;
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return false;
  return Date.now() - parsed <= maxOverlayAgeMs();
}

function ingestFlowRecord(row: Record<string, unknown>) {
  const symbol = normalizeSymbol(row.symbol ?? row.ticker ?? row.underlying);
  if (!symbol) return;
  const premiumUsd = asNumber(row.premium ?? row.notional ?? row.value);
  const unusualScore = asNumber(row.unusualScore ?? row.unusual_score ?? row.score);
  const side = toFlowSide(row.side ?? row.option_type);
  const openedAt = toIsoTimestamp(row.timestamp ?? row.openedAt ?? row.executed_at);
  const overlay: OverlayState = {
    premiumUsd,
    unusualScore,
    side,
    openedAt,
  };
  getStore().flowOverlay.set(symbol, overlay);
  pushLiveEvent({
    type: "flow",
    symbol,
    source: "websocket",
    summary: `${symbol} flow update premium=${premiumUsd ?? "na"} score=${unusualScore ?? "na"}`,
  });
  recordLiveMetric({ type: "message", count: 1 });
}

function ingestDarkRecord(row: Record<string, unknown>) {
  const symbol = normalizeSymbol(row.symbol ?? row.ticker ?? row.underlying);
  if (!symbol) return;
  const notionalUsd = asNumber(row.notional ?? row.value ?? row.premium);
  const unusualScore = asNumber(row.unusualScore ?? row.unusual_score ?? row.score);
  const sideEstimate = toDarkSide(row.side ?? row.sideEstimate ?? row.side_estimate);
  const executedAt = toIsoTimestamp(row.timestamp ?? row.executedAt ?? row.executed_at);
  const overlay: DarkOverlayState = {
    notionalUsd,
    unusualScore,
    sideEstimate,
    executedAt,
  };
  getStore().darkOverlay.set(symbol, overlay);
  pushLiveEvent({
    type: "dark_pool",
    symbol,
    source: "websocket",
    summary: `${symbol} dark-pool update notional=${notionalUsd ?? "na"} score=${unusualScore ?? "na"}`,
  });
  recordLiveMetric({ type: "message", count: 1 });
}

function ingestNewsRecord(row: Record<string, unknown>) {
  const title = asString(row.title ?? row.headline, "");
  if (!title) return;
  const symbol = normalizeSymbol(row.symbol ?? row.ticker ?? row.asset);
  const impactRaw = asString(row.impact ?? row.severity, "").toLowerCase();
  const impact: IntelligenceNewsItem["impact"] =
    impactRaw.includes("high") ? "high" : impactRaw.includes("low") ? "low" : "medium";
  const categoryRaw = asString(row.category ?? row.topic, "").toLowerCase();
  const category: IntelligenceNewsItem["category"] =
    categoryRaw.includes("earn")
      ? "earnings"
      : categoryRaw.includes("macro")
        ? "macro"
        : categoryRaw.includes("crypto")
          ? "crypto"
          : categoryRaw.includes("policy")
            ? "policy"
            : "technical";

  const item: IntelligenceNewsItem = {
    id: asString(row.id, `live_news_${Date.now().toString(36)}`),
    title,
    symbol: symbol || "SPY",
    impact,
    category,
    summary: asString(row.summary ?? row.description, title),
    publishedAt: toIsoTimestamp(row.publishedAt ?? row.timestamp),
    source: asString(row.source, "LiveFeed"),
  };

  const store = getStore();
  store.newsOverlay.unshift(item);
  if (store.newsOverlay.length > 120) {
    store.newsOverlay.splice(120);
  }

  pushLiveEvent({
    type: "news",
    symbol: item.symbol,
    source: "websocket",
    summary: `${item.symbol} live news: ${item.title.slice(0, 90)}`,
  });
  recordLiveMetric({ type: "message", count: 1 });
}

function ingestPayload(payload: unknown) {
  const store = getStore();
  const row = toRecord(payload);
  const rawType = asString(row.type ?? row.channel ?? row.topic, "").toLowerCase();

  if (Array.isArray(payload)) {
    for (const item of payload) {
      ingestPayload(item);
    }
    return;
  }

  if (rawType.includes("flow") || rawType.includes("option")) {
    ingestFlowRecord(row);
    return;
  }
  if (rawType.includes("dark")) {
    ingestDarkRecord(row);
    return;
  }
  if (rawType.includes("news") || rawType.includes("headline")) {
    ingestNewsRecord(row);
    return;
  }

  if (Array.isArray(row.flow) || Array.isArray(row.flowTape)) {
    const flowRows = (row.flow || row.flowTape || []) as unknown[];
    for (const item of flowRows) {
      ingestFlowRecord(toRecord(item));
    }
  }
  if (Array.isArray(row.darkPool) || Array.isArray(row.dark_pool)) {
    const darkRows = (row.darkPool || row.dark_pool || []) as unknown[];
    for (const item of darkRows) {
      ingestDarkRecord(toRecord(item));
    }
  }
  if (Array.isArray(row.news)) {
    for (const item of row.news as unknown[]) {
      ingestNewsRecord(toRecord(item));
    }
  }

  store.receivedEvents += 1;
}

function scheduleReconnect() {
  const store = getStore();
  if (!store.enabled) return;
  if (store.reconnectTimer) return;
  const delay = reconnectDelayMs();
  store.reconnectTimer = setTimeout(() => {
    store.reconnectTimer = undefined;
    startLiveSocket();
  }, delay);
}

function startLiveSocket() {
  const store = getStore();
  const wsUrl = String(process.env.TRADEHAX_INTELLIGENCE_WS_URL || "").trim();
  const wsProtocol = String(process.env.TRADEHAX_INTELLIGENCE_WS_PROTOCOL || "").trim();
  store.urlConfigured = wsUrl.length > 0;

  if (!store.enabled || !store.urlConfigured) {
    store.provider = "disabled";
    return;
  }

  if (typeof WebSocket === "undefined") {
    store.provider = "disabled";
    store.lastError = "WebSocket runtime not available in this environment.";
    pushLiveEvent({
      type: "status",
      source: "system",
      summary: store.lastError,
    });
    recordLiveMetric({ type: "error", count: 1 });
    return;
  }

  try {
    store.provider = "websocket";
    store.socket = wsProtocol ? new WebSocket(wsUrl, wsProtocol) : new WebSocket(wsUrl);
  } catch (error) {
    store.connected = false;
    store.lastError = error instanceof Error ? error.message : "WebSocket initialization failed.";
    store.reconnectCount += 1;
    pushLiveEvent({
      type: "status",
      source: "system",
      summary: `WebSocket init failed: ${store.lastError}`,
    });
    recordLiveMetric({ type: "error", count: 1 });
    scheduleReconnect();
    return;
  }

  const socket = store.socket;
  socket.onopen = () => {
    const current = getStore();
    current.connected = true;
    current.lastConnectedAt = nowIso();
    current.lastError = undefined;
    pushLiveEvent({
      type: "status",
      source: "system",
      summary: "Live ingestion socket connected.",
    });
    recordLiveMetric({ type: "connect", count: 1 });
  };

  socket.onmessage = (event) => {
    const current = getStore();
    current.lastMessageAt = nowIso();
    current.receivedEvents += 1;

    try {
      const rawData = event.data;
      let text = "";
      if (typeof rawData === "string") {
        text = rawData;
      } else if (rawData instanceof ArrayBuffer) {
        text = Buffer.from(rawData).toString("utf8");
      } else if (ArrayBuffer.isView(rawData)) {
        text = Buffer.from(rawData.buffer).toString("utf8");
      } else {
        text = String(rawData ?? "");
      }

      if (!text.trim()) {
        pushLiveEvent({
          type: "heartbeat",
          source: "websocket",
          summary: "Live heartbeat",
        });
        return;
      }

      const parsed = JSON.parse(text) as unknown;
      ingestPayload(parsed);
    } catch (error) {
      current.lastError = error instanceof Error ? error.message : "Failed to parse live payload.";
      pushLiveEvent({
        type: "status",
        source: "system",
        summary: `Live payload parse error: ${current.lastError}`,
      });
      recordLiveMetric({ type: "error", count: 1 });
    }
  };

  socket.onerror = () => {
    const current = getStore();
    current.lastError = "WebSocket transport error.";
    recordLiveMetric({ type: "error", count: 1 });
  };

  socket.onclose = () => {
    const current = getStore();
    current.connected = false;
    current.reconnectCount += 1;
    pushLiveEvent({
      type: "status",
      source: "system",
      summary: "Live ingestion socket closed. Reconnecting.",
    });
    recordLiveMetric({ type: "disconnect", count: 1 });
    scheduleReconnect();
  };
}

export function ensureLiveIngestion() {
  const store = getStore();
  if (store.started) return;

  const enabled = parseBoolean(process.env.TRADEHAX_INTELLIGENCE_WS_ENABLED, false);
  store.enabled = enabled;
  store.started = true;
  store.urlConfigured = Boolean(String(process.env.TRADEHAX_INTELLIGENCE_WS_URL || "").trim());
  store.provider = enabled && store.urlConfigured ? "websocket" : "disabled";

  if (!enabled) {
    pushLiveEvent({
      type: "status",
      source: "system",
      summary: "Live ingestion disabled by TRADEHAX_INTELLIGENCE_WS_ENABLED=false.",
    });
    return;
  }

  startLiveSocket();
}

export function getLiveIngestionStatus(): IntelligenceLiveStatus {
  const store = getStore();
  return {
    enabled: store.enabled,
    started: store.started,
    connected: store.connected,
    provider: store.provider,
    urlConfigured: store.urlConfigured,
    reconnectCount: store.reconnectCount,
    receivedEvents: store.receivedEvents,
    droppedEvents: store.droppedEvents,
    lastConnectedAt: store.lastConnectedAt,
    lastMessageAt: store.lastMessageAt,
    lastError: store.lastError,
    generatedAt: nowIso(),
  };
}

export function getLiveEventsSince(cursor = 0, limit = 100) {
  const store = getStore();
  const safeLimit = Math.min(400, Math.max(1, Math.floor(limit)));
  const events = store.events.filter((event) => event.seq > cursor).slice(0, safeLimit);
  const nextCursor = events.length > 0 ? events[events.length - 1].seq : cursor;
  return {
    events,
    nextCursor,
    latestSeq: store.seq,
  };
}

export function applyLiveOverlay(input: ApplyOverlayInput): ApplyOverlayResult {
  const store = getStore();
  const flowTape = input.flowTape.map((trade) => {
    const overlay = store.flowOverlay.get(trade.symbol);
    if (!overlay || !isOverlayFresh(overlay.openedAt)) {
      return trade;
    }
    return {
      ...trade,
      premiumUsd: overlay.premiumUsd ?? trade.premiumUsd,
      unusualScore: overlay.unusualScore ?? trade.unusualScore,
      side: overlay.side ?? trade.side,
      openedAt: overlay.openedAt ?? trade.openedAt,
    };
  });

  const darkPoolTape = input.darkPoolTape.map((trade) => {
    const overlay = store.darkOverlay.get(trade.symbol);
    if (!overlay || !isOverlayFresh(overlay.executedAt)) {
      return trade;
    }
    return {
      ...trade,
      notionalUsd: overlay.notionalUsd ?? trade.notionalUsd,
      unusualScore: overlay.unusualScore ?? trade.unusualScore,
      sideEstimate: overlay.sideEstimate ?? trade.sideEstimate,
      executedAt: overlay.executedAt ?? trade.executedAt,
    };
  });

  const recentNews = store.newsOverlay
    .filter((item) => isOverlayFresh(item.publishedAt))
    .slice(0, 20);
  const seen = new Set<string>();
  const news: IntelligenceNewsItem[] = [];
  for (const item of [...recentNews, ...input.news]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    news.push(item);
    if (news.length >= 60) break;
  }

  return {
    flowTape,
    darkPoolTape,
    news,
    overlayInfo: {
      flowSymbols: store.flowOverlay.size,
      darkSymbols: store.darkOverlay.size,
      newsItems: recentNews.length,
      recentEvents: store.events.length,
    },
  };
}
