"use client";

import { Activity, ShieldX, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubCapitalPreservationCircuitProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubCapitalPreservationCircuit({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubCapitalPreservationCircuitProps) {
  const [dailyDrawdownPct, setDailyDrawdownPct] = useState("2.4");
  const [maxAllowedDrawdownPct, setMaxAllowedDrawdownPct] = useState("4.0");
  const [lossStreakCount, setLossStreakCount] = useState("3");
  const [avgPlanAdherencePct, setAvgPlanAdherencePct] = useState("68");

  const circuit = useMemo(() => {
    const drawdown = Number(dailyDrawdownPct || "0");
    const maxDrawdown = Number(maxAllowedDrawdownPct || "0");
    const streak = Number(lossStreakCount || "0");
    const adherence = Number(avgPlanAdherencePct || "0");

    const drawdownRatio = maxDrawdown > 0 ? drawdown / maxDrawdown : 0;
    const stressRaw =
      drawdownRatio * 45 +
      streak * 10 +
      (100 - adherence) * 0.42 +
      (riskStance === "aggressive" ? 6 : 0) +
      (marketRegime === "BEARISH" ? 7 : 0);

    const preservationStress = clamp(Math.round(stressRaw), 0, 100);

    const circuitState =
      preservationStress >= 80 || drawdownRatio >= 1
        ? "HARD_STOP"
        : preservationStress >= 55
          ? "SOFT_LIMIT"
          : "CAPITAL_SAFE";

    const protocol =
      circuitState === "HARD_STOP"
        ? [
            "Disable new entries for the rest of session.",
            "Perform structured post-mortem before next session.",
            "Reset max risk to 0.25x baseline tomorrow.",
          ]
        : circuitState === "SOFT_LIMIT"
          ? [
              "Cut position size by 40%.",
              "Only trade top-tier setups with checklist pass.",
              "Stop after next loss to prevent cascade.",
            ]
          : [
              "Capital condition healthy.",
              "Continue with standard risk protocol.",
              "Re-evaluate after each closed trade block.",
            ];

    return {
      drawdown,
      maxDrawdown,
      streak,
      adherence,
      drawdownRatio,
      preservationStress,
      circuitState,
      protocol,
    };
  }, [dailyDrawdownPct, maxAllowedDrawdownPct, lossStreakCount, avgPlanAdherencePct, riskStance, marketRegime]);

  const buildBrief = () => {
    const lines = [
      "CAPITAL_PRESERVATION_CIRCUIT_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `DAILY_DRAWDOWN_PERCENT: ${circuit.drawdown.toFixed(2)}%`,
      `MAX_ALLOWED_DRAWDOWN_PERCENT: ${circuit.maxDrawdown.toFixed(2)}%`,
      `DRAWDOWN_RATIO: ${circuit.drawdownRatio.toFixed(2)}x`,
      `LOSS_STREAK: ${circuit.streak}`,
      `PLAN_ADHERENCE_PERCENT: ${circuit.adherence.toFixed(0)}%`,
      `PRESERVATION_STRESS_INDEX_0_TO_100: ${circuit.preservationStress}`,
      `CIRCUIT_STATE: ${circuit.circuitState}`,
      "CAPITAL_PROTOCOL:",
      ...circuit.protocol.map((step, index) => `${index + 1}. ${step}`),
      "UNMET_DEMAND_COVERAGE: Real-time drawdown governance + streak-based kill switch + disciplined capital protection automation.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-emerald-400/20 bg-[rgba(8,20,14,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-200">Capital Preservation Circuit</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Stress {circuit.preservationStress}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Prevents drawdown spirals with automated hard-stop and soft-limit governance.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={dailyDrawdownPct}
          onChange={(event) => setDailyDrawdownPct(event.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Daily drawdown %"
        />
        <input
          value={maxAllowedDrawdownPct}
          onChange={(event) => setMaxAllowedDrawdownPct(event.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Max allowed drawdown %"
        />
        <input
          value={lossStreakCount}
          onChange={(event) => setLossStreakCount(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Loss streak"
        />
        <input
          value={avgPlanAdherencePct}
          onChange={(event) => setAvgPlanAdherencePct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Plan adherence %"
        />
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-emerald-300" />
          <span>State: {circuit.circuitState}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-300" />
          <span>Drawdown ratio: {circuit.drawdownRatio.toFixed(2)}x • Streak: {circuit.streak}</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <ShieldX className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
          <ul className="space-y-0.5 text-zinc-200">
            {circuit.protocol.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildBrief())}
          className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100"
        >
          Insert Circuit Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save Circuit Memory
        </button>
      </div>
    </div>
  );
}
