"use client";

/**
 * StrategyBlock — a configurable card representing one step in a trading strategy.
 */

import { motion } from "framer-motion";
import { GripVertical, X, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { StrategyBlock as IStrategyBlock, BlockParam } from "@/types/trading";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<IStrategyBlock["category"], string> = {
  entry: "border-blue-500/60 bg-blue-500/5",
  exit: "border-orange-500/60 bg-orange-500/5",
  filter: "border-purple-500/60 bg-purple-500/5",
  action: "border-green-500/60 bg-green-500/5",
};

const CATEGORY_BADGE: Record<IStrategyBlock["category"], string> = {
  entry: "bg-blue-500/20 text-blue-400",
  exit: "bg-orange-500/20 text-orange-400",
  filter: "bg-purple-500/20 text-purple-400",
  action: "bg-green-500/20 text-green-400",
};

// ─── Param Editor ─────────────────────────────────────────────────────────────

interface ParamEditorProps {
  param: BlockParam;
  onChange: (key: string, value: BlockParam["value"]) => void;
  isPremium: boolean;
}

function ParamEditor({ param, onChange, isPremium }: ParamEditorProps) {
  const disabled = param.isPremium && !isPremium;

  if (param.type === "toggle") {
    return (
      <label className="flex items-center justify-between gap-2 cursor-pointer">
        <span className="text-xs text-muted-foreground">{param.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(param.value)}
          disabled={disabled}
          onClick={() => onChange(param.key, !param.value)}
          className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            param.value ? "bg-primary" : "bg-muted"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              param.value ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </label>
    );
  }

  if (param.type === "select" && param.options) {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{param.label}</span>
        <select
          value={String(param.value)}
          disabled={disabled}
          onChange={(e) => onChange(param.key, e.target.value)}
          className={`text-xs rounded border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label={param.label}
        >
          {param.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">
        {param.label}
        {(param.type === "percent") && " (%)"}
      </span>
      <input
        type="number"
        value={String(param.value)}
        disabled={disabled}
        min={param.min}
        max={param.max}
        step={param.step ?? 1}
        onChange={(e) => onChange(param.key, Number(e.target.value))}
        className={`text-xs rounded border border-border bg-background px-2 py-1 text-foreground w-24 focus:outline-none focus:ring-1 focus:ring-ring ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-label={param.label}
      />
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StrategyBlockProps {
  block: IStrategyBlock;
  isPremium: boolean;
  onUpdate: (id: string, changes: Partial<IStrategyBlock>) => void;
  onRemove: (id: string) => void;
  /** Pointer-event drag handle callbacks (passed from canvas). */
  onDragStart: (e: React.PointerEvent, id: string) => void;
}

/**
 * Draggable, configurable block card for the strategy builder canvas.
 */
export function StrategyBlock({ block, isPremium, onUpdate, onRemove, onDragStart }: StrategyBlockProps) {
  const [expanded, setExpanded] = useState(true);
  const locked = block.isPremium && !isPremium;

  function handleParamChange(key: string, value: BlockParam["value"]) {
    const updated = block.params.map((p) => (p.key === key ? { ...p, value } : p));
    onUpdate(block.id, { params: updated });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`relative rounded-lg border-2 ${CATEGORY_COLORS[block.category]} overflow-hidden`}
      style={{ opacity: block.enabled ? 1 : 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background/40 border-b border-border/30">
        {/* Drag handle */}
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          onPointerDown={(e) => onDragStart(e, block.id)}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Category badge */}
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${CATEGORY_BADGE[block.category]}`}>
          {block.category}
        </span>

        {/* Label */}
        <span className="text-sm font-semibold flex-1 truncate">{block.label}</span>

        {/* Premium lock */}
        {locked && (
          <Lock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" aria-label="Premium feature" />
        )}

        {/* Enable toggle */}
        <button
          type="button"
          onClick={() => onUpdate(block.id, { enabled: !block.enabled })}
          className={`text-xs px-1.5 py-0.5 rounded border ${
            block.enabled
              ? "border-primary/50 text-primary bg-primary/10"
              : "border-border text-muted-foreground"
          }`}
          aria-pressed={block.enabled}
          aria-label={block.enabled ? "Disable block" : "Enable block"}
        >
          {block.enabled ? "ON" : "OFF"}
        </button>

        {/* Expand/collapse */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Remove block"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Params */}
      {expanded && (
        <div className="px-3 py-3">
          {locked && (
            <p className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Upgrade to premium to configure this block.
            </p>
          )}
          <p className="text-xs text-muted-foreground mb-3">{block.description}</p>
          {block.params.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {block.params.map((param) => (
                <ParamEditor
                  key={param.key}
                  param={param}
                  onChange={handleParamChange}
                  isPremium={isPremium}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No parameters to configure.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
