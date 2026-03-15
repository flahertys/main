/**
 * AI Signal Personalization Engine
 * Learns from user preferences and trading outcomes to personalize signals
 */

const DEFAULT_USER_PROFILE = {
  riskTolerance: 'moderate', // conservative, moderate, aggressive
  tradingStyle: 'swing', // scalp, day, swing, position
  favoriteAssets: ['BTC', 'ETH'], // Array of tickers
  indicatorWeights: {
    momentum: 0.3,
    sentiment: 0.25,
    technicalAnalysis: 0.25,
    onChainMetrics: 0.2,
  },
  tradeHistory: [], // Array of { asset, signal, result, confidence }
  winRate: 0,
  averageConfidence: 0.5,
  lastUpdated: new Date().toISOString(),
};

/**
 * Load user profile from localStorage or API
 */
export function loadUserProfile() {
  const stored = localStorage.getItem('userProfile');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
  }
  return { ...DEFAULT_USER_PROFILE };
}

/**
 * Save user profile to localStorage and optionally to API
 */
export function saveUserProfile(profile) {
  localStorage.setItem('userProfile', JSON.stringify(profile));
  // TODO: Sync to API endpoint
  return profile;
}

/**
 * Record trade outcome to build accuracy history
 * @param {string} asset - Trading pair (BTC, ETH, etc)
 * @param {string} signal - LONG, SHORT, or NEUTRAL
 * @param {number} confidence - Signal confidence 0-1
 * @param {string} outcome - WIN or LOSS
 * @param {number} pnl - Profit/loss in dollars
 */
export function recordTradeOutcome(asset, signal, confidence, outcome, pnl = 0) {
  const profile = loadUserProfile();

  const trade = {
    asset,
    signal,
    confidence,
    outcome,
    pnl,
    timestamp: new Date().toISOString(),
  };

  profile.tradeHistory.push(trade);

  // Keep only last 100 trades
  if (profile.tradeHistory.length > 100) {
    profile.tradeHistory = profile.tradeHistory.slice(-100);
  }

  // Recalculate stats
  profile.winRate = calculateWinRate(profile.tradeHistory);
  profile.averageConfidence = calculateAverageConfidence(profile.tradeHistory);

  saveUserProfile(profile);
  return profile;
}

/**
 * Update user risk preference
 */
export function setRiskTolerance(tolerance) {
  const profile = loadUserProfile();
  if (['conservative', 'moderate', 'aggressive'].includes(tolerance)) {
    profile.riskTolerance = tolerance;
    saveUserProfile(profile);
  }
  return profile;
}

/**
 * Update user favorite assets
 */
export function setFavoriteAssets(assets) {
  const profile = loadUserProfile();
  profile.favoriteAssets = assets;
  saveUserProfile(profile);
  return profile;
}

/**
 * Update indicator preference weights
 */
export function setIndicatorWeights(weights) {
  const profile = loadUserProfile();
  const normalized = normalizeWeights({
    ...profile.indicatorWeights,
    ...weights,
  });
  profile.indicatorWeights = normalized;
  saveUserProfile(profile);
  return profile;
}

/**
 * Personalize signal based on user profile
 * Takes a generic signal and adjusts confidence/recommendation based on user history
 */
export function personalizeSignal(baseSignal, userProfile = null) {
  const profile = userProfile || loadUserProfile();

  // Calculate user-specific accuracy for this asset
  const assetTrades = profile.tradeHistory.filter(
    (t) => t.asset === baseSignal.asset
  );
  const assetWinRate = assetTrades.length > 0
    ? calculateWinRate(assetTrades)
    : 0.5;

  // Calculate signal-type accuracy
  const signalTrades = profile.tradeHistory.filter(
    (t) => t.signal === baseSignal.signal
  );
  const signalWinRate = signalTrades.length > 0
    ? calculateWinRate(signalTrades)
    : 0.5;

  // Blend base confidence with user's historical accuracy
  const userAccuracyMultiplier =
    assetWinRate * 0.4 + signalWinRate * 0.3 + profile.averageConfidence * 0.3;

  const personalizedConfidence = Math.min(
    1,
    baseSignal.confidence * userAccuracyMultiplier
  );

  // Adjust position size based on risk tolerance
  const positionSizeMultiplier = {
    conservative: 0.5,
    moderate: 1,
    aggressive: 1.5,
  }[profile.riskTolerance] || 1;

  return {
    ...baseSignal,
    confidence: personalizedConfidence,
    assetWinRate,
    signalWinRate,
    userProfile: {
      riskTolerance: profile.riskTolerance,
      tradingStyle: profile.tradingStyle,
    },
    positionSizeMultiplier,
    baseSignal,
  };
}

