"use client";

import { useEffect, useState } from "react";

const USAGE_STORAGE_KEY = "tradehax_ai_usage";

export function useUsageLimit(limit: number) {
  const [usageCount, setUsageCount] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!stored) return;

    const count = Number.parseInt(stored, 10);
    if (Number.isNaN(count) || count < 0) return;

    setUsageCount(count);
    if (count >= limit) {
      setIsCharging(true);
    }
  }, [limit]);

  function incrementUsage() {
    const nextCount = usageCount + 1;
    setUsageCount(nextCount);
    localStorage.setItem(USAGE_STORAGE_KEY, nextCount.toString());
    if (nextCount >= limit) {
      setIsCharging(true);
    }
  }

  function resetUsage() {
    setUsageCount(0);
    setIsCharging(false);
    localStorage.setItem(USAGE_STORAGE_KEY, "0");
  }

  return {
    usageCount,
    isCharging,
    incrementUsage,
    resetUsage,
  };
}
