"use client";

import { useEffect, useMemo, useState } from "react";

type ScoreboardResponse = {
  ok: boolean;
  telemetry?: {
    totalRequests: number;
    domains: Array<{
      domain: "stock" | "crypto" | "kalshi" | "general";
      requests: number;
      avgConfidence: number;
      fallbackRate: number;
      providers: {
        huggingface: number;
        kernel: number;
      };
      models: Array<{
        model: string;
        requests: number;
      }>;
    }>;
  };
  recommendations?: Record<string, string>;
  dataIntegrity?: {
    algorithm?: string;
    trainFileSha256?: string | null;
    externalDatasets?: boolean;
  };
};

export function ModelScoreboardPanel() {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/ai/model-scoreboard", { cache: "no-store" });
        const body = (await res.json()) as ScoreboardResponse;
        if (!res.ok || !body.ok) {
          throw new Error("Unable to load model scoreboard.");
        }
        if (!ignore) {
          setData(body);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load model scoreboard");
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const domains = useMemo(() => data?.telemetry?.domains || [], [data]);

  return (
    <div className="theme-panel p-6 sm:p-8 mb-12">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Model Performance Scoreboard</h2>
          <p className="text-xs text-zinc-300 mt-1">
            Cross-domain health for stock, crypto, Kalshi, and general routes.
          </p>
        </div>
        <div className="text-xs text-cyan-200/80 border border-cyan-500/20 rounded px-2 py-1 bg-cyan-600/10">
          Requests: {data?.telemetry?.totalRequests ?? 0}
        </div>
      </div>

      {error ? (
        <div className="rounded border border-rose-500/30 bg-rose-600/20 px-3 py-2 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        {domains.map((entry) => (
          <div key={entry.domain} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-cyan-100 uppercase tracking-wide text-sm">{entry.domain}</h3>
              <span className="text-[11px] text-zinc-300">{entry.requests} req</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
              <MetricChip label="Avg confidence" value={`${entry.avgConfidence}%`} tone={entry.avgConfidence >= 70 ? "good" : "mid"} />
              <MetricChip label="Fallback" value={`${entry.fallbackRate}%`} tone={entry.fallbackRate <= 20 ? "good" : "warn"} />
              <MetricChip
                label="HF ratio"
                value={`${entry.requests > 0 ? Math.round((entry.providers.huggingface / entry.requests) * 100) : 0}%`}
                tone="mid"
              />
            </div>

            <div className="text-[11px] text-zinc-300 space-y-1">
              <p>
                <span className="text-zinc-400">Recommended model:</span>{" "}
                <span className="text-emerald-200">{data?.recommendations?.[entry.domain] || "n/a"}</span>
              </p>
              <p>
                <span className="text-zinc-400">Top observed model:</span>{" "}
                <span className="text-cyan-200">{entry.models[0]?.model || "no traffic yet"}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded border border-emerald-500/20 bg-emerald-600/10 p-3 text-xs text-emerald-100/85">
        <p className="font-semibold">Data Integrity</p>
        <p className="mt-1">
          Algorithm: {data?.dataIntegrity?.algorithm || "n/a"} • External datasets: {data?.dataIntegrity?.externalDatasets ? "enabled" : "disabled"}
        </p>
        <p className="mt-1 break-all text-emerald-100/70">Hash: {data?.dataIntegrity?.trainFileSha256 || "not available"}</p>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "mid" | "warn";
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
      : tone === "warn"
        ? "border-rose-400/30 bg-rose-500/20 text-rose-100"
        : "border-cyan-400/30 bg-cyan-500/20 text-cyan-100";

  return (
    <div className={`rounded border px-2 py-1 ${toneClasses}`}>
      <div className="opacity-80">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
