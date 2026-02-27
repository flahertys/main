/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

"use client";

import { useCallback, useState } from "react";

type MemoryScope = "short" | "long";

interface MemoryCard {
  id: string;
  scope: MemoryScope;
  title: string;
  content: string;
  updatedAt: number;
  confidence: number;
}

export function useMemoryCardControls() {
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryTitle, setEditingMemoryTitle] = useState("");
  const [editingMemoryContent, setEditingMemoryContent] = useState("");

  const addMemoryCard = useCallback((scope: MemoryScope, title: string, content: string) => {
    const trimmedTitle = title.trim().slice(0, 40);
    const trimmedContent = content.trim().slice(0, 160);
    if (!trimmedTitle || !trimmedContent) return;

    setMemoryCards((prev) => {
      const next = [
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          scope,
          title: trimmedTitle,
          content: trimmedContent,
          updatedAt: Date.now(),
          confidence: scope === "long" ? 84 : 72,
        },
        ...prev,
      ];

      const shorts = next.filter((card) => card.scope === "short").slice(0, 6);
      const longs = next.filter((card) => card.scope === "long").slice(0, 6);
      return [...longs, ...shorts].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12);
    });
  }, []);

  const beginEditMemory = useCallback((card: MemoryCard) => {
    setEditingMemoryId(card.id);
    setEditingMemoryTitle(card.title);
    setEditingMemoryContent(card.content);
  }, []);

  const cancelEditMemory = useCallback(() => {
    setEditingMemoryId(null);
    setEditingMemoryTitle("");
    setEditingMemoryContent("");
  }, []);

  const saveEditMemory = useCallback(
    (id: string) => {
      const title = editingMemoryTitle.trim().slice(0, 40);
      const content = editingMemoryContent.trim().slice(0, 160);
      if (!title || !content) {
        return false;
      }

      setMemoryCards((prev) =>
        prev.map((card) =>
          card.id === id
            ? {
                ...card,
                title,
                content,
                updatedAt: Date.now(),
                confidence: Math.min(100, card.confidence + 4),
              }
            : card,
        ),
      );
      cancelEditMemory();
      return true;
    },
    [cancelEditMemory, editingMemoryContent, editingMemoryTitle],
  );

  const deleteMemoryCard = useCallback((id: string) => {
    setMemoryCards((prev) => prev.filter((card) => card.id !== id));
  }, []);

  const toggleMemoryScope = useCallback((id: string) => {
    setMemoryCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              scope: card.scope === "long" ? "short" : "long",
              updatedAt: Date.now(),
              confidence: Math.min(100, card.confidence + 2),
            }
          : card,
      ),
    );
  }, []);

  const boostMemoryCard = useCallback((id: string) => {
    setMemoryCards((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              updatedAt: Date.now(),
              confidence: Math.min(100, entry.confidence + 8),
            }
          : entry,
      ),
    );
  }, []);

  return {
    memoryCards,
    setMemoryCards,
    editingMemoryId,
    editingMemoryTitle,
    setEditingMemoryTitle,
    editingMemoryContent,
    setEditingMemoryContent,
    addMemoryCard,
    beginEditMemory,
    cancelEditMemory,
    saveEditMemory,
    deleteMemoryCard,
    toggleMemoryScope,
    boostMemoryCard,
  };
}