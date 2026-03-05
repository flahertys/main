"use client";

/**
 * FactorBreakdown — animated horizontal bar chart of contributing signal factors.
 */

import { motion } from "framer-motion";
import type { SignalFactor } from "@/types/trading";

const DIRECTION_COLOR: Record<SignalFactor["direction"], string> = {
  bullish: "bg-green-500",
  bearish: "bg-red-500",
  neutral: "bg-yellow-500",
};

interface FactorBreakdownProps {
  factors: SignalFactor[];
}

/**
 * Renders a sorted list of signal factors as animated horizontal bars.
 */
export function FactorBreakdown({ factors }: FactorBreakdownProps) {
  const sorted = [...factors].sort((a, b) => b.weight - a.weight);

  return (
    <div className="flex flex-col gap-3" role="list" aria-label="Contributing factors">
      {sorted.map((factor, i) => {
        const pct = Math.round(factor.weight * 100);
        const barColor = DIRECTION_COLOR[factor.direction];
        return (
          <div key={i} role="listitem" className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground truncate max-w-[60%]">{factor.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[11px] hidden sm:block">{factor.value}</span>
                <span className={`font-bold ${factor.direction === "bullish" ? "text-green-400" : factor.direction === "bearish" ? "text-red-400" : "text-yellow-400"}`}>
                  {pct}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
