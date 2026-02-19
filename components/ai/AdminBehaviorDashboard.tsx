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

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/admin/behavior?includePersisted=1&recordLimit=250", {
        headers: {
          "x-tradehax-admin-key": adminKey,
        },
      });
      const json = (await response.json()) as DashboardPayload;
      setPayload(json);
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
        </div>
      )}
    </section>
  );
}
