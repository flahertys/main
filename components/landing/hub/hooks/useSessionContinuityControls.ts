"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type ResponseStyle = "concise" | "coach" | "operator";
type RiskStance = "guarded" | "balanced" | "aggressive";
type PersonaPresetId = "mystic" | "analyst" | "mentor";
type LlmWorkflowTask = "chat" | "generate" | "summarize" | "qa";
type LlmDepth = "quick" | "balanced" | "deep";

interface SessionPreset {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

interface PromptLibraryItem {
  id: string;
  title: string;
  category: "trading" | "content" | "ops";
  value: string;
}

interface MemoryCard {
  id: string;
  scope: "short" | "long";
  title: string;
  content: string;
  updatedAt: number;
  confidence: number;
}

interface WorkspaceSettingsSnapshot {
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

interface WorkspaceSnapshotPayload {
  settings: WorkspaceSettingsSnapshot;
  customPromptPacks: PromptLibraryItem[];
  memoryCards: MemoryCard[];
  sessionPresets: SessionPreset[];
}

interface WorkspaceSnapshot {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  payload: WorkspaceSnapshotPayload;
}

interface SessionSettingsInput {
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

interface SessionSetterActions {
  setGuideName: (value: string) => void;
  setResponseStyle: (value: ResponseStyle) => void;
  setRiskStance: (value: RiskStance) => void;
  setFocusSymbol: (value: string) => void;
  setSessionIntent: (value: string) => void;
  setPersonaPreset: (value: PersonaPresetId) => void;
  setWorkflowTask: (value: LlmWorkflowTask) => void;
  setWorkflowDepth: (value: LlmDepth) => void;
  setWorkflowCreativity: (value: number) => void;
}

interface UseSessionContinuityControlsOptions {
  settings: SessionSettingsInput;
  customPromptPacks: PromptLibraryItem[];
  memoryCards: MemoryCard[];
  sessionPresets: SessionPreset[];
  sessionPresetName: string;
  workspaceSnapshots: WorkspaceSnapshot[];
  workspaceSnapshotName: string;
  selectedWorkspaceSnapshotId: string | null;
  setSessionPresets: Dispatch<SetStateAction<SessionPreset[]>>;
  setSessionPresetName: Dispatch<SetStateAction<string>>;
  setWorkspaceSnapshots: Dispatch<SetStateAction<WorkspaceSnapshot[]>>;
  setWorkspaceSnapshotName: Dispatch<SetStateAction<string>>;
  setSelectedWorkspaceSnapshotId: Dispatch<SetStateAction<string | null>>;
  setCustomPromptPacks: (value: PromptLibraryItem[]) => void;
  setMemoryCards: (value: MemoryCard[]) => void;
  sessionSetters: SessionSetterActions;
  normalizeSymbol: (value: string) => string;
  onActivateChat: () => void;
  setChatStatus: Dispatch<SetStateAction<string>>;
}

export function useSessionContinuityControls({
  settings,
  customPromptPacks,
  memoryCards,
  sessionPresets,
  sessionPresetName,
  workspaceSnapshots,
  workspaceSnapshotName,
  selectedWorkspaceSnapshotId,
  setSessionPresets,
  setSessionPresetName,
  setWorkspaceSnapshots,
  setWorkspaceSnapshotName,
  setSelectedWorkspaceSnapshotId,
  setCustomPromptPacks,
  setMemoryCards,
  sessionSetters,
  normalizeSymbol,
  onActivateChat,
  setChatStatus,
}: UseSessionContinuityControlsOptions) {
  const buildWorkspaceSettingsSnapshot = useCallback((): WorkspaceSettingsSnapshot => ({
    guideName: settings.guideName,
    responseStyle: settings.responseStyle,
    riskStance: settings.riskStance,
    focusSymbol: settings.focusSymbol,
    sessionIntent: settings.sessionIntent,
    personaPreset: settings.personaPreset,
    workflowTask: settings.workflowTask,
    workflowDepth: settings.workflowDepth,
    workflowCreativity: settings.workflowCreativity,
  }), [settings]);

  const createSessionPreset = useCallback(() => {
    const cleanedName = sessionPresetName.trim().slice(0, 42) || `${settings.personaPreset.toUpperCase()} • ${settings.focusSymbol}`;
    const preset: SessionPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanedName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      guideName: settings.guideName,
      responseStyle: settings.responseStyle,
      riskStance: settings.riskStance,
      focusSymbol: settings.focusSymbol,
      sessionIntent: settings.sessionIntent,
      personaPreset: settings.personaPreset,
      workflowTask: settings.workflowTask,
      workflowDepth: settings.workflowDepth,
      workflowCreativity: settings.workflowCreativity,
    };

    setSessionPresets((prev) => [preset, ...prev].slice(0, 20));
    setSessionPresetName("");
    setChatStatus(`Saved session preset: ${cleanedName}`);
  }, [sessionPresetName, settings, setSessionPresets, setSessionPresetName, setChatStatus]);

