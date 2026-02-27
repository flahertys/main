"use client";

import { useCallback, useEffect, useMemo } from "react";

type WorkflowTask = "chat" | "generate" | "summarize" | "qa";
type HubTab = "CHAT" | "IMAGE_GEN" | "MARKET";

type SlashCommand = {
  id: string;
  label: string;
  description: string;
  execute: () => void;
  clearInputAfterExecute?: boolean;
};

type CommandPaletteEntry = {
  id: string;
  label: string;
  hint: string;
  action: () => void;
};

interface UseChatCommandControlsOptions {
  chatInput: string;
  commandQuery: string;
  commandSelectionIndex: number;
  isCommandPaletteOpen: boolean;
  setCommandSelectionIndex: React.Dispatch<React.SetStateAction<number>>;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  setChatStatus: React.Dispatch<React.SetStateAction<string>>;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCommandQuery: React.Dispatch<React.SetStateAction<string>>;
  onStartNewChat: () => void;
  onTogglePromptLibrary: () => void;
  onSetWorkflowTask: (task: WorkflowTask) => void;
  onSetActiveTab: (tab: HubTab) => void;
  onSaveSessionPreset: () => void;
  onExportSession: () => void;
  onImportSession: () => void;
  onCreateWorkspaceSnapshot: () => void;
  onRestorePreviousWorkspaceSnapshot: () => void;
  onCopyLastReply: () => Promise<void>;
  onExportTranscript: () => void;
}

