/**
 * Achievement System
 * Defines all achievements, unlock conditions, and rewards
 */

export const ACHIEVEMENTS = {
  // Phase 1: Discover
  FIRST_TRADE: {
    id: 'first-trade',
    name: 'First Trade',
    description: 'Completed your first paper trade',
    icon: '🚀',
    phase: 1,
    reward: { credits: 100, badge: true },
    condition: (userStats) => userStats.paperTrades >= 1,
  },

  // Phase 2: Analyze
  FIRST_SIGNAL: {
    id: 'first-signal',
    name: 'First Signal',
    description: 'Generated your first AI signal',
    icon: '🎯',
    phase: 2,
    reward: { credits: 100, badge: true },
    condition: (userStats) => userStats.signalsGenerated >= 1,
  },

  // Phase 3: Create
  CREATOR: {
    id: 'creator',
    name: 'Creator',
    description: 'Created your first music or service',
    icon: '✨',
    phase: 3,
    reward: { credits: 100, badge: true },
    condition: (userStats) => userStats.creationsCount >= 1,
  },

  // Phase 4: Connect
  CONNECTED: {
    id: 'connected',
    name: 'Connected',
    description: 'Linked your wallet for real trading',
    icon: '🔗',
    phase: 4,
    reward: { credits: 100, badge: true },
    condition: (userStats) => userStats.walletConnected,
  },

  // Milestone achievements
  WEEK_STREAK: {
    id: 'week-streak',
    name: 'Week Streak',
    description: '7 consecutive days of activity',
    icon: '🔥',
    phase: null,
    reward: { credits: 200, badge: true },
    condition: (userStats) => userStats.streakDays >= 7,
  },

  WIN_10: {
    id: 'win-10',
    name: 'Win 10',
    description: 'Generated 10 winning signals',
    icon: '🏆',
    phase: null,
    reward: { credits: 300, badge: true },
    condition: (userStats) => userStats.winningSignals >= 10,
  },

  PROFIT_1K: {
    id: 'profit-1k',
    name: 'Profitable',
    description: 'Earned $1000 in trading profits',
    icon: '💰',
    phase: null,
    reward: { credits: 500, badge: true },
    condition: (userStats) => userStats.totalProfits >= 1000,
  },

  REFER_3: {
    id: 'refer-3',
    name: 'Connector',
    description: 'Referred 3 friends who signed up',
    icon: '👥',
    phase: null,
    reward: { credits: 250, badge: true },
    condition: (userStats) => userStats.referralsCount >= 3,
  },

  POWER_USER: {
    id: 'power-user',
    name: 'Power User',
    description: 'Premium subscriber with active engagement',
    icon: '⚡',
    phase: null,
    reward: { credits: 1000, badge: true },
    condition: (userStats) =>
      userStats.isPremium &&
      userStats.signalsGenerated >= 50 &&
      userStats.daysActive >= 30,
  },
};

/**
 * Onboarding phases
 * Sequential progression through platform
 */
export const ONBOARDING_PHASES = [
  {
    id: 1,
    name: 'Discover',
    description: 'Try paper trading on BTC/USD',
    duration: '2 min',
    achievement: ACHIEVEMENTS.FIRST_TRADE,
    actionUrl: '/trading',
    actionLabel: 'Start Paper Trading',
  },
  {
    id: 2,
    name: 'Analyze',
    description: 'Run your first AI signal scan',
    duration: '5 min',
    achievement: ACHIEVEMENTS.FIRST_SIGNAL,
    actionUrl: '/trading',
    actionLabel: 'Generate AI Signal',
  },
  {
    id: 3,
    name: 'Create',
    description: 'Create a music idea or service',
    duration: '10 min',
    achievement: ACHIEVEMENTS.CREATOR,
    actionUrl: '/create',
    actionLabel: 'Start Creating',
  },
  {
    id: 4,
    name: 'Connect',
    description: 'Link wallet for real execution',
    duration: '30 sec',
    achievement: ACHIEVEMENTS.CONNECTED,
    actionUrl: '/settings/wallet',
    actionLabel: 'Connect Wallet',
  },
];

/**
 * Check if an achievement is earned based on user stats
 */
export function checkAchievements(userStats) {
  const earned = {};
  Object.values(ACHIEVEMENTS).forEach((achievement) => {
    earned[achievement.id] = achievement.condition(userStats);
  });
  return earned;
}

/**
 * Get next locked achievement in phase
 */
export function getNextAchievementInPhase(phase, earnedAchievements) {
  const phaseAchievements = Object.values(ACHIEVEMENTS).filter(
    (a) => a.phase === phase
  );
  for (const achievement of phaseAchievements) {
    if (!earnedAchievements[achievement.id]) {
      return achievement;
    }
  }
  return null;
}

/**
 * Calculate total credits earned from achievements
 */
export function calculateTotalCredits(earnedAchievements) {
  let total = 0;
  Object.entries(earnedAchievements).forEach(([id, earned]) => {
    if (earned) {
      const achievement = Object.values(ACHIEVEMENTS).find(
        (a) => a.id === id
      );
      if (achievement) {
        total += achievement.reward.credits;
      }
    }
  });
  return total;
}

/**
 * Get all earned achievement objects
 */
export function getEarnedAchievements(earnedAchievements) {
  return Object.entries(earnedAchievements)
    .filter(([, earned]) => earned)
    .map(([id]) =>
      Object.values(ACHIEVEMENTS).find((a) => a.id === id)
    )
    .filter(Boolean);
}