  const applySessionPreset = useCallback((preset: SessionPreset) => {
    sessionSetters.setGuideName(preset.guideName);
    sessionSetters.setResponseStyle(preset.responseStyle);
    sessionSetters.setRiskStance(preset.riskStance);
    sessionSetters.setFocusSymbol(normalizeSymbol(preset.focusSymbol) || "SOL");
    sessionSetters.setSessionIntent(preset.sessionIntent);
    sessionSetters.setPersonaPreset(preset.personaPreset);
    sessionSetters.setWorkflowTask(preset.workflowTask);
    sessionSetters.setWorkflowDepth(preset.workflowDepth);
    sessionSetters.setWorkflowCreativity(Math.max(20, Math.min(100, Math.round(preset.workflowCreativity))));

    setSessionPresets((prev) =>
      prev
        .map((item) =>
          item.id === preset.id
            ? {
                ...item,
                updatedAt: Date.now(),
              }
            : item,
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );

    onActivateChat();
    setChatStatus(`Applied preset: ${preset.name}`);
  }, [normalizeSymbol, onActivateChat, sessionSetters, setChatStatus, setSessionPresets]);

  const deleteSessionPreset = useCallback((id: string) => {
    setSessionPresets((prev) => prev.filter((item) => item.id !== id));
    setChatStatus("Session preset removed.");
  }, [setSessionPresets, setChatStatus]);

  const createWorkspaceSnapshot = useCallback((customName?: string) => {
    const nextVersion = (workspaceSnapshots[0]?.version ?? 0) + 1;
    const snapshotName = (customName ?? workspaceSnapshotName).trim().slice(0, 56) || `Workspace v${nextVersion}`;
    const snapshot: WorkspaceSnapshot = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: snapshotName,
      version: nextVersion,
      createdAt: Date.now(),
      payload: {
        settings: buildWorkspaceSettingsSnapshot(),
        customPromptPacks: customPromptPacks.slice(0, 24),
        memoryCards: memoryCards.slice(0, 12),
        sessionPresets: sessionPresets.slice(0, 20),
      },
    };

    setWorkspaceSnapshots((prev) => [snapshot, ...prev].slice(0, 16));
    setSelectedWorkspaceSnapshotId(snapshot.id);
    setWorkspaceSnapshotName("");
    setChatStatus(`Workspace snapshot saved: ${snapshot.name}`);
  }, [
    workspaceSnapshots,
    workspaceSnapshotName,
    buildWorkspaceSettingsSnapshot,
    customPromptPacks,
    memoryCards,
    sessionPresets,
    setWorkspaceSnapshots,
    setSelectedWorkspaceSnapshotId,
    setWorkspaceSnapshotName,
    setChatStatus,
  ]);