export function useChatCommandControls({
  chatInput,
  commandQuery,
  commandSelectionIndex,
  isCommandPaletteOpen,
  setCommandSelectionIndex,
  setChatInput,
  setChatStatus,
  setIsCommandPaletteOpen,
  setCommandQuery,
  onStartNewChat,
  onTogglePromptLibrary,
  onSetWorkflowTask,
  onSetActiveTab,
  onSaveSessionPreset,
  onExportSession,
  onImportSession,
  onCreateWorkspaceSnapshot,
  onRestorePreviousWorkspaceSnapshot,
  onCopyLastReply,
  onExportTranscript,
}: UseChatCommandControlsOptions) {
  const slashCommands = useMemo<SlashCommand[]>(
    () => [
      {
        id: "new",
        label: "/new",
        description: "Start a new secure chat session",
        execute: onStartNewChat,
      },
      {
        id: "palette",
        label: "/palette",
        description: "Open command palette",
        execute: () => {
          setCommandQuery("");
          setIsCommandPaletteOpen(true);
        },
      },
      {
        id: "library",
        label: "/library",
        description: "Toggle prompt library drawer",
        execute: onTogglePromptLibrary,
      },
      {
        id: "task-chat",
        label: "/chat",
        description: "Switch to Neural Chat task",
        execute: () => onSetWorkflowTask("chat"),
      },
      {
        id: "task-generate",
        label: "/generate",
        description: "Switch to Generate task",
        execute: () => onSetWorkflowTask("generate"),
      },
      {
        id: "task-summarize",
        label: "/summarize",
        description: "Switch to Summarize task",
        execute: () => onSetWorkflowTask("summarize"),
      },
      {
        id: "task-qa",
        label: "/qa",
        description: "Switch to QA task",
        execute: () => onSetWorkflowTask("qa"),
      },
      {
        id: "tab-chat",
        label: "/tabchat",
        description: "Open AI Chat workspace",
        execute: () => onSetActiveTab("CHAT"),
      },
      {
        id: "tab-image",
        label: "/tabimage",
        description: "Open Image Tool workspace",
        execute: () => onSetActiveTab("IMAGE_GEN"),
      },
      {
        id: "tab-market",
        label: "/tabmarket",
        description: "Open Market Tools workspace",
        execute: () => onSetActiveTab("MARKET"),
      },
      {
        id: "save-preset",
        label: "/savepreset",
        description: "Save current settings as a session preset",
        execute: onSaveSessionPreset,
      },
      {
        id: "export-session",
        label: "/exportsession",
        description: "Export full session snapshot",
        execute: onExportSession,
      },
      {
        id: "import-session",
        label: "/importsession",
        description: "Import a session snapshot JSON",
        execute: onImportSession,
      },
      {
        id: "snapshot",
        label: "/snapshot",
        description: "Capture workspace timeline snapshot",
        execute: onCreateWorkspaceSnapshot,
      },
      {
        id: "undo-snapshot",
        label: "/undo",
        description: "Restore previous workspace snapshot",
        execute: onRestorePreviousWorkspaceSnapshot,
      },
      {
        id: "help",
        label: "/help",
        description: "Show available slash commands",
        execute: () => {
          setChatInput("/");
          setChatStatus("Slash command help opened. Pick a command below or type one directly.");
        },
        clearInputAfterExecute: false,
      },
    ],
    [
      onCreateWorkspaceSnapshot,
      onExportSession,
      onImportSession,
      onRestorePreviousWorkspaceSnapshot,
      onSaveSessionPreset,
      onSetWorkflowTask,
      onSetActiveTab,
      onStartNewChat,
      onTogglePromptLibrary,
      setCommandQuery,
      setChatInput,
      setChatStatus,
      setIsCommandPaletteOpen,
    ],
  );

  const commandPaletteEntries = useMemo<CommandPaletteEntry[]>(
    () => [
      { id: "new-chat", label: "New Chat", hint: "Start a fresh secure session", action: onStartNewChat },
      { id: "toggle-library", label: "Toggle Prompt Library", hint: "Open/close curated prompt drawer", action: onTogglePromptLibrary },
      { id: "task-chat", label: "Mode: Neural Chat", hint: "Relationship-aware assistant mode", action: () => onSetWorkflowTask("chat") },
      { id: "task-generate", label: "Mode: Generate", hint: "Draft long-form or short-form output", action: () => onSetWorkflowTask("generate") },
      { id: "task-summarize", label: "Mode: Summarize", hint: "Compress dense source into action summary", action: () => onSetWorkflowTask("summarize") },
      { id: "task-qa", label: "Mode: Q&A", hint: "Ground answers in explicit context", action: () => onSetWorkflowTask("qa") },
      { id: "open-chat-tab", label: "Open AI Chat", hint: "Switch workspace to AI chat", action: () => onSetActiveTab("CHAT") },
      { id: "open-image-tab", label: "Open Image Tool", hint: "Switch workspace to image generation", action: () => onSetActiveTab("IMAGE_GEN") },
      { id: "open-market-tab", label: "Open Market Tools", hint: "Switch workspace to market tools", action: () => onSetActiveTab("MARKET") },
      { id: "save-preset", label: "Save Session Preset", hint: "Store current operator setup", action: onSaveSessionPreset },
      { id: "export-session", label: "Export Session Snapshot", hint: "Download settings, memory, and presets JSON", action: onExportSession },
      { id: "import-session", label: "Import Session Snapshot", hint: "Paste JSON to restore a saved workspace", action: onImportSession },
      { id: "capture-workspace", label: "Capture Workspace Snapshot", hint: "Save full timeline snapshot of current state", action: onCreateWorkspaceSnapshot },
      { id: "undo-workspace", label: "Undo to Previous Snapshot", hint: "Rewind workspace to prior saved state", action: onRestorePreviousWorkspaceSnapshot },
      { id: "copy-last", label: "Copy Last Reply", hint: "Copy latest assistant output", action: () => { void onCopyLastReply(); } },
      { id: "export", label: "Export Transcript", hint: "Download current session transcript", action: onExportTranscript },
    ],
    [
      onCopyLastReply,
      onCreateWorkspaceSnapshot,
      onExportSession,
      onExportTranscript,
      onImportSession,
      onRestorePreviousWorkspaceSnapshot,
      onSaveSessionPreset,
      onSetWorkflowTask,
      onSetActiveTab,
      onStartNewChat,
      onTogglePromptLibrary,
    ],
  );

  const slashQuery = chatInput.startsWith("/") ? chatInput.slice(1).trim().toLowerCase() : "";

  const filteredSlashCommands = useMemo(
    () =>
      chatInput.startsWith("/")
        ? slashCommands.filter(
            (command) =>
              command.label.replace(/^\//, "").includes(slashQuery) || command.description.toLowerCase().includes(slashQuery),
          )
        : [],
    [chatInput, slashCommands, slashQuery],
  );

  const filteredCommandPaletteEntries = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    return commandPaletteEntries.filter((entry) => {
      if (!query) return true;
      return entry.label.toLowerCase().includes(query) || entry.hint.toLowerCase().includes(query);
    });
  }, [commandPaletteEntries, commandQuery]);

  const runPaletteCommand = useCallback(
    (id: string) => {
      const match = commandPaletteEntries.find((entry) => entry.id === id);
      if (!match) return;
      match.action();
      setIsCommandPaletteOpen(false);
      setCommandQuery("");
    },
    [commandPaletteEntries, setCommandQuery, setIsCommandPaletteOpen],
  );

  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const onPaletteKeyDown = (event: KeyboardEvent) => {
      if (filteredCommandPaletteEntries.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCommandSelectionIndex((prev) => (prev + 1) % filteredCommandPaletteEntries.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCommandSelectionIndex((prev) => (prev <= 0 ? filteredCommandPaletteEntries.length - 1 : prev - 1));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selected = filteredCommandPaletteEntries[Math.min(commandSelectionIndex, filteredCommandPaletteEntries.length - 1)];
        if (selected) {
          runPaletteCommand(selected.id);
        }
      }
    };

    window.addEventListener("keydown", onPaletteKeyDown);
    return () => window.removeEventListener("keydown", onPaletteKeyDown);
  }, [commandSelectionIndex, filteredCommandPaletteEntries, isCommandPaletteOpen, runPaletteCommand, setCommandSelectionIndex]);

  const applySlashCommand = useCallback(
    (command: SlashCommand) => {
      command.execute();
      if (command.clearInputAfterExecute !== false) {
        setChatInput("");
      }
      setChatStatus(`Executed ${command.label}`);
    },
    [setChatInput, setChatStatus],
  );

  const tryExecuteSlashInput = useCallback(
    (input: string) => {
      if (!input.startsWith("/")) return false;
      const slashToken = input.split(/\s+/)[0].trim().toLowerCase();
      const command = slashCommands.find((item) => item.label === slashToken);
      if (!command) {
        const startsWithMatches = slashCommands.filter((item) => item.label.startsWith(slashToken));
        if (startsWithMatches.length === 1) {
          applySlashCommand(startsWithMatches[0]);
          setChatStatus(`Executed ${startsWithMatches[0].label} (auto-matched).`);
          return true;
        }

        const includesMatches = slashCommands.filter((item) => item.label.includes(slashToken.replace(/^\//, "")));
        const suggestions = [...startsWithMatches, ...includesMatches]
          .map((item) => item.label)
          .filter((value, index, arr) => arr.indexOf(value) === index)
          .slice(0, 4);

        const suggestionText = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(", ")}?` : "";
        setChatStatus(`Unknown slash command.${suggestionText} Try /help.`);
        return true;
      }

      applySlashCommand(command);
      return true;
    },
    [applySlashCommand, setChatStatus, slashCommands],
  );

  return {
    filteredSlashCommands,
    filteredCommandPaletteEntries,
    applySlashCommand,
    runPaletteCommand,
    tryExecuteSlashInput,
  };
}
