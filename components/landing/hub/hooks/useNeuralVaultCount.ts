"use client";

import { useCallback, useEffect, useState } from "react";

export function useNeuralVaultCount(readVault: () => unknown[]) {
  const [neuralVaultCount, setNeuralVaultCount] = useState(0);

  const refreshNeuralVaultCount = useCallback(() => {
    setNeuralVaultCount(readVault().length);
  }, [readVault]);

  useEffect(() => {
    refreshNeuralVaultCount();
  }, [refreshNeuralVaultCount]);

  return {
    neuralVaultCount,
    refreshNeuralVaultCount,
  };
}
