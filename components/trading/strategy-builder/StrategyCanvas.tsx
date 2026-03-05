"use client";

/**
 * StrategyCanvas — drag-and-drop canvas for ordering strategy blocks.
 * Uses pointer events only (no external DnD library).
 */

import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { StrategyBlock } from "./StrategyBlock";
import type { StrategyBlock as IStrategyBlock } from "@/types/trading";

interface StrategyCanvasProps {
  blocks: IStrategyBlock[];
  isPremium: boolean;
  onBlocksChange: (blocks: IStrategyBlock[]) => void;
}

/**
 * Drag-and-drop canvas that renders blocks in sequence.
 * Drag is implemented with pointer events — no heavy DnD library required.
 */
export function StrategyCanvas({ blocks, isPremium, onBlocksChange }: StrategyCanvasProps) {
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.PointerEvent, id: string) => {
      dragIdRef.current = id;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!dragIdRef.current) return;

      // Find which block the pointer is over
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const blockEl = target?.closest("[data-block-id]") as HTMLElement | null;
      const overId = blockEl?.dataset.blockId ?? null;

      if (overId && overId !== dragIdRef.current) {
        setDragOverId(overId);
      }
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    if (!dragIdRef.current || !dragOverId) {
      dragIdRef.current = null;
      setDragOverId(null);
      return;
    }

    const fromIdx = blocks.findIndex((b) => b.id === dragIdRef.current);
    const toIdx = blocks.findIndex((b) => b.id === dragOverId);

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const reordered = [...blocks];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      // Update positions
      const updated = reordered.map((b, i) => ({ ...b, position: i }));
      onBlocksChange(updated);
    }

    dragIdRef.current = null;
    setDragOverId(null);
  }, [blocks, dragOverId, onBlocksChange]);

  // ── Block callbacks ───────────────────────────────────────────────────────

  const handleUpdate = useCallback(
    (id: string, changes: Partial<IStrategyBlock>) => {
      onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, ...changes } : b)));
    },
    [blocks, onBlocksChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onBlocksChange(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i })));
    },
    [blocks, onBlocksChange],
  );

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/40 rounded-xl text-muted-foreground text-sm gap-2">
        <span className="text-3xl">🧩</span>
        <p>Add blocks from the palette to build your strategy.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 relative"
      onPointerMove={handleDragOver}
      onPointerUp={handleDragEnd}
      role="list"
      aria-label="Strategy blocks"
    >
      <AnimatePresence>
        {blocks
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((block) => (
            <div
              key={block.id}
              data-block-id={block.id}
              role="listitem"
              className={`transition-all duration-150 ${
                dragOverId === block.id ? "ring-2 ring-primary/60 rounded-lg" : ""
              }`}
            >
              <StrategyBlock
                block={block}
                isPremium={isPremium}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                onDragStart={handleDragStart}
              />
            </div>
          ))}
      </AnimatePresence>
    </div>
  );
}
