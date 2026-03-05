"use client";

/**
 * /trading/sentiment — Market Sentiment Engine page.
 * Displays the Fear & Greed gauge, per-asset scores, and live event feed.
 */

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { SentimentGauge } from "@/components/trading/SentimentGauge";
import { SentimentFeed } from "@/components/trading/SentimentFeed";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { useSentimentStream } from "@/hooks/use-sentiment-stream";

// ─── Asset tabs ───────────────────────────────────────────────────────────────

const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL"] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GaugeSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-slate-800/50 border border-slate-700/30 p-6 flex flex-col items-center gap-4">
      <div className="w-48 h-48 rounded-full bg-slate-700/40" />
      <div className="w-32 h-4 rounded bg-slate-700/40" />
      <div className="grid grid-cols-3 gap-2 w-full">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded bg-slate-700/30" />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SentimentPage() {
  const [symbols] = useState(DEFAULT_SYMBOLS.join(","));
  const { snapshot, loading, error, refresh, lastUpdated } = useSentimentStream({
    symbols,
    pollIntervalMs: 60_000,
  });

  const handleRefresh = useCallback(() => refresh(), [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-2">
              Sentiment Engine
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Real-time Fear &amp; Greed analysis aggregated from social, news, and on-chain signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh sentiment data"
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error} — displaying last known data.
          </div>
        )}

        {/* Market gauge + per-asset gauges */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Overall Market Sentiment</h2>

          {loading && !snapshot ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => <GaugeSkeleton key={i} />)}
            </div>
          ) : snapshot ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Market-wide gauge */}
              <div className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-6 flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  All Markets
                </p>
                <SentimentGauge data={snapshot.market} size={180} showBreakdown />
              </div>

              {/* Per-asset gauges */}
              {snapshot.assets.map((asset) => (
                <div
                  key={asset.symbol}
                  className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-6 flex flex-col items-center"
                >
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    {asset.symbol}
                  </p>
                  <SentimentGauge data={asset} size={180} showBreakdown />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Live event feed */}
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Live Signal Feed</h2>

          {loading && !snapshot ? (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-slate-800/40 border border-slate-700/20" />
              ))}
            </div>
          ) : snapshot ? (
            <SentimentFeed events={snapshot.recentEvents} maxEvents={20} />
          ) : null}
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}
