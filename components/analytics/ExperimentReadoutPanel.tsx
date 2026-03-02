"use client";

import {
  clearExperimentSessionRollup,
  getExperimentSessionRollup,
  listAssignedExperimentVariants,
} from "@/lib/experiments";
import { useEffect, useMemo, useState } from "react";

const VARIANTS = ["control", "accelerated"] as const;
const MIN_STRONG_SAMPLE = 25;

interface ReadoutState {
  enabled: boolean;
  assigned: ReturnType<typeof listAssignedExperimentVariants>;
  rollup: ReturnType<typeof getExperimentSessionRollup>;
}

const DEBUG_STORAGE_KEY = "thx-exp-debug";

function getDebugEnabledFromUrl(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const value = new URLSearchParams(window.location.search).get("exp_debug");
  return value === "1" || value === "true";
}

function resolveDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const queryEnabled = getDebugEnabledFromUrl();
  if (queryEnabled) {
    try {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures.
    }
    return true;
  }

  try {
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function ExperimentReadoutPanel() {
  const [state, setState] = useState<ReadoutState>({
    enabled: false,
    assigned: {},
    rollup: {},
  });

  useEffect(() => {
    const enabled = resolveDebugEnabled();
    if (!enabled) {
      return;
    }

    const refresh = () => {
      setState({
        enabled,
        assigned: listAssignedExperimentVariants(),
        rollup: getExperimentSessionRollup(),
      });
    };

    refresh();
    const intervalId = window.setInterval(refresh, 1500);
    return () => window.clearInterval(intervalId);
  }, []);

  const experimentNames = useMemo(() => {
    const names = new Set<string>([...Object.keys(state.assigned), ...Object.keys(state.rollup)]);
    return Array.from(names);
  }, [state.assigned, state.rollup]);

  if (!state.enabled) {
    return null;
  }

  return (
    <aside className="fixed bottom-3 right-3 z-[70] w-[340px] max-h-[70vh] overflow-hidden rounded-xl border border-cyan-400/30 bg-black/95 shadow-2xl shadow-cyan-500/20">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Experiment Readout</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={async () => {
              const payload = {
                generatedAt: new Date().toISOString(),
                assigned: state.assigned,
                rollup: state.rollup,
              };

              const json = JSON.stringify(payload, null, 2);

              if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                try {
                  await navigator.clipboard.writeText(json);
                } catch {
                  // Ignore clipboard failures.
                }
              }
            }}
            className="rounded border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 hover:text-white"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={() => {
              clearExperimentSessionRollup();
              setState((previous) => ({ ...previous, rollup: {} }));
            }}
            className="rounded border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto p-3">
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Assignments</p>
          <div className="space-y-1">
            {Object.entries(state.assigned).length === 0 ? (
              <p className="text-xs text-zinc-500">No experiment assignments detected yet.</p>
            ) : (
              Object.entries(state.assigned).map(([name, variant]) => (
                <div key={name} className="flex items-center justify-between rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                  <span className="text-[11px] text-zinc-200">{name}</span>
                  <span className="text-[11px] font-semibold text-cyan-300">{variant}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Session Results</p>
          <div className="space-y-2">
            {experimentNames.length === 0 ? (
              <p className="text-xs text-zinc-500">Waiting for exposure and goal events…</p>
            ) : (
              experimentNames.map((name) => {
                const byVariant = state.rollup[name as keyof typeof state.rollup] ?? {};
                const control = byVariant.control;
                const accelerated = byVariant.accelerated;

                const controlRate = control?.exposureCount
                  ? (control.goalCount / control.exposureCount) * 100
                  : 0;
                const acceleratedRate = accelerated?.exposureCount
                  ? (accelerated.goalCount / accelerated.exposureCount) * 100
                  : 0;

                const rateDelta = acceleratedRate - controlRate;
                const bothStrongSample =
                  (control?.exposureCount ?? 0) >= MIN_STRONG_SAMPLE &&
                  (accelerated?.exposureCount ?? 0) >= MIN_STRONG_SAMPLE;

                const leaderLabel =
                  rateDelta > 0.1
                    ? "Accelerated leads"
                    : rateDelta < -0.1
                      ? "Control leads"
                      : "Too close to call";

                const confidenceLabel = bothStrongSample
                  ? "sample: strong"
                  : "sample: warming up";

                return (
                  <article key={name} className="rounded border border-white/10 bg-white/[0.02] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] text-zinc-200">{name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{leaderLabel}</p>
                    </div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">{confidenceLabel}</div>
                    <div className="space-y-1.5">
                      {VARIANTS.map((variant) => {
                        const entry = byVariant[variant];
                        const exposureCount = entry?.exposureCount ?? 0;
                        const goalCount = entry?.goalCount ?? 0;
                        const weightedGoalValue = entry?.weightedGoalValue ?? 0;
                        const conversionRate = exposureCount ? ((goalCount / exposureCount) * 100).toFixed(1) : "0.0";

                        return (
                          <div
                            key={`${name}:${variant}`}
                            className="grid grid-cols-2 gap-1 rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-zinc-300"
                          >
                            <span className="font-semibold text-zinc-100">{variant}</span>
                            <span>Exposures: {exposureCount}</span>
                            <span>Goals: {goalCount}</span>
                            <span>CVR: {conversionRate}%</span>
                            <span>Value: {weightedGoalValue}</span>
                            <span>
                              VPE: {exposureCount ? (weightedGoalValue / exposureCount).toFixed(2) : "0.00"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
