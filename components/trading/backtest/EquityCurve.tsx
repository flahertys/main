"use client";

/**
 * EquityCurve — SVG line chart showing portfolio value vs buy-and-hold benchmark.
 */

import type { EquityPoint } from "@/types/trading";

interface EquityCurveProps {
  data: EquityPoint[];
  width?: number;
  height?: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatValue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/**
 * Renders a strategy equity curve vs buy-and-hold benchmark using SVG.
 */
export function EquityCurve({ data, width = 600, height = 260 }: EquityCurveProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Not enough data points.
      </div>
    );
  }

  const PADDING = { top: 20, right: 20, bottom: 36, left: 64 };
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const allValues = data.flatMap((d) => [d.equity, d.benchmark]);
  const minV = Math.min(...allValues) * 0.97;
  const maxV = Math.max(...allValues) * 1.03;
  const range = maxV - minV || 1;

  const toX = (i: number) => (i / (data.length - 1)) * chartW;
  const toY = (v: number) => chartH - ((v - minV) / range) * chartH;

  const stratPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.equity)}`).join(" ");
  const benchPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.benchmark)}`).join(" ");

  // Label ticks
  const labelCount = Math.min(6, data.length);
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    Math.floor((i / (labelCount - 1)) * (data.length - 1)),
  );

  // Y axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minV + (i / yTicks) * range);

  const lastEquity = data[data.length - 1].equity;
  const lastBench = data[data.length - 1].benchmark;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ minWidth: 320, maxWidth: "100%" }}
        aria-label="Equity curve chart"
        role="img"
      >
        <g transform={`translate(${PADDING.left},${PADDING.top})`}>
          {/* Y axis grid */}
          {yTickValues.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={toY(v)} x2={chartW} y2={toY(v)} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4,4" />
              <text x={-8} y={toY(v)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                {formatValue(v)}
              </text>
            </g>
          ))}

          {/* Benchmark line */}
          <path d={benchPath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="5,4" />

          {/* Strategy line */}
          <path d={stratPath} fill="none" stroke={lastEquity >= lastBench ? "#22c55e" : "#ef4444"} strokeWidth="2" />

          {/* X axis labels */}
          {labelIndices.map((idx) => (
            <text
              key={idx}
              x={toX(idx)}
              y={chartH + 18}
              textAnchor="middle"
              fontSize="9"
              fill="hsl(var(--muted-foreground))"
            >
              {formatDate(data[idx].timestamp)}
            </text>
          ))}

          {/* Legend */}
          <g transform={`translate(${chartW - 130}, -12)`}>
            <rect x={0} y={0} width={10} height={3} fill={lastEquity >= lastBench ? "#22c55e" : "#ef4444"} />
            <text x={14} y={4} fontSize="9" fill="hsl(var(--muted-foreground))">Strategy</text>
            <rect x={70} y={0} width={10} height={3} fill="hsl(var(--muted-foreground))" />
            <text x={84} y={4} fontSize="9" fill="hsl(var(--muted-foreground))">Buy&amp;Hold</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
