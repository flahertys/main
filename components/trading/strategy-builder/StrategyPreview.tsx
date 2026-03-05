"use client";

/**
 * StrategyPreview — shows a human-readable summary of the complete strategy.
 */

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { validateStrategy } from "@/lib/trading/strategy-validator";
import type { StrategyDefinition } from "@/types/trading";

// ─── Block summary text ───────────────────────────────────────────────────────

function blockSummaryLine(block: StrategyDefinition["blocks"][number]): string {
  const paramMap = Object.fromEntries(block.params.map((p) => [p.key, p.value]));
  switch (block.type) {
    case "price_cross":
      return `Price crosses ${paramMap.direction === "cross_above" ? "above" : "below"} ${paramMap.ma_type}(${paramMap.period})`;
    case "rsi_threshold":
      return `RSI(${paramMap.period}) ${paramMap.direction} ${paramMap.threshold}`;
    case "macd_signal":
      return `MACD(${paramMap.fast},${paramMap.slow},${paramMap.signal}) ${paramMap.direction} crossover`;
    case "sentiment_threshold":
      return `${paramMap.asset} sentiment ${paramMap.direction} ${paramMap.threshold}`;
    case "volume_spike":
      return `Volume > ${paramMap.multiplier}× ${paramMap.avg_period}-bar average`;
    case "take_profit":
      return `Take profit at +${paramMap.pct}%`;
    case "stop_loss":
      return `Stop loss at -${paramMap.pct}%`;
    case "trailing_stop":
      return `Trailing stop ${paramMap.trail_pct}% below peak`;
    case "time_based_exit":
      return `Exit after ${paramMap.candles} candles`;
    case "market_hours":
      return `Active ${paramMap.start_hour}:00–${paramMap.end_hour}:00 UTC`;
    case "volatility_filter":
      return `Skip if ATR(${paramMap.atr_period}) > ${paramMap.max_atr_pct}%`;
    case "trend_filter":
      return `Only trade in ${paramMap.ma_type}(${paramMap.ma_period}) direction`;
    case "buy":
      return `Buy ${paramMap.size_pct}% of capital`;
    case "sell":
      return `Sell ${paramMap.size_pct}% of position`;
    case "limit_order":
      return `Limit order ${paramMap.offset_pct}% off market, ${paramMap.size_pct}% size`;
    case "dca_increment":
      return `DCA: add ${paramMap.increment_pct}% on each ${paramMap.dip_pct}% dip (max ${paramMap.max_orders}×)`;
    default:
      return block.label;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StrategyPreviewProps {
  strategy: StrategyDefinition;
}

/**
 * Renders a human-readable summary of the strategy with validation status.
 */
export function StrategyPreview({ strategy }: StrategyPreviewProps) {
  const validation = validateStrategy(strategy);
  const enabledBlocks = strategy.blocks.filter((b) => b.enabled).sort((a, b) => a.position - b.position);

  const grouped: Record<string, StrategyDefinition["blocks"]> = {
    entry: [],
    filter: [],
    action: [],
    exit: [],
  };

  for (const block of enabledBlocks) {
    grouped[block.category]?.push(block);
  }

  const SECTION_LABELS: Record<string, string> = {
    entry: "📥 Entry Conditions",
    filter: "🔒 Filters",
    action: "⚡ Actions",
    exit: "📤 Exit Conditions",
  };

  return (
    <div className="space-y-4">
      {/* Validation banner */}
      <div
        className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
          validation.valid
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}
        role="alert"
        aria-live="polite"
      >
        {validation.valid ? (
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="font-semibold">{validation.valid ? "Strategy is valid" : "Strategy has issues"}</p>
          {validation.errors.map((err, i) => (
            <p key={i} className="text-xs mt-0.5">• {err}</p>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            {validation.warnings.map((w, i) => (
              <p key={i} className="text-xs">• {w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Strategy name */}
      <div>
        <h4 className="text-base font-bold text-foreground">{strategy.name}</h4>
        {strategy.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{strategy.description}</p>
        )}
      </div>

      {/* Block summary by category */}
      {Object.entries(SECTION_LABELS).map(([cat, sectionLabel]) => {
        const catBlocks = grouped[cat];
        if (!catBlocks || catBlocks.length === 0) return null;
        return (
          <div key={cat}>
            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              {sectionLabel}
            </h5>
            <ul className="space-y-1">
              {catBlocks.map((block) => (
                <li key={block.id} className="flex items-start gap-1.5 text-xs text-foreground">
                  <span className="text-muted-foreground mt-0.5">→</span>
                  <span>{blockSummaryLine(block)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {enabledBlocks.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No enabled blocks yet.</p>
      )}
    </div>
  );
}
