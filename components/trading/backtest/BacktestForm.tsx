"use client";

/**
 * BacktestForm — configuration form for running a backtest.
 */

import { useState } from "react";
import { Play } from "lucide-react";
import { nanoid } from "@/lib/utils";
import type { BacktestConfig } from "@/types/trading";

const SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "ADA"];
const TIME_RANGES = ["1M", "3M", "6M", "1Y"] as const;

interface BacktestFormProps {
  onSubmit: (config: BacktestConfig) => void;
  loading: boolean;
}

/**
 * Form for configuring and submitting a backtest run.
 */
export function BacktestForm({ onSubmit, loading }: BacktestFormProps) {
  const [symbol, setSymbol] = useState("BTC");
  const [timeRange, setTimeRange] = useState<BacktestConfig["timeRange"]>("3M");
  const [capital, setCapital] = useState(10_000);
  const [feePct, setFeePct] = useState(0.1);
  const [slippagePct, setSlippagePct] = useState(0.05);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      id: nanoid(),
      symbol,
      timeRange,
      initialCapital: capital,
      feePct,
      slippagePct,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      {/* Symbol */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="bt-symbol">Asset</label>
        <select
          id="bt-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="text-sm rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Time range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="bt-range">Time Range</label>
        <div className="flex gap-1" role="group" aria-label="Time range">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                timeRange === r
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={timeRange === r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Initial capital */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="bt-capital">Initial Capital ($)</label>
        <input
          id="bt-capital"
          type="number"
          value={capital}
          onChange={(e) => setCapital(Math.max(100, Number(e.target.value)))}
          min={100}
          max={10_000_000}
          className="w-28 text-sm rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Fee */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="bt-fee">Fee (%)</label>
        <input
          id="bt-fee"
          type="number"
          value={feePct}
          onChange={(e) => setFeePct(Math.max(0, Math.min(5, Number(e.target.value))))}
          min={0}
          max={5}
          step={0.01}
          className="w-20 text-sm rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Slippage */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="bt-slip">Slippage (%)</label>
        <input
          id="bt-slip"
          type="number"
          value={slippagePct}
          onChange={(e) => setSlippagePct(Math.max(0, Math.min(2, Number(e.target.value))))}
          min={0}
          max={2}
          step={0.01}
          className="w-20 text-sm rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Run button */}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-semibold text-sm transition-colors disabled:opacity-50"
      >
        <Play className="w-4 h-4" />
        {loading ? "Running…" : "Run Backtest"}
      </button>
    </form>
  );
}
