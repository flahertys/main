"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TelemetrySummary = {
  windowMinutes: number;
  totalEvents: number;
  cacheHitRate: number;
  sloFallbackRate: number;
  sloFallbackCount: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p99LatencyMs: number;
  avgQualityScore: number;
  qualityDistribution: Record<"elite" | "strong" | "moderate" | "weak", number>;
  bySloProfile: Record<string, number>;
  byTier: Record<string, number>;
  byModel: Record<string, number>;
  generatedAt: string;
};

const emptySummary: TelemetrySummary = {
  windowMinutes: 60,
  totalEvents: 0,
  cacheHitRate: 0,
  sloFallbackRate: 0,
  sloFallbackCount: 0,
  avgLatencyMs: 0,
  p50LatencyMs: 0,
  p90LatencyMs: 0,
  p99LatencyMs: 0,
  avgQualityScore: 0,
  qualityDistribution: { elite: 0, strong: 0, moderate: 0, weak: 0 },
  bySloProfile: {},
  byTier: {},
  byModel: {},
  generatedAt: "",
};

export default function AIHubAnalyticsPage() {
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<TelemetrySummary>(emptySummary);

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/ai/telemetry/summary?windowMinutes=${windowMinutes}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to load telemetry summary");
      }
      setSummary(data.summary as TelemetrySummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown telemetry error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, [windowMinutes]);

  const topModels = useMemo(
    () => Object.entries(summary.byModel).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [summary.byModel],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-200/75">AI Ops</p>
            <h1 className="text-3xl font-bold text-cyan-100">Telemetry Analytics</h1>
            <p className="mt-1 text-sm text-zinc-300">Live stream quality, latency, cache, and SLO performance.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(Number(e.target.value))}
              title="Telemetry window"
              aria-label="Telemetry window"
              className="rounded-lg border border-cyan-400/35 bg-black/45 px-3 py-2 text-sm text-cyan-100"
            >
              <option value={15}>15m</option>
              <option value={60}>1h</option>
              <option value={180}>3h</option>
              <option value={720}>12h</option>
              <option value={1440}>24h</option>
            </select>
            <button
              type="button"
              onClick={() => void fetchSummary()}
              className="rounded-lg border border-emerald-400/35 bg-emerald-500/25 px-3 py-2 text-sm font-semibold text-emerald-100"
            >
              Refresh
            </button>
            <Link
              href="/ai-hub#ai-chat-stream"
              className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white"
            >
              Back to Hub
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-500/35 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total events" value={String(summary.totalEvents)} />
          <MetricCard label="Cache hit rate" value={`${summary.cacheHitRate.toFixed(2)}%`} />
          <MetricCard label="SLO fallback rate" value={`${summary.sloFallbackRate.toFixed(2)}%`} />
          <MetricCard label="SLO fallback count" value={String(summary.sloFallbackCount)} />
          <MetricCard label="Avg quality" value={summary.avgQualityScore.toFixed(2)} />
          <MetricCard label="Avg latency" value={`${summary.avgLatencyMs}ms`} />
          <MetricCard label="p50 latency" value={`${summary.p50LatencyMs}ms`} />
          <MetricCard label="p90 latency" value={`${summary.p90LatencyMs}ms`} />
          <MetricCard label="p99 latency" value={`${summary.p99LatencyMs}ms`} />
          <MetricCard label="Window" value={`${summary.windowMinutes}m`} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <DistributionCard title="Quality distribution" entries={Object.entries(summary.qualityDistribution)} />
          <DistributionCard title="SLO profile mix" entries={Object.entries(summary.bySloProfile)} />
          <DistributionCard title="Tier mix" entries={Object.entries(summary.byTier)} />
        </div>

        <div className="mt-6 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4">
          <h2 className="text-lg font-bold text-cyan-100">Top models (event volume)</h2>
          <div className="mt-3 space-y-2">
            {topModels.length === 0 ? (
              <p className="text-sm text-cyan-100/70">No model telemetry yet in this time window.</p>
            ) : (
              topModels.map(([model, count]) => {
                const pct = summary.totalEvents > 0 ? Math.round((count / summary.totalEvents) * 100) : 0;
                return (
                  <div key={model}>
                    <div className="mb-1 flex items-center justify-between text-xs text-cyan-100/85">
                      <span className="truncate pr-2">{model}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <progress
                      value={pct}
                      max={100}
                      aria-label={`${model} share`}
                      className="h-2 w-full overflow-hidden rounded bg-black/40 [&::-webkit-progress-bar]:bg-black/40 [&::-webkit-progress-value]:bg-cyan-400 [&::-moz-progress-bar]:bg-cyan-400"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          {loading ? "Refreshing telemetry…" : `Last updated ${summary.generatedAt ? new Date(summary.generatedAt).toLocaleString() : "n/a"}`}
        </p>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-emerald-200">{value}</p>
    </div>
  );
}

function DistributionCard({ title, entries }: { title: string; entries: Array<[string, number]> }) {
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 p-4">
      <h3 className="text-sm font-semibold text-fuchsia-100">{title}</h3>
      <div className="mt-3 space-y-2">
        {entries.length === 0 ? (
          <p className="text-xs text-fuchsia-100/70">No data</p>
        ) : (
          entries.map(([label, value]) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs text-fuchsia-100/90">
                  <span>{label}</span>
                  <span>{value} ({pct}%)</span>
                </div>
                <progress
                  value={pct}
                  max={100}
                  aria-label={`${label} distribution`}
                  className="h-2 w-full overflow-hidden rounded bg-black/35 [&::-webkit-progress-bar]:bg-black/35 [&::-webkit-progress-value]:bg-fuchsia-400 [&::-moz-progress-bar]:bg-fuchsia-400"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
