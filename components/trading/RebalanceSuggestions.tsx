"use client";

/**
 * RebalanceSuggestions — displays AI-driven rebalance recommendations.
 */

import { ArrowUpRight, ArrowDownLeft, Zap } from "lucide-react";
import type { RebalanceSuggestion } from "@/types/trading";

const PRIORITY_STYLE: Record<RebalanceSuggestion["priority"], string> = {
  high: "border-red-500/40 bg-red-500/5",
  medium: "border-yellow-500/40 bg-yellow-500/5",
  low: "border-border/30 bg-muted/10",
};

const PRIORITY_BADGE: Record<RebalanceSuggestion["priority"], string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-muted text-muted-foreground",
};

interface RebalanceSuggestionsProps {
  suggestions: RebalanceSuggestion[];
}

/**
 * Renders AI-generated rebalance suggestions with action indicators.
 */
export function RebalanceSuggestions({ suggestions }: RebalanceSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-400">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span>Portfolio is well-balanced. No immediate rebalancing needed.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" role="list" aria-label="Rebalance suggestions">
      {suggestions.map((s) => (
        <div
          key={s.id}
          role="listitem"
          className={`rounded-lg border p-3 ${PRIORITY_STYLE[s.priority]}`}
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {s.action === "sell" ? (
              <ArrowDownLeft className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-green-400 flex-shrink-0" aria-hidden />
            )}
            <span className={`text-sm font-semibold ${s.action === "sell" ? "text-red-400" : "text-green-400"}`}>
              {s.action.toUpperCase()} {s.quantity.toFixed(4)} {s.symbol}
            </span>
            <span className="text-xs text-muted-foreground">on {s.exchange}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              ≈ ${s.estimatedValueUsd.toFixed(2)}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${PRIORITY_BADGE[s.priority]}`}>
              {s.priority}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.reasoning}</p>
        </div>
      ))}
    </div>
  );
}
