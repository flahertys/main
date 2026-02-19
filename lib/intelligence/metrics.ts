import { IntelligenceSlaMetrics } from "@/lib/intelligence/types";

type ProviderMetricEvent = {
  timestamp: number;
  vendor: string;
  mode: "live" | "simulated";
  ok: boolean;
  latencyMs: number;
  error?: string;
};

type AlertScanMetricEvent = {
  timestamp: number;
  generated: number;
};

type AlertDispatchMetricEvent = {
  timestamp: number;
  ok: boolean;
  latencyMs: number;
  attempted: number;
  delivered: number;
};

type LiveMetricEvent = {
  timestamp: number;
  type: "message" | "connect" | "disconnect" | "error";
  count: number;
};

type MetricsStore = {
  provider: ProviderMetricEvent[];
  scans: AlertScanMetricEvent[];
  dispatch: AlertDispatchMetricEvent[];
  live: LiveMetricEvent[];
};

function getStore(): MetricsStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_INTELLIGENCE_METRICS__?: MetricsStore;
  };

  if (!globalRef.__TRADEHAX_INTELLIGENCE_METRICS__) {
    globalRef.__TRADEHAX_INTELLIGENCE_METRICS__ = {
      provider: [],
      scans: [],
      dispatch: [],
      live: [],
    };
  }

  return globalRef.__TRADEHAX_INTELLIGENCE_METRICS__;
}

function nowMs() {
  return Date.now();
}

function trimArray<T>(list: T[], max = 8_000) {
  if (list.length <= max) return;
  list.splice(0, list.length - max);
}

export function recordProviderMetric(event: Omit<ProviderMetricEvent, "timestamp">) {
  const store = getStore();
  store.provider.push({
    timestamp: nowMs(),
    ...event,
  });
  trimArray(store.provider);
}

export function recordAlertScanMetric(event: Omit<AlertScanMetricEvent, "timestamp">) {
  const store = getStore();
  store.scans.push({
    timestamp: nowMs(),
    ...event,
  });
  trimArray(store.scans);
}

export function recordAlertDispatchMetric(event: Omit<AlertDispatchMetricEvent, "timestamp">) {
  const store = getStore();
  store.dispatch.push({
    timestamp: nowMs(),
    ...event,
  });
  trimArray(store.dispatch);
}

export function recordLiveMetric(event: Omit<LiveMetricEvent, "timestamp">) {
  const store = getStore();
  store.live.push({
    timestamp: nowMs(),
    ...event,
  });
  trimArray(store.live);
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export function getIntelligenceSlaMetrics(windowMinutes = 60): IntelligenceSlaMetrics {
  const store = getStore();
  const safeWindowMinutes = Math.min(24 * 60, Math.max(5, Math.floor(windowMinutes)));
  const fromTs = nowMs() - safeWindowMinutes * 60_000;

  const providerEvents = store.provider.filter((item) => item.timestamp >= fromTs);
  const scanEvents = store.scans.filter((item) => item.timestamp >= fromTs);
  const dispatchEvents = store.dispatch.filter((item) => item.timestamp >= fromTs);
  const liveEvents = store.live.filter((item) => item.timestamp >= fromTs);

  const providerSuccess = providerEvents.filter((item) => item.ok).length;
  const providerFailures = providerEvents.length - providerSuccess;
  const providerLatencies = providerEvents.map((item) => item.latencyMs);
  const providerLiveCount = providerEvents.filter((item) => item.mode === "live").length;
  const providerSimCount = providerEvents.filter((item) => item.mode === "simulated").length;
  const providerLastError = providerEvents
    .slice()
    .reverse()
    .find((item) => item.error)?.error;

  const totalGenerated = scanEvents.reduce((total, item) => total + item.generated, 0);
  const attempted = dispatchEvents.reduce((total, item) => total + item.attempted, 0);
  const delivered = dispatchEvents.reduce((total, item) => total + item.delivered, 0);
  const dispatchLatencies = dispatchEvents.map((item) => item.latencyMs);
  const dispatchOkCount = dispatchEvents.filter((item) => item.ok).length;

  const liveMessages = liveEvents
    .filter((item) => item.type === "message")
    .reduce((total, item) => total + item.count, 0);
  const liveConnects = liveEvents
    .filter((item) => item.type === "connect")
    .reduce((total, item) => total + item.count, 0);
  const liveDisconnects = liveEvents
    .filter((item) => item.type === "disconnect")
    .reduce((total, item) => total + item.count, 0);
  const liveErrors = liveEvents
    .filter((item) => item.type === "error")
    .reduce((total, item) => total + item.count, 0);

  const lastMessageTs = store.live
    .slice()
    .reverse()
    .find((item) => item.type === "message")?.timestamp;

  return {
    generatedAt: new Date().toISOString(),
    windowMinutes: safeWindowMinutes,
    provider: {
      requests: providerEvents.length,
      successRatePct: Number(pct(providerSuccess, providerEvents.length).toFixed(2)),
      errorRatePct: Number(pct(providerFailures, providerEvents.length).toFixed(2)),
      avgLatencyMs: Number(avg(providerLatencies).toFixed(2)),
      modeBreakdown: {
        live: providerLiveCount,
        simulated: providerSimCount,
      },
      lastError: providerLastError,
    },
    alerts: {
      scans: scanEvents.length,
      generated: totalGenerated,
      dispatchBatches: dispatchEvents.length,
      deliverySuccessRatePct: Number(pct(dispatchOkCount, dispatchEvents.length).toFixed(2)),
      dropRatePct: Number((attempted > 0 ? ((attempted - delivered) / attempted) * 100 : 0).toFixed(2)),
      avgDispatchLatencyMs: Number(avg(dispatchLatencies).toFixed(2)),
      attemptedDeliveries: attempted,
      delivered,
    },
    live: {
      events: liveEvents.length,
      messages: liveMessages,
      connections: liveConnects,
      disconnects: liveDisconnects,
      errors: liveErrors,
      lastMessageAt: lastMessageTs ? new Date(lastMessageTs).toISOString() : undefined,
    },
  };
}