  const restoreWorkspaceSnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    const snapshotSettings = snapshot.payload.settings;
    sessionSetters.setGuideName(snapshotSettings.guideName);
    sessionSetters.setResponseStyle(snapshotSettings.responseStyle);
    sessionSetters.setRiskStance(snapshotSettings.riskStance);
    sessionSetters.setFocusSymbol(normalizeSymbol(snapshotSettings.focusSymbol) || "SOL");
    sessionSetters.setSessionIntent(snapshotSettings.sessionIntent.slice(0, 72));
    sessionSetters.setPersonaPreset(snapshotSettings.personaPreset);
    sessionSetters.setWorkflowTask(snapshotSettings.workflowTask);
    sessionSetters.setWorkflowDepth(snapshotSettings.workflowDepth);
    sessionSetters.setWorkflowCreativity(Math.max(20, Math.min(100, Math.round(snapshotSettings.workflowCreativity))));

    setCustomPromptPacks(snapshot.payload.customPromptPacks.slice(0, 24));
    setMemoryCards(snapshot.payload.memoryCards.slice(0, 12));
    setSessionPresets(snapshot.payload.sessionPresets.slice(0, 20));
    setSelectedWorkspaceSnapshotId(snapshot.id);
    onActivateChat();
    setChatStatus(`Restored workspace snapshot: ${snapshot.name}`);
  }, [
    normalizeSymbol,
    onActivateChat,
    sessionSetters,
    setChatStatus,
    setCustomPromptPacks,
    setMemoryCards,
    setSessionPresets,
    setSelectedWorkspaceSnapshotId,
  ]);

  const restorePreviousWorkspaceSnapshot = useCallback(() => {
    if (workspaceSnapshots.length < 2) {
      setChatStatus("No previous workspace snapshot available.");
      return;
    }
    restoreWorkspaceSnapshot(workspaceSnapshots[1]);
  }, [restoreWorkspaceSnapshot, setChatStatus, workspaceSnapshots]);

  const deleteWorkspaceSnapshot = useCallback((id: string) => {
    setWorkspaceSnapshots((prev) => prev.filter((item) => item.id !== id));
    if (selectedWorkspaceSnapshotId === id) {
      setSelectedWorkspaceSnapshotId(null);
    }
    setChatStatus("Workspace snapshot deleted.");
  }, [selectedWorkspaceSnapshotId, setChatStatus, setSelectedWorkspaceSnapshotId, setWorkspaceSnapshots]);

  const getWorkspaceSnapshotDiff = useCallback((snapshot: WorkspaceSnapshot) => {
    const currentSettings = buildWorkspaceSettingsSnapshot();
    const incomingSettings = snapshot.payload.settings;
    const changedSettings = (Object.keys(currentSettings) as Array<keyof WorkspaceSettingsSnapshot>).filter(
      (key) => currentSettings[key] !== incomingSettings[key],
    );

    return {
      changedSettings,
      customPromptDelta: snapshot.payload.customPromptPacks.length - customPromptPacks.length,
      memoryDelta: snapshot.payload.memoryCards.length - memoryCards.length,
      presetsDelta: snapshot.payload.sessionPresets.length - sessionPresets.length,
    };
  }, [buildWorkspaceSettingsSnapshot, customPromptPacks.length, memoryCards.length, sessionPresets.length]);

  const selectedWorkspaceSnapshot = useMemo(
    () =>
      selectedWorkspaceSnapshotId
        ? workspaceSnapshots.find((item) => item.id === selectedWorkspaceSnapshotId) ?? null
        : workspaceSnapshots[0] ?? null,
    [selectedWorkspaceSnapshotId, workspaceSnapshots],
  );

  const selectedWorkspaceSnapshotDiff = useMemo(
    () => (selectedWorkspaceSnapshot ? getWorkspaceSnapshotDiff(selectedWorkspaceSnapshot) : null),
    [getWorkspaceSnapshotDiff, selectedWorkspaceSnapshot],
  );

  return {
    createSessionPreset,
    applySessionPreset,
    deleteSessionPreset,
    createWorkspaceSnapshot,
    restoreWorkspaceSnapshot,
    restorePreviousWorkspaceSnapshot,
    deleteWorkspaceSnapshot,
    selectedWorkspaceSnapshot,
    selectedWorkspaceSnapshotDiff,
  };
}
