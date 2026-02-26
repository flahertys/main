"use client";

import { ShieldAlert, Target } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubCompetitiveEdgeLabProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubCompetitiveEdgeLab({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubCompetitiveEdgeLabProps) {
  const [accountSize, setAccountSize] = useState("10000");
  const [maxDailyRiskPct, setMaxDailyRiskPct] = useState("2.5");
  const [riskPerTradePct, setRiskPerTradePct] = useState("0.8");
  const [stopDistancePct, setStopDistancePct] = useState("1.2");
  const [confidenceScore, setConfidenceScore] = useState("72");

  const computed = useMemo(() => {
    const account = Number(accountSize || "0");
    const dailyRisk = Number(maxDailyRiskPct || "0");
    const tradeRisk = Number(riskPerTradePct || "0");
    const stopPct = Number(stopDistancePct || "0");
    const confidence = Number(confidenceScore || "0");

    const riskAmount = account * (tradeRisk / 100);
    const dailyLossCap = account * (dailyRisk / 100);
    const positionNotional = stopPct > 0 ? riskAmount / (stopPct / 100) : 0;

    const fomoRaw =
      confidence * 0.45 +
      (tradeRisk > 1.5 ? 14 : 0) +
      (tradeRisk > 2.5 ? 16 : 0) +
      (stopPct < 1 ? 18 : 0) +
      (riskStance === "aggressive" ? 10 : 0) +
      (marketRegime === "MIXED" ? 7 : 0);

    const fomoIndex = clamp(Math.round(fomoRaw), 5, 99);
    const overDailyRisk = tradeRisk >= dailyRisk && dailyRisk > 0;
    const breakerTriggered = fomoIndex >= 70 || overDailyRisk || stopPct <= 0;

    return {
      account,
      dailyRisk,
      tradeRisk,
      stopPct,
      confidence,
      riskAmount,
      dailyLossCap,
      positionNotional,
      fomoIndex,
      breakerTriggered,
      overDailyRisk,
    };
  }, [accountSize, maxDailyRiskPct, riskPerTradePct, stopDistancePct, confidenceScore, riskStance, marketRegime]);

  const buildBrief = () => {
    const actionLine = computed.breakerTriggered
      ? "ACTION: Pause entry, reduce risk-per-trade, and wait for higher-quality confirmation."
      : "ACTION: Proceed only with pre-defined invalidation + post-trade review timer.";

    const lines = [
      "COMPETITIVE_EDGE_EXECUTION_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `ACCOUNT_SIZE: ${computed.account.toFixed(2)}`,
      `DAILY_RISK_CAP_PCT: ${computed.dailyRisk.toFixed(2)}%`,
      `RISK_PER_TRADE_PCT: ${computed.tradeRisk.toFixed(2)}%`,
      `STOP_DISTANCE_PCT: ${computed.stopPct.toFixed(2)}%`,
      `RISK_PER_TRADE_USD: ${computed.riskAmount.toFixed(2)}`,
      `MAX_POSITION_NOTIONAL_USD: ${computed.positionNotional.toFixed(2)}`,
      `FOMO_INDEX_0_TO_100: ${computed.fomoIndex}`,
      `CIRCUIT_BREAKER: ${computed.breakerTriggered ? "TRIGGERED" : "CLEAR"}`,
      actionLine,
      "UNMET_DEMAND_COVERAGE: Pre-trade circuit breaker + explainable risk sizing + emotion-aware execution gate.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-amber-400/20 bg-[rgba(20,14,8,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-200">Edge Lab · Competitor Gap Features</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          FOMO {computed.fomoIndex}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Address unmet trader needs: explainable sizing, emotional risk gating, and a hard pre-trade circuit breaker.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={accountSize}
          onChange={(event) => setAccountSize(event.target.value.replace(/[^\d.]/g, "").slice(0, 12))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-amber-300/60"
          placeholder="Account size"
        />
        <input
          value={maxDailyRiskPct}
          onChange={(event) => setMaxDailyRiskPct(event.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-amber-300/60"
          placeholder="Max daily risk %"
        />
        <input
          value={riskPerTradePct}
          onChange={(event) => setRiskPerTradePct(event.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-amber-300/60"
          placeholder="Risk per trade %"
        />
        <input
          value={stopDistancePct}
          onChange={(event) => setStopDistancePct(event.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-amber-300/60"
          placeholder="Stop distance %"
        />
      </div>

      <div className="mt-2">
        <label className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="edge-confidence-range">
          <span>Execution confidence</span>
          <span>{computed.confidence.toFixed(0)}%</span>
        </label>
        <input
          id="edge-confidence-range"
          type="range"
          min={0}
          max={100}
          value={computed.confidence}
          onChange={(event) => setConfidenceScore(event.target.value)}
          className="w-full accent-amber-400"
        />
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <p className="text-zinc-500">Risk/Trade</p>
            <p className="font-semibold text-amber-100">${computed.riskAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-zinc-500">Daily Loss Cap</p>
            <p className="font-semibold text-amber-100">${computed.dailyLossCap.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-zinc-500">Max Notional</p>
            <p className="font-semibold text-amber-100">${computed.positionNotional.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {computed.breakerTriggered ? (
            <ShieldAlert className="h-3.5 w-3.5 text-rose-300" />
          ) : (
            <Target className="h-3.5 w-3.5 text-emerald-300" />
          )}
          <p className={`font-mono uppercase ${computed.breakerTriggered ? "text-rose-200" : "text-emerald-200"}`}>
            Circuit breaker: {computed.breakerTriggered ? "Triggered" : "Clear"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildBrief())}
          className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-amber-100"
        >
          Insert Edge Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save to Memory
        </button>
      </div>
    </div>
  );
}
