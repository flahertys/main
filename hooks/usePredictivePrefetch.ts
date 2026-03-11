"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Route-prediction map: for each pathname prefix, list the routes most likely
 * to be visited next. Extend this map as analytics data becomes available.
 */
const ROUTE_PREDICTIONS: Record<string, string[]> = {
  "/": ["/services", "/ai-hub", "/about"],
  "/ai-hub": ["/intelligence", "/trading", "/dashboard"],
  "/services": ["/billing", "/about", "/schedule"],
  "/about": ["/services", "/portfolio", "/music"],
  "/music": ["/about", "/schedule"],
  "/trading": ["/intelligence", "/ai-hub", "/tokenomics"],
  "/intelligence": ["/trading", "/ai-hub", "/dashboard"],
  "/portfolio": ["/services", "/about"],
  "/billing": ["/services", "/account"],
  "/tokenomics": ["/trading", "/crypto-project"],
  "/crypto-project": ["/tokenomics", "/trading", "/portfolio"],
  "/games": ["/game", "/ai-hub"],
  "/game": ["/games", "/ai-hub"],
  "/dashboard": ["/trading", "/intelligence", "/account"],
  "/schedule": ["/services", "/music"],
};

/**
 * Returns the predicted next routes for the given pathname, matching on the
 * longest known prefix.
 */
function predictNextRoutes(pathname: string): string[] {
  if (ROUTE_PREDICTIONS[pathname]) {
    return ROUTE_PREDICTIONS[pathname];
  }
  // Match on leading path segment (e.g. /blog/my-post -> /blog)
  const segment = "/" + pathname.split("/")[1];
  return ROUTE_PREDICTIONS[segment] ?? [];
}

function resolvePrefetchBudget() {
  if (typeof navigator === "undefined") {
    return 0;
  }

  const connection = navigator as Navigator & {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };

  if (connection.connection?.saveData) {
    return 0;
  }

  const effectiveType = connection.connection?.effectiveType || "4g";
  if (effectiveType === "slow-2g" || effectiveType === "2g") {
    return 0;
  }

  if (effectiveType === "3g") {
    return 1;
  }

  return 2;
}

/**
 * usePredictivePrefetch
 *
 * Automatically prefetches likely next routes based on the current page.
 * Prefetching is deferred until the browser is idle (requestIdleCallback)
 * so it never competes with critical rendering work.
 *
 * @example
 * ```tsx
 * // In a layout or navigation component:
 * usePredictivePrefetch();
 * ```
 */
export function usePredictivePrefetch() {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const doPrefetch = useCallback(
    (routes: string[]) => {
      for (const route of routes) {
        if (!prefetchedRef.current.has(route)) {
          router.prefetch(route);
          prefetchedRef.current.add(route);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const prefetchBudget = resolvePrefetchBudget();
    if (prefetchBudget === 0) return;

    const predicted = predictNextRoutes(pathname)
      .filter((route) => route !== pathname)
      .slice(0, prefetchBudget);
    if (predicted.length === 0) return;

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => doPrefetch(predicted), {
        timeout: 2500,
      });
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback: defer slightly so it doesn't block initial paint
      const timer = setTimeout(() => doPrefetch(predicted), 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, doPrefetch]);
}
