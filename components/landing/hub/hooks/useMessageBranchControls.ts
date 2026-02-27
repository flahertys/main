/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BranchTrailEntry {
  id: string;
  kind: "retry" | "edit-retry";
  fromIndex: number;
  preview: string;
  createdAt: number;
}

export function useMessageBranchControls() {
  const [branchTrail, setBranchTrail] = useState<BranchTrailEntry[]>([]);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingMessageDraft, setEditingMessageDraft] = useState("");

  const beginEditMessage = useCallback((messages: Message[], index: number) => {
    const target = messages[index];
    if (!target || target.role !== "user") return;
    setEditingMessageIndex(index);
    setEditingMessageDraft(target.content);
  }, []);

  const cancelEditMessage = useCallback(() => {
    setEditingMessageIndex(null);
    setEditingMessageDraft("");
  }, []);

  const pruneConversationAtUser = useCallback(
    (
      messages: Message[],
      index: number,
      replacementContent: string | undefined,
      setMessages: Dispatch<SetStateAction<Message[]>>,
    ) => {
      const target = messages[index];
      if (!target || target.role !== "user") return "";

      const updatedUserContent = (replacementContent ?? target.content).trim();
      if (!updatedUserContent) return "";

      const nextHistory = messages.slice(0, index + 1).map((entry, entryIdx) =>
        entryIdx === index
          ? {
              ...entry,
              content: updatedUserContent,
            }
          : entry,
      );
      setMessages(nextHistory);
      return updatedUserContent;
    },
    [],
  );

  const logBranch = useCallback((kind: "retry" | "edit-retry", fromIndex: number, preview: string) => {
    const safePreview = preview.trim().slice(0, 120);
    if (!safePreview) return;

    setBranchTrail((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind,
        fromIndex,
        preview: safePreview,
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 18));
  }, []);

  const clearBranchTrail = useCallback(() => {
    setBranchTrail([]);
  }, []);

  return {
    branchTrail,
    setBranchTrail,
    clearBranchTrail,
    editingMessageIndex,
    editingMessageDraft,
    setEditingMessageDraft,
    beginEditMessage,
    cancelEditMessage,
    pruneConversationAtUser,
    logBranch,
  };
}
