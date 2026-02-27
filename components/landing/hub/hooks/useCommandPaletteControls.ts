"use client";

import { useEffect } from "react";

interface UseCommandPaletteControlsOptions {
  commandQuery: string;
  isCommandPaletteOpen: boolean;
  setCommandSelectionIndex: (value: number) => void;
  onOpenPalette: () => void;
  onClosePalette: () => void;
}

export function useCommandPaletteControls({
  commandQuery,
  isCommandPaletteOpen,
  setCommandSelectionIndex,
  onOpenPalette,
  onClosePalette,
}: UseCommandPaletteControlsOptions) {
  useEffect(() => {
    setCommandSelectionIndex(0);
  }, [commandQuery, isCommandPaletteOpen, setCommandSelectionIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMetaCommand = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isMetaCommand) {
        event.preventDefault();
        onOpenPalette();
        return;
      }

      if (event.key === "Escape") {
        onClosePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenPalette, onClosePalette]);
}
