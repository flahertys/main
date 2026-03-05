/**
 * Strategy Serializer
 *
 * Converts a StrategyDefinition to/from JSON for saving, loading, and sharing.
 */

import type { StrategyDefinition } from "@/types/trading";

/**
 * Serialize a strategy to a JSON string.
 *
 * @param strategy  The strategy definition to serialize.
 * @returns         A compact JSON string.
 */
export function serializeStrategy(strategy: StrategyDefinition): string {
  return JSON.stringify(strategy);
}

/**
 * Deserialize a strategy from a JSON string.
 *
 * @param json  The JSON string to parse.
 * @returns     The parsed StrategyDefinition, or null if parsing fails.
 */
export function deserializeStrategy(json: string): StrategyDefinition | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isStrategyDefinition(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Type guard for StrategyDefinition. */
function isStrategyDefinition(value: unknown): value is StrategyDefinition {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    Array.isArray(obj.blocks)
  );
}

/**
 * Clone a strategy with a new ID and timestamps.
 */
export function cloneStrategy(
  strategy: StrategyDefinition,
  newId: string,
  newName: string,
): StrategyDefinition {
  const now = new Date().toISOString();
  return {
    ...strategy,
    id: newId,
    name: newName,
    createdAt: now,
    updatedAt: now,
    blocks: strategy.blocks.map((b) => ({ ...b, params: b.params.map((p) => ({ ...p })) })),
  };
}
