"use client";

/**
 * StrategyToolbar — block palette for adding new blocks to the canvas.
 */

import { Plus, Lock } from "lucide-react";
import type { BlockType, BlockCategory, StrategyBlock } from "@/types/trading";

// ─── Block catalogue ──────────────────────────────────────────────────────────

interface BlockTemplate {
  type: BlockType;
  category: BlockCategory;
  label: string;
  description: string;
  isPremium: boolean;
  defaultParams: StrategyBlock["params"];
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // ── Entry conditions ──────────────────────────────────────────────────────
  {
    type: "price_cross",
    category: "entry",
    label: "Price Cross",
    description: "Enter when price crosses a moving average (SMA/EMA).",
    isPremium: false,
    defaultParams: [
      { key: "ma_type", label: "MA Type", type: "select", value: "SMA", options: ["SMA", "EMA", "WMA"] },
      { key: "period", label: "Period", type: "number", value: 20, min: 2, max: 200 },
      { key: "direction", label: "Direction", type: "select", value: "cross_above", options: ["cross_above", "cross_below"] },
    ],
  },
  {
    type: "rsi_threshold",
    category: "entry",
    label: "RSI Threshold",
    description: "Enter when RSI crosses a level (e.g., oversold < 30).",
    isPremium: false,
    defaultParams: [
      { key: "period", label: "RSI Period", type: "number", value: 14, min: 2, max: 50 },
      { key: "threshold", label: "Threshold", type: "number", value: 30, min: 1, max: 99 },
      { key: "direction", label: "Condition", type: "select", value: "below", options: ["below", "above"] },
    ],
  },
  {
    type: "macd_signal",
    category: "entry",
    label: "MACD Signal",
    description: "Enter on MACD line crossing the signal line.",
    isPremium: false,
    defaultParams: [
      { key: "fast", label: "Fast EMA", type: "number", value: 12, min: 2, max: 50 },
      { key: "slow", label: "Slow EMA", type: "number", value: 26, min: 2, max: 100 },
      { key: "signal", label: "Signal EMA", type: "number", value: 9, min: 2, max: 30 },
      { key: "direction", label: "Cross", type: "select", value: "bullish", options: ["bullish", "bearish"] },
    ],
  },
  {
    type: "sentiment_threshold",
    category: "entry",
    label: "Sentiment Threshold",
    description: "Enter when market sentiment score crosses a threshold.",
    isPremium: true,
    defaultParams: [
      { key: "threshold", label: "Score Threshold", type: "number", value: 40, min: -100, max: 100 },
      { key: "direction", label: "Condition", type: "select", value: "above", options: ["above", "below"] },
      { key: "asset", label: "Asset", type: "select", value: "MARKET", options: ["MARKET", "BTC", "ETH", "SOL"] },
    ],
  },
  {
    type: "volume_spike",
    category: "entry",
    label: "Volume Spike",
    description: "Enter on unusually high volume (relative to average).",
    isPremium: true,
    defaultParams: [
      { key: "multiplier", label: "Volume Multiplier", type: "number", value: 2, min: 1.1, max: 10, step: 0.1 },
      { key: "avg_period", label: "Avg Period (bars)", type: "number", value: 20, min: 5, max: 100 },
    ],
  },

  // ── Exit conditions ───────────────────────────────────────────────────────
  {
    type: "take_profit",
    category: "exit",
    label: "Take Profit",
    description: "Exit when price reaches the target profit %.",
    isPremium: false,
    defaultParams: [
      { key: "pct", label: "Take Profit %", type: "percent", value: 5, min: 0.1, max: 1000, step: 0.1 },
    ],
  },
  {
    type: "stop_loss",
    category: "exit",
    label: "Stop Loss",
    description: "Exit to limit losses at a defined % below entry.",
    isPremium: false,
    defaultParams: [
      { key: "pct", label: "Stop Loss %", type: "percent", value: 2, min: 0.1, max: 100, step: 0.1 },
    ],
  },
  {
    type: "trailing_stop",
    category: "exit",
    label: "Trailing Stop",
    description: "Stop that follows the price up, locks in gains.",
    isPremium: true,
    defaultParams: [
      { key: "trail_pct", label: "Trail %", type: "percent", value: 3, min: 0.1, max: 50, step: 0.1 },
    ],
  },
  {
    type: "time_based_exit",
    category: "exit",
    label: "Time-Based Exit",
    description: "Close position after a set number of candles.",
    isPremium: false,
    defaultParams: [
      { key: "candles", label: "Max Candles", type: "number", value: 48, min: 1, max: 1000 },
    ],
  },

