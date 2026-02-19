/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import { SITE_ROUTE_CATALOG } from "@/lib/ai/site-map";
import { sanitizePlainText } from "@/lib/security";

export type NavigationSuggestion = {
  path: string;
  title: string;
  reason: string;
  confidence: number;
};

export type SiteIntent =
  | "onboarding"
  | "ai_tools"
  | "trading"
  | "game"
  | "billing"
  | "services"
  | "learning"
  | "general";

type IntentRule = {
  intent: SiteIntent;
  keywords: string[];
  boostTags: string[];
};

const INTENT_RULES: IntentRule[] = [
  {
    intent: "onboarding",
    keywords: ["new", "start", "where do i begin", "first time", "onboard"],
    boostTags: ["start", "overview", "new user"],
  },
  {
    intent: "ai_tools",
    keywords: ["ai", "chatbot", "model", "llm", "hugging face", "generator"],
    boostTags: ["ai", "assistant", "models", "chat"],
  },
  {
    intent: "trading",
    keywords: ["trade", "trading", "signals", "market", "portfolio", "intel"],
    boostTags: ["trading", "market", "signals", "analytics"],
  },
  {
    intent: "game",
    keywords: ["game", "hyperborea", "play", "leaderboard"],
    boostTags: ["game", "hyperborea", "play"],
  },
  {
    intent: "billing",
    keywords: ["billing", "price", "pricing", "subscription", "pay", "invoice"],
    boostTags: ["billing", "plans", "subscription", "checkout"],
  },
  {
    intent: "services",
    keywords: ["service", "consulting", "repair", "web development", "hire"],
    boostTags: ["services", "consulting", "web development"],
  },
  {
    intent: "learning",
    keywords: ["learn", "lesson", "music", "guide", "blog", "education"],
    boostTags: ["education", "music", "guides", "blog"],
  },
];

function normalizeText(input: string) {
  return sanitizePlainText(input, 500).toLowerCase();
}

function detectIntent(message: string): SiteIntent {
  const normalized = normalizeText(message);
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.intent;
    }
  }
  return "general";
}

export function interpretNavigationIntent(message: string) {
  const normalized = normalizeText(message);
  const intent = detectIntent(message);
  const activeRule = INTENT_RULES.find((rule) => rule.intent === intent);

  const ranked = SITE_ROUTE_CATALOG.map((route) => {
    let score = route.priority / 100;

    const titleAndSummary = `${route.title} ${route.summary}`.toLowerCase();
    if (normalized && titleAndSummary.includes(normalized.slice(0, 32))) {
      score += 0.35;
    }

    for (const token of normalized.split(/\s+/).filter(Boolean).slice(0, 12)) {
      if (token.length < 3) continue;
      if (route.tags.some((tag) => tag.includes(token))) {
        score += 0.14;
      }
      if (titleAndSummary.includes(token)) {
        score += 0.07;
      }
    }

    if (activeRule) {
      const boosted = activeRule.boostTags.some((boost) =>
        route.tags.some((tag) => tag.includes(boost) || boost.includes(tag)),
      );
      if (boosted) {
        score += 0.3;
      }
    }

    return {
      route,
      score,
    };
  })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const suggestions: NavigationSuggestion[] = ranked.map(({ route, score }) => ({
    path: route.path,
    title: route.title,
    reason: route.summary,
    confidence: Math.max(0, Math.min(1, Number.parseFloat(score.toFixed(3)))),
  }));

  return {
    intent,
    suggestions,
    normalized,
  };
}
