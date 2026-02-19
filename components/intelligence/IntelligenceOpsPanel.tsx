"use client";

import { formatDateTime } from "@/lib/intelligence/format";
import { IntelligenceLiveEvent, IntelligenceLiveStatus, IntelligenceSlaMetrics } from "@/lib/intelligence/types";
import { useEffect, useMemo, useRef, useState } from "react";

type MetricsResponse = {
  ok: boolean;
  metrics?: IntelligenceSlaMetrics;
  error?: string;
};

type LiveStatusResponse = {
  ok: boolean;
  live?: IntelligenceLiveStatus;
  error?: string;
};

function formatPct(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}%`;
}

function formatMs(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}ms`;
}

export function IntelligenceOpsPanel() {
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [metrics, setMetrics] = useState<IntelligenceSlaMetrics | null>(null);
  const [liveStatus, setLiveStatus] = useState<IntelligenceLiveStatus | null>(null);
  const [liveEvents, setLiveEvents] = useState<IntelligenceLiveEvent[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  const liveSummary = useMemo(() => {
    const flow = liveEvents.filter((item) => item.type === "flow").length;
    const dark = liveEvents.filter((item) => item.type === "dark_pool").length;
    const news = liveEvents.filter((item) => item.type === "news").length;
    return { flow, dark, news };
  }, [liveEvents]);

  function pushLiveEvent(event: IntelligenceLiveEvent) {
    setLiveEvents((prev) => {
      const next = [event, ...prev];
      return next.slice(0, 120);
    });
  }

  async function loadMetrics() {
    const response = await fetch(`/api/intelligence/metrics?windowMinutes=${windowMinutes}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as MetricsResponse;
    if (!response.ok || !payload.ok || !payload.metrics) {
      throw new Error(payload.error || "Failed to load SLA metrics.");
    }
    setMetrics(payload.metrics);
  }

  async function loadLiveStatus() {
    const response = await fetch("/api/intelligence/live/status", {
      cache: "no-store",
    });
    const payload = (await response.json()) as LiveStatusResponse;
    if (!response.ok || !payload.ok || !payload.live) {
      throw new Error(payload.error || "Failed to load live status.");
    }
    setLiveStatus(payload.live);
  }

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadMetrics(), loadLiveStatus()]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load operations data.");
    } finally {
      setLoading(false);
    }
  }

  function connectStream() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const source = new EventSource("/api/intelligence/live/stream");
    eventSourceRef.current = source;

    source.addEventListener("open", () => {
      setStreamConnected(true);
    });

    source.addEventListener("event", (event) => {
      try {
        const parsed = JSON.parse(event.data) as IntelligenceLiveEvent;
        pushLiveEvent(parsed);
      } catch {
        // Ignore malformed event payload.
      }
    });

    source.addEventListener("status", (event) => {
      try {
        const parsed = JSON.parse(event.data) as IntelligenceLiveStatus;
        setLiveStatus(parsed);
      } catch {
        // Ignore malformed status payload.
      }
    });

    source.addEventListener("error", () => {
      setStreamConnected(false);
    });
  }

  useEffect(() => {
    void refresh();
    connectStream();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    void loadMetrics().catch(() => {
      // No-op, refresh flow handles error UI.
    });
  }, [windowMinutes]);

  return (
    <section className="theme-panel p-5 sm:p-6">
      <p className="theme-kicker mb-2">Phase 4 Ops</p>
      <h2 className="theme-title text-2xl mb-2">Live Ingestion + SLA Metrics</h2>
      <p className="text-sm text-[#a8bfd1] mb-5">
        Track provider latency, alert delivery quality, and live intraday ingestion health.
      </p>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Window (min)
          <select
            value={windowMinutes}
            onChange={(event) => setWindowMinutes(Number.parseInt(event.target.value, 10))}
            className="mt-2 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          >
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={240}>240</option>
            <option value={720}>720</option>
          </select>
        </label>
        <button type="button" onClick={() => void refresh()} className="theme-cta theme-cta--loud">
          {loading ? "Refreshing..." : "Refresh Metrics"}
        </button>
        <button type="button" onClick={connectStream} className="theme-cta theme-cta--secondary">
          Reconnect Stream
        </button>
        <span className="text-xs text-[#8ea8be] uppercase tracking-[0.2em]">
          Stream: {streamConnected ? "connected" : "disconnected"}
        </span>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8ea8be]">Provider Success</p>
          <p className="text-xl font-semibold text-white mt-2">
            {formatPct(metrics?.provider.successRatePct ?? 0)}
          </p>
          <p className="text-xs text-[#8ea8be] mt-1">{metrics?.provider.requests ?? 0} requests</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8ea8be]">Provider Latency</p>
          <p className="text-xl font-semibold text-white mt-2">
            {formatMs(metrics?.provider.avgLatencyMs ?? 0)}
          </p>
          <p className="text-xs text-[#8ea8be] mt-1">
            live {metrics?.provider.modeBreakdown.live ?? 0} / simulated{" "}
            {metrics?.provider.modeBreakdown.simulated ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8ea8be]">Alert Drop Rate</p>
          <p className="text-xl font-semibold text-white mt-2">{formatPct(metrics?.alerts.dropRatePct ?? 0)}</p>
          <p className="text-xs text-[#8ea8be] mt-1">
            delivered {metrics?.alerts.delivered ?? 0}/{metrics?.alerts.attemptedDeliveries ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8ea8be]">Dispatch Latency</p>
          <p className="text-xl font-semibold text-white mt-2">
            {formatMs(metrics?.alerts.avgDispatchLatencyMs ?? 0)}
          </p>
          <p className="text-xs text-[#8ea8be] mt-1">{metrics?.alerts.dispatchBatches ?? 0} batches</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Live Health</h3>
          <div className="space-y-2 text-sm text-[#b7c9d7]">
            <p>Enabled: {liveStatus?.enabled ? "yes" : "no"}</p>
            <p>Connected: {liveStatus?.connected ? "yes" : "no"}</p>
            <p>Provider: {liveStatus?.provider || "disabled"}</p>
            <p>Reconnects: {liveStatus?.reconnectCount ?? 0}</p>
            <p>Received Events: {liveStatus?.receivedEvents ?? 0}</p>
            <p>Flow/Dark/News Stream Events: {liveSummary.flow}/{liveSummary.dark}/{liveSummary.news}</p>
            <p>Last Message: {liveStatus?.lastMessageAt ? formatDateTime(liveStatus.lastMessageAt) : "none"}</p>
            {liveStatus?.lastError ? <p>Last Error: {liveStatus.lastError}</p> : null}
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Recent Stream Events</h3>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {liveEvents.map((event) => (
              <div key={`${event.seq}-${event.type}`} className="rounded border border-white/10 px-3 py-2">
                <div className="text-xs text-[#8ea8be] uppercase tracking-[0.2em]">
                  #{event.seq} {event.type} {event.symbol ? `• ${event.symbol}` : ""}
                </div>
                <div className="text-sm text-white mt-1">{event.summary}</div>
                <div className="text-[11px] text-[#8ea8be] mt-1">{formatDateTime(event.timestamp)}</div>
              </div>
            ))}
            {liveEvents.length === 0 ? (
              <p className="text-sm text-[#8ea8be]">No stream events yet. Connect live websocket feed to populate.</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
