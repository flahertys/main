"use client";

import { AlertTriangle, Gauge, Timer } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubExecutionLatencyGuardProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubExecutionLatencyGuard({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubExecutionLatencyGuardProps) {
  const [expectedLatencyMs, setExpectedLatencyMs] = useState("120");
  const [observedLatencyMs, setObservedLatencyMs] = useState("280");
  const [spreadBps, setSpreadBps] = useState("16");
  const [slippageBps, setSlippageBps] = useState("22");
  const [orderBookDepthScore, setOrderBookDepthScore] = useState("58");

  const metrics = useMemo(() => {
    const expected = Number(expectedLatencyMs || "0");
    const observed = Number(observedLatencyMs || "0");
    const spread = Number(spreadBps || "0");
    const slippage = Number(slippageBps || "0");
    const depth = Number(orderBookDepthScore || "0");

    const latencyMultiple = expected > 0 ? observed / expected : 0;
    const dragRaw =
      latencyMultiple * 22 +
      spread * 1.1 +
      slippage * 1.25 +
      (100 - depth) * 0.55 +
      (riskStance === "aggressive" ? 8 : 0) +
      (marketRegime === "MIXED" ? 6 : 0);

    const dragIndex = clamp(Math.round(dragRaw), 0, 100);
    const guardStatus = dragIndex >= 75 ? "BLOCK_EXECUTION" : dragIndex >= 50 ? "THROTTLE_EXECUTION" : "EXECUTION_CLEAR";

    const protocol =
      guardStatus === "BLOCK_EXECUTION"
        ? [
            "Pause market orders and switch to passive limit logic.",
            "Cut size by 50% until latency normalizes.",
            "Require spread + slippage recheck before any entry.",
          ]
        : guardStatus === "THROTTLE_EXECUTION"
          ? [
              "Reduce execution speed and size by 25%.",
              "Allow only A+ setups with tighter invalidation.",
              "Re-run latency guard every 3 entries.",
            ]
          : [
              "Execution conditions acceptable.",
              "Maintain current playbook risk sizing.",
              "Keep monitoring latency drift in-session.",
            ];

    return {
      expected,
      observed,
      spread,
      slippage,
      depth,
      latencyMultiple,
      dragIndex,
      guardStatus,
      protocol,
    };
  }, [expectedLatencyMs, observedLatencyMs, spreadBps, slippageBps, orderBookDepthScore, riskStance, marketRegime]);

  const buildBrief = () => {
    const lines = [
      "EXECUTION_LATENCY_GUARD_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `EXPECTED_LATENCY_MS: ${metrics.expected.toFixed(0)}`,
      `OBSERVED_LATENCY_MS: ${metrics.observed.toFixed(0)}`,
      `LATENCY_MULTIPLE: ${metrics.latencyMultiple.toFixed(2)}x`,
      `SPREAD_BPS: ${metrics.spread.toFixed(1)}`,
      `SLIPPAGE_BPS: ${metrics.slippage.toFixed(1)}`,
      `ORDER_BOOK_DEPTH_0_TO_100: ${metrics.depth.toFixed(0)}`,
      `EXECUTION_DRAG_INDEX_0_TO_100: ${metrics.dragIndex}`,
      `GUARD_STATUS: ${metrics.guardStatus}`,
      "TEMP_EXECUTION_PROTOCOL:",
      ...metrics.protocol.map((step, index) => `${index + 1}. ${step}`),
      "UNMET_DEMAND_COVERAGE: Real-time execution friction gating + slippage-aware risk throttle + anti-latency overtrading control.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-rose-400/20 bg-[rgba(24,10,12,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-rose-200">Execution Latency Guard</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Drag {metrics.dragIndex}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Protects users when execution quality degrades — a hidden edge most competitors ignore.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={expectedLatencyMs}
          onChange={(event) => setExpectedLatencyMs(event.target.value.replace(/\D/g, "").slice(0, 5))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-rose-300/60"
          placeholder="Expected latency ms"
        />
        <input
          value={observedLatencyMs}
          onChange={(event) => setObservedLatencyMs(event.target.value.replace(/\D/g, "").slice(0, 5))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-rose-300/60"
          placeholder="Observed latency ms"
        />
        <input
          value={spreadBps}
          onChange={(event) => setSpreadBps(event.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-rose-300/60"
          placeholder="Spread bps"
        />
        <input
          value={slippageBps}
          onChange={(event) => setSlippageBps(event.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-rose-300/60"
          placeholder="Slippage bps"
        />
      </div>

      <div className="mt-2">
        <label className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="order-book-depth-range">
          <span>Order book depth</span>
          <span>{metrics.depth.toFixed(0)}%</span>
        </label>
        <input
          id="order-book-depth-range"
          type="range"
          min={0}
          max={100}
          value={metrics.depth}
          onChange={(event) => setOrderBookDepthScore(event.target.value)}
          className="w-full accent-rose-400"
        />
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <Timer className="h-3.5 w-3.5 text-rose-300" />
          <span>Latency multiple: {metrics.latencyMultiple.toFixed(2)}x</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-cyan-300" />
          <span>Status: {metrics.guardStatus}</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
          <ul className="space-y-0.5 text-zinc-200">
            {metrics.protocol.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildBrief())}
          className="rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-rose-100"
        >
          Insert Guard Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save Guard Memory
        </button>
      </div>
    </div>
  );
}
