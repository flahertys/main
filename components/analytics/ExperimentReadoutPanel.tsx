"use client";

import {
  clearExperimentSessionRollup,
  getExperimentSessionRollup,
  listAssignedExperimentVariants,
} from "@/lib/experiments";
import { useEffect, useMemo, useState } from "react";

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

  const rows = useMemo(() => Object.entries(state.rollup), [state.rollup]);

  if (!state.enabled) {
    return null;
  }

  return (
    <aside className="fixed bottom-3 right-3 z-[70] w-[340px] max-h-[70vh] overflow-hidden rounded-xl border border-cyan-400/30 bg-black/95 shadow-2xl shadow-cyan-500/20">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Experiment Readout</p>
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
            {rows.length === 0 ? (
              <p className="text-xs text-zinc-500">Waiting for exposure and goal events…</p>
            ) : (
              rows.map(([name, entry]) => {
                if (!entry) {
                  return null;
                }

                const conversionRate = entry.exposureCount
                  ? ((entry.goalCount / entry.exposureCount) * 100).toFixed(1)
                  : "0.0";

                return (
                  <article key={name} className="rounded border border-white/10 bg-white/[0.02] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] text-zinc-200">{name}</p>
                      <p className="text-[11px] font-semibold text-cyan-300">{entry.variant}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-300">
                      <span>Exposures: {entry.exposureCount}</span>
                      <span>Goals: {entry.goalCount}</span>
                      <span>CVR: {conversionRate}%</span>
                      <span>Value: {entry.weightedGoalValue}</span>
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
