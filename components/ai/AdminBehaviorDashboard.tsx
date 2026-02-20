"use client";

import { useMemo, useState } from "react";

type MetricPoint = {
  label: string;
  value: number;
};

type DashboardPayload = {
  ok: boolean;
  summary?: {
    acceptedEvents?: number;
    trainingEligibleEvents?: number;
    uniqueProfiles?: number;
  };
  charts?: {
    funnel?: {
      widget_opened: number;
      prompt_sent: number;
      suggestion_clicked: number;
      chat_messages: number;
    };
    topIntents?: MetricPoint[];
    routeHeatmap?: MetricPoint[];
    hourlyTrend?: MetricPoint[];
  };
  error?: string;
};

type BenchmarkStage = {
  id: string;
  title: string;
  score: number;
  targetScore: number;
  status: "not_started" | "in_progress" | "passing";
};

type BenchmarksPayload = {
  ok: boolean;
  snapshot?: {
    overallScore?: number;
    stages?: BenchmarkStage[];
  };
};

type PersonalizationPayload = {
  ok: boolean;
  summary?: {
    profileCount?: number;
    totalTrades?: number;
    winRate?: number;
    avgPnlPercent?: number;
    userLiftEstimate?: number;
    topIndicators?: MetricPoint[];
  };
};

