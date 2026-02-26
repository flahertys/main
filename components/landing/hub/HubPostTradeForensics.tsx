"use client";

import { Activity, Brain, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubPostTradeForensicsProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubPostTradeForensics({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubPostTradeForensicsProps) {
  const [tradeOutcomeUsd, setTradeOutcomeUsd] = useState("-180");
  const [maxAdverseExcursionPct, setMaxAdverseExcursionPct] = useState("2.2");
  const [planAdherence, setPlanAdherence] = useState("58");
  const [emotionalControl, setEmotionalControl] = useState("49");
  const [slippageBps, setSlippageBps] = useState("18");
  const [note, setNote] = useState("");

  const analysis = useMemo(() => {
    const outcome = Number(tradeOutcomeUsd || "0");
    const mae = Number(maxAdverseExcursionPct || "0");
    const adherence = clamp(Number(planAdherence || "0"), 0, 100);
    const control = clamp(Number(emotionalControl || "0"), 0, 100);
    const slippage = Number(slippageBps || "0");

    const disciplineScore = clamp(
      Math.round(adherence * 0.45 + control * 0.35 + Math.max(0, 100 - slippage) * 0.2),
      0,
      100,
    );

    const rootCause =
      adherence < 55
        ? "Plan drift"
        : control < 55
          ? "Emotional override"
          : slippage > 25
            ? "Execution friction"
            : mae > 3
              ? "Invalidation too loose"
              : "Execution mostly valid";

    const recoveryMode =
      outcome < 0 && disciplineScore < 60
        ? "RESET_PROTOCOL"
        : outcome < 0
          ? "CALIBRATE_PROTOCOL"
          : "COMPOUND_PROTOCOL";

    const recoverySteps =
      recoveryMode === "RESET_PROTOCOL"
        ? [
            "Pause for one full session and ban revenge entries.",
            "Cut next-trade risk by 35% and require checklist signoff.",
            "Replay failed setup with strict invalidation and one alternative exit.",
          ]
        : recoveryMode === "CALIBRATE_PROTOCOL"
          ? [
              "Keep strategy, reduce size by 20% for next 3 trades.",
              "Tighten trigger quality filter to A+ only.",
              "Log execution latency and slippage before any scale-up.",
            ]
          : [
              "Maintain risk size; avoid confidence creep.",
              "Document what repeated edge looked like in this regime.",
              "Pre-commit profit-protection and review after session close.",
            ];

    return {
      outcome,
      mae,
      adherence,
      control,
      slippage,
      disciplineScore,
      rootCause,
      recoveryMode,
      recoverySteps,
    };
  }, [tradeOutcomeUsd, maxAdverseExcursionPct, planAdherence, emotionalControl, slippageBps]);

  const buildForensicsBrief = () => {
    const lines = [
      "POST_TRADE_FORENSICS_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `OUTCOME_USD: ${analysis.outcome.toFixed(2)}`,
      `MAX_ADVERSE_EXCURSION_PCT: ${analysis.mae.toFixed(2)}%`,
      `PLAN_ADHERENCE_0_TO_100: ${analysis.adherence}`,
      `EMOTIONAL_CONTROL_0_TO_100: ${analysis.control}`,
      `SLIPPAGE_BPS: ${analysis.slippage.toFixed(0)}`,
      `DISCIPLINE_SCORE_0_TO_100: ${analysis.disciplineScore}`,
      `ROOT_CAUSE: ${analysis.rootCause}`,
      `RECOVERY_MODE: ${analysis.recoveryMode}`,
      "RECOVERY_STEPS:",
      ...analysis.recoverySteps.map((step, idx) => `${idx + 1}. ${step}`),
      note.trim() ? `NOTE: ${note.trim()}` : "NOTE: None",
      "UNMET_DEMAND_COVERAGE: Root-cause attribution + recovery protocol generation + behavior memory loop.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-[rgba(8,16,20,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-200">Forensics Autopilot · Post-Trade Recovery</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Score {analysis.disciplineScore}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Convert every trade into a structured diagnosis and recovery plan — not just journaling noise.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={tradeOutcomeUsd}
          onChange={(event) => setTradeOutcomeUsd(event.target.value.replace(/[^\d.-]/g, "").slice(0, 12))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          placeholder="Trade outcome USD"
        />
        <input
          value={maxAdverseExcursionPct}
          onChange={(event) => setMaxAdverseExcursionPct(event.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          placeholder="Max adverse excursion %"
        />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <label className="rounded-md border border-white/10 bg-black/35 px-2 py-1">
          <span className="text-[9px] font-mono uppercase text-zinc-400">Plan adherence {analysis.adherence}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={analysis.adherence}
            onChange={(event) => setPlanAdherence(event.target.value)}
            className="mt-1 w-full accent-cyan-400"
          />
        </label>

        <label className="rounded-md border border-white/10 bg-black/35 px-2 py-1">
          <span className="text-[9px] font-mono uppercase text-zinc-400">Emotional control {analysis.control}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={analysis.control}
            onChange={(event) => setEmotionalControl(event.target.value)}
            className="mt-1 w-full accent-cyan-400"
          />
        </label>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-[140px_1fr]">
        <input
          value={slippageBps}
          onChange={(event) => setSlippageBps(event.target.value.replace(/\D/g, "").slice(0, 5))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          placeholder="Slippage bps"
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 180))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          placeholder="Optional context note"
        />
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="flex flex-wrap items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-300" />
          <span className="font-mono uppercase text-zinc-400">Root cause:</span>
          <span className="text-cyan-100">{analysis.rootCause}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-fuchsia-300" />
          <span className="font-mono uppercase text-zinc-400">Recovery mode:</span>
          <span className="text-fuchsia-100">{analysis.recoveryMode}</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
          <ul className="space-y-0.5 text-zinc-200">
            {analysis.recoverySteps.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildForensicsBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Insert Forensics Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildForensicsBrief())}
          className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100"
        >
          Save Recovery Memory
        </button>
      </div>
    </div>
  );
}
