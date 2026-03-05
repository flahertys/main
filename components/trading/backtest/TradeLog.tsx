"use client";

/**
 * TradeLog — scrollable table of individual backtest trades.
 */

import type { BacktestTrade } from "@/types/trading";

interface TradeLogProps {
  trades: BacktestTrade[];
}

function formatDuration(ms: number) {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  return `${hours}h`;
}

/**
 * Scrollable table showing every simulated trade with P&L and duration.
 */
export function TradeLog({ trades }: TradeLogProps) {
  if (trades.length === 0) {
    return <p className="text-sm text-muted-foreground">No trades executed in this backtest.</p>;
  }

  return (
    <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-border/30">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr>
            {["#", "Entry Date", "Exit Date", "Entry $", "Exit $", "P&L", "P&L %", "Duration", "Signal"].map((h) => (
              <th key={h} className="text-left px-2 py-2 text-muted-foreground font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => (
            <tr key={trade.id} className="border-t border-border/20 hover:bg-muted/20 transition-colors">
              <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                {new Date(trade.entryTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                {new Date(trade.exitTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </td>
              <td className="px-2 py-1.5 font-mono">${trade.entryPrice.toLocaleString()}</td>
              <td className="px-2 py-1.5 font-mono">${trade.exitPrice.toLocaleString()}</td>
              <td className={`px-2 py-1.5 font-mono font-semibold ${trade.pnlUsd >= 0 ? "text-green-400" : "text-red-400"}`}>
                {trade.pnlUsd >= 0 ? "+" : ""}${trade.pnlUsd.toFixed(2)}
              </td>
              <td className={`px-2 py-1.5 font-mono ${trade.pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {trade.pnlPct >= 0 ? "+" : ""}{trade.pnlPct.toFixed(2)}%
              </td>
              <td className="px-2 py-1.5 text-muted-foreground">{formatDuration(trade.durationMs)}</td>
              <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[120px]">{trade.signalReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
