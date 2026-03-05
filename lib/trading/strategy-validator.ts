/**
 * Strategy Validator
 *
 * Checks a StrategyDefinition for logical completeness and configuration errors.
 */

import type { StrategyDefinition, StrategyValidationResult } from "@/types/trading";

/**
 * Validate a strategy definition.
 *
 * Rules:
 * - Must have at least one enabled entry block.
 * - Must have at least one enabled exit block (take_profit, stop_loss, trailing_stop, or time_based_exit).
 * - Must have at least one enabled action block (buy or sell).
 * - Numeric params must satisfy their min/max constraints.
 *
 * @param strategy  The strategy to validate.
 * @returns         A result object with `valid`, `errors`, and `warnings` arrays.
 */
export function validateStrategy(strategy: StrategyDefinition): StrategyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const enabledBlocks = strategy.blocks.filter((b) => b.enabled);

  if (enabledBlocks.length === 0) {
    errors.push("Strategy has no enabled blocks.");
    return { valid: false, errors, warnings };
  }

  const entryBlocks = enabledBlocks.filter((b) => b.category === "entry");
  const exitBlocks = enabledBlocks.filter(
    (b) =>
      b.category === "exit" ||
      b.type === "take_profit" ||
      b.type === "stop_loss" ||
      b.type === "trailing_stop" ||
      b.type === "time_based_exit",
  );
  const actionBlocks = enabledBlocks.filter((b) => b.category === "action");

  if (entryBlocks.length === 0) {
    errors.push("Strategy requires at least one Entry Condition block.");
  }

  if (exitBlocks.length === 0) {
    errors.push("Strategy requires at least one Exit Condition block (Take Profit, Stop Loss, Trailing Stop, or Time-Based Exit).");
  }

  if (actionBlocks.length === 0) {
    errors.push("Strategy requires at least one Action block (Buy or Sell).");
  }

  // Validate numeric params
  for (const block of enabledBlocks) {
    for (const param of block.params) {
      if (param.type === "number" || param.type === "percent") {
        const numVal = Number(param.value);
        if (!Number.isFinite(numVal)) {
          errors.push(`Block "${block.label}" — parameter "${param.label}" must be a valid number.`);
          continue;
        }
        if (param.min !== undefined && numVal < param.min) {
          errors.push(
            `Block "${block.label}" — parameter "${param.label}" must be ≥ ${param.min}.`,
          );
        }
        if (param.max !== undefined && numVal > param.max) {
          errors.push(
            `Block "${block.label}" — parameter "${param.label}" must be ≤ ${param.max}.`,
          );
        }
      }
    }
  }

  // Warnings
  if (entryBlocks.length > 5) {
    warnings.push("More than 5 entry conditions may cause very few trade signals.");
  }
  if (exitBlocks.length > 3) {
    warnings.push("Multiple exit conditions are active — ensure they don't conflict.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
