type SloProfile = "latency" | "balanced" | "quality";
type QualityClass = "elite" | "strong" | "moderate" | "weak";

export type StreamTelemetryEvent = {
  id: string;
  timestamp: number;
  userId: string;
  status: "cached" | "fallback-complete" | "complete" | "error";
  tier?: string;
  sloProfile?: SloProfile;
  model?: string;
  preset?: string;
  predictionDomain?: string;
  predictionConfidence?: number;
  qualityScore?: number;
  qualityClass?: QualityClass;
  responseLatencyMs?: number;
  cached?: boolean;
  failedModels?: string[];
  creditsSpent?: number;
  creditsRemaining?: number;
};

export type TelemetrySummary = {
  windowMinutes: number;
  totalEvents: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p99LatencyMs: number;
  avgQualityScore: number;
  qualityDistribution: Record<QualityClass, number>;
  bySloProfile: Record<string, number>;
  byTier: Record<string, number>;
  byModel: Record<string, number>;
  generatedAt: string;
};

const MAX_EVENTS = 20_000;

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_STREAM_TELEMETRY__?: StreamTelemetryEvent[];
  };

  if (!globalRef.__TRADEHAX_STREAM_TELEMETRY__) {
    globalRef.__TRADEHAX_STREAM_TELEMETRY__ = [];
  }

  return globalRef.__TRADEHAX_STREAM_TELEMETRY__;
}

function percentile(values: number[], pct: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((pct / 100) * sorted.length)));
  return sorted[index] ?? 0;
}

export function recordStreamTelemetry(event: Omit<StreamTelemetryEvent, "id" | "timestamp">) {
  const store = getStore();
  store.push({
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: Date.now(),
  });

  if (store.length > MAX_EVENTS) {
    store.splice(0, store.length - MAX_EVENTS);
  }
}

export function getTelemetryEvents(windowMinutes = 60) {
  const store = getStore();
  const cutoff = Date.now() - windowMinutes * 60_000;
  return store.filter((event) => event.timestamp >= cutoff);
}

export function summarizeTelemetry(params?: {
  windowMinutes?: number;
  tier?: string;
  sloProfile?: SloProfile;
  predictionDomain?: string;
}): TelemetrySummary {
  const windowMinutes = Math.max(1, Math.min(24 * 60, params?.windowMinutes || 60));
  const events = getTelemetryEvents(windowMinutes).filter((event) => {
    if (params?.tier && event.tier !== params.tier) return false;
    if (params?.sloProfile && event.sloProfile !== params.sloProfile) return false;
    if (params?.predictionDomain && event.predictionDomain !== params.predictionDomain) return false;
    return true;
  });

  const latencies = events
    .map((event) => event.responseLatencyMs || 0)
    .filter((value) => value > 0);

  const qualityScores = events
    .map((event) => event.qualityScore || 0)
    .filter((value) => value > 0);

  const qualityDistribution: Record<QualityClass, number> = {
    elite: 0,
    strong: 0,
    moderate: 0,
    weak: 0,
  };

  const bySloProfile: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  const byModel: Record<string, number> = {};

  let cacheHits = 0;

  for (const event of events) {
    if (event.cached) cacheHits += 1;
    if (event.qualityClass) qualityDistribution[event.qualityClass] += 1;
    if (event.sloProfile) bySloProfile[event.sloProfile] = (bySloProfile[event.sloProfile] || 0) + 1;
    if (event.tier) byTier[event.tier] = (byTier[event.tier] || 0) + 1;
    if (event.model) byModel[event.model] = (byModel[event.model] || 0) + 1;
  }

  const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const avgQualityScore = qualityScores.length > 0
    ? Math.round((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 100) / 100
    : 0;

  return {
    windowMinutes,
    totalEvents: events.length,
    cacheHitRate: events.length > 0 ? Math.round((cacheHits / events.length) * 10_000) / 100 : 0,
    avgLatencyMs,
    p50LatencyMs: percentile(latencies, 50),
    p90LatencyMs: percentile(latencies, 90),
    p99LatencyMs: percentile(latencies, 99),
    avgQualityScore,
    qualityDistribution,
    bySloProfile,
    byTier,
    byModel,
    generatedAt: new Date().toISOString(),
  };
}
