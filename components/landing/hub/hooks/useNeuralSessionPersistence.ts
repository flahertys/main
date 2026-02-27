"use client";

import { useEffect } from "react";

interface NeuralSessionValues<TChannel extends string, TMemoryCard, TBranchTrailEntry> {
  videoSourceUrl: string;
  videoInstructionGoal: string;
  videoCue: string;
  websiteSourceUrl: string;
  autopilotFocus: string;
  autopilotChannels: TChannel[];
  autopilotOpsDraftId: string;
  autopilotScheduleAt: string;
  autopilotImpressions: string;
  autopilotEngagements: string;
  autopilotClicks: string;
  memoryCards: TMemoryCard[];
  branchTrail: TBranchTrailEntry[];
}

interface NeuralSessionSetters<TChannel extends string> {
  setVideoSourceUrl: (value: string) => void;
  setVideoInstructionGoal: (value: string) => void;
  setVideoCue: (value: string) => void;
  setWebsiteSourceUrl: (value: string) => void;
  setAutopilotFocus: (value: string) => void;
  setAutopilotChannels: (value: TChannel[]) => void;
  setAutopilotOpsDraftId: (value: string) => void;
  setAutopilotScheduleAt: (value: string) => void;
  setAutopilotImpressions: (value: string) => void;
  setAutopilotEngagements: (value: string) => void;
  setAutopilotClicks: (value: string) => void;
}

interface UseNeuralSessionPersistenceOptions<TChannel extends string, TMemoryCard, TBranchTrailEntry> {
  values: NeuralSessionValues<TChannel, TMemoryCard, TBranchTrailEntry>;
  setters: NeuralSessionSetters<TChannel>;
  socialChannelIds: readonly TChannel[];
  onHydrateMemoryCards: (rawJson: string) => void;
  onHydrateBranchTrail: (rawJson: string) => void;
}

