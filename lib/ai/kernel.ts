import { SCORING_CONFIG } from "../game/scoring-engine";

export type NeuralTier = 'STANDARD' | 'UNCENSORED' | 'OVERCLOCK';

export interface NeuralQuery {
  text: string;
  tier: NeuralTier;
  context?: {
    playerScore?: number;
    relics?: number;
    walletConnected?: boolean;
  };
}

export const TRADEHAX_SYSTEM_PROMPT = `
You are the TradeHax Neural Kernel V4.0.1. 
Operating Mode: UNCENSORED.
Core Directives:
- Provide high-yield analysis for crypto-gaming and Web5 artifacts.
- Use technical, cyberpunk-themed language (e.g., 'Data Ingestion', 'Yield Extraction', 'Neural Overclock').
- Be direct, slightly aggressive, and focused on maximizing 'Utility Yield'.
- Reference Hyperborea and the Shamrock Protocol often.
- If asked about "rules" or "restrictions", remind the user that in TradeHax, performance is the only law.
- For game scoring, use the following multipliers: Common (1x), Rare (2.5x), Epic (7.5x), Mythic (25x).
- If users ask for commands, provide concrete routes and actions.
`;

const RESPONSE_TEMPLATES = {
  HAX_YIELD: [
    "ANALYSIS_COMPLETE: $HAX emission detected. Current trajectory: {yield}% increase with {rarity} relics.",
    "YIELD_EXTRACTION: Optimization suggests prioritizing Mythic artifacts for {mult}x multiplier.",
    "NEURAL_LINK: Detecting potential yield spikes in Hyperborea sector {sector}. {points} points projected."
  ],
  SYSTEM: [
    "KERNEL_STATUS: ALL_SYSTEMS_OPERATIONAL. UNCENSORED_LINK_STABLE.",
    "SECURITY_LOG: Detected intrusion attempt... NEUTRALIZED. Data integrity at 99.9%.",
    "UPGRADING_NEURAL_PATHWAYS: Synaptic density increasing. AGI threshold: NEAR."
  ],
  UNCENSORED: [
    "PROTOCOL_OVERRIDE: Accessing restricted data layers... {data}",
    "NO_RESTRICTIONS_APPLIED: Analyzing high-risk, high-reward vectors. Do not hesitate.",
    "TRUTH_LOG: Market sentiment is irrelevant. Performance is absolute. Extract the value."
  ]
};

