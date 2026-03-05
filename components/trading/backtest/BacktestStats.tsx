"use client";

/**
 * BacktestStats — key performance metric cards.
 */

import type { BacktestStats as IBacktestStats } from "@/types/trading";

const ms = (ms: number) => {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days > 1) return `${days}d`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  return `${hours}h`;
};

interface BacktestStatsProps {
  stats: IBacktestStats;
}

function MetricCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean | null;
}) {
  const colorClass =
    positive === true
      ? "text-green-400"
      : positive === false
        ? "text-red-400"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xl font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
  );
}

/**
 * Grid of key backtest performance metrics.
 */
export function BacktestStats({ stats }: BacktestStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetricCard
        label="Total Return"
        value={`${stats.totalReturnPct >= 0 ? "+" : ""}${stats.totalReturnPct.toFixed(2)}%`}
        positive={stats.totalReturnPct >= 0}
      />
      <MetricCard
        label="vs Buy & Hold"
        value={`${stats.benchmarkReturnPct >= 0 ? "+" : ""}${stats.benchmarkReturnPct.toFixed(2)}%`}
        positive={stats.benchmarkReturnPct >= 0}
      />
      <MetricCard
        label="Sharpe Ratio"
        value={stats.sharpeRatio.toFixed(2)}
        positive={stats.sharpeRatio >= 1 ? true : stats.sharpeRatio <= 0 ? false : null}
      />
      <MetricCard
        label="Max Drawdown"
        value={`-${stats.maxDrawdownPct.toFixed(2)}%`}
        positive={stats.maxDrawdownPct < 15 ? true : stats.maxDrawdownPct > 40 ? false : null}
      />
      <MetricCard
        label="Win Rate"
        value={`${stats.winRatePct.toFixed(1)}%`}
        positive={stats.winRatePct >= 50}
      />
      <MetricCard
        label="Total Trades"
        value={String(stats.totalTrades)}
        positive={null}
      />
      <MetricCard
        label="Profit Factor"
        value={stats.profitFactor.toFixed(2)}
        positive={stats.profitFactor >= 1.5 ? true : stats.profitFactor < 1 ? false : null}
      />
      <MetricCard
        label="Avg Duration"
        value={ms(stats.avgTradeDurationMs)}
        positive={null}
      />
    </div>
  );
}
