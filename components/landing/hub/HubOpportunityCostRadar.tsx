"use client";

import { BarChart3, Compass, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubOpportunityCostRadarProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubOpportunityCostRadar({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubOpportunityCostRadarProps) {
  const [currentSetupExpectedR, setCurrentSetupExpectedR] = useState("1.2");
  const [bestAlternativeExpectedR, setBestAlternativeExpectedR] = useState("2.1");
  const [probabilityCurrentPct, setProbabilityCurrentPct] = useState("54");
  const [probabilityAlternativePct, setProbabilityAlternativePct] = useState("62");

  const radar = useMemo(() => {
    const currentR = Number(currentSetupExpectedR || "0");
    const altR = Number(bestAlternativeExpectedR || "0");
    const pCurrent = Number(probabilityCurrentPct || "0") / 100;
    const pAlt = Number(probabilityAlternativePct || "0") / 100;

    const evCurrent = currentR * pCurrent;
    const evAlt = altR * pAlt;
    const evGap = evAlt - evCurrent;

    const rawCost =
      evGap * 55 +
      (marketRegime === "MIXED" ? 8 : 0) +
      (riskStance === "aggressive" ? 6 : 0);

    const opportunityCostIndex = clamp(Math.round(rawCost * 10), 0, 100);

    const recommendation =
      opportunityCostIndex >= 70
        ? "SKIP_CURRENT_SETUP"
        : opportunityCostIndex >= 45
          ? "DEFER_AND_RECHECK"
          : "CURRENT_SETUP_ACCEPTABLE";

    const protocol =
      recommendation === "SKIP_CURRENT_SETUP"
        ? [
            "Skip current setup and queue alternative candidate.",
            "Reallocate risk budget to higher-EV setup only.",
            "Do not trade until EV gap narrows below threshold.",
          ]
        : recommendation === "DEFER_AND_RECHECK"
          ? [
              "Wait one confirmation cycle before committing.",
              "Recompute EV delta using updated volatility.",
              "Proceed only if current setup quality improves.",
            ]
          : [
              "Opportunity cost acceptable.",
              "Current setup can be executed with standard controls.",
              "Monitor alternatives in parallel for rotation.",
            ];

    return {
      currentR,
      altR,
      pCurrent,
      pAlt,
      evCurrent,
      evAlt,
      evGap,
      opportunityCostIndex,
      recommendation,
      protocol,
    };
  }, [currentSetupExpectedR, bestAlternativeExpectedR, probabilityCurrentPct, probabilityAlternativePct, marketRegime, riskStance]);

  const buildBrief = () => {
    const lines = [
      "OPPORTUNITY_COST_RADAR_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `CURRENT_SETUP_EXPECTED_R: ${radar.currentR.toFixed(2)}`,
      `BEST_ALTERNATIVE_EXPECTED_R: ${radar.altR.toFixed(2)}`,
      `CURRENT_SETUP_PROBABILITY: ${(radar.pCurrent * 100).toFixed(0)}%`,
      `ALTERNATIVE_PROBABILITY: ${(radar.pAlt * 100).toFixed(0)}%`,
      `EV_CURRENT: ${radar.evCurrent.toFixed(2)}`,
      `EV_ALTERNATIVE: ${radar.evAlt.toFixed(2)}`,
      `EV_GAP: ${radar.evGap.toFixed(2)}`,
      `OPPORTUNITY_COST_INDEX_0_TO_100: ${radar.opportunityCostIndex}`,
      `RECOMMENDATION: ${radar.recommendation}`,
      "OPPORTUNITY_PROTOCOL:",
      ...radar.protocol.map((step, index) => `${index + 1}. ${step}`),
      "UNMET_DEMAND_COVERAGE: EV-aware setup ranking + alternative-path recommendation + anti-mediocre-entry filter.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-sky-400/20 bg-[rgba(8,14,24,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-sky-200">Opportunity Cost Radar</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Cost {radar.opportunityCostIndex}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Prevents low-EV entries by comparing your current setup against the best available alternative.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={currentSetupExpectedR}
          onChange={(event) => setCurrentSetupExpectedR(event.target.value.replace(/[^\d.]/g, "").slice(0, 4))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-sky-300/60"
          placeholder="Current setup R"
        />
        <input
          value={bestAlternativeExpectedR}
          onChange={(event) => setBestAlternativeExpectedR(event.target.value.replace(/[^\d.]/g, "").slice(0, 4))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-sky-300/60"
          placeholder="Best alternative R"
        />
        <input
          value={probabilityCurrentPct}
          onChange={(event) => setProbabilityCurrentPct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-sky-300/60"
          placeholder="Current probability %"
        />
        <input
          value={probabilityAlternativePct}
          onChange={(event) => setProbabilityAlternativePct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-sky-300/60"
          placeholder="Alternative probability %"
        />
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-sky-300" />
          <span>EV current: {radar.evCurrent.toFixed(2)} • EV alt: {radar.evAlt.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          <span>EV gap: {radar.evGap.toFixed(2)} • Recommendation: {radar.recommendation}</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <Compass className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
          <ul className="space-y-0.5 text-zinc-200">
            {radar.protocol.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildBrief())}
          className="rounded-full border border-sky-300/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-sky-100"
        >
          Insert Cost Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save Cost Memory
        </button>
      </div>
    </div>
  );
}
