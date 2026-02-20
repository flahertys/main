"use client";

import { useEffect } from "react";

const LEGACY_SW_HINT = "/service-worker.js";
const LEGACY_CACHE_PREFIX = "hyperborea-";

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) => {
              const urls = [
                registration.active?.scriptURL,
                registration.installing?.scriptURL,
                registration.waiting?.scriptURL,
              ].filter((value): value is string => Boolean(value));
              return urls.some((url) => url.includes(LEGACY_SW_HINT));
            })
            .map((registration) => registration.unregister()),
        );
      } catch {
        // no-op: best effort cleanup
      }

      if (!("caches" in window)) {
        return;
      }

      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith(LEGACY_CACHE_PREFIX))
            .map((key) => caches.delete(key)),
        );
      } catch {
        // no-op: best effort cleanup
      }
    };

    void cleanup();
  }, []);

  return null;
}