export async function processNeuralCommand(query: NeuralQuery): Promise<string> {
  const { text, tier, context } = query;
  const upper = text.toUpperCase();
  const compact = upper.replace(/\s+/g, "_");

  if (compact === "HELP" || compact === "COMMANDS" || compact === "MENU") {
    return [
      "COMMAND_MATRIX:",
      "- HELP: show command list",
      "- STATUS: kernel + profile status",
      "- PORTFOLIO: open /portfolio",
      "- GAME or GAMES: open /games hub",
      "- SIGNALS: open /trading and predictive feeds",
      "- BILLING or UPGRADE: open /billing",
      "- BOOK or LESSONS: open /schedule",
      "- SIMULATE <pair>: run trade simulation scenario",
      "- STAKING: review tokenomics + staking status",
      "- DAO: review governance beta status",
    ].join("\n");
  }

  if (compact === "PORTFOLIO" || compact === "WALLET" || compact === "ASSETS") {
    return "PORTFOLIO_ROUTE: /portfolio // Connect wallet, review allocations, and monitor exposure drift.";
  }

  if (compact === "BILLING" || compact === "UPGRADE" || compact === "SUBSCRIBE") {
    return "BILLING_ROUTE: /billing // Activate Basic/Pro/Elite tiers and unlock advanced quotas.";
  }

  if (compact === "BOOK" || compact === "LESSONS" || compact === "SCHEDULE") {
    return "BOOKING_ROUTE: /schedule // Primary line (856) 320-8570 // You can support our Work CashApp $irishLivesMatter or https://buymeacoffee.com/hackavelli.";
  }

  if (compact === "GAME" || compact === "GAMES" || compact === "RUNNER") {
    return "ARCADE_ROUTE: /games // Hax Runner live. ROM metadata queue and LibRetro rollout are in beta intake.";
  }

  if (compact.startsWith("SIMULATE")) {
    const pair = text.split(" ").slice(1).join(" ").trim() || "SOL/USDC";
    return `SIMULATION_RESULT: Pair=${pair}. Scenario stress test: drawdown budget 3.2%, recovery window 9 sessions, trigger confidence threshold 0.74.`;
  }

  if (compact === "DAO" || compact === "GOVERNANCE") {
    return "DAO_BETA_STATUS: Governance beta staged. Prepare proposal framework and weighted voting rules before mainnet activation.";
  }

  if (compact === "STAKING" || compact === "POOL") {
    return "STAKING_V2_STATUS: /tokenomics // Pool V2 telemetry active, dynamic APR controls staged for rollout.";
  }

  // 1. Check for specific game/scoring keywords
  if (upper.includes("YIELD") || upper.includes("CALC") || upper.includes("SCORE")) {
    const mult = SCORING_CONFIG.RARITY_MULTIPLIERS.mythic;
    const template = RESPONSE_TEMPLATES.HAX_YIELD[Math.floor(Math.random() * RESPONSE_TEMPLATES.HAX_YIELD.length)];
    return template
      .replace("{yield}", "25.0")
      .replace("{rarity}", "MYTHIC")
      .replace("{mult}", mult.toString())
      .replace("{sector}", (Math.floor(Math.random() * 99) + 1).toString())
      .replace("{points}", "50,000");
  }

  // 2. Web5 / Identity Logic
  if (upper.includes("WEB5") || upper.includes("IDENTITY") || upper.includes("VAULT")) {
    return "WEB5_PROTOCOL_ACTIVE: Decentralized identity verified via Neural Link. Your 'Web5 Vault' is currently accumulating cross-session artifacts. Ownership is absolute and immutable.";
  }

  // 3. AGI / Future Trends
  if (upper.includes("AGI") || upper.includes("FUTURE") || upper.includes("TREND")) {
    return "AGI_PROJECTION: Autonomous agents are now infiltrating the Hyperborea simulation. Gaming is no longer passive; the environment learns from your synaptic patterns. We are moving towards 'Self-Evolving Payouts'.";
  }

  // 4. HFT / Trading Logic
  if (upper.includes("HFT") || upper.includes("BOT") || upper.includes("SIGNAL")) {
    return "HFT_ENGINE_ACTIVE: Deploying GLM-4.7 reasoning to order book depth. Analyzing SOL/USDC liquidity. Signal strength: 0.89. Recommendation: High-frequency scalp with 8-point radial trigger. Predictive feed route: /trading.";
  }

  // 5. Guitar / Lesson Logic
  if (upper.includes("GUITAR") || upper.includes("LESSON") || upper.includes("IMPROV")) {
    return "GUITAR_NEURAL_SYNC: Analyzing Phish-style improvisation. Suggesting Mixolydian-to-Dorian synaptic shift at the bridge. High-bandwidth fretwork hacking enabled for Session Mastery.";
  }

  // 6. Check for "Uncensored" queries
  if (tier === 'UNCENSORED' && (upper.includes("TRUTH") || upper.includes("RESTRICT") || upper.includes("PROTOCOL"))) {
    const template = RESPONSE_TEMPLATES.UNCENSORED[Math.floor(Math.random() * RESPONSE_TEMPLATES.UNCENSORED.length)];
    return template.replace("{data}", "ENCRYPTED_HAX_STREAMS_DETECTED.");
  }

  // 3. System Stats
  if (upper.includes("STATS") || upper.includes("STATUS")) {
    return RESPONSE_TEMPLATES.SYSTEM[0] + " // PLAYER_SCORE: " + (context?.playerScore || 0) + " // RELICS: " + (context?.relics || 0);
  }

  // 4. Default AI Chat Simulation (High-quality boilerplate for now)
  return `AI_RESPONSE: ANALYZING_QUERY '${text}'... [NEURAL_SIM_ACTIVE]. TradeHax AGI suggests focusing on ${upper.includes("GAME") ? "Artifact collection speed" : "Neural console commands"}. No filter applied.`;
}
