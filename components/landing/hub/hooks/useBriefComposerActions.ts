"use client";

import type { Dispatch, SetStateAction } from "react";

interface UseBriefComposerActionsOptions {
  focusSymbol: string;
  videoSourceUrl: string;
  setChatInput: Dispatch<SetStateAction<string>>;
  setChatStatus: Dispatch<SetStateAction<string>>;
  onActivateChat: () => void;
  addMemoryCard: (scope: "short" | "long", title: string, content: string) => void;
  normalizeVideoUrl: (value: string) => string;
  buildVideoInstructionBrief: () => string;
}

export function useBriefComposerActions({
  focusSymbol,
  videoSourceUrl,
  setChatInput,
  setChatStatus,
  onActivateChat,
  addMemoryCard,
  normalizeVideoUrl,
  buildVideoInstructionBrief,
}: UseBriefComposerActionsOptions) {
  const insertBriefIntoChat = (brief: string, emptyMessage: string, successMessage: string) => {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus(emptyMessage);
      return;
    }
    onActivateChat();
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus(successMessage);
  };

  const storeBriefInMemory = (brief: string, title: string, emptyMessage: string, successMessage: string) => {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus(emptyMessage);
      return;
    }
    addMemoryCard("long", title, safeBrief.slice(0, 160));
    setChatStatus(successMessage);
  };

  const insertVideoInstructionBrief = () => {
    const safeUrl = normalizeVideoUrl(videoSourceUrl);
    if (!safeUrl) {
      setChatStatus("Add a video URL first to infuse instructions.");
      return;
    }

    const brief = buildVideoInstructionBrief();
    onActivateChat();
    setChatInput((prev) => `${prev.trim()}\n\n${brief}`.trim().slice(0, 1500));
    setChatStatus("Video AI instruction brief inserted into chat input.");
  };

  const rememberVideoInstructionBrief = () => {
    const safeUrl = normalizeVideoUrl(videoSourceUrl);
    if (!safeUrl) {
      setChatStatus("Cannot store video brief without a URL.");
      return;
    }

    addMemoryCard("long", "Video Instruction Brief", buildVideoInstructionBrief());
    setChatStatus("Stored video instruction brief in long-term memory.");
  };

  const insertCompetitiveEdgeBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Edge brief is empty. Adjust inputs and retry.", "Competitive edge brief inserted into chat input.");
  };

  const rememberCompetitiveEdgeBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Edge Brief ${focusSymbol}`,
      "Nothing to save yet. Build an edge brief first.",
      "Competitive edge brief saved to long-term memory.",
    );
  };

  const insertPostTradeForensicsBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Forensics brief is empty. Fill post-trade inputs first.", "Post-trade forensics brief inserted into chat input.");
  };

  const rememberPostTradeForensicsBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Forensics ${focusSymbol}`,
      "Nothing to store yet. Generate a forensics brief first.",
      "Post-trade recovery brief saved to long-term memory.",
    );
  };

  const insertRegimeShiftSentinelBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Regime sentinel brief is empty. Fill metrics first.", "Regime shift sentinel brief inserted into chat input.");
  };

  const rememberRegimeShiftSentinelBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Regime Sentinel ${focusSymbol}`,
      "No regime brief to store yet.",
      "Regime sentinel brief saved to long-term memory.",
    );
  };

  const insertExecutionLatencyGuardBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Latency guard brief is empty. Fill metrics first.", "Execution latency guard brief inserted into chat input.");
  };

  const rememberExecutionLatencyGuardBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Latency Guard ${focusSymbol}`,
      "No latency guard brief to store yet.",
      "Execution latency guard brief saved to long-term memory.",
    );
  };

  const insertSessionDriftGovernorBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Session drift brief is empty. Fill metrics first.", "Session drift governor brief inserted into chat input.");
  };

  const rememberSessionDriftGovernorBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Session Drift ${focusSymbol}`,
      "No session drift brief to store yet.",
      "Session drift governor brief saved to long-term memory.",
    );
  };

  const insertCapitalPreservationCircuitBrief = (brief: string) => {
    insertBriefIntoChat(
      brief,
      "Capital circuit brief is empty. Fill metrics first.",
      "Capital preservation circuit brief inserted into chat input.",
    );
  };

  const rememberCapitalPreservationCircuitBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Capital Circuit ${focusSymbol}`,
      "No capital circuit brief to store yet.",
      "Capital preservation circuit brief saved to long-term memory.",
    );
  };

  const insertOpportunityCostRadarBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Opportunity cost brief is empty. Fill metrics first.", "Opportunity cost radar brief inserted into chat input.");
  };

  const rememberOpportunityCostRadarBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Opportunity Cost ${focusSymbol}`,
      "No opportunity cost brief to store yet.",
      "Opportunity cost radar brief saved to long-term memory.",
    );
  };

  const insertConvictionCalibrationBrief = (brief: string) => {
    insertBriefIntoChat(brief, "Calibration brief is empty. Fill metrics first.", "Conviction calibration brief inserted into chat input.");
  };

  const rememberConvictionCalibrationBrief = (brief: string) => {
    storeBriefInMemory(
      brief,
      `Calibration ${focusSymbol}`,
      "No calibration brief to store yet.",
      "Conviction calibration brief saved to long-term memory.",
    );
  };

  return {
    insertVideoInstructionBrief,
    rememberVideoInstructionBrief,
    insertCompetitiveEdgeBrief,
    rememberCompetitiveEdgeBrief,
    insertPostTradeForensicsBrief,
    rememberPostTradeForensicsBrief,
    insertRegimeShiftSentinelBrief,
    rememberRegimeShiftSentinelBrief,
    insertExecutionLatencyGuardBrief,
    rememberExecutionLatencyGuardBrief,
    insertSessionDriftGovernorBrief,
    rememberSessionDriftGovernorBrief,
    insertCapitalPreservationCircuitBrief,
    rememberCapitalPreservationCircuitBrief,
    insertOpportunityCostRadarBrief,
    rememberOpportunityCostRadarBrief,
    insertConvictionCalibrationBrief,
    rememberConvictionCalibrationBrief,
  };
}
