"use client";

import {
    normalizePromptLibraryItems,
    normalizeSessionPresets,
    normalizeWorkspaceSnapshots,
    type ParsedPromptLibraryItem,
    type ParsedSessionPreset,
    type ParsedWorkspaceSnapshot,
} from "@/components/landing/hub/utils/sessionSnapshotParser";
import { useEffect } from "react";

type ResponseStyle = "concise" | "coach" | "operator";
type RiskStance = "guarded" | "balanced" | "aggressive";
type PersonaPresetId = "mystic" | "analyst" | "mentor";
type LlmWorkflowTask = "chat" | "generate" | "summarize" | "qa";
type LlmDepth = "quick" | "balanced" | "deep";
type PromptLibraryCategory = "trading" | "content" | "ops";

type PromptLibraryItem = ParsedPromptLibraryItem;

type SessionPreset = ParsedSessionPreset;

type WorkspaceSnapshot = ParsedWorkspaceSnapshot;

interface WorkspaceTimelineValues {
  customPromptPacks: PromptLibraryItem[];
  sessionPresets: SessionPreset[];
  workspaceSnapshots: WorkspaceSnapshot[];
}

interface WorkspaceTimelineSetters {
  setCustomPromptPacks: (value: PromptLibraryItem[]) => void;
  setSessionPresets: (value: SessionPreset[]) => void;
  setWorkspaceSnapshots: (value: WorkspaceSnapshot[]) => void;
  setSelectedWorkspaceSnapshotId: (value: string | null) => void;
}

interface UseWorkspaceTimelinePersistenceOptions {
  values: WorkspaceTimelineValues;
  setters: WorkspaceTimelineSetters;
}

export function useWorkspaceTimelinePersistence({ values, setters }: UseWorkspaceTimelinePersistenceOptions) {
  const {
    setCustomPromptPacks,
    setSessionPresets,
    setWorkspaceSnapshots,
    setSelectedWorkspaceSnapshotId,
  } = setters;

  useEffect(() => {
    const storedCustomPrompts = localStorage.getItem("tradehax_ai_custom_prompt_packs");
    if (storedCustomPrompts) {
      try {
        const parsed = JSON.parse(storedCustomPrompts);
        setCustomPromptPacks(normalizePromptLibraryItems(parsed));
      } catch {
        // ignore malformed prompt pack payload
      }
    }

    const storedSessionPresets = localStorage.getItem("tradehax_ai_session_presets");
    if (storedSessionPresets) {
      try {
        const parsed = JSON.parse(storedSessionPresets);
        setSessionPresets(normalizeSessionPresets(parsed));
      } catch {
        // ignore malformed preset payload
      }
    }

    const storedWorkspaceSnapshots = localStorage.getItem("tradehax_ai_workspace_timeline");
    if (storedWorkspaceSnapshots) {
      try {
        const parsed = JSON.parse(storedWorkspaceSnapshots);
        const hydrated = normalizeWorkspaceSnapshots(parsed);
        setWorkspaceSnapshots(hydrated);
        if (hydrated[0]?.id) {
          setSelectedWorkspaceSnapshotId(hydrated[0].id);
        }
      } catch {
        // ignore malformed timeline payload
      }
    }
  }, [
    setCustomPromptPacks,
    setSessionPresets,
    setWorkspaceSnapshots,
    setSelectedWorkspaceSnapshotId,
  ]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_custom_prompt_packs", JSON.stringify(values.customPromptPacks.slice(0, 24)));
  }, [values.customPromptPacks]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_session_presets", JSON.stringify(values.sessionPresets.slice(0, 20)));
  }, [values.sessionPresets]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_workspace_timeline", JSON.stringify(values.workspaceSnapshots.slice(0, 16)));
  }, [values.workspaceSnapshots]);
}
