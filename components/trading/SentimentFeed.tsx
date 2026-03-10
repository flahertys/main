"use client";

/**
 * SentimentFeed — live scrolling list of sentiment events.
 * Each event shows: source icon, text snippet, score badge, timestamp.
 */

import type { SentimentEvent } from "@/types/trading";
import { AnimatePresence, motion } from "framer-motion";

// ─── Source icons (emoji fallbacks; swap to Lucide if preferred) ──────────────

const SOURCE_ICON: Record<SentimentEvent["source"], string> = {
  twitter: "𝕏",
  reddit: "🤖",
  news: "📰",
  "on-chain": "⛓️",
  derivatives: "📊",
};

const SOURCE_LABEL: Record<SentimentEvent["source"], string> = {
  twitter: "X / Twitter",
  reddit: "Reddit",
  news: "News",
  "on-chain": "On-Chain",
  derivatives: "Derivatives",
};

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const isPositive = score >= 20;
  const isNegative = score <= -20;
  const colorClass = isPositive
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : isNegative
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-mono font-semibold ${colorClass}`}
      aria-label={`Sentiment score: ${score}`}
    >
      {score > 0 ? `+${score}` : score}
    </span>
  );
}

// ─── Single event row ─────────────────────────────────────────────────────────

function EventRow({ event }: { event: SentimentEvent }) {
  const relTime = (() => {
    const diffMs = Date.now() - new Date(event.timestamp).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      {/* Source icon */}
      <div
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-background border border-border/60 text-sm"
        aria-label={SOURCE_LABEL[event.source]}
        title={SOURCE_LABEL[event.source]}
      >
        {SOURCE_ICON[event.source]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{event.symbol}</span>
          <span className="text-xs text-muted-foreground">{SOURCE_LABEL[event.source]}</span>
          <span className="text-xs text-muted-foreground ml-auto">{relTime}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{event.text}</p>
      </div>

      {/* Score badge */}
      <div className="flex-shrink-0">
        <ScoreBadge score={event.score} />
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SentimentFeedProps {
  events: SentimentEvent[];
  /** Maximum number of events to display (default 15). */
  maxEvents?: number;
  className?: string;
}

/**
 * Live sentiment event feed with animated entry/exit.
 * Displays the most recent events from multiple sources.
 */
export function SentimentFeed({ events, maxEvents = 15, className = "" }: SentimentFeedProps) {
  const displayed = events.slice(0, maxEvents);

  if (displayed.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-sm text-muted-foreground ${className}`}>
        No sentiment events available.
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1 ${className}`}
      role="feed"
      aria-label="Live sentiment events"
    >
      <AnimatePresence initial={false}>
        {displayed.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </AnimatePresence>
    </div>
  );
}
