"use client";

import type { Dispatch, SetStateAction } from "react";

type SocialChannel = "youtube" | "discord" | "x" | "linkedin" | "instagram" | "facebook" | "telegram" | "tiktok";

interface SocialOpsDraft {
  id: string;
  focus: string;
  sourceUrl: string;
  channels: SocialChannel[];
  status: "draft" | "pending_approval" | "approved" | "published";
  scheduledAt?: string;
  performance?: {
    impressions: number;
    engagements: number;
    clicks: number;
  };
  updatedAt: string;
}

interface SocialOpsQueueJob {
  id: string;
  draftId: string;
  channel: SocialChannel;
  runAt: string;
  status: "queued" | "running" | "done" | "failed";
  lastError?: string;
}

interface SocialOpsSnapshot {
  connectors: Partial<Record<SocialChannel, boolean>>;
  drafts: SocialOpsDraft[];
  queue: SocialOpsQueueJob[];
  calendar: Array<{
    draftId: string;
    runAt?: string;
    status: string;
    focus: string;
    channels: SocialChannel[];
    performance?: {
      impressions: number;
      engagements: number;
      clicks: number;
    };
  }>;
}

interface UseWebsiteAutopilotWorkflowsOptions {
  websiteSourceUrl: string;
  autopilotFocus: string;
  autopilotChannels: SocialChannel[];
  latestAutopilotDraft: Record<string, unknown> | null;
  autopilotOpsDraftId: string;
  autopilotScheduleAt: string;
  autopilotImpressions: string;
  autopilotEngagements: string;
  autopilotClicks: string;
  setIsGeneratingAutopilot: Dispatch<SetStateAction<boolean>>;
  setLatestAutopilotDraft: Dispatch<SetStateAction<Record<string, unknown> | null>>;
  setAutopilotOpsLoading: Dispatch<SetStateAction<boolean>>;
  setAutopilotOpsSnapshot: Dispatch<SetStateAction<SocialOpsSnapshot | null>>;
  setAutopilotOpsDraftId: Dispatch<SetStateAction<string>>;
  setChatInput: Dispatch<SetStateAction<string>>;
  setChatStatus: Dispatch<SetStateAction<string>>;
  onActivateChat: () => void;
  addMemoryCard: (scope: "short" | "long", title: string, content: string) => void;
  normalizeVideoUrl: (value: string) => string;
  buildAutopilotDraftBlock: (draft: unknown) => string;
}

