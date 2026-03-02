"use client";

import {
  applyExperimentRecommendation,
  clearExperimentPolicySwitchEvents,
  clearExperimentSessionRollup,
  clearAssignedExperimentVariant,
  clearExperimentGuardrailEvents,
  clearExperimentRampEvents,
  clearExperimentRolloutTarget,
  EXPERIMENT_POLICY_PROFILES,
  evaluateExperimentDecision,
  getExperimentPolicyAutoswitchEnabled,
  getExperimentPolicyPendingSwitch,
  getExperimentPolicyProfile,
  getExperimentPolicyRegimeState,
  getExperimentPolicySettings,
  getExperimentSessionRollup,
  listExperimentGuardrailEvents,
  listExperimentPolicySwitchEvents,
  listExperimentRampEvents,
  listExperimentRolloutTargets,
  listExperimentNames,
  listAssignedExperimentVariants,
  runExperimentPolicyAutoswitch,
  runExperimentGuardrailAutoRollback,
  runExperimentRampAutopilot,
  setExperimentPolicyAutoswitchEnabled,
  setExperimentPolicyProfile,
  setExperimentRolloutTarget,
  setAssignedExperimentVariant,
  type ExperimentPolicyProfile,
} from "@/lib/experiments";
import { useEffect, useMemo, useState } from "react";

const VARIANTS = ["control", "accelerated"] as const;
const MIN_STRONG_SAMPLE = 25;

interface ReadoutState {
  enabled: boolean;
  policyAutoswitchEnabled: boolean;
  guardrailsEnabled: boolean;
  rampAutopilotEnabled: boolean;
  policyProfile: ExperimentPolicyProfile;
  assigned: ReturnType<typeof listAssignedExperimentVariants>;
  rollout: ReturnType<typeof listExperimentRolloutTargets>;
  rollup: ReturnType<typeof getExperimentSessionRollup>;
  guardrailEvents: ReturnType<typeof listExperimentGuardrailEvents>;
  policySwitchEvents: ReturnType<typeof listExperimentPolicySwitchEvents>;
  policyRegime: ReturnType<typeof getExperimentPolicyRegimeState>;
  policyPending: ReturnType<typeof getExperimentPolicyPendingSwitch>;
  rampEvents: ReturnType<typeof listExperimentRampEvents>;
}

