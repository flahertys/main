"use client";

/**
 * /trading/strategy-builder — Visual No-Code Strategy Builder page.
 */

import { useState, useCallback } from "react";
import { nanoid } from "@/lib/utils";
import { StrategyCanvas } from "@/components/trading/strategy-builder/StrategyCanvas";
import { StrategyToolbar, BlockTemplate, BLOCK_TEMPLATES } from "@/components/trading/strategy-builder/StrategyToolbar";
import { StrategyPreview } from "@/components/trading/strategy-builder/StrategyPreview";
import { serializeStrategy, deserializeStrategy } from "@/lib/trading/strategy-serializer";
import type { StrategyBlock, StrategyDefinition } from "@/types/trading";
import { Download, Upload, Trash2, Copy } from "lucide-react";

// ─── Template Presets ─────────────────────────────────────────────────────────

const PRESET_NAMES = ["Conservative DCA", "Momentum Rider", "Grid Scalper", "Sentiment Surfer"] as const;
type PresetName = typeof PRESET_NAMES[number];

function getBlocksByTypes(types: StrategyBlock["type"][]): StrategyBlock[] {
  return types.map((t, i) => {
    const tmpl = BLOCK_TEMPLATES.find((b) => b.type === t)!;
    return {
      id: nanoid(),
      type: tmpl.type,
      category: tmpl.category,
      label: tmpl.label,
      description: tmpl.description,
      params: tmpl.defaultParams.map((p) => ({ ...p })),
      position: i,
      enabled: true,
      isPremium: tmpl.isPremium,
    };
  });
}

const PRESETS: Record<PresetName, Omit<StrategyDefinition, "id" | "createdAt" | "updatedAt">> = {
  "Conservative DCA": {
    name: "Conservative DCA",
    description: "Dollar-cost average into dips using RSI oversold signals.",
    blocks: getBlocksByTypes(["rsi_threshold", "stop_loss", "take_profit", "dca_increment", "buy"]),
    tags: ["dca", "conservative"],
  },
  "Momentum Rider": {
    name: "Momentum Rider",
    description: "Ride breakouts with MACD and volume confirmation.",
    blocks: getBlocksByTypes(["macd_signal", "volume_spike", "trend_filter", "buy", "trailing_stop"]),
    tags: ["momentum", "breakout"],
  },
  "Grid Scalper": {
    name: "Grid Scalper",
    description: "Scale in/out with limit orders inside a price range.",
    blocks: getBlocksByTypes(["price_cross", "limit_order", "take_profit", "stop_loss"]),
    tags: ["grid", "scalping"],
  },
  "Sentiment Surfer": {
    name: "Sentiment Surfer",
    description: "Trade based on Fear & Greed index transitions.",
    blocks: getBlocksByTypes(["sentiment_threshold", "buy", "take_profit", "stop_loss"]),
    tags: ["sentiment", "contrarian"],
  },
};

function buildPreset(name: PresetName): StrategyDefinition {
  const now = new Date().toISOString();
  const template = PRESETS[name];
  const blocks = template.blocks.map((b, i) => ({
    ...b,
    id: nanoid(),
    position: i,
    params: b.params.map((p) => ({ ...p })),
  }));
  return { ...template, id: nanoid(), createdAt: now, updatedAt: now, blocks };
}

function emptyStrategy(): StrategyDefinition {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    name: "My Strategy",
    description: "",
    blocks: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyBuilderPage() {
  const [strategy, setStrategy] = useState<StrategyDefinition>(emptyStrategy);
  const [isPremium] = useState(false); // wire to your monetization hook
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const updateStrategy = useCallback((changes: Partial<StrategyDefinition>) => {
    setStrategy((prev) => ({ ...prev, ...changes, updatedAt: new Date().toISOString() }));
  }, []);

  // ── Add block ────────────────────────────────────────────────────────────

  const addBlock = useCallback(
    (tmpl: BlockTemplate) => {
      if (tmpl.isPremium && !isPremium) return;
      const newBlock: StrategyBlock = {
        id: nanoid(),
        type: tmpl.type,
        category: tmpl.category,
        label: tmpl.label,
        description: tmpl.description,
        params: tmpl.defaultParams.map((p) => ({ ...p })),
        position: strategy.blocks.length,
        enabled: true,
        isPremium: tmpl.isPremium,
      };
      updateStrategy({ blocks: [...strategy.blocks, newBlock] });
    },
    [isPremium, strategy.blocks, updateStrategy],
  );

  // ── Export / Import ──────────────────────────────────────────────────────

  function handleExport() {
    const json = serializeStrategy(strategy);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = strategy.name.replace(/[^a-zA-Z0-9-]/gi, "-").toLowerCase();
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg("Strategy exported!");
    setTimeout(() => setExportMsg(null), 2000);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = deserializeStrategy(String(ev.target?.result ?? ""));
        if (parsed) {
          setStrategy(parsed);
          setExportMsg("Strategy imported!");
        } else {
          setExportMsg("Invalid strategy file.");
        }
        setTimeout(() => setExportMsg(null), 2500);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleCopy() {
    navigator.clipboard.writeText(serializeStrategy(strategy)).then(() => {
      setExportMsg("Copied to clipboard!");
      setTimeout(() => setExportMsg(null), 2000);
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Visual Strategy Builder</h1>
          <p className="text-sm text-muted-foreground">Build no-code trading strategies with drag-and-drop blocks.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Preset picker */}
          <select
            className="text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground"
            onChange={(e) => {
              if (!e.target.value) return;
              setStrategy(buildPreset(e.target.value as PresetName));
              e.target.value = "";
            }}
            aria-label="Load preset strategy"
            defaultValue=""
          >
            <option value="" disabled>Load preset…</option>
            {PRESET_NAMES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button
            onClick={() => updateStrategy({ blocks: [], updatedAt: new Date().toISOString() })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
            aria-label="Clear all blocks"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Copy JSON
          </button>

          {exportMsg && (
            <span className="text-xs text-green-400 self-center" role="status">{exportMsg}</span>
          )}
        </div>
      </div>

      {/* Strategy name input */}
      <div className="mb-4 flex gap-3 items-center">
        <input
          type="text"
          value={strategy.name}
          onChange={(e) => updateStrategy({ name: e.target.value })}
          className="flex-1 max-w-xs text-sm rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Strategy name"
          placeholder="Strategy name"
        />
        <input
          type="text"
          value={strategy.description}
          onChange={(e) => updateStrategy({ description: e.target.value })}
          className="flex-1 text-sm rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Strategy description"
          placeholder="Optional description…"
        />
      </div>

      {/* ── Layout: toolbar | canvas | preview ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Block palette */}
        <StrategyToolbar isPremium={isPremium} onAddBlock={addBlock} />

        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <StrategyCanvas
            blocks={strategy.blocks}
            isPremium={isPremium}
            onBlocksChange={(blocks) => updateStrategy({ blocks })}
          />
        </div>

        {/* Preview panel */}
        <aside className="w-full lg:w-72 flex-shrink-0 rounded-xl border border-border/40 bg-muted/20 p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">Strategy Preview</h3>
          <StrategyPreview strategy={strategy} />
        </aside>
      </div>
    </main>
  );
}