function BarList({ title, data }: { title: string; data: MetricPoint[] }) {
  const max = useMemo(() => Math.max(1, ...data.map((item) => item.value)), [data]);
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-black/35 p-4">
      <h3 className="text-sm font-semibold text-cyan-200">{title}</h3>
      <div className="mt-3 space-y-2">
        {data.length === 0 && <p className="text-xs text-cyan-100/60">No data yet.</p>}
        {data.map((item) => (
          <div key={`${title}-${item.label}`}>
            <div className="mb-1 flex items-center justify-between text-[11px] text-cyan-100/85">
              <span className="truncate pr-2">{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 w-full rounded bg-cyan-500/10">
              <div
                className={`h-2 rounded bg-cyan-400/60 ${
                  item.value / max >= 0.9
                    ? "w-full"
                    : item.value / max >= 0.75
                      ? "w-10/12"
                      : item.value / max >= 0.6
                        ? "w-8/12"
                        : item.value / max >= 0.45
                          ? "w-6/12"
                          : item.value / max >= 0.3
                            ? "w-4/12"
                            : item.value / max >= 0.15
                              ? "w-3/12"
                              : "w-2/12"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminBehaviorDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarksPayload | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationPayload | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const headers = {
        "x-tradehax-admin-key": adminKey,
      };

      const [behaviorResult, benchmarkResult, personalizationResult] = await Promise.allSettled([
        fetch("/api/ai/admin/behavior?includePersisted=1&recordLimit=250", { headers }),
        fetch("/api/ai/admin/benchmarks", { headers }),
        fetch("/api/ai/admin/personalization?limit=200", { headers }),
      ]);

      if (behaviorResult.status === "fulfilled") {
        const behaviorJson = (await behaviorResult.value.json()) as DashboardPayload;
        setPayload(behaviorJson);
      } else {
        setPayload({ ok: false, error: "Unable to load behavior dashboard data." });
      }

      if (benchmarkResult.status === "fulfilled") {
        const benchmarkJson = (await benchmarkResult.value.json()) as BenchmarksPayload;
        setBenchmarks(benchmarkJson);
      } else {
        setBenchmarks({ ok: false });
      }

      if (personalizationResult.status === "fulfilled") {
        const personalizationJson = (await personalizationResult.value.json()) as PersonalizationPayload;
        setPersonalization(personalizationJson);
      } else {
        setPersonalization({ ok: false });
      }
    } catch {
      setPayload({
        ok: false,
        error: "Unable to load dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const funnel = payload?.charts?.funnel;
  const topIntents = payload?.charts?.topIntents || [];
  const routeHeatmap = payload?.charts?.routeHeatmap || [];
  const hourlyTrend = payload?.charts?.hourlyTrend || [];
  const benchmarkStages = benchmarks?.snapshot?.stages || [];
  const topIndicators = personalization?.summary?.topIndicators || [];

  return (
    <section className="rounded-xl border border-violet-500/30 bg-black/40 p-6">
      <h2 className="text-lg font-semibold text-violet-300">Live Behavior Dashboard</h2>
      <p className="mt-2 text-sm text-violet-100/80">
        Enter your admin key to load funnel, route heatmap, and intent trends.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          placeholder="x-tradehax-admin-key"
          className="w-full rounded border border-violet-500/30 bg-black/60 px-3 py-2 text-xs text-violet-100 outline-none placeholder:text-violet-200/40"
        />
        <button
          type="button"
          disabled={loading || adminKey.trim().length === 0}
          onClick={() => {
            void load();
          }}
          className="rounded border border-violet-400/40 bg-violet-500/20 px-4 py-2 text-xs font-semibold text-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load Data"}
        </button>
      </div>

      {payload && !payload.ok && (
        <p className="mt-3 text-xs text-rose-300">{payload.error || "Request failed."}</p>
      )}

      {payload?.ok && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded border border-cyan-500/25 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              <div className="text-cyan-200/80">Accepted Events</div>
              <div className="mt-1 text-lg font-bold">{payload.summary?.acceptedEvents ?? 0}</div>
            </div>
            <div className="rounded border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-100">
              <div className="text-emerald-200/80">Training Eligible</div>
              <div className="mt-1 text-lg font-bold">{payload.summary?.trainingEligibleEvents ?? 0}</div>
            </div>
            <div className="rounded border border-indigo-500/25 bg-indigo-500/10 p-3 text-xs text-indigo-100">
              <div className="text-indigo-200/80">Unique Profiles</div>
              <div className="mt-1 text-lg font-bold">{payload.summary?.uniqueProfiles ?? 0}</div>
            </div>
          </div>

          {funnel && (
            <section className="rounded-xl border border-emerald-500/20 bg-black/35 p-4">
              <h3 className="text-sm font-semibold text-emerald-200">Engagement Funnel</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-emerald-100 sm:grid-cols-4">
                <div className="rounded border border-emerald-500/25 p-2">Widget Opened: {funnel.widget_opened}</div>
                <div className="rounded border border-emerald-500/25 p-2">Prompts Sent: {funnel.prompt_sent}</div>
                <div className="rounded border border-emerald-500/25 p-2">Suggestion Clicks: {funnel.suggestion_clicked}</div>
                <div className="rounded border border-emerald-500/25 p-2">Chat Events: {funnel.chat_messages}</div>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BarList title="Top Intents" data={topIntents} />
            <BarList title="Route Heatmap" data={routeHeatmap} />
            <BarList title="Hourly Trend (UTC)" data={hourlyTrend} />
          </div>

          <section className="rounded-xl border border-fuchsia-500/20 bg-black/35 p-4">
            <h3 className="text-sm font-semibold text-fuchsia-200">Training Benchmarks</h3>
            <div className="mt-2 text-xs text-fuchsia-100/80">
              Overall score: {Math.round((benchmarks?.snapshot?.overallScore || 0) * 100)}%
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {benchmarkStages.length === 0 && <p className="text-xs text-fuchsia-100/60">No benchmark stages yet.</p>}
              {benchmarkStages.map((stage) => {
                const progress = stage.targetScore > 0 ? Math.min(1, stage.score / stage.targetScore) : 0;
                const progressWidthClass =
                  progress >= 0.9
                    ? "w-full"
                    : progress >= 0.8
                      ? "w-10/12"
                      : progress >= 0.7
                        ? "w-9/12"
                        : progress >= 0.6
                          ? "w-8/12"
                          : progress >= 0.5
                            ? "w-7/12"
                            : progress >= 0.4
                              ? "w-6/12"
                              : progress >= 0.3
                                ? "w-4/12"
                                : progress >= 0.2
                                  ? "w-3/12"
                                  : progress >= 0.1
                                    ? "w-2/12"
                                    : "w-1/12";
                return (
                  <div key={stage.id} className="rounded border border-fuchsia-500/25 p-2 text-xs text-fuchsia-100">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate">{stage.title}</span>
                      <span className="uppercase text-[10px] text-fuchsia-200/80">{stage.status}</span>
                    </div>
                    <div className="h-2 rounded bg-fuchsia-500/10">
                      <div className={`h-2 rounded bg-fuchsia-400/70 ${progressWidthClass}`} />
                    </div>
                    <div className="mt-1 text-[10px] text-fuchsia-200/80">
                      {Math.round(stage.score * 100)}% / target {Math.round(stage.targetScore * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-amber-500/20 bg-black/35 p-4">
            <h3 className="text-sm font-semibold text-amber-200">Personalization Lift</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-amber-100 md:grid-cols-5">
              <div className="rounded border border-amber-500/25 p-2">Profiles: {personalization?.summary?.profileCount ?? 0}</div>
              <div className="rounded border border-amber-500/25 p-2">Trades: {personalization?.summary?.totalTrades ?? 0}</div>
              <div className="rounded border border-amber-500/25 p-2">Win Rate: {Math.round((personalization?.summary?.winRate || 0) * 100)}%</div>
              <div className="rounded border border-amber-500/25 p-2">Avg PnL: {(personalization?.summary?.avgPnlPercent || 0).toFixed(2)}%</div>
              <div className="rounded border border-amber-500/25 p-2">Lift: {(personalization?.summary?.userLiftEstimate || 0).toFixed(3)}</div>
            </div>
            <div className="mt-3">
              <BarList title="Top Indicators" data={topIndicators} />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
