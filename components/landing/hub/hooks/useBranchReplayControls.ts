"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface BranchReplayEntry {
  id: string;
  kind: "retry" | "edit-retry";
  fromIndex: number;
  preview: string;
  createdAt: number;
}

interface UseBranchReplayControlsOptions {
  branchTrail: BranchReplayEntry[];
  onRestoreEntry: (entry: BranchReplayEntry) => void;
}

export function useBranchReplayControls({ branchTrail, onRestoreEntry }: UseBranchReplayControlsOptions) {
  const [replayCursor, setReplayCursor] = useState(0);

  useEffect(() => {
    setReplayCursor((prev) => Math.min(prev, Math.max(0, branchTrail.length - 1)));
  }, [branchTrail]);

  const replayEntries = branchTrail;

  const activeReplayEntry = useMemo(() => {
    if (replayEntries.length === 0) return null;
    return replayEntries[Math.min(replayCursor, replayEntries.length - 1)];
  }, [replayCursor, replayEntries]);

  const stepReplay = useCallback(
    (delta: number) => {
      setReplayCursor((prev) => {
        const next = prev + delta;
        if (next < 0) return 0;
        if (next >= replayEntries.length) return Math.max(0, replayEntries.length - 1);
        return next;
      });
    },
    [replayEntries.length],
  );

  const restoreReplayEntry = useCallback(
    (entry: BranchReplayEntry | null) => {
      if (!entry) return;
      onRestoreEntry(entry);
    },
    [onRestoreEntry],
  );

  return {
    replayCursor,
    replayEntries,
    activeReplayEntry,
    stepReplay,
    restoreReplayEntry,
  };
}
