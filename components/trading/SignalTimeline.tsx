"use client";

/**
 * SignalTimeline — historical signal accuracy timeline.
 * Shows similar past signals and their outcomes.
 */

import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { SimilarSignal } from "@/types/trading";

interface SignalTimelineProps {
  signals: SimilarSignal[];
}

const OUTCOME_ICON = {
  win: <CheckCircle className="w-4 h-4 text-green-400" aria-label="Win" />,
  loss: <XCircle className="w-4 h-4 text-red-400" aria-label="Loss" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" aria-label="Pending" />,
};

/**
 * Timeline of similar historical signals with outcome indicators.
 */
export function SignalTimeline({ signals }: SignalTimelineProps) {
  if (signals.length === 0) {
    return <p className="text-xs text-muted-foreground">No similar signals found.</p>;
  }

  return (
    <div className="relative pl-5" role="list" aria-label="Similar past signals">
      {/* Vertical line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" aria-hidden="true" />

      <div className="flex flex-col gap-4">
        {signals.map((sig, i) => {
          const date = new Date(sig.generatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          const returnColor =
            sig.returnPct >= 0 ? "text-green-400" : "text-red-400";

          return (
            <div key={sig.id} role="listitem" className="relative flex items-start gap-3">
              {/* Timeline dot */}
              <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-primary border border-background" aria-hidden="true" />

              <div className="flex-shrink-0 mt-0.5">{OUTCOME_ICON[sig.outcome]}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{sig.symbol} {sig.action.toUpperCase()}</span>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-xs font-bold ${returnColor}`}>
                    {sig.returnPct >= 0 ? "+" : ""}{sig.returnPct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {Math.round(sig.similarity * 100)}% similar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
