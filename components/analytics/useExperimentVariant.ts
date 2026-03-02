"use client";

import { resolveExperimentVariant, trackExperimentExposure, type ExperimentName, type ExperimentVariant } from "@/lib/experiments";
import { useEffect, useState } from "react";

interface UseExperimentVariantOptions {
  surface: string;
  fallback?: ExperimentVariant;
}

export function useExperimentVariant(
  name: ExperimentName,
  { surface, fallback = "control" }: UseExperimentVariantOptions,
) {
  const [variant, setVariant] = useState<ExperimentVariant>(fallback);

  useEffect(() => {
    const resolved = resolveExperimentVariant(name, fallback);
    setVariant(resolved);
    trackExperimentExposure(name, resolved, surface);
  }, [fallback, name, surface]);

  return variant;
}
