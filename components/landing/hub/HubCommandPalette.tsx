"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command, Search } from "lucide-react";

type CommandEntry = {
  id: string;
  label: string;
  hint: string;
};

type HubCommandPaletteProps = {
  isOpen: boolean;
  commandQuery: string;
  setCommandQuery: (value: string) => void;
  commandSelectionIndex: number;
  filteredEntries: CommandEntry[];
  onClose: () => void;
  onRunCommand: (id: string) => void;
  onSetSelectionIndex: (index: number) => void;
};

export function HubCommandPalette({
  isOpen,
  commandQuery,
  setCommandQuery,
  commandSelectionIndex,
  filteredEntries,
  onClose,
  onRunCommand,
  onSetSelectionIndex,
}: HubCommandPaletteProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 px-4 pt-24 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-2xl rounded-2xl border border-cyan-400/25 bg-[rgba(8,12,18,0.96)] shadow-[0_0_40px_rgba(34,211,238,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
              <Search className="h-4 w-4 text-cyan-300" />
              <input
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value.slice(0, 80))}
                placeholder="Search commands..."
                className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
                autoFocus
              />
              <span className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[9px] uppercase text-zinc-400">
                Esc
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onRunCommand(entry.id)}
                    onMouseEnter={() => onSetSelectionIndex(index)}
                    className={`mb-1 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                      commandSelectionIndex === index
                        ? "border-cyan-300/45 bg-cyan-500/10"
                        : "border-white/10 bg-black/35 hover:border-cyan-300/35"
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-cyan-100">{entry.label}</p>
                      <p className="text-[10px] text-zinc-400">{entry.hint}</p>
                    </div>
                    <Command className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-4 text-center text-[11px] text-zinc-500">
                  No commands match your query.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] text-zinc-400">
              <span>Tip: press Ctrl/Cmd + K any time</span>
              <span>Phase 3 Operator Palette</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
