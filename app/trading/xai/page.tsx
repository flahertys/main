"use client";

/**
 * /trading/xai — AI Explainability (XAI) Panel page.
 * Let users enter a signal or pick a preset to see a full AI explanation.
 */

import { useState, useCallback } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { SignalExplainer } from "@/components/trading/SignalExplainer";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import type { SignalExplanation, TradingSignal } from "@/types/trading";

// ─── Preset signals ───────────────────────────────────────────────────────────

interface PresetSignal {
  label: string;
  signal: Omit<TradingSignal, "id" | "generatedAt">;
}

const PRESETS: PresetSignal[] = [
  {
    label: "BTC Strong Buy",
    signal: {
      symbol: "BTC",
      action: "buy",
      confidence: 0.87,
      price: 68500,
      targetPrice: 74000,
      stopLoss: 65000,
      timeframe: "4h",
      source: "ai-engine",
      tags: ["momentum", "on-chain"],
    },
  },
  {
    label: "ETH Sell Signal",
    signal: {
      symbol: "ETH",
      action: "sell",
      confidence: 0.72,
      price: 3400,
      targetPrice: 3100,
      stopLoss: 3600,
      timeframe: "1d",
      source: "ai-engine",
      tags: ["overbought", "resistance"],
    },
  },
  {
    label: "SOL Hold",
    signal: {
      symbol: "SOL",
      action: "hold",
      confidence: 0.55,
      price: 145,
      targetPrice: 160,
      stopLoss: 130,
      timeframe: "1h",
      source: "ai-engine",
      tags: ["neutral", "consolidation"],
    },
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ExplainSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-xl bg-slate-800/50 border border-slate-700/20" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-800/40" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-slate-800/40" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function XAIPage() {
  const [explanation, setExplanation] = useState<SignalExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const fetchExplanation = useCallback(async (preset: PresetSignal) => {
    setActivePreset(preset.label);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/signals/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preset.signal,
          id: `preset-${Date.now()}`,
          generatedAt: new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to fetch explanation.");
      }
      setExplanation(json.data as SignalExplanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-2">
            AI Explainability Panel
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Understand exactly why the AI generated each signal — factor weights, risk levels, and historical accuracy in full detail.
          </p>
        </div>

        {/* Preset selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            Choose a sample signal to explain
          </p>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => fetchExplanation(preset)}
                disabled={loading}
                aria-pressed={activePreset === preset.label}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  activePreset === preset.label
                    ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                    : "border-slate-700/40 bg-slate-800/30 text-slate-300 hover:border-cyan-500/30 hover:bg-cyan-500/5"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {loading && <ExplainSkeleton />}

        {!loading && explanation && (
          <SignalExplainer explanation={explanation} />
        )}

        {!loading && !explanation && !error && (
          <div className="rounded-2xl border border-dashed border-slate-700/40 bg-slate-900/20 p-16 text-center">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              Select a sample signal above to see the full AI explanation.
            </p>
          </div>
        )}
      </main>

      <ShamrockFooter />
    </div>
  );
}
