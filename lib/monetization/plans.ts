import { PlanDefinition, SubscriptionTier, UsageFeature } from "@/lib/monetization/types";

const planCatalog: Record<SubscriptionTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    description: "Starter access with 30 minutes of free AI usage each week, plus core platform features.",
    features: [
      "Basic portfolio dashboard",
      "30 minutes of AI usage per week",
      "5 Hax Runner plays/day",
      "Daily AI sentiment teaser",
      "Community updates",
    ],
    limits: {
      aiChatDaily: 500,
      haxRunnerDaily: 5,
      signalAlertsDaily: 3,
      botCreatesDaily: 0,
    },
    entitlements: {
      uncensoredAi: false,
      overclockAi: false,
      premiumSignals: false,
      adFree: false,
      priorityStakingBoostPct: 0,
      tournamentAccess: false,
    },
  },
  basic: {
    id: "basic",
    name: "Basic",
    monthlyPriceUsd: 4.99,
    yearlyPriceUsd: 49,
    description: "Entry tier for frequent usage with uncensored AI and practical alerts.",
    features: [
      "Uncensored Neural Terminal",
      "20 Hax Runner plays/day",
      "Entry-level cross-chain alerts",
      "Email support queue",
    ],
    limits: {
      aiChatDaily: 80,
      haxRunnerDaily: 20,
      signalAlertsDaily: 25,
      botCreatesDaily: 1,
    },
    entitlements: {
      uncensoredAi: true,
      overclockAi: false,
      premiumSignals: true,
      adFree: true,
      priorityStakingBoostPct: 5,
      tournamentAccess: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 9.99,
    yearlyPriceUsd: 99,
    description: "Advanced tier for active traders and automation-heavy workflows.",
    features: [
      "Real-time premium signal feeds",
      "AI-assisted strategy refinement",
      "Trading bot orchestration access",
      "Priority support",
    ],
    limits: {
      aiChatDaily: 220,
      haxRunnerDaily: 60,
      signalAlertsDaily: 120,
      botCreatesDaily: 8,
    },
    entitlements: {
      uncensoredAi: true,
      overclockAi: true,
      premiumSignals: true,
      adFree: true,
      priorityStakingBoostPct: 10,
      tournamentAccess: true,
    },
  },
  elite: {
    id: "elite",
    name: "Elite",
    monthlyPriceUsd: 19.99,
    yearlyPriceUsd: 199,
    description: "VIP tier with high limits, coaching pathways, and launch privileges.",
    features: [
      "Everything in Pro",
      "High-stakes tournament queue",
      "VIP roadmap and launch briefings",
      "Custom AI workflow presets",
    ],
    limits: {
      aiChatDaily: 600,
      haxRunnerDaily: 180,
      signalAlertsDaily: 400,
      botCreatesDaily: 20,
    },
    entitlements: {
      uncensoredAi: true,
      overclockAi: true,
      premiumSignals: true,
      adFree: true,
      priorityStakingBoostPct: 20,
      tournamentAccess: true,
    },
  },
};

export const planOrder: SubscriptionTier[] = ["free", "basic", "pro", "elite"];

export function getPlanDefinition(tier: SubscriptionTier): PlanDefinition {
  return planCatalog[tier];
}

export function getAllPlans(): PlanDefinition[] {
  return planOrder.map((tier) => planCatalog[tier]);
}

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === "string" && value in planCatalog;
}

export function getFeatureDailyLimit(tier: SubscriptionTier, feature: UsageFeature): number {
  const limits = planCatalog[tier].limits;
  switch (feature) {
    case "ai_chat":
      return limits.aiChatDaily;
    case "hax_runner":
      return limits.haxRunnerDaily;
    case "signal_alert":
      return limits.signalAlertsDaily;
    case "bot_create":
      return limits.botCreatesDaily;
    default:
      return 0;
  }
}