export function useWebsiteAutopilotWorkflows({
  websiteSourceUrl,
  autopilotFocus,
  autopilotChannels,
  latestAutopilotDraft,
  autopilotOpsDraftId,
  autopilotScheduleAt,
  autopilotImpressions,
  autopilotEngagements,
  autopilotClicks,
  setIsGeneratingAutopilot,
  setLatestAutopilotDraft,
  setAutopilotOpsLoading,
  setAutopilotOpsSnapshot,
  setAutopilotOpsDraftId,
  setChatInput,
  setChatStatus,
  onActivateChat,
  addMemoryCard,
  normalizeVideoUrl,
  buildAutopilotDraftBlock,
}: UseWebsiteAutopilotWorkflowsOptions) {
  const refreshAutopilotOps = async () => {
    try {
      const response = await fetch("/api/intelligence/content/autopilot", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setChatStatus(typeof payload?.error === "string" ? payload.error : "Failed to refresh social ops status.");
        return;
      }
      setAutopilotOpsSnapshot(payload as SocialOpsSnapshot);
      if (!autopilotOpsDraftId && Array.isArray(payload?.drafts) && payload.drafts[0]?.id) {
        setAutopilotOpsDraftId(String(payload.drafts[0].id));
      }
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : "Could not refresh social ops state.");
    }
  };

  const performAutopilotAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setAutopilotOpsLoading(true);
    try {
      const response = await fetch("/api/intelligence/content/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setChatStatus(typeof payload?.error === "string" ? payload.error : `Autopilot action failed: ${action}`);
        return null;
      }
      await refreshAutopilotOps();
      return payload as Record<string, unknown>;
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : `Autopilot action failed: ${action}`);
      return null;
    } finally {
      setAutopilotOpsLoading(false);
    }
  };

  const generateWebsiteAutopilotDraft = async () => {
    const normalizedSource = normalizeVideoUrl(websiteSourceUrl);
    if (!normalizedSource) {
      setChatStatus("Add a website URL first for social autopilot.");
      return;
    }

    setIsGeneratingAutopilot(true);
    setChatStatus("Generating cross-platform social drafts from website content...");

    try {
      const response = await fetch("/api/intelligence/content/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: normalizedSource,
          focus: autopilotFocus,
          channels: autopilotChannels,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setChatStatus(typeof payload?.error === "string" ? payload.error : "Failed to generate social drafts.");
        return;
      }

      const block = buildAutopilotDraftBlock(payload.draft);
      if (!block) {
        setChatStatus("Draft generation returned empty content.");
        return;
      }

      setLatestAutopilotDraft(payload.draft as Record<string, unknown>);
      onActivateChat();
      setChatInput((prev) => `${prev.trim()}\n\n${block}`.trim().slice(0, 3500));
      addMemoryCard("long", "Website Social Autopilot", block.slice(0, 160));
      setChatStatus("Social autopilot drafts inserted into chat input. Save it to ops when ready.");
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : "Social autopilot request failed.");
    } finally {
      setIsGeneratingAutopilot(false);
    }
  };

  const saveCurrentAutopilotDraftToOps = async () => {
    if (!latestAutopilotDraft) {
      setChatStatus("Generate drafts first, then save to Social Ops.");
      return;
    }

    const response = await performAutopilotAction("create_draft", {
      sourceUrl: String(latestAutopilotDraft.sourceUrl || normalizeVideoUrl(websiteSourceUrl) || ""),
      focus: String(latestAutopilotDraft.focus || autopilotFocus || "cross-platform brand growth"),
      channels: autopilotChannels,
      content:
        latestAutopilotDraft.channels && typeof latestAutopilotDraft.channels === "object"
          ? (latestAutopilotDraft.channels as Record<string, unknown>)
          : {},
    });

    const draft = response?.draft as { id?: string } | undefined;
    if (draft?.id) {
      setAutopilotOpsDraftId(String(draft.id));
      setChatStatus(`Saved draft to social ops: ${draft.id}`);
    }
  };

  const submitAutopilotForApproval = async () => {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    const response = await performAutopilotAction("submit_for_approval", { draftId: autopilotOpsDraftId.trim() });
    if (response) setChatStatus("Draft submitted for approval.");
  };

  const approveAutopilotDraft = async () => {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    const response = await performAutopilotAction("approve_draft", { draftId: autopilotOpsDraftId.trim() });
    if (response) setChatStatus("Draft approved and ready to publish.");
  };

  const scheduleAutopilotDraft = async () => {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    if (!autopilotScheduleAt.trim()) {
      setChatStatus("Pick a schedule datetime first.");
      return;
    }

    const response = await performAutopilotAction("schedule_draft", {
      draftId: autopilotOpsDraftId.trim(),
      runAt: autopilotScheduleAt,
      channels: autopilotChannels,
    });
    if (response) setChatStatus("Draft scheduled and queued by channel.");
  };

  const publishAutopilotNow = async () => {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    const response = await performAutopilotAction("publish_now", {
      draftId: autopilotOpsDraftId.trim(),
      channels: autopilotChannels,
    });
    if (response) setChatStatus("Publish now executed. Check queue results and connector status.");
  };

  const runDueAutopilotJobs = async () => {
    const response = await performAutopilotAction("run_due_jobs");
    if (response) setChatStatus("Processed due queued jobs.");
  };

  const syncAutopilotPerformance = async () => {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }

    const impressions = Number(autopilotImpressions.replace(/\D/g, "") || "0");
    const engagements = Number(autopilotEngagements.replace(/\D/g, "") || "0");
    const clicks = Number(autopilotClicks.replace(/\D/g, "") || "0");

    const response = await performAutopilotAction("update_performance", {
      draftId: autopilotOpsDraftId.trim(),
      metrics: {
        impressions,
        engagements,
        clicks,
      },
    });
    if (response) setChatStatus("Performance metrics synced to calendar feedback loop.");
  };

  return {
    generateWebsiteAutopilotDraft,
    refreshAutopilotOps,
    saveCurrentAutopilotDraftToOps,
    submitAutopilotForApproval,
    approveAutopilotDraft,
    scheduleAutopilotDraft,
    publishAutopilotNow,
    runDueAutopilotJobs,
    syncAutopilotPerformance,
  };
}
