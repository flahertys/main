"use client";

/**
 * SignalExplainer — full AI Explainability Panel (XAI).
 * Collapsible sections showing confidence, factors, data, risk, and similar signals.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Database, TrendingUp, Shield, History } from "lucide-react";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { FactorBreakdown } from "./FactorBreakdown";
import { SignalTimeline } from "./SignalTimeline";
import type { SignalExplanation } from "@/types/trading";

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: SignalExplanation["riskLevel"] }) {
  const styles = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold capitalize ${styles[level]}`}
      aria-label={`Risk level: ${level}`}
    >
      {level} Risk
    </span>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        aria-expanded={open}
      >
        {icon}
        <span className="text-sm font-semibold flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SignalExplainerProps {
  explanation: SignalExplanation;
  className?: string;
}

/**
 * Renders a full XAI breakdown panel for a single trading signal.
 */
export function SignalExplainer({ explanation, className = "" }: SignalExplainerProps) {
  const {
    symbol,
    action,
    confidence,
    factors,
    dataPointsAnalyzed,
    timeRangeAnalyzed,
    dataSources,
    historicalPerformance,
    riskLevel,
    riskReason,
    naturalLanguageSummary,
    similarSignals,
  } = explanation;

  const actionColor =
    action === "buy" ? "text-green-400" : action === "sell" ? "text-red-400" : "text-yellow-400";

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <span className="text-lg font-bold font-display">{symbol}</span>
          <span className={`ml-2 text-base font-semibold uppercase ${actionColor}`}>{action}</span>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      {/* Natural language summary */}
      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-lg px-4 py-3 border border-border/30">
        {naturalLanguageSummary}
      </p>

      {/* Confidence */}
      <Section title="Confidence Score" icon={<TrendingUp className="w-4 h-4 text-primary" />}>
        <ConfidenceMeter confidence={confidence} size="md" />
      </Section>

      {/* Contributing factors */}
      <Section title="Contributing Factors" icon={<TrendingUp className="w-4 h-4 text-blue-400" />}>
        <FactorBreakdown factors={factors} />
      </Section>

      {/* Data points */}
      <Section title="Data Analysis" icon={<Database className="w-4 h-4 text-purple-400" />} defaultOpen={false}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Data Points Analyzed</dt>
          <dd className="font-semibold">{dataPointsAnalyzed.toLocaleString()}</dd>
          <dt className="text-muted-foreground">Time Range</dt>
          <dd className="font-semibold">{timeRangeAnalyzed}</dd>
          <dt className="text-muted-foreground">Sources</dt>
          <dd className="font-semibold">{dataSources.join(", ")}</dd>
        </dl>
      </Section>

      {/* Historical accuracy */}
      <Section title="Historical Accuracy" icon={<TrendingUp className="w-4 h-4 text-lime-400" />} defaultOpen={false}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Win Rate</dt>
          <dd className="font-semibold text-green-400">{Math.round(historicalPerformance.winRate * 100)}%</dd>
          <dt className="text-muted-foreground">Avg Return</dt>
          <dd className={`font-semibold ${historicalPerformance.avgReturnPct >= 0 ? "text-green-400" : "text-red-400"}`}>
            {historicalPerformance.avgReturnPct >= 0 ? "+" : ""}{historicalPerformance.avgReturnPct}%
          </dd>
          <dt className="text-muted-foreground">Sample Size</dt>
          <dd className="font-semibold">{historicalPerformance.sampleSize} signals</dd>
          <dt className="text-muted-foreground">Time Range</dt>
          <dd className="font-semibold">{historicalPerformance.timeRange}</dd>
        </dl>
      </Section>

      {/* Risk assessment */}
      <Section title="Risk Assessment" icon={<Shield className="w-4 h-4 text-orange-400" />} defaultOpen={false}>
        <div className="flex items-start gap-2">
          <RiskBadge level={riskLevel} />
          <p className="text-xs text-muted-foreground">{riskReason}</p>
        </div>
      </Section>

      {/* Similar signals */}
      <Section title="Similar Past Signals" icon={<History className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
        <SignalTimeline signals={similarSignals} />
      </Section>
    </div>
  );
}
