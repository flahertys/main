"use client";

import { useExperimentVariant } from "@/components/analytics/useExperimentVariant";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";

interface HomeHeroActionsProps {
  scheduleHref: string;
}

export function HomeHeroActions({ scheduleHref }: HomeHeroActionsProps) {
  const variant = useExperimentVariant("home_hero_primary_cta", {
    surface: "home_hero",
    fallback: "control",
  });

  const primaryLabel = variant === "accelerated" ? "Start Now" : "Book Now";
  const secondaryLabel = variant === "accelerated" ? "Launch AI Assistant" : "Start AI Assistant";

  return (
    <div className="flex flex-wrap gap-3">
      <TrackedCtaLink
        href={scheduleHref}
        conversionId="open_schedule"
        surface="home:hero"
        conversionContext={{ placement: "hero_primary", variant: `exp_${variant}`, audience: "all" }}
        className="theme-cta theme-cta--loud px-6 py-3"
      >
        {primaryLabel}
      </TrackedCtaLink>
      <TrackedCtaLink
        href="/ai-hub"
        conversionId="open_ai_chat"
        surface="home:hero"
        conversionContext={{ placement: "hero_secondary", variant: `exp_${variant}`, audience: "all" }}
        className="theme-cta theme-cta--secondary px-6 py-3"
      >
        {secondaryLabel}
      </TrackedCtaLink>
    </div>
  );
}
