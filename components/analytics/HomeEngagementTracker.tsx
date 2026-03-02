"use client";

import { event, trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

const SCROLL_MILESTONES = [25, 50, 75, 90] as const;
const OBSERVED_SECTIONS = [
  "home-quick-paths",
  "home-intent-lanes",
] as const;

export function HomeEngagementTracker() {
  useEffect(() => {
    const firedMilestones = new Set<number>();
    const startedAt = Date.now();
    const seenSections = new Set<string>();

    const handleScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const percent = Math.min(100, Math.round((window.scrollY / maxScroll) * 100));
      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone && !firedMilestones.has(milestone)) {
          firedMilestones.add(milestone);
          trackEvent.scrollDepth(milestone);
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = entry.target.id;
          if (!sectionId || seenSections.has(sectionId)) continue;

          seenSections.add(sectionId);
          event({
            action: "section_view",
            category: "engagement",
            label: `home:${sectionId}`,
            value: 1,
          });
        }
      },
      { threshold: 0.35 }
    );

    for (const sectionId of OBSERVED_SECTIONS) {
      const node = document.getElementById(sectionId);
      if (node) observer.observe(node);
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        trackEvent.timeOnPage(seconds, "home");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      trackEvent.timeOnPage(seconds, "home");
    };
  }, []);

  return null;
}
