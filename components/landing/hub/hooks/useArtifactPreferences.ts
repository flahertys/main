"use client";

import { useEffect } from "react";

interface ArtifactPreferenceValues {
  datasetName: string;
  datasetRows: string;
  datasetNotes: string;
  behaviorLabel: string;
  behaviorObservation: string;
  tickerBehaviorSymbol: string;
  tickerBehaviorPattern: string;
  learningEnvironmentName: string;
  learningEnvironmentHypothesis: string;
}

interface ArtifactPreferenceSetters {
  setDatasetName: (value: string) => void;
  setDatasetRows: (value: string) => void;
  setDatasetNotes: (value: string) => void;
  setBehaviorLabel: (value: string) => void;
  setBehaviorObservation: (value: string) => void;
  setTickerBehaviorSymbol: (value: string) => void;
  setTickerBehaviorPattern: (value: string) => void;
  setLearningEnvironmentName: (value: string) => void;
  setLearningEnvironmentHypothesis: (value: string) => void;
}

interface UseArtifactPreferencesOptions {
  values: ArtifactPreferenceValues;
  setters: ArtifactPreferenceSetters;
}

export function useArtifactPreferences({ values, setters }: UseArtifactPreferencesOptions) {
  const {
    setDatasetName,
    setDatasetRows,
    setDatasetNotes,
    setBehaviorLabel,
    setBehaviorObservation,
    setTickerBehaviorSymbol,
    setTickerBehaviorPattern,
    setLearningEnvironmentName,
    setLearningEnvironmentHypothesis,
  } = setters;

  useEffect(() => {
    const storedDatasetName = localStorage.getItem("tradehax_ai_dataset_name");
    if (storedDatasetName && storedDatasetName.trim()) {
      setDatasetName(storedDatasetName.trim().slice(0, 80));
    }

    const storedDatasetRows = localStorage.getItem("tradehax_ai_dataset_rows");
    if (storedDatasetRows && /^\d{1,6}$/.test(storedDatasetRows)) {
      setDatasetRows(storedDatasetRows);
    }

    const storedDatasetNotes = localStorage.getItem("tradehax_ai_dataset_notes");
    if (storedDatasetNotes && storedDatasetNotes.trim()) {
      setDatasetNotes(storedDatasetNotes.trim().slice(0, 220));
    }

    const storedBehaviorLabel = localStorage.getItem("tradehax_ai_behavior_label");
    if (storedBehaviorLabel && storedBehaviorLabel.trim()) {
      setBehaviorLabel(storedBehaviorLabel.trim().slice(0, 100));
    }

    const storedBehaviorObservation = localStorage.getItem("tradehax_ai_behavior_observation");
    if (storedBehaviorObservation && storedBehaviorObservation.trim()) {
      setBehaviorObservation(storedBehaviorObservation.trim().slice(0, 240));
    }

    const storedTickerBehaviorSymbol = localStorage.getItem("tradehax_ai_ticker_behavior_symbol");
    if (storedTickerBehaviorSymbol && storedTickerBehaviorSymbol.trim()) {
      setTickerBehaviorSymbol(storedTickerBehaviorSymbol.trim().slice(0, 20).toUpperCase());
    }

    const storedTickerBehaviorPattern = localStorage.getItem("tradehax_ai_ticker_behavior_pattern");
    if (storedTickerBehaviorPattern && storedTickerBehaviorPattern.trim()) {
      setTickerBehaviorPattern(storedTickerBehaviorPattern.trim().slice(0, 240));
    }

    const storedLearningEnvironmentName = localStorage.getItem("tradehax_ai_learning_environment_name");
    if (storedLearningEnvironmentName && storedLearningEnvironmentName.trim()) {
      setLearningEnvironmentName(storedLearningEnvironmentName.trim().slice(0, 120));
    }

    const storedLearningEnvironmentHypothesis = localStorage.getItem("tradehax_ai_learning_environment_hypothesis");
    if (storedLearningEnvironmentHypothesis && storedLearningEnvironmentHypothesis.trim()) {
      setLearningEnvironmentHypothesis(storedLearningEnvironmentHypothesis.trim().slice(0, 260));
    }
  }, [
    setDatasetName,
    setDatasetRows,
    setDatasetNotes,
    setBehaviorLabel,
    setBehaviorObservation,
    setTickerBehaviorSymbol,
    setTickerBehaviorPattern,
    setLearningEnvironmentName,
    setLearningEnvironmentHypothesis,
  ]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_dataset_name", values.datasetName.slice(0, 80));
  }, [values.datasetName]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_dataset_rows", values.datasetRows.replace(/\D/g, "").slice(0, 6) || "0");
  }, [values.datasetRows]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_dataset_notes", values.datasetNotes.slice(0, 220));
  }, [values.datasetNotes]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_behavior_label", values.behaviorLabel.slice(0, 100));
  }, [values.behaviorLabel]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_behavior_observation", values.behaviorObservation.slice(0, 240));
  }, [values.behaviorObservation]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_ticker_behavior_symbol", values.tickerBehaviorSymbol.slice(0, 20).toUpperCase());
  }, [values.tickerBehaviorSymbol]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_ticker_behavior_pattern", values.tickerBehaviorPattern.slice(0, 240));
  }, [values.tickerBehaviorPattern]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_learning_environment_name", values.learningEnvironmentName.slice(0, 120));
  }, [values.learningEnvironmentName]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_learning_environment_hypothesis", values.learningEnvironmentHypothesis.slice(0, 260));
  }, [values.learningEnvironmentHypothesis]);
}
