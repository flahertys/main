export type SubscriptionTier = "free" | "basic" | "pro" | "elite";

export type BillingProvider =
  | "none"
  | "stripe"
  | "coinbase"
  | "paypal"
  | "square"
  | "venmo"
  | "cashapp"
  | "ebay"
  | "crypto";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type UsageFeature =
  | "ai_chat"
  | "hax_runner"
  | "signal_alert"
  | "bot_create";

export type BillingCycle = "monthly" | "yearly";

export type TierLimits = {
  aiChatDaily: number;
  haxRunnerDaily: number;
  signalAlertsDaily: number;
  botCreatesDaily: number;
};

export type TierEntitlements = {
  uncensoredAi: boolean;
  overclockAi: boolean;
  premiumSignals: boolean;
  adFree: boolean;
  priorityStakingBoostPct: number;
  tournamentAccess: boolean;
};

export type PlanDefinition = {
  id: SubscriptionTier;
  name: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  description: string;
  features: string[];
  limits: TierLimits;
  entitlements: TierEntitlements;
};

export type SubscriptionRecord = {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: BillingProvider;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
  metadata?: Record<string, string>;
};

export type UsageEvent = {
  id: string;
  userId: string;
  feature: UsageFeature;
  units: number;
  source: string;
  timestamp: string;
  metadata?: Record<string, string>;
};

export type UsageSummary = {
  feature: UsageFeature;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  usedThisWeek?: number;
  weeklyLimit?: number;
  remainingThisWeek?: number;
  weeklyMinutes?: number;
  unitDurationSeconds?: number;
};

export type MonetizationSnapshot = {
  userId: string;
  subscription: SubscriptionRecord;
  plan: PlanDefinition;
  usage: UsageSummary[];
};

export type AllowanceResult = {
  allowed: boolean;
  feature: UsageFeature;
  requestedUnits: number;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  usedThisWeek?: number;
  weeklyLimit?: number;
  remainingThisWeek?: number;
  unitDurationSeconds?: number;
  weeklyMinutes?: number;
  reason?: string;
};

export type MonetizationMetrics = {
  generatedAt: string;
  activeSubscribers: number;
  mrrUsd: number;
  arrUsd: number;
  arpuUsd: number;
  totalUsers: number;
  tierBreakdown: Record<SubscriptionTier, number>;
};
