"use client";

import {
  exportLocalNeuralVault,
  saveDatasetArtifact,
  saveLearningEnvironmentArtifact,
  saveTickerBehaviorArtifact,
  saveUserBehaviorArtifact,
} from "@/lib/ai/site-neural-memory";
import type { Dispatch, SetStateAction } from "react";

interface UseNeuralArtifactWorkflowsOptions {
  datasetName: string;
  datasetRows: string;
  datasetNotes: string;
  behaviorLabel: string;
  behaviorObservation: string;
  tickerBehaviorSymbol: string;
  tickerBehaviorPattern: string;
  learningEnvironmentName: string;
  learningEnvironmentHypothesis: string;
  buildHubUserId: () => string;
  refreshNeuralVaultCount: () => void;
  setChatStatus: Dispatch<SetStateAction<string>>;
}

export function useNeuralArtifactWorkflows({
  datasetName,
  datasetRows,
  datasetNotes,
  behaviorLabel,
  behaviorObservation,
  tickerBehaviorSymbol,
  tickerBehaviorPattern,
  learningEnvironmentName,
  learningEnvironmentHypothesis,
  buildHubUserId,
  refreshNeuralVaultCount,
  setChatStatus,
}: UseNeuralArtifactWorkflowsOptions) {
  const saveDatasetNeuralArtifact = async () => {
    const rows = Number(datasetRows.replace(/\D/g, "") || "0");
    if (!datasetName.trim()) {
      setChatStatus("Dataset name is required.");
      return;
    }

    const result = await saveDatasetArtifact({
      name: datasetName,
      rows,
      notes: datasetNotes,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    refreshNeuralVaultCount();
    setChatStatus(result.ok ? "Dataset artifact saved to neural memory." : "Dataset saved locally. Network sync pending.");
  };

  const saveUserBehaviorNeuralArtifact = async () => {
    if (!behaviorLabel.trim() || !behaviorObservation.trim()) {
      setChatStatus("Behavior and observation are required.");
      return;
    }

    const result = await saveUserBehaviorArtifact({
      behavior: behaviorLabel,
      observation: behaviorObservation,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    refreshNeuralVaultCount();
    setChatStatus(result.ok ? "User behavior pattern saved." : "Behavior saved locally. Network sync pending.");
  };

  const saveTickerBehaviorNeuralArtifact = async () => {
    if (!tickerBehaviorSymbol.trim() || !tickerBehaviorPattern.trim()) {
      setChatStatus("Ticker symbol and pattern are required.");
      return;
    }

    const result = await saveTickerBehaviorArtifact({
      ticker: tickerBehaviorSymbol,
      pattern: tickerBehaviorPattern,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    refreshNeuralVaultCount();
    setChatStatus(result.ok ? "Ticker behavior pattern saved." : "Ticker behavior saved locally. Network sync pending.");
  };

  const saveLearningEnvironmentNeuralArtifact = async () => {
    if (!learningEnvironmentName.trim() || !learningEnvironmentHypothesis.trim()) {
      setChatStatus("Environment and hypothesis are required.");
      return;
    }

    const result = await saveLearningEnvironmentArtifact({
      environment: learningEnvironmentName,
      hypothesis: learningEnvironmentHypothesis,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    refreshNeuralVaultCount();
    setChatStatus(result.ok ? "Learning environment saved." : "Learning environment saved locally. Network sync pending.");
  };

  const exportNeuralVaultDataset = () => {
    const result = exportLocalNeuralVault();
    if (!result.ok) {
      setChatStatus("Unable to export neural vault in this environment.");
      return;
    }
    setChatStatus(`Exported neural vault with ${result.count} records.`);
  };

  return {
    saveDatasetNeuralArtifact,
    saveUserBehaviorNeuralArtifact,
    saveTickerBehaviorNeuralArtifact,
    saveLearningEnvironmentNeuralArtifact,
    exportNeuralVaultDataset,
  };
}
