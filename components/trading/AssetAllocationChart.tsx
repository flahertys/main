"use client";

/**
 * AssetAllocationChart — SVG donut chart for portfolio allocation visualization.
 */

import type { PortfolioAsset } from "@/types/trading";

interface AssetAllocationChartProps {
  assets: PortfolioAsset[];
  size?: number;
}

/** Convert a slice to an SVG arc path on a unit circle. */
function slicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  holeRadius: number,
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cos = Math.cos;
  const sin = Math.sin;

  const x1 = cx + r * cos(toRad(startAngle - 90));
  const y1 = cy + r * sin(toRad(startAngle - 90));
  const x2 = cx + r * cos(toRad(endAngle - 90));
  const y2 = cy + r * sin(toRad(endAngle - 90));

  const hx1 = cx + holeRadius * cos(toRad(startAngle - 90));
  const hy1 = cy + holeRadius * sin(toRad(startAngle - 90));
  const hx2 = cx + holeRadius * cos(toRad(endAngle - 90));
  const hy2 = cy + holeRadius * sin(toRad(endAngle - 90));

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${hx2} ${hy2}`,
    `A ${holeRadius} ${holeRadius} 0 ${largeArc} 0 ${hx1} ${hy1}`,
    "Z",
  ].join(" ");
}

/**
 * Donut chart showing portfolio asset allocation percentages.
 */
export function AssetAllocationChart({ assets, size = 200 }: AssetAllocationChartProps) {
  if (assets.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-muted/30 border border-border/30 text-muted-foreground text-xs"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const holeRadius = r * 0.55;

  let startAngle = 0;
  const slices = assets.map((asset) => {
    const sweep = (asset.allocationPct / 100) * 360;
    const path = slicePath(cx, cy, r, startAngle, startAngle + sweep, holeRadius);
    const midAngle = startAngle + sweep / 2;
    const labelR = r * 1.25;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const lx = cx + labelR * Math.cos(toRad(midAngle - 90));
    const ly = cy + labelR * Math.sin(toRad(midAngle - 90));
    startAngle += sweep;
    return { asset, path, lx, ly };
  });

  return (
    <svg
      width={size * 1.6}
      height={size}
      viewBox={`${-size * 0.3} 0 ${size * 1.6} ${size}`}
      aria-label="Asset allocation donut chart"
      role="img"
    >
      {slices.map(({ asset, path }) => (
        <path
          key={`${asset.symbol}-${asset.exchange}`}
          d={path}
          fill={asset.color ?? "#6b7280"}
          opacity={0.85}
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
        >
          <title>{`${asset.symbol}: ${asset.allocationPct.toFixed(1)}%`}</title>
        </path>
      ))}

      {/* Center total label */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
        Allocation
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
        {assets.length} assets
      </text>

      {/* Percentage labels for slices ≥ 8% */}
      {slices.map(({ asset, lx, ly }) =>
        asset.allocationPct >= 8 ? (
          <text
            key={`lbl-${asset.symbol}-${asset.exchange}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill={asset.color ?? "white"}
            fontWeight="600"
          >
            {asset.symbol}
          </text>
        ) : null,
      )}
    </svg>
  );
}
