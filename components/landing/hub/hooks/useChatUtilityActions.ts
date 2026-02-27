"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type MemoryScope = "short" | "long";

interface UseChatUtilityActionsOptions {
  guideName: string;
  sessionIntent: string;
  focusSymbol: string;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setChatInput: Dispatch<SetStateAction<string>>;
  setChatStatus: Dispatch<SetStateAction<string>>;
  clearBranchTrail: () => void;
  cancelEditMessage: () => void;
  addMemoryCard: (scope: MemoryScope, title: string, content: string) => void;
}

export function useChatUtilityActions({
  guideName,
  sessionIntent,
  focusSymbol,
  messages,
  setMessages,
  setChatInput,
  setChatStatus,
  clearBranchTrail,
  cancelEditMessage,
  addMemoryCard,
}: UseChatUtilityActionsOptions) {
  const startNewChat = useCallback(() => {
    setMessages([
      {
        role: "assistant",
        content: `${guideName} is synced. Intent locked: ${sessionIntent}. Focus: ${focusSymbol}. Say the word and we begin.`,
      },
    ]);
    clearBranchTrail();
    setChatInput("");
    cancelEditMessage();
    setChatStatus("Started a fresh secure session.");
  }, [cancelEditMessage, clearBranchTrail, focusSymbol, guideName, sessionIntent, setChatInput, setChatStatus, setMessages]);

  const copyLastReply = useCallback(async () => {
    let text = "";
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        text = messages[i].content;
        break;
      }
    }

    if (!text) {
      setChatStatus("No assistant reply to copy yet.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setChatStatus("Copied last reply to clipboard.");
    } catch {
      setChatStatus("Copy failed. Try selecting text manually.");
    }
  }, [messages, setChatStatus]);

  const rememberLastPrompt = useCallback(() => {
    const lastUser = [...messages].reverse().find((item) => item.role === "user")?.content || "";
    if (!lastUser) {
      setChatStatus("No recent user prompt to store.");
      return;
    }
    addMemoryCard("short", `Prompt ${new Date().toLocaleTimeString()}`, lastUser);
    setChatStatus("Stored latest prompt in session memory.");
  }, [addMemoryCard, messages, setChatStatus]);

  const pinCurrentFocus = useCallback(() => {
    addMemoryCard("long", `Focus ${focusSymbol}`, `${sessionIntent} • Symbol: ${focusSymbol}`);
    setChatStatus("Pinned current focus into long-term memory.");
  }, [addMemoryCard, focusSymbol, sessionIntent, setChatStatus]);

  return {
    startNewChat,
    copyLastReply,
    rememberLastPrompt,
    pinCurrentFocus,
  };
}
