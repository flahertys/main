"use client";

/**
 * BacktestResults — complete results display including equity curve, stats, trade log, and monthly heatmap.
 */

import { useState } from "react";
import { Download } from "lucide-react";
import { BacktestStats } from "./BacktestStats";
import { EquityCurve } from "./EquityCurve";
import { TradeLog } from "./TradeLog";
import type { BacktestResult } from "@/types/trading";

// ─── Monthly heatmap ──────────────────────────────────────────────────────────

function MonthlyHeatmap({ result }: { result: BacktestResult }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const byYearMonth: Record<string, number> = {};
  for (const mr of result.monthlyReturns) {
    byYearMonth[`${mr.year}-${mr.month}`] = mr.returnPct;
  }

  const years = [...new Set(result.monthlyReturns.map((r) => r.year))].sort();

  function cellColor(ret: number | undefined) {
    if (ret === undefined) return "bg-muted/20";
    if (ret >= 10) return "bg-green-600";
    if (ret >= 5) return "bg-green-500";
    if (ret >= 2) return "bg-green-400/80";
    if (ret >= 0) return "bg-green-300/50";
    if (ret >= -5) return "bg-red-300/60";
    if (ret >= -10) return "bg-red-500/80";
    return "bg-red-600";
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-muted-foreground pr-2">Year</th>
            {months.map((m) => (
              <th key={m} className="text-muted-foreground text-center w-8">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className="text-muted-foreground pr-2 font-medium">{year}</td>
              {Array.from({ length: 12 }, (_, i) => {
                const ret = byYearMonth[`${year}-${i + 1}`];
                return (
                  <td
                    key={i}
                    className={`w-8 h-6 rounded text-center font-mono ${cellColor(ret)} ${ret !== undefined ? "text-white" : "text-muted-foreground"}`}
                    title={ret !== undefined ? `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%` : "No data"}
                  >
                    {ret !== undefined ? (ret >= 0 ? `+${Math.round(ret)}` : Math.round(ret)) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BacktestResultsProps {
  result: BacktestResult;
}

/**
 * Full backtest results display with tabbed sections.
 */
export function BacktestResults({ result }: BacktestResultsProps) {
  const [tab, setTab] = useState<"chart" | "trades" | "heatmap">("chart");

  function handleExport() {
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeSymbol = result.config.symbol.replace(/[^a-zA-Z0-9-]/g, "");
    const safeRange = result.config.timeRange.replace(/[^a-zA-Z0-9-]/g, "");
    a.download = `backtest-${safeSymbol}-${safeRange}-${result.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <BacktestStats stats={result.stats} />

      {/* Tab header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 border-b border-border/40">
          {(["chart", "trades", "heatmap"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={tab === t}
            >
              {t === "chart" ? "Equity Curve" : t === "trades" ? "Trade Log" : "Monthly Heatmap"}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export JSON
        </button>
      </div>

      {/* Tab content */}
      {tab === "chart" && (
        <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
          <EquityCurve data={result.equityCurve} />
        </div>
      )}

      {tab === "trades" && <TradeLog trades={result.trades} />}

      {tab === "heatmap" && (
        <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
          <MonthlyHeatmap result={result} />
        </div>
      )}
    </div>
  );
}