  // ── Filters ───────────────────────────────────────────────────────────────
  {
    type: "market_hours",
    category: "filter",
    label: "Market Hours Filter",
    description: "Only trade during specified UTC hours.",
    isPremium: false,
    defaultParams: [
      { key: "start_hour", label: "Start Hour (UTC)", type: "number", value: 8, min: 0, max: 23 },
      { key: "end_hour", label: "End Hour (UTC)", type: "number", value: 20, min: 0, max: 23 },
    ],
  },
  {
    type: "volatility_filter",
    category: "filter",
    label: "Volatility Filter",
    description: "Skip trades when ATR-based volatility exceeds threshold.",
    isPremium: true,
    defaultParams: [
      { key: "atr_period", label: "ATR Period", type: "number", value: 14, min: 2, max: 50 },
      { key: "max_atr_pct", label: "Max ATR %", type: "percent", value: 5, min: 0.1, max: 50, step: 0.1 },
    ],
  },
  {
    type: "trend_filter",
    category: "filter",
    label: "Trend Filter",
    description: "Only enter long above the trend MA, short below.",
    isPremium: true,
    defaultParams: [
      { key: "ma_period", label: "Trend MA Period", type: "number", value: 200, min: 10, max: 500 },
      { key: "ma_type", label: "MA Type", type: "select", value: "EMA", options: ["SMA", "EMA"] },
    ],
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  {
    type: "buy",
    category: "action",
    label: "Buy",
    description: "Execute a market buy order.",
    isPremium: false,
    defaultParams: [
      { key: "size_pct", label: "Position Size %", type: "percent", value: 10, min: 0.1, max: 100, step: 0.1 },
    ],
  },
  {
    type: "sell",
    category: "action",
    label: "Sell",
    description: "Execute a market sell order.",
    isPremium: false,
    defaultParams: [
      { key: "size_pct", label: "Position Size %", type: "percent", value: 100, min: 0.1, max: 100, step: 0.1 },
    ],
  },
  {
    type: "limit_order",
    category: "action",
    label: "Limit Order",
    description: "Place a limit order at a % offset from market price.",
    isPremium: true,
    defaultParams: [
      { key: "offset_pct", label: "Offset %", type: "percent", value: 0.5, min: 0, max: 10, step: 0.1 },
      { key: "size_pct", label: "Position Size %", type: "percent", value: 10, min: 0.1, max: 100, step: 0.1 },
    ],
  },
  {
    type: "dca_increment",
    category: "action",
    label: "DCA Increment",
    description: "Add to position on each % dip (dollar-cost averaging).",
    isPremium: true,
    defaultParams: [
      { key: "dip_pct", label: "Dip % per DCA", type: "percent", value: 3, min: 0.1, max: 50, step: 0.1 },
      { key: "increment_pct", label: "Add % of Capital", type: "percent", value: 5, min: 0.1, max: 50, step: 0.1 },
      { key: "max_orders", label: "Max DCA Orders", type: "number", value: 5, min: 1, max: 20 },
    ],
  },
];

const CATEGORY_ORDER: BlockCategory[] = ["entry", "exit", "filter", "action"];

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  entry: "Entry Conditions",
  exit: "Exit Conditions",
  filter: "Filters",
  action: "Actions",
};

const CATEGORY_ACCENT: Record<BlockCategory, string> = {
  entry: "text-blue-400",
  exit: "text-orange-400",
  filter: "text-purple-400",
  action: "text-green-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface StrategyToolbarProps {
  isPremium: boolean;
  onAddBlock: (template: BlockTemplate) => void;
}

/**
 * Block palette that lets users add strategy blocks to the canvas.
 */
export function StrategyToolbar({ isPremium, onAddBlock }: StrategyToolbarProps) {
  return (
    <aside
      className="w-full lg:w-64 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-200px)] pr-1"
      aria-label="Strategy block palette"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3 px-1">Block Palette</h3>
      {CATEGORY_ORDER.map((cat) => {
        const blocks = BLOCK_TEMPLATES.filter((b) => b.category === cat);
        return (
          <div key={cat} className="mb-4">
            <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 px-1 ${CATEGORY_ACCENT[cat]}`}>
              {CATEGORY_LABELS[cat]}
            </h4>
            <div className="flex flex-col gap-1.5">
              {blocks.map((tmpl) => {
                const locked = tmpl.isPremium && !isPremium;
                return (
                  <button
                    key={tmpl.type}
                    type="button"
                    onClick={() => !locked && onAddBlock(tmpl)}
                    disabled={locked}
                    title={locked ? "Upgrade to premium to use this block." : tmpl.description}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border border-border/40 text-xs transition-colors ${
                      locked
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : "bg-muted/30 hover:bg-muted/60 hover:border-primary/40 cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="flex-1 font-medium text-foreground truncate">{tmpl.label}</span>
                    {locked && <Lock className="w-3 h-3 flex-shrink-0 text-yellow-400" aria-label="Premium" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}

export type { BlockTemplate };
