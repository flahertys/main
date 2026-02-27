"use client";

import { useEffect } from "react";

type ResponseStyle = "concise" | "coach" | "operator";
type RiskStance = "guarded" | "balanced" | "aggressive";
type PersonaPresetId = "mystic" | "analyst" | "mentor";

interface CorePreferenceValues {
  selectedChatModel: string;
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  isPromptLibraryOpen: boolean;
  beginnerFocusMode: boolean;
  showOperatorDock: boolean;
}

interface CorePreferenceSetters {
  setSelectedChatModel: (value: string) => void;
  setGuideName: (value: string) => void;
  setResponseStyle: (value: ResponseStyle) => void;
  setRiskStance: (value: RiskStance) => void;
  setFocusSymbol: (value: string) => void;
  setSessionIntent: (value: string) => void;
  setPersonaPreset: (value: PersonaPresetId) => void;
  setIsPromptLibraryOpen: (value: boolean) => void;
  setBeginnerFocusMode: (value: boolean) => void;
  setShowOperatorDock: (value: boolean) => void;
}

interface UseCorePreferencesOptions {
  validModelIds: readonly string[];
  values: CorePreferenceValues;
  setters: CorePreferenceSetters;
}

export function useCorePreferences({ validModelIds, values, setters }: UseCorePreferencesOptions) {
  const {
    setSelectedChatModel,
    setGuideName,
    setResponseStyle,
    setRiskStance,
    setFocusSymbol,
    setSessionIntent,
    setPersonaPreset,
    setIsPromptLibraryOpen,
    setBeginnerFocusMode,
    setShowOperatorDock,
  } = setters;

  useEffect(() => {
    const storedModel = localStorage.getItem("tradehax_ai_chat_model");
    if (storedModel && validModelIds.includes(storedModel)) {
      setSelectedChatModel(storedModel);
    }

    const storedGuideName = localStorage.getItem("tradehax_ai_guide_name");
    if (storedGuideName && storedGuideName.trim()) {
      setGuideName(storedGuideName.trim().slice(0, 24));
    }

    const storedStyle = localStorage.getItem("tradehax_ai_response_style");
    if (storedStyle === "concise" || storedStyle === "coach" || storedStyle === "operator") {
      setResponseStyle(storedStyle);
    }

    const storedRisk = localStorage.getItem("tradehax_ai_risk_stance");
    if (storedRisk === "guarded" || storedRisk === "balanced" || storedRisk === "aggressive") {
      setRiskStance(storedRisk);
    }

    const storedFocusSymbol = localStorage.getItem("tradehax_ai_focus_symbol");
    if (storedFocusSymbol && storedFocusSymbol.trim()) {
      setFocusSymbol(storedFocusSymbol.trim().slice(0, 12).toUpperCase());
    }

    const storedIntent = localStorage.getItem("tradehax_ai_session_intent");
    if (storedIntent && storedIntent.trim()) {
      setSessionIntent(storedIntent.trim().slice(0, 72));
    }

    const storedPersona = localStorage.getItem("tradehax_ai_persona_preset");
    if (storedPersona === "mystic" || storedPersona === "analyst" || storedPersona === "mentor") {
      setPersonaPreset(storedPersona);
    }

    const storedPromptLibrary = localStorage.getItem("tradehax_ai_prompt_library_open");
    if (storedPromptLibrary === "true") {
      setIsPromptLibraryOpen(true);
    }

    const storedBeginnerFocus = localStorage.getItem("tradehax_ai_beginner_focus_mode");
    if (storedBeginnerFocus === "false") {
      setBeginnerFocusMode(false);
      setShowOperatorDock(true);
    }

    const storedOperatorDock = localStorage.getItem("tradehax_ai_operator_dock_open");
    if (storedOperatorDock === "true") {
      setShowOperatorDock(true);
    }
  }, [
    validModelIds,
    setSelectedChatModel,
    setGuideName,
    setResponseStyle,
    setRiskStance,
    setFocusSymbol,
    setSessionIntent,
    setPersonaPreset,
    setIsPromptLibraryOpen,
    setBeginnerFocusMode,
    setShowOperatorDock,
  ]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_chat_model", values.selectedChatModel);
  }, [values.selectedChatModel]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_guide_name", values.guideName.trim() || "Trader");
  }, [values.guideName]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_response_style", values.responseStyle);
  }, [values.responseStyle]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_risk_stance", values.riskStance);
  }, [values.riskStance]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_focus_symbol", values.focusSymbol);
  }, [values.focusSymbol]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_session_intent", values.sessionIntent);
  }, [values.sessionIntent]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_persona_preset", values.personaPreset);
  }, [values.personaPreset]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_prompt_library_open", String(values.isPromptLibraryOpen));
  }, [values.isPromptLibraryOpen]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_beginner_focus_mode", String(values.beginnerFocusMode));
  }, [values.beginnerFocusMode]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_operator_dock_open", String(values.showOperatorDock));
  }, [values.showOperatorDock]);
}