const DEBUG_STORAGE_KEY = "thx-exp-debug";
const GUARDRAILS_STORAGE_KEY = "thx-exp-guardrails-enabled";
const RAMP_AUTOPILOT_STORAGE_KEY = "thx-exp-ramp-autopilot-enabled";

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
    policyAutoswitchEnabled: false,
    guardrailsEnabled: false,
    rampAutopilotEnabled: false,
    policyProfile: "balanced",
    assigned: {},
    rollout: {},
    rollup: {},
    guardrailEvents: [],
    policySwitchEvents: [],
    policyRegime: null,
    policyPending: null,
    rampEvents: [],
  });

  useEffect(() => {
    const enabled = resolveDebugEnabled();
    if (!enabled) {
      return;
    }

    const refresh = () => {
      const guardrailsEnabled =
        typeof window !== "undefined" && window.localStorage.getItem(GUARDRAILS_STORAGE_KEY) === "1";
      const rampAutopilotEnabled =
        typeof window !== "undefined" && window.localStorage.getItem(RAMP_AUTOPILOT_STORAGE_KEY) === "1";
      const policyAutoswitchEnabled = getExperimentPolicyAutoswitchEnabled();
      const currentPolicyProfile = getExperimentPolicyProfile();

      const rollupSnapshot = getExperimentSessionRollup();

      if (policyAutoswitchEnabled) {
        runExperimentPolicyAutoswitch(rollupSnapshot);
      }

      const policyProfile = getExperimentPolicyProfile();

      if (guardrailsEnabled) {
        runExperimentGuardrailAutoRollback(rollupSnapshot, { clearCurrentAssignment: true, profile: policyProfile });
      }

      if (rampAutopilotEnabled) {
        runExperimentRampAutopilot(rollupSnapshot, { clearCurrentAssignment: true, profile: policyProfile });
      }

      setState({
        enabled,
        policyAutoswitchEnabled,
        guardrailsEnabled,
        rampAutopilotEnabled,
        policyProfile,
        assigned: listAssignedExperimentVariants(),
        rollout: listExperimentRolloutTargets(),
        rollup: rollupSnapshot,
        guardrailEvents: listExperimentGuardrailEvents(),
        policySwitchEvents: listExperimentPolicySwitchEvents(),
        policyRegime: getExperimentPolicyRegimeState(),
        policyPending: getExperimentPolicyPendingSwitch(),
        rampEvents: listExperimentRampEvents(),
      });
    };

    refresh();
    const intervalId = window.setInterval(refresh, 1500);
    return () => window.clearInterval(intervalId);
  }, []);

  const experimentNames = useMemo(() => {
    const names = new Set<string>([
      ...listExperimentNames(),
      ...Object.keys(state.assigned),
      ...Object.keys(state.rollup),
    ]);
    return Array.from(names);
  }, [state.assigned, state.rollup]);

  const refreshReadout = () => {
    const guardrailsEnabled =
      typeof window !== "undefined" && window.localStorage.getItem(GUARDRAILS_STORAGE_KEY) === "1";
    const rampAutopilotEnabled =
      typeof window !== "undefined" && window.localStorage.getItem(RAMP_AUTOPILOT_STORAGE_KEY) === "1";
    const policyAutoswitchEnabled = getExperimentPolicyAutoswitchEnabled();
    const rollupSnapshot = getExperimentSessionRollup();

    if (policyAutoswitchEnabled) {
      runExperimentPolicyAutoswitch(rollupSnapshot);
    }

    const policyProfile = getExperimentPolicyProfile();

    if (guardrailsEnabled) {
      runExperimentGuardrailAutoRollback(rollupSnapshot, { clearCurrentAssignment: true, profile: policyProfile });
    }

    if (rampAutopilotEnabled) {
      runExperimentRampAutopilot(rollupSnapshot, { clearCurrentAssignment: true, profile: policyProfile });
    }

    setState((previous) => ({
      ...previous,
      policyAutoswitchEnabled,
      guardrailsEnabled,
      rampAutopilotEnabled,
      policyProfile,
      assigned: listAssignedExperimentVariants(),
      rollout: listExperimentRolloutTargets(),
      rollup: rollupSnapshot,
      guardrailEvents: listExperimentGuardrailEvents(),
      policySwitchEvents: listExperimentPolicySwitchEvents(),
      policyRegime: getExperimentPolicyRegimeState(),
      policyPending: getExperimentPolicyPendingSwitch(),
      rampEvents: listExperimentRampEvents(),
    }));
  };

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
            onClick={() => {
              const nextEnabled = !state.rampAutopilotEnabled;
              if (typeof window !== "undefined") {
                window.localStorage.setItem(RAMP_AUTOPILOT_STORAGE_KEY, nextEnabled ? "1" : "0");
              }

              setState((previous) => ({ ...previous, rampAutopilotEnabled: nextEnabled }));
              refreshReadout();
            }}
            className="rounded border border-emerald-400/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200 hover:text-white"
          >
            ramp {state.rampAutopilotEnabled ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => {
              const nextEnabled = !state.guardrailsEnabled;
              if (typeof window !== "undefined") {
                window.localStorage.setItem(GUARDRAILS_STORAGE_KEY, nextEnabled ? "1" : "0");
              }

              setState((previous) => ({ ...previous, guardrailsEnabled: nextEnabled }));
              refreshReadout();
            }}
            className="rounded border border-amber-400/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200 hover:text-white"
          >
            guardrails {state.guardrailsEnabled ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const payload = {
                generatedAt: new Date().toISOString(),
                assigned: state.assigned,
                rollout: state.rollout,
                profile: state.policyProfile,
                policyAutoswitchEnabled: state.policyAutoswitchEnabled,
                rollup: state.rollup,
                guardrailEvents: state.guardrailEvents,
                policySwitchEvents: state.policySwitchEvents,
                policyRegime: state.policyRegime,
                policyPending: state.policyPending,
                rampEvents: state.rampEvents,
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
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Policy Profile</p>
          <div className="mb-1 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                const nextEnabled = !state.policyAutoswitchEnabled;
                setExperimentPolicyAutoswitchEnabled(nextEnabled);
                setState((previous) => ({ ...previous, policyAutoswitchEnabled: nextEnabled }));
                refreshReadout();
              }}
              className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                state.policyAutoswitchEnabled
                  ? "border-fuchsia-400/40 text-fuchsia-200"
                  : "border-white/15 text-zinc-400 hover:text-white"
              }`}
            >
              autoswitch {state.policyAutoswitchEnabled ? "on" : "off"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {EXPERIMENT_POLICY_PROFILES.map((profile) => {
              const selected = state.policyProfile === profile;
              return (
                <button
                  key={profile}
                  type="button"
                  onClick={() => {
                    setExperimentPolicyProfile(profile, "manual");
                    setState((previous) => ({ ...previous, policyProfile: profile }));
                    refreshReadout();
                  }}
                  className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    selected
                      ? "border-cyan-400/40 text-cyan-200"
                      : "border-white/15 text-zinc-400 hover:text-white"
                  }`}
                >
                  {profile}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">
            min sample {getExperimentPolicySettings(state.policyProfile).minRequiredPerVariant} ·
            Δ threshold {getExperimentPolicySettings(state.policyProfile).minDeltaPoints.toFixed(1)} pts
          </p>
          {state.policyRegime ? (
            <p className="mt-1 text-[10px] text-zinc-500">
              regime Δ~{state.policyRegime.smoothedAbsDeltaCvrPoints.toFixed(2)} · coverage~
              {(state.policyRegime.smoothedCoverage * 100).toFixed(0)}% · samples {state.policyRegime.sampleCount}
            </p>
          ) : null}
          {state.policyPending ? (
            <p className="mt-1 text-[10px] text-zinc-500">
              pending {state.policyPending.pendingProfile} · confirm {state.policyPending.confirmationCount}/
              {state.policyPending.requiredConfirmations}
            </p>
          ) : null}
        </section>

        <section>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Policy Feed</p>
            <button
              type="button"
              onClick={() => {
                clearExperimentPolicySwitchEvents();
                refreshReadout();
              }}
              className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              clear
            </button>
          </div>
          <div className="space-y-1">
            {state.policySwitchEvents.length === 0 ? (
              <p className="text-xs text-zinc-500">No policy switches triggered.</p>
            ) : (
              state.policySwitchEvents.slice(0, 5).map((entry) => (
                <div key={`${entry.timestamp}:${entry.previousProfile}:${entry.nextProfile}`} className="rounded border border-white/10 bg-black/30 px-2 py-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-300">
                    <span>{entry.previousProfile} → {entry.nextProfile}</span>
                    <span>coverage {(entry.sufficientCoverage * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    smooth Δ {entry.smoothedAbsDeltaCvrPoints.toFixed(2)} · smooth cov {(entry.smoothedCoverage * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-zinc-500">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Assignments</p>
          <div className="space-y-1">
            {experimentNames.map((name) => {
              const typedName = name as keyof typeof state.assigned;
              const assignedVariant = state.assigned[typedName];
              const rolloutTarget = state.rollout[name as keyof typeof state.rollout];

              return (
                <div key={name} className="rounded border border-white/10 bg-white/[0.02] px-2 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-200">{name}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                      {assignedVariant ?? "unassigned"}
                    </span>
                  </div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">
                    rollout accelerated: {rolloutTarget ?? 50}%
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignedExperimentVariant(name as Parameters<typeof setAssignedExperimentVariant>[0], "control");
                        refreshReadout();
                      }}
                      className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300 hover:text-white"
                    >
                      control
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignedExperimentVariant(
                          name as Parameters<typeof setAssignedExperimentVariant>[0],
                          "accelerated",
                        );
                        refreshReadout();
                      }}
                      className="rounded border border-cyan-400/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200 hover:text-white"
                    >
                      accelerated
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAssignedExperimentVariant(name as Parameters<typeof clearAssignedExperimentVariant>[0]);
                        refreshReadout();
                      }}
                      className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                    >
                      auto
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {[10, 25, 50, 75, 100].map((target) => (
                      <button
                        key={`${name}:rollout:${target}`}
                        type="button"
                        onClick={() => {
                          setExperimentRolloutTarget(
                            name as Parameters<typeof setExperimentRolloutTarget>[0],
                            target,
                          );
                          refreshReadout();
                        }}
                        className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                      >
                        {target}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        clearExperimentRolloutTarget(name as Parameters<typeof clearExperimentRolloutTarget>[0]);
                        refreshReadout();
                      }}
                      className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white"
                    >
                      clear ramp
                    </button>
                  </div>
                </div>
              );
            })}
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
                const typedName = name as Parameters<typeof evaluateExperimentDecision>[0];
                const decision = evaluateExperimentDecision(typedName, state.rollup, { profile: state.policyProfile });

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
                  decision.recommendation === "promote_accelerated"
                    ? "Promote accelerated"
                    : decision.recommendation === "keep_control"
                      ? "Keep control"
                      : decision.recommendation === "insufficient_data"
                        ? "Need more data"
                        : rateDelta > 0.1
                          ? "Accelerated leads"
                          : rateDelta < -0.1
                            ? "Control leads"
                            : "Too close to call";

                const confidenceLabel = bothStrongSample
                  ? `sample: strong · ${decision.confidence}`
                  : `sample: warming up · ${decision.confidence}`;

                return (
                  <article key={name} className="rounded border border-white/10 bg-white/[0.02] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] text-zinc-200">{name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{leaderLabel}</p>
                    </div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">{confidenceLabel}</div>
                    <div className="mb-2 text-[10px] text-zinc-400">
                      ΔCVR {decision.deltaCvrPoints >= 0 ? "+" : ""}
                      {decision.deltaCvrPoints.toFixed(2)} pts · z={decision.zScore.toFixed(2)}
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          applyExperimentRecommendation(decision, {
                            clearCurrentAssignment: true,
                            profile: state.policyProfile,
                          });
                          refreshReadout();
                        }}
                        className="rounded border border-cyan-400/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200 hover:text-white"
                      >
                        apply recommendation
                      </button>
                    </div>
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

        <section>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Guardrail Feed</p>
            <button
              type="button"
              onClick={() => {
                clearExperimentGuardrailEvents();
                refreshReadout();
              }}
              className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              clear
            </button>
          </div>
          <div className="space-y-1">
            {state.guardrailEvents.length === 0 ? (
              <p className="text-xs text-zinc-500">No rollback actions triggered.</p>
            ) : (
              state.guardrailEvents.slice(0, 5).map((entry) => (
                <div key={`${entry.experiment}:${entry.timestamp}`} className="rounded border border-white/10 bg-black/30 px-2 py-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-300">
                    <span>{entry.experiment}</span>
                    <span>{entry.previousRollout}% → {entry.nextRollout}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Ramp Feed</p>
            <button
              type="button"
              onClick={() => {
                clearExperimentRampEvents();
                refreshReadout();
              }}
              className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              clear
            </button>
          </div>
          <div className="space-y-1">
            {state.rampEvents.length === 0 ? (
              <p className="text-xs text-zinc-500">No ramp actions triggered.</p>
            ) : (
              state.rampEvents.slice(0, 5).map((entry) => (
                <div key={`${entry.experiment}:${entry.timestamp}`} className="rounded border border-white/10 bg-black/30 px-2 py-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-300">
                    <span>{entry.experiment}</span>
                    <span>{entry.previousRollout}% → {entry.nextRollout}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
