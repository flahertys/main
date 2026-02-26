"use client";

import { BrainCircuit, ShieldAlert, Target } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubSessionDriftGovernorProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubSessionDriftGovernor({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubSessionDriftGovernorProps) {
  const [ruleViolations, setRuleViolations] = useState("2");
  const [impulseEntries, setImpulseEntries] = useState("3");
  const [focusScore, setFocusScore] = useState("64");
  const [fatigueScore, setFatigueScore] = useState("52");

  const drift = useMemo(() => {
    const violations = Number(ruleViolations || "0");
    const impulses = Number(impulseEntries || "0");
    const focus = Number(focusScore || "0");
    const fatigue = Number(fatigueScore || "0");

    const driftRaw =
      violations * 13 +
      impulses * 9 +
      (100 - focus) * 0.42 +
      fatigue * 0.35 +
      (riskStance === "aggressive" ? 7 : 0) +
      (marketRegime === "MIXED" ? 5 : 0);

    const driftIndex = clamp(Math.round(driftRaw), 0, 100);

    const governorState =
      driftIndex >= 78
        ? "LOCKDOWN"
        : driftIndex >= 55
          ? "THROTTLE"
          : "STABLE";

    const protocol =
      governorState === "LOCKDOWN"
        ? [
            "Stop discretionary entries for 30 minutes.",
            "Permit only pre-defined A+ setups with half size.",
            "Run reset routine: breathing + checklist + invalidation review.",
          ]
        : governorState === "THROTTLE"
          ? [
              "Reduce trade frequency and enforce one-trade cooldown.",
              "Require checklist confirmation before each entry.",
              "Cap risk per position at 0.5x normal size.",
            ]
          : [
              "Session behavior stable.",
              "Maintain current process discipline.",
              "Recheck drift after each 3 trades.",
            ];

    return {
      violations,
      impulses,
      focus,
      fatigue,
      driftIndex,
      governorState,
      protocol,
    };
  }, [ruleViolations, impulseEntries, focusScore, fatigueScore, riskStance, marketRegime]);

  const buildBrief = () => {
    const lines = [
      "SESSION_DRIFT_GOVERNOR_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `RULE_VIOLATIONS: ${drift.violations}`,
      `IMPULSE_ENTRIES: ${drift.impulses}`,
      `FOCUS_SCORE_0_TO_100: ${drift.focus}`,
      `FATIGUE_SCORE_0_TO_100: ${drift.fatigue}`,
      `SESSION_DRIFT_INDEX_0_TO_100: ${drift.driftIndex}`,
      `GOVERNOR_STATE: ${drift.governorState}`,
      "TEMP_BEHAVIOR_PROTOCOL:",
      ...drift.protocol.map((step, index) => `${index + 1}. ${step}`),
      "UNMET_DEMAND_COVERAGE: Real-time behavioral drift control + anti-revenge-trading throttle + fatigue-aware session governance.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-indigo-400/20 bg-[rgba(10,12,24,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-indigo-200">Session Drift Governor</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Drift {drift.driftIndex}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Detects behavioral degradation mid-session and enforces anti-tilt protocols before capital damage compounds.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={ruleViolations}
          onChange={(event) => setRuleViolations(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-indigo-300/60"
          placeholder="Rule violations"
        />
        <input
          value={impulseEntries}
          onChange={(event) => setImpulseEntries(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-indigo-300/60"
          placeholder="Impulse entries"
        />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <div>
          <label className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="focus-score-range">
            <span>Focus score</span>
            <span>{drift.focus}%</span>
          </label>
          <input
            id="focus-score-range"
            type="range"
            min={0}
            max={100}
            value={drift.focus}
            onChange={(event) => setFocusScore(event.target.value)}
            className="w-full accent-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="fatigue-score-range">
            <span>Fatigue score</span>
            <span>{drift.fatigue}%</span>
          </label>
          <input
            id="fatigue-score-range"
            type="range"
            min={0}
            max={100}
            value={drift.fatigue}
            onChange={(event) => setFatigueScore(event.target.value)}
            className="w-full accent-indigo-400"
          />
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-3.5 w-3.5 text-indigo-300" />
          <span>Governor state: {drift.governorState}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-cyan-300" />
          <span>Rule violations: {drift.violations} • Impulses: {drift.impulses}</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
          <ul className="space-y-0.5 text-zinc-200">
            {drift.protocol.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildBrief())}
          className="rounded-full border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-indigo-100"
        >
          Insert Drift Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save Drift Memory
        </button>
      </div>
    </div>
  );
}
