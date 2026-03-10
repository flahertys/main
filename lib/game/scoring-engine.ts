import { ArtifactRarity } from "./level-types";

/**
 * TradeHax Scoring Engine Configuration
 * Defines the weights and multipliers for crypto-payout calculations.
 */
export const SCORING_CONFIG = {
  UTILITY_POINTS_PER_TOKEN: 100,
  RARITY_MULTIPLIERS: {
    common: 1.0,
    rare: 2.5,
    epic: 7.5,
    mythic: 25.0,
  } as Record<ArtifactRarity, number>,
  COMBO_BONUS_STEP: 0.1, // 10% increase per combo level
  SPEED_BONUS_THRESHOLD: 120, // seconds for "fast" completion
} as const;

export interface ScoringFactors {
  basePoints: number;
  rarity: ArtifactRarity;
  combo: number;
  timeElapsedSeconds: number;
  isLockedAtPickup: boolean;
}

/**
 * Calculates the 'Utility Yield' for a collection event.
 * This is the value used to determine crypto disbursement.
 */
export function calculateUtilityYield(factors: ScoringFactors) {
  const { basePoints, rarity, combo, isLockedAtPickup } = factors;

  // 1. Rarity Multiplier (The most important factor for payout)
  const rarityMult = SCORING_CONFIG.RARITY_MULTIPLIERS[rarity];

  // 2. Combo Multiplier (Rewards skill and flow)
  const comboMult = 1 + (combo * SCORING_CONFIG.COMBO_BONUS_STEP);

  // 3. Penalty for "Brute Force" collection (if puzzle wasn't solved first)
  const integrityMult = isLockedAtPickup ? 0.4 : 1.0;

  // 4. Calculate Final Utility Points
  const rawYield = basePoints * rarityMult * comboMult * integrityMult;

  return {
    utilityPoints: Math.round(rawYield),
    projectedTokens: Math.floor(rawYield / SCORING_CONFIG.UTILITY_POINTS_PER_TOKEN),
    multipliers: {
      rarity: rarityMult,
      combo: comboMult,
      integrity: integrityMult
    }
  };
}

/**
 * Accumulates global run score into a payout-ready snapshot.
 */
export function finalizeRunPayout(
  totalScore: number,
  _relicsCollected: number,
  timeSeconds: number
) {
  // Speed bonus: Reward efficiency
  const speedBonus = timeSeconds < SCORING_CONFIG.SPEED_BONUS_THRESHOLD
    ? 1.5
    : 1.0;

  const finalUtility = Math.round(totalScore * 0.05 * speedBonus);

  return {
    finalUtility,
    tokenGrant: Math.floor(finalUtility / SCORING_CONFIG.UTILITY_POINTS_PER_TOKEN),
    performanceTier: speedBonus > 1 ? "EXCEPTIONAL" : "STANDARD"
  };
}
