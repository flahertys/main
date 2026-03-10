"use client";

import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";

interface HomeHeroActionsProps {
  scheduleHref: string;
}

export function HomeHeroActions({ scheduleHref: _scheduleHref }: HomeHeroActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <TrackedCtaLink
        href="/intelligence"
        conversionId="open_intelligence"
        surface="home:hero"
        conversionContext={{ placement: "hero_primary", variant: "digital_dynasty", audience: "all" }}
        className="theme-cta theme-cta--loud px-6 py-3"
      >
        Launch Intelligence
      </TrackedCtaLink>

      <TrackedCtaLink
        href="/ai-hub"
        conversionId="open_ai_chat"
        surface="home:hero"
        conversionContext={{ placement: "hero_secondary", variant: "digital_dynasty", audience: "all" }}
        className="theme-cta theme-cta--loud px-6 py-3"
      >
        Open AI Assistant
      </TrackedCtaLink>
    </div>
  );
}
