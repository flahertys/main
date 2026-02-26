"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

type UseKidsModeLockOptions = {
  setOpenModeEnabled: Dispatch<SetStateAction<boolean>>;
  setBeginnerFocusMode: Dispatch<SetStateAction<boolean>>;
  setShowOperatorDock: Dispatch<SetStateAction<boolean>>;
};

export function useKidsModeLock({
  setOpenModeEnabled,
  setBeginnerFocusMode,
  setShowOperatorDock,
}: UseKidsModeLockOptions) {
  const [kidsModeEnabled, setKidsModeEnabled] = useState(false);
  const [kidsModePin, setKidsModePin] = useState("");
  const [kidsModePinDraft, setKidsModePinDraft] = useState("");
  const [kidsModePinConfirm, setKidsModePinConfirm] = useState("");
  const [kidsModeUnlockInput, setKidsModeUnlockInput] = useState("");
  const [showKidsUnlockPrompt, setShowKidsUnlockPrompt] = useState(false);
  const [kidsModePinError, setKidsModePinError] = useState("");

  useEffect(() => {
    const storedKidsMode = localStorage.getItem("tradehax_ai_kids_mode_enabled");
    if (storedKidsMode === "true") {
      setKidsModeEnabled(true);
      setOpenModeEnabled(false);
      setBeginnerFocusMode(true);
      setShowOperatorDock(false);
    }

    const storedKidsPin = localStorage.getItem("tradehax_ai_kids_mode_pin");
    if (storedKidsPin && /^\d{4,8}$/.test(storedKidsPin)) {
      setKidsModePin(storedKidsPin);
    }
  }, [setBeginnerFocusMode, setOpenModeEnabled, setShowOperatorDock]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_kids_mode_enabled", String(kidsModeEnabled));
  }, [kidsModeEnabled]);

  useEffect(() => {
    if (kidsModePin) {
      localStorage.setItem("tradehax_ai_kids_mode_pin", kidsModePin);
    } else {
      localStorage.removeItem("tradehax_ai_kids_mode_pin");
    }
  }, [kidsModePin]);

  function saveKidsModePin() {
    const pin = kidsModePinDraft.trim();
    const confirm = kidsModePinConfirm.trim();
    if (!/^\d{4,8}$/.test(pin)) {
      setKidsModePinError("PIN must be 4-8 digits.");
      return null;
    }
    if (pin !== confirm) {
      setKidsModePinError("PIN confirmation does not match.");
      return null;
    }
    setKidsModePin(pin);
    setKidsModePinDraft("");
    setKidsModePinConfirm("");
    setKidsModePinError("");
    return "Parent PIN saved for Kids Mode lock.";
  }

  function clearKidsModePin() {
    setKidsModePin("");
    setKidsModePinDraft("");
    setKidsModePinConfirm("");
    setKidsModeUnlockInput("");
    setShowKidsUnlockPrompt(false);
    setKidsModePinError("");
    return "Parent PIN removed.";
  }

  function attemptKidsModeUnlock() {
    if (!kidsModePin) {
      setKidsModeEnabled(false);
      setShowKidsUnlockPrompt(false);
      setKidsModeUnlockInput("");
      return "Kids Mode unlocked.";
    }
    if (kidsModeUnlockInput.trim() !== kidsModePin) {
      setKidsModePinError("Incorrect PIN.");
      return null;
    }
    setKidsModeEnabled(false);
    setShowKidsUnlockPrompt(false);
    setKidsModeUnlockInput("");
    setKidsModePinError("");
    return "Kids Mode unlocked.";
  }

  function cancelKidsModeUnlock() {
    setShowKidsUnlockPrompt(false);
    setKidsModeUnlockInput("");
    setKidsModePinError("");
  }

  function toggleKidsMode() {
    if (kidsModeEnabled) {
      if (kidsModePin) {
        setShowKidsUnlockPrompt(true);
        setKidsModePinError("");
        return null;
      }
      setKidsModeEnabled(false);
      return "Kids Mode disabled.";
    }

    setKidsModeEnabled(true);
    setOpenModeEnabled(false);
    setBeginnerFocusMode(true);
    setShowOperatorDock(false);
    setShowKidsUnlockPrompt(false);
    setKidsModeUnlockInput("");
    setKidsModePinError("");
    return "Kids Mode enabled.";
  }

  return {
    kidsModeEnabled,
    setKidsModeEnabled,
    kidsModePin,
    kidsModePinDraft,
    setKidsModePinDraft,
    kidsModePinConfirm,
    setKidsModePinConfirm,
    kidsModeUnlockInput,
    setKidsModeUnlockInput,
    showKidsUnlockPrompt,
    kidsModePinError,
    saveKidsModePin,
    clearKidsModePin,
    attemptKidsModeUnlock,
    cancelKidsModeUnlock,
    toggleKidsMode,
  };
}
