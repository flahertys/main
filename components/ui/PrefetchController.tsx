"use client";

import { usePredictivePrefetch } from "@/hooks/usePredictivePrefetch";

/**
 * PrefetchController
 *
 * Headless client component that activates predictive prefetching for the
 * current page. Place this once inside the root layout so every route
 * automatically prefetches likely next destinations during browser idle time.
 */
export function PrefetchController() {
  usePredictivePrefetch();
  return null;
}
