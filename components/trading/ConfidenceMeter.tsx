"use client";

/**
 * ConfidenceMeter — visual 0-100% confidence indicator with color coding.
 */

import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  /** Value from 0 to 1. */
  confidence: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.75) return "bg-green-500";
  if (confidence >= 0.5) return "bg-yellow-500";
  return "bg-red-500";
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.75) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}

/**
 * Horizontal progress-bar style confidence meter.
 */
export function ConfidenceMeter({ confidence, size = "md", showLabel = true }: ConfidenceMeterProps) {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const colorClass = confidenceColor(confidence);
  const label = confidenceLabel(confidence);

  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-4" : "h-2.5";
  const textClass = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`${textClass} text-muted-foreground`}>Confidence</span>
          <span className={`${textClass} font-bold ${confidence >= 0.75 ? "text-green-400" : confidence >= 0.5 ? "text-yellow-400" : "text-red-400"}`}>
            {pct}% — {label}
          </span>
        </div>
      )}
      <div className={`w-full bg-muted rounded-full overflow-hidden ${heightClass}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence: ${pct}%`}>
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
