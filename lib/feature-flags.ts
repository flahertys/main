/**
 * Feature Flags: Control beta/incomplete features without code changes.
 * Used to prevent users from accessing half-finished functionality.
 */

type FeatureFlag = {
    enabled: boolean;
    label: string;
    description: string;
    completedDate?: string;
    betaUntil?: string; // ISO date
};

export const featureFlags = {
    // ✅ COMPLETE features
    "education.investor-academy": {
        enabled: true,
        label: "Investor Academy",
        description: "8-module crypto education curriculum",
        completedDate: "2026-01-15",
    } as FeatureFlag,

    "trading.sentiment": {
        enabled: true,
        label: "Sentiment Engine",
        description: "Real-time market sentiment analysis",
        completedDate: "2025-12-20",
    } as FeatureFlag,

    "gaming.spades": {
        enabled: true,
        label: "Spades Game Rooms",
        description: "Multiplayer card game with rewards",
        completedDate: "2025-11-30",
    } as FeatureFlag,

    "monetization.stripe": {
        enabled: true,
        label: "Stripe Payments",
        description: "Premium subscription processing",
        completedDate: "2025-10-10",
    } as FeatureFlag,

    "auth.web3-wallet": {
        enabled: true,
        label: "Web3 Wallet Auth",
        description: "Solana wallet connection",
        completedDate: "2025-09-05",
    } as FeatureFlag,

    // 🔧 BETA/INCOMPLETE features (hidden from users)
    "trading.bot-creation": {
        enabled: false, // DISABLED: Route exists but no database persistence, no execution logic
        label: "Trading Bot Builder",
        description: "Create and deploy automated trading bots (BETA)",
        betaUntil: "2026-04-30",
    } as FeatureFlag,

    "trading.backtesting": {
        enabled: false, // DISABLED: Routes are stubs, no backtest engine
        label: "Strategy Backtesting",
        description: "Test strategies on historical data (BETA)",
        betaUntil: "2026-05-15",
    } as FeatureFlag,

    "gaming.nft-rewards": {
        enabled: false, // DISABLED: DAO frame exists but no NFT contract integration
        label: "NFT Reward System",
        description: "Earn and trade NFT badges (BETA)",
        betaUntil: "2026-06-01",
    } as FeatureFlag,

    "community.leaderboards": {
        enabled: false, // DISABLED: Only academy has leaderboard, localStorage-based; needs cross-product implementation
        label: "Global Leaderboards",
        description: "Cross-product competitive rankings (BETA)",
        betaUntil: "2026-05-20",
    } as FeatureFlag,

    "intelligence.api-export": {
        enabled: false, // DISABLED: No public API endpoint; internal only
        label: "Intelligence API",
        description: "Export market intelligence via API (BETA)",
        betaUntil: "2026-06-15",
    } as FeatureFlag,
} as const;

/**
 * Check if a feature is enabled
 * @param key - Feature flag key from featureFlags object
 * @returns true if feature is enabled and visible to users
 */
export function isFeatureEnabled(key: keyof typeof featureFlags): boolean {
    return featureFlags[key]?.enabled ?? false;
}

/**
 * Get feature metadata (useful for logs, admin panels, etc.)
 */
export function getFeatureStatus(key: keyof typeof featureFlags) {
    const flag = featureFlags[key];
    if (!flag) return null;

    return {
        ...flag,
        status: flag.enabled ? "LIVE" : "BETA",
        isOverdue: flag.betaUntil && new Date(flag.betaUntil) < new Date(),
    };
}

/**
 * List all disabled features (for admin/team visibility)
 */
export function listBetaFeatures() {
    return Object.entries(featureFlags)
        .filter(([, flag]) => !flag.enabled)
        .map(([key, flag]) => ({
            key,
            ...flag,
            daysUntilBeta: flag.betaUntil
                ? Math.ceil(
                    (new Date(flag.betaUntil).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                : null,
        }));
}
