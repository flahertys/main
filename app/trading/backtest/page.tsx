"use client";

/**
 * /trading/backtest — Backtesting Sandbox page.
 */

import { useState } from "react";
import { BacktestForm } from "@/components/trading/backtest/BacktestForm";
import { BacktestResults } from "@/components/trading/backtest/BacktestResults";
import type { BacktestConfig, BacktestResult } from "@/types/trading";

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading backtest results">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted/30" />
        ))}
      </div>
      <div className="h-10 w-64 rounded bg-muted/30" />
      <div className="h-64 rounded-xl bg-muted/30" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BacktestPage() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(config: BacktestConfig) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const json = await res.json() as { ok: boolean; data: BacktestResult };
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backtest failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">Backtesting Sandbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate your trading strategy against historical price data. Powered by RSI-based signal generation.
        </p>
      </div>

      {/* Config form */}
      <div className="mb-8 rounded-xl border border-border/40 bg-muted/10 p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Configuration</h2>
        <BacktestForm onSubmit={handleRun} loading={loading} />
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Results */}
      {loading && <Skeleton />}
      {!loading && result && (
        <div className="rounded-xl border border-border/40 bg-muted/10 p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Results — {result.config.symbol} / {result.config.timeRange}
            </h2>
            <span className="text-xs text-muted-foreground">
              Completed {new Date(result.completedAt).toLocaleTimeString()}
            </span>
          </div>
          <BacktestResults result={result} />
        </div>
      )}

      {!loading && !result && !error && (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2 rounded-xl border-2 border-dashed border-border/30">
          <span className="text-3xl">📈</span>
          <p>Configure and run a backtest to see results here.</p>
        </div>
      )}
    </main>
  );
}
