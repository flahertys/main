"use client";

/**
 * SentimentGauge — circular arc gauge with animated needle.
 * Displays a -100 to +100 sentiment score with Fear & Greed styling.
 */

import { motion } from "framer-motion";
import { categoryColor, categoryLabel } from "@/lib/trading/sentiment-engine";
import type { SentimentScore } from "@/types/trading";

// ─── SVG Arc Helpers ──────────────────────────────────────────────────────────

const CX = 100;
const CY = 100;
const R = 80;
const START_ANGLE = -210; // degrees (left-most of the arc)
const END_ANGLE = 30;    // degrees (right-most)
const TOTAL_SWEEP = END_ANGLE - START_ANGLE; // 240 degrees

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(angle: number, r: number) {
  return {
    x: CX + r * Math.cos(degToRad(angle)),
    y: CY + r * Math.sin(degToRad(angle)),
  };
}

function describeArc(startDeg: number, endDeg: number, r: number) {
  const start = polarToXY(startDeg, r);
  const end = polarToXY(endDeg, r);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Map score (-100→+100) to an arc angle. */
function scoreToAngle(score: number): number {
  const clamped = Math.max(-100, Math.min(100, score));
  const normalized = (clamped + 100) / 200; // 0 → 1
  return START_ANGLE + normalized * TOTAL_SWEEP;
}

// ─── Gradient segments ────────────────────────────────────────────────────────

const GRADIENT_SEGMENTS = [
  { from: START_ANGLE, to: START_ANGLE + TOTAL_SWEEP * 0.2, color: "#ef4444" },  // extreme fear
  { from: START_ANGLE + TOTAL_SWEEP * 0.2, to: START_ANGLE + TOTAL_SWEEP * 0.4, color: "#f97316" },  // fear
  { from: START_ANGLE + TOTAL_SWEEP * 0.4, to: START_ANGLE + TOTAL_SWEEP * 0.6, color: "#eab308" },  // neutral
  { from: START_ANGLE + TOTAL_SWEEP * 0.6, to: START_ANGLE + TOTAL_SWEEP * 0.8, color: "#84cc16" },  // greed
  { from: START_ANGLE + TOTAL_SWEEP * 0.8, to: END_ANGLE, color: "#22c55e" },  // extreme greed
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SentimentGaugeProps {
  /** The asset or market sentiment to display. */
  data: SentimentScore;
  /** Rendered size in px (default 200). */
  size?: number;
  /** Show sub-score breakdown below gauge (default true). */
  showBreakdown?: boolean;
}

/**
 * Visual sentiment gauge using an SVG arc with animated needle.
 * Color transitions from red (extreme fear) through yellow (neutral) to green (extreme greed).
 */
export function SentimentGauge({ data, size = 200, showBreakdown = true }: SentimentGaugeProps) {
  const needleAngle = scoreToAngle(data.score);
  const needleTip = polarToXY(needleAngle, R - 10);
  const needleBase1 = polarToXY(needleAngle + 90, 8);
  const needleBase2 = polarToXY(needleAngle - 90, 8);

  const colorClass = categoryColor(data.category);
  const label = categoryLabel(data.category);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Gauge SVG */}
      <div style={{ width: size, height: size * 0.7 }} className="relative">
        <svg
          viewBox="20 30 160 120"
          width={size}
          height={size * 0.7}
          aria-label={`${data.symbol} sentiment: ${data.score} (${label})`}
          role="img"
        >
          {/* Track background */}
          <path
            d={describeArc(START_ANGLE, END_ANGLE, R)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Colored segments */}
          {GRADIENT_SEGMENTS.map((seg, i) => (
            <path
              key={i}
              d={describeArc(seg.from, seg.to, R)}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeLinecap="butt"
              opacity={0.85}
            />
          ))}

          {/* Animated needle */}
          <motion.polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill="white"
            opacity={0.95}
            initial={{ rotate: 0, originX: `${CX}px`, originY: `${CY}px` }}
            animate={{ rotate: needleAngle - START_ANGLE, originX: `${CX}px`, originY: `${CY}px` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />

          {/* Center dot */}
          <circle cx={CX} cy={CY} r={6} fill="white" opacity={0.9} />

          {/* Score text */}
          <text
            x={CX}
            y={CY + 28}
            textAnchor="middle"
            className="fill-foreground"
            fontSize="18"
            fontWeight="700"
            style={{ fill: "white" }}
          >
            {data.score > 0 ? `+${data.score}` : data.score}
          </text>
        </svg>
      </div>

      {/* Category label */}
      <div className={`text-sm font-semibold ${colorClass}`}>{label}</div>
      <div className="text-xs text-muted-foreground">{data.symbol}</div>

      {/* Sub-score breakdown */}
      {showBreakdown && (
        <div className="grid grid-cols-3 gap-2 w-full text-center text-xs mt-1">
          {[
            { label: "Social", value: data.socialScore },
            { label: "News", value: data.newsScore },
            { label: "On-Chain", value: data.onChainScore },
          ].map(({ label: l, value: v }) => (
            <div key={l} className="flex flex-col items-center gap-0.5">
              <span className="text-muted-foreground">{l}</span>
              <span className={`font-medium ${categoryColor(data.category)}`}>
                {v > 0 ? `+${v}` : v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
