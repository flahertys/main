/**
 * Leaderboard Data Management
 * Handles leaderboard data, rankings, and premium tier integration
 */

// Leaderboard types
export const LEADERBOARD_TYPES = {
  TRADING: 'trading',
  MUSIC: 'music',
  SERVICES: 'services',
};

// Timeframe options
export const LEADERBOARD_TIMEFRAMES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'allTime',
};

/**
 * Mock leaderboard data structure for trading
 * In production, this would be fetched from real P&L data
 */
export function getMockTradingLeaderboard(timeframe = 'weekly') {
  return [
    {
      rank: 1,
      userId: 'user_001',
      username: 'Trader #1001',
      pnl: 2450,
      pnlPercent: 9.8,
      winRate: 0.72,
      sharpeRatio: 1.8,
      trades: 48,
      isPremium: true,
      featuredTier: true,
    },
    {
      rank: 2,
      userId: 'user_002',
      username: 'Trader #1002',
      pnl: 1850,
      pnlPercent: 7.4,
      winRate: 0.68,
      sharpeRatio: 1.5,
      trades: 35,
      isPremium: false,
      featuredTier: false,
    },
    {
      rank: 3,
      userId: 'user_003',
      username: 'Trader #1003',
      pnl: 1620,
      pnlPercent: 6.5,
      winRate: 0.65,
      sharpeRatio: 1.3,
      trades: 42,
      isPremium: true,
      featuredTier: false,
    },
    {
      rank: 4,
      userId: 'user_004',
      username: 'Trader #1004',
      pnl: 950,
      pnlPercent: 3.8,
      winRate: 0.58,
      sharpeRatio: 0.9,
      trades: 28,
      isPremium: false,
      featuredTier: false,
    },
    {
      rank: 5,
      userId: 'user_005',
      username: 'Trader #1005',
      pnl: 720,
      pnlPercent: 2.9,
      winRate: 0.55,
      sharpeRatio: 0.7,
      trades: 25,
      isPremium: false,
      featuredTier: false,
    },
  ];
}

/**
 * Mock leaderboard data for music
 */
export function getMockMusicLeaderboard(timeframe = 'weekly') {
  return [
    {
      rank: 1,
      userId: 'artist_001',
      username: 'Artist #5001',
      totalListens: 15420,
      weeklyListens: 3200,
      shares: 420,
      followers: 2840,
      isPremium: true,
      featuredTier: true,
    },
    {
      rank: 2,
      userId: 'artist_002',
      username: 'Artist #5002',
      totalListens: 12350,
      weeklyListens: 2100,
      shares: 310,
      followers: 1920,
      isPremium: false,
      featuredTier: false,
    },
    {
      rank: 3,
      userId: 'artist_003',
      username: 'Artist #5003',
      totalListens: 9870,
      weeklyListens: 1850,
      shares: 245,
      followers: 1450,
      isPremium: true,
      featuredTier: false,
    },
  ];
}

/**
 * Mock leaderboard data for services
 */
export function getMockServicesLeaderboard(timeframe = 'weekly') {
  return [
    {
      rank: 1,
      userId: 'builder_001',
      username: 'Builder #7001',
      projectsCompleted: 34,
      clientRating: 4.9,
      totalEarnings: 12500,
      monthlyEarnings: 2100,
      isPremium: true,
      featuredTier: true,
    },
    {
      rank: 2,
      userId: 'builder_002',
      username: 'Builder #7002',
      projectsCompleted: 28,
      clientRating: 4.7,
      totalEarnings: 8920,
      monthlyEarnings: 1450,
      isPremium: false,
      featuredTier: false,
    },
    {
      rank: 3,
      userId: 'builder_003',
      username: 'Builder #7003',
      projectsCompleted: 24,
      clientRating: 4.6,
      totalEarnings: 7200,
      monthlyEarnings: 980,
      isPremium: false,
      featuredTier: false,
    },
  ];
}

/**
 * Check if user qualifies for leaderboard inclusion
 * Minimum standards to prevent low-quality entries
 */
export function checkLeaderboardEligibility(user, leaderboardType) {
  const minimums = {
    [LEADERBOARD_TYPES.TRADING]: {
      trades: 10,
      daysActive: 7,
    },
    [LEADERBOARD_TYPES.MUSIC]: {
      listens: 100,
      daysActive: 7,
    },
    [LEADERBOARD_TYPES.SERVICES]: {
      projectsCompleted: 3,
      daysActive: 7,
    },
  };

  const min = minimums[leaderboardType];
  if (!min) return false;

  // Check eligibility based on type
  switch (leaderboardType) {
    case LEADERBOARD_TYPES.TRADING:
      return user.trades >= min.trades && user.daysActive >= min.daysActive;
    case LEADERBOARD_TYPES.MUSIC:
      return user.listens >= min.listens && user.daysActive >= min.daysActive;
    case LEADERBOARD_TYPES.SERVICES:
      return (
        user.projectsCompleted >= min.projectsCompleted &&
        user.daysActive >= min.daysActive
      );
    default:
      return false;
  }
}

/**
 * Verify P&L authenticity (prevent fraud)
 * In production, this would check digital signatures or API read-only access
 */
export function verifyPnL(userId, pnl, signature) {
  // TODO: Implement verification
  // Option 1: Check signature from trading service
  // Option 2: Read-only API call to verify
  // Option 3: Blockchain verification (future)
  return true;
}

/**
 * Premium tier subscription data
 */
export const PREMIUM_TIERS = {
  FEATURED: {
    id: 'featured',
    name: 'Featured Rank',
    price: 9.99,
    interval: 'month',
    benefits: [
      'Sticky top-of-leaderboard positioning',
      'Custom profile banner',
      'Enhanced visibility in social feeds',
      '10% boost to referral rewards',
    ],
  },
  GUILD_PREMIUM: {
    id: 'guild-premium',
    name: 'Guild Features (Discord)',
    price: 5.99,
    interval: 'month',
    benefits: [
      'Advanced commands (extended responses, priority)',
      'Guild leaderboard integration',
      'Custom bot prefix',
      'Analytics dashboard',
    ],
  },
};

/**
 * Calculate ranking metrics
 */
export function calculateRankingMetrics(trades) {
  if (!trades || trades.length === 0) {
    return {
      winRate: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
    };
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  const winRate = wins.length / trades.length;
  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins;

  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;

  // Simplified Sharpe Ratio (daily returns / volatility)
  const returns = trades.map((t) => t.pnl);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? mean / stdDev : 0;

  return {
    winRate: Math.round(winRate * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
  };
}

/**
 * Get leaderboard data based on type and timeframe
 */
export function getLeaderboardData(type, timeframe = 'weekly') {
  switch (type) {
    case LEADERBOARD_TYPES.TRADING:
      return getMockTradingLeaderboard(timeframe);
    case LEADERBOARD_TYPES.MUSIC:
      return getMockMusicLeaderboard(timeframe);
    case LEADERBOARD_TYPES.SERVICES:
      return getMockServicesLeaderboard(timeframe);
    default:
      return [];
  }
}

/**
 * Find user's ranking
 */
export function findUserRank(userId, leaderboardType, timeframe = 'weekly') {
  const leaderboard = getLeaderboardData(leaderboardType, timeframe);
  return leaderboard.find((entry) => entry.userId === userId);
}

/**
 * Get leaderboard percentile for user
 */
export function getUserPercentile(userRank, totalUsers) {
  if (!userRank || !totalUsers) return 0;
  return Math.round(((totalUsers - userRank.rank) / totalUsers) * 100);
}