/**
 * Get personalization insights about user preferences
 */
export function getPersonalizationInsights(userProfile = null) {
  const profile = userProfile || loadUserProfile();

  const insights = {
    totalTrades: profile.tradeHistory.length,
    winRate: profile.winRate,
    favoriteAsset: findMostSuccessfulAsset(profile.tradeHistory),
    bestSignalType: findBestSignalType(profile.tradeHistory),
    strongestIndicator: findStrongestIndicator(profile),
    recommendedAdjustments: [],
  };

  // Generate recommendations
  if (insights.winRate < 0.45 && insights.totalTrades > 10) {
    insights.recommendedAdjustments.push(
      `Your win rate is ${(insights.winRate * 100).toFixed(1)}%. Consider increasing stop-loss distance or reducing position size.`
    );
  }

  if (insights.winRate > 0.65) {
    insights.recommendedAdjustments.push(
      `Excellent ${(insights.winRate * 100).toFixed(1)}% win rate! Consider increasing position size.`
    );
  }

  const momentumWeight = profile.indicatorWeights.momentum;
  if (insights.strongestIndicator === 'sentiment' && momentumWeight > 0.3) {
    insights.recommendedAdjustments.push(
      'You succeed more with sentiment, consider reducing momentum weight.'
    );
  }

  return insights;
}

/**
 * Calculate win rate from trade history
 */
function calculateWinRate(trades) {
  if (trades.length === 0) return 0.5;
  const wins = trades.filter((t) => t.outcome === 'WIN').length;
  return wins / trades.length;
}

/**
 * Calculate average confidence of all trades
 */
function calculateAverageConfidence(trades) {
  if (trades.length === 0) return 0.5;
  const sum = trades.reduce((acc, t) => acc + t.confidence, 0);
  return sum / trades.length;
}

/**
 * Normalize weights to sum to 1
 */
function normalizeWeights(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalized = {};
  Object.entries(weights).forEach(([key, val]) => {
    normalized[key] = val / sum;
  });
  return normalized;
}

/**
 * Find most successful asset
 */
function findMostSuccessfulAsset(trades) {
  if (trades.length === 0) return null;
  const assetStats = {};
  trades.forEach((t) => {
    if (!assetStats[t.asset]) {
      assetStats[t.asset] = { wins: 0, total: 0 };
    }
    assetStats[t.asset].total++;
    if (t.outcome === 'WIN') assetStats[t.asset].wins++;
  });

  let best = null;
  let bestRate = 0;
  Object.entries(assetStats).forEach(([asset, stats]) => {
    const rate = stats.wins / stats.total;
    if (rate > bestRate) {
      bestRate = rate;
      best = asset;
    }
  });
  return best;
}

/**
 * Find best performing signal type
 */
function findBestSignalType(trades) {
  if (trades.length === 0) return null;
  const signalStats = {};
  trades.forEach((t) => {
    if (!signalStats[t.signal]) {
      signalStats[t.signal] = { wins: 0, total: 0 };
    }
    signalStats[t.signal].total++;
    if (t.outcome === 'WIN') signalStats[t.signal].wins++;
  });

  let best = null;
  let bestRate = 0;
  Object.entries(signalStats).forEach(([signal, stats]) => {
    const rate = stats.wins / stats.total;
    if (rate > bestRate) {
      bestRate = rate;
      best = signal;
    }
  });
  return best;
}

/**
 * Find strongest indicator based on profile and history
 */
function findStrongestIndicator(profile) {
  const weights = profile.indicatorWeights;
  let strongest = 'momentum';
  let highest = weights.momentum;

  Object.entries(weights).forEach(([indicator, weight]) => {
    if (weight > highest) {
      highest = weight;
      strongest = indicator;
    }
  });

  return strongest;
}

/**
 * Export user profile for sharing
 */
export function exportUserProfile(userProfile = null) {
  const profile = userProfile || loadUserProfile();
  return {
    version: 1,
    riskTolerance: profile.riskTolerance,
    tradingStyle: profile.tradingStyle,
    indicatorWeights: profile.indicatorWeights,
    stats: {
      totalTrades: profile.tradeHistory.length,
      winRate: profile.winRate,
    },
  };
}

/**
 * Import user profile from shared config
 */
export function importUserProfile(configString) {
  try {
    const imported = JSON.parse(configString);
    const profile = loadUserProfile();
    profile.riskTolerance = imported.riskTolerance || profile.riskTolerance;
    profile.tradingStyle = imported.tradingStyle || profile.tradingStyle;
    profile.indicatorWeights = imported.indicatorWeights || profile.indicatorWeights;
    saveUserProfile(profile);
    return profile;
  } catch (e) {
    console.error('Failed to import profile:', e);
    return null;
  }
}

