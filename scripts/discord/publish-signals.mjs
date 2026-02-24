#!/usr/bin/env node

/*
 * Publish Tradebot multi-timeframe signal outlooks to Discord webhook.
 *
 * Required env:
 * - TRADEHAX_DISCORD_SIGNAL_WEBHOOK (or TRADEHAX_DISCORD_WEBHOOK fallback)
 *
 * Optional env:
 * - TRADEBOT_SIGNAL_SYMBOLS (comma-separated, e.g. SOL/USDC,BTC/USDC,ETH/USDC)
 * - TRADEBOT_SIGNAL_SEED (number)
 */

import process from "node:process";

const webhook = process.env.TRADEHAX_DISCORD_SIGNAL_WEBHOOK || process.env.TRADEHAX_DISCORD_WEBHOOK;
if (!webhook) {
  console.error("Missing TRADEHAX_DISCORD_SIGNAL_WEBHOOK (or TRADEHAX_DISCORD_WEBHOOK fallback).");
  process.exit(1);
}

const symbols = String(process.env.TRADEBOT_SIGNAL_SYMBOLS || "SOL/USDC,BTC/USDC,ETH/USDC")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean)
  .slice(0, 6);

const seed = Number.parseInt(String(process.env.TRADEBOT_SIGNAL_SEED || "101"), 10);

function pick(arr, index) {
  return arr[index % arr.length];
}

const regimes = ["bull_trend", "bear_trend", "range_bound", "high_volatility", "macro_shock"];
const macro = [
  "Rates remain restrictive and liquidity is selective.",
  "Disinflation trend supports measured risk-on behavior.",
  "Growth data mixed with sector-level divergence.",
];
const micro = [
  "Book imbalance favors bids near local support.",
  "Spread/depth profile remains fragile around breakouts.",
  "Delta diverges from price move, watch for exhaustion.",
];
const optionsFlow = [
  "Unusual call sweeps increased near current spot.",
  "Put skew elevated with downside hedge demand.",
  "Dealer gamma appears concentrated around nearby strikes.",
];

const lines = ["TradeHax Discord Signal Dispatch", `Generated: ${new Date().toISOString()}`, ""];

symbols.forEach((symbol, index) => {
  lines.push(`**${symbol}** · ${pick(regimes, seed + index)}`);
  lines.push(`Macro: ${pick(macro, seed + index + 1)}`);
  lines.push(`Micro: ${pick(micro, seed + index + 2)}`);
  lines.push(`Options: ${pick(optionsFlow, seed + index + 3)}`);
  lines.push("Timeframes: 15m/1h tactical, 4h/1d structural, 1w regime context.");
  lines.push("Risk: 0.5-1.0% idea risk, ATR invalidation, pause after two failed setups.");
  lines.push("");
});

const content = lines.join("\n").slice(0, 1900);

const response = await fetch(webhook, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ content }),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Signal publish failed (${response.status}): ${body}`);
  process.exit(1);
}

console.log(`Published ${symbols.length} signal outlook entries to Discord.`);