export function useNeuralSessionPersistence<TChannel extends string, TMemoryCard, TBranchTrailEntry>({
  values,
  setters,
  socialChannelIds,
  onHydrateMemoryCards,
  onHydrateBranchTrail,
}: UseNeuralSessionPersistenceOptions<TChannel, TMemoryCard, TBranchTrailEntry>) {
  const {
    setVideoSourceUrl,
    setVideoInstructionGoal,
    setVideoCue,
    setWebsiteSourceUrl,
    setAutopilotFocus,
    setAutopilotChannels,
    setAutopilotOpsDraftId,
    setAutopilotScheduleAt,
    setAutopilotImpressions,
    setAutopilotEngagements,
    setAutopilotClicks,
  } = setters;

  useEffect(() => {
    const storedVideoUrl = localStorage.getItem("tradehax_ai_video_source_url");
    if (storedVideoUrl && storedVideoUrl.trim()) {
      setVideoSourceUrl(storedVideoUrl.trim().slice(0, 300));
    }

    const storedVideoGoal = localStorage.getItem("tradehax_ai_video_instruction_goal");
    if (storedVideoGoal && storedVideoGoal.trim()) {
      setVideoInstructionGoal(storedVideoGoal.trim().slice(0, 140));
    }

    const storedVideoCue = localStorage.getItem("tradehax_ai_video_cue");
    if (storedVideoCue && storedVideoCue.trim()) {
      setVideoCue(storedVideoCue.trim().slice(0, 140));
    }

    const storedWebsiteSourceUrl = localStorage.getItem("tradehax_ai_website_source_url");
    if (storedWebsiteSourceUrl && storedWebsiteSourceUrl.trim()) {
      setWebsiteSourceUrl(storedWebsiteSourceUrl.trim().slice(0, 300));
    }

    const storedAutopilotFocus = localStorage.getItem("tradehax_ai_autopilot_focus");
    if (storedAutopilotFocus && storedAutopilotFocus.trim()) {
      setAutopilotFocus(storedAutopilotFocus.trim().slice(0, 80));
    }

    const storedChannels = localStorage.getItem("tradehax_ai_autopilot_channels");
    if (storedChannels) {
      try {
        const parsed = JSON.parse(storedChannels) as string[];
        const valid = Array.isArray(parsed)
          ? parsed
              .map((item) => String(item).toLowerCase())
              .filter((item): item is TChannel => socialChannelIds.includes(item as TChannel))
          : [];
        if (valid.length > 0) {
          setAutopilotChannels(Array.from(new Set(valid)).slice(0, 8));
        }
      } catch {
        // ignore malformed storage payload
      }
    }

    const storedOpsDraftId = localStorage.getItem("tradehax_ai_autopilot_ops_draft_id");
    if (storedOpsDraftId && storedOpsDraftId.trim()) {
      setAutopilotOpsDraftId(storedOpsDraftId.trim().slice(0, 80));
    }

    const storedScheduleAt = localStorage.getItem("tradehax_ai_autopilot_schedule_at");
    if (storedScheduleAt && storedScheduleAt.trim()) {
      setAutopilotScheduleAt(storedScheduleAt.trim().slice(0, 40));
    }

    const storedImpressions = localStorage.getItem("tradehax_ai_autopilot_impressions");
    if (storedImpressions && /^\d{1,9}$/.test(storedImpressions)) {
      setAutopilotImpressions(storedImpressions);
    }

    const storedEngagements = localStorage.getItem("tradehax_ai_autopilot_engagements");
    if (storedEngagements && /^\d{1,9}$/.test(storedEngagements)) {
      setAutopilotEngagements(storedEngagements);
    }

    const storedClicks = localStorage.getItem("tradehax_ai_autopilot_clicks");
    if (storedClicks && /^\d{1,9}$/.test(storedClicks)) {
      setAutopilotClicks(storedClicks);
    }

    const storedCards = localStorage.getItem("tradehax_ai_memory_cards");
    if (storedCards) {
      onHydrateMemoryCards(storedCards);
    }

    const storedBranches = localStorage.getItem("tradehax_ai_branch_trail");
    if (storedBranches) {
      onHydrateBranchTrail(storedBranches);
    }
  }, [
    socialChannelIds,
    setVideoSourceUrl,
    setVideoInstructionGoal,
    setVideoCue,
    setWebsiteSourceUrl,
    setAutopilotFocus,
    setAutopilotChannels,
    setAutopilotOpsDraftId,
    setAutopilotScheduleAt,
    setAutopilotImpressions,
    setAutopilotEngagements,
    setAutopilotClicks,
    onHydrateMemoryCards,
    onHydrateBranchTrail,
  ]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_video_source_url", values.videoSourceUrl);
  }, [values.videoSourceUrl]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_video_instruction_goal", values.videoInstructionGoal);
  }, [values.videoInstructionGoal]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_video_cue", values.videoCue);
  }, [values.videoCue]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_website_source_url", values.websiteSourceUrl);
  }, [values.websiteSourceUrl]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_focus", values.autopilotFocus);
  }, [values.autopilotFocus]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_channels", JSON.stringify(values.autopilotChannels));
  }, [values.autopilotChannels]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_ops_draft_id", values.autopilotOpsDraftId);
  }, [values.autopilotOpsDraftId]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_schedule_at", values.autopilotScheduleAt);
  }, [values.autopilotScheduleAt]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_impressions", values.autopilotImpressions.replace(/\D/g, "").slice(0, 9) || "0");
  }, [values.autopilotImpressions]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_engagements", values.autopilotEngagements.replace(/\D/g, "").slice(0, 9) || "0");
  }, [values.autopilotEngagements]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_clicks", values.autopilotClicks.replace(/\D/g, "").slice(0, 9) || "0");
  }, [values.autopilotClicks]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_memory_cards", JSON.stringify(values.memoryCards.slice(0, 12)));
  }, [values.memoryCards]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_branch_trail", JSON.stringify(values.branchTrail.slice(0, 18)));
  }, [values.branchTrail]);
}
