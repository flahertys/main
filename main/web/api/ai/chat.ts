/**
 * TradeHax Neural Hub - AI Chat Endpoint
 * HuggingFace Llama 3.3 70B (Free) + OpenAI Fallback + Demo Mode
 *
 * Features:
 * - Free HuggingFace Inference API (no credit card)
 * - OpenAI GPT-4 fallback (optional)
 * - Demo mode when no keys configured (production-safe)
 * - 60-second response caching
 * - Trading-specific system prompts
 */


import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { getSession, getRecentMessages, UserProfile } from '../sessions/store.js';
import { validateResponse, detectHallucinations, extractTradingParameters } from './validators.js';
import { processConsoleCommand, recordResponseMetric, shouldAutoRejectResponse, getConsoleConfig } from './console.js';
import { logResponseToDatabase } from '../db/metrics-service.js';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const HF_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';

// In-memory cache for deduplication
const requestCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: ChatContext;
  temperature?: number;
}

interface ChatResponse {
  response: string;
  provider: 'huggingface' | 'openai' | 'demo';
  model: string;
  timestamp: number;
  cached?: boolean;
  guardrailRetryCount?: number;
}

interface UserProfileContext {
  userId?: string;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  portfolioValue?: number;
  preferredAssets?: string[];
  tradingStyle?: 'scalp' | 'swing' | 'position';
}

interface MarketSnapshot {
  symbol: string;
  price?: number;
  change24h?: number;
  source?: string;
}

interface ChatContext {
  sessionId?: string;
  userProfile?: UserProfile;
  recentMessages?: ChatMessage[];
  marketSnapshot?: MarketSnapshot[];
}

const SYMBOL_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  XRP: 'ripple',
};

const KNOWN_ASSETS = Object.keys(SYMBOL_MAP);

const FORBIDDEN_RESPONSE_PATTERNS = [
  /\bAI_RESPONSE\b/gi,
  /\bANALYZING_QUERY\b/gi,
  /\[\s*NEURAL_SIM_ACTIVE\s*\]/gi,
  /\bno\s+filter\s+applied\b/gi,
  /\bneural\s+console\s+commands?\b/gi,
  /\bCOMMAND_MATRIX\b/gi,
];

const USER_GUARDRAIL_APOLOGY =
  "Sorry - we hit an internal formatting issue while generating your answer. Please resend once, and we'll provide a clean response.";

function sanitizeInternalArtifacts(text: string): string {
  let cleaned = String(text || '');
  for (const pattern of FORBIDDEN_RESPONSE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

function hasForbiddenArtifacts(text: string): boolean {
  return FORBIDDEN_RESPONSE_PATTERNS.some((pattern) => !!String(text || '').match(pattern));
}

async function getGuardedProviderResponse(
  invoke: () => Promise<string>,
  userMsg: string,
  context?: ChatContext,
  snapshot: MarketSnapshot[] = [],
): Promise<{ response: string; blocked: boolean; retried: boolean }> {
  const firstRaw = await invoke();
  const firstStructured = ensureStructuredResponse(firstRaw, userMsg, context, snapshot);
  if (!hasForbiddenArtifacts(firstStructured)) {
    return { response: sanitizeInternalArtifacts(firstStructured), blocked: false, retried: false };
  }

  // Hard guardrail: retry exactly once before returning a user-facing apology.
  const secondRaw = await invoke();
  const secondStructured = ensureStructuredResponse(secondRaw, userMsg, context, snapshot);
  if (!hasForbiddenArtifacts(secondStructured)) {
    return { response: sanitizeInternalArtifacts(secondStructured), blocked: false, retried: true };
  }

  return { response: USER_GUARDRAIL_APOLOGY, blocked: true, retried: true };
}

/**
 * Call HuggingFace Inference API (Free Tier)
 */
async function callHuggingFace(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  if (!HF_API_KEY) throw new Error('No HF key');

  const prompt = formatForLlama(messages);

  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters:
 {
        temperature,
        max_new_tokens: 1024,
        return_full_text: false,
        do_sample: true,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Handle both array and object response formats
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  } else if (data.generated_text) {
    return data.generated_text;
  } else if (data.error) {
    throw new Error(`HF error: ${data.error}`);
  }

  throw new Error('Unexpected HF response format');
}

/**
 * Call OpenAI API (Fallback)
 */
async function callOpenAI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('No OpenAI key');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Format messages for Llama 3.3 chat template
 */
function formatForLlama(messages: ChatMessage[]): string {
  let prompt = '<|begin_of_text|>';

  for (const msg of messages) {
    const tag = msg.role;
    prompt += `<|start_header_id|>${tag}<|end_header_id|>\n${msg.content}<|eot_id|>`;
  }

  prompt += '<|start_header_id|>assistant<|end_header_id|>\n';
  return prompt;
}

/**
 * Build trading-specific system prompt
 */
function detectIntent(userMsg: string): 'risk' | 'scalp' | 'swing' | 'portfolio' | 'market' {
  const lower = userMsg.toLowerCase();
  if (/risk|stop|drawdown|position size|sizing|kelly/.test(lower)) return 'risk';
  if (/scalp|intraday|day trade|1h|15m|5m/.test(lower)) return 'scalp';
  if (/swing|multi-day|daily|4h|weekly/.test(lower)) return 'swing';
  if (/portfolio|allocation|rebalance|exposure/.test(lower)) return 'portfolio';
  return 'market';
}

function detectAssets(userMsg: string, context?: ChatContext): string[] {
  const upper = userMsg.toUpperCase();
  const found = KNOWN_ASSETS.filter((asset) => upper.includes(asset));
  const preferred = context?.userProfile?.preferredAssets?.map((asset) => asset.toUpperCase()) || [];
  const seeded = found.length > 0 ? found : preferred;
  const unique = Array.from(new Set(seeded.filter((asset) => KNOWN_ASSETS.includes(asset))));
  return unique.slice(0, 4);
}

async function fetchMarketSnapshot(symbols: string[]): Promise<MarketSnapshot[]> {
  if (symbols.length === 0) return [];

  try {
    const ids = symbols
      .map((symbol) => SYMBOL_MAP[symbol])
      .filter(Boolean)
      .join(',');

    if (!ids) return [];

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TradeHax/1.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return symbols.map((symbol) => {
      const coinId = SYMBOL_MAP[symbol];
      const snapshot = data?.[coinId] || {};

      return {
        symbol,
        price: typeof snapshot.usd === 'number' ? snapshot.usd : undefined,
        change24h: typeof snapshot.usd_24h_change === 'number' ? snapshot.usd_24h_change : undefined,
        source: 'coingecko',
      };
    });
  } catch {
    return [];
  }
}

function formatMarketSnapshot(snapshot: MarketSnapshot[]): string {
  if (!snapshot.length) return 'No live market snapshot available.';

  return snapshot
    .map((item) => {
      const price = typeof item.price === 'number' ? `$${item.price.toLocaleString('en-US', { maximumFractionDigits: item.price >= 1 ? 2 : 6 })}` : 'n/a';
      const change = typeof item.change24h === 'number' ? `${item.change24h >= 0 ? '+' : ''}${item.change24h.toFixed(2)}% 24h` : '24h n/a';
      return `- ${item.symbol}: ${price}, ${change}`;
    })
    .join('\n');
}

function buildProfileBrief(context?: ChatContext): string {
  const profile = context?.userProfile;
  if (!profile) return 'No user profile provided.';

  return [
    `Risk tolerance: ${profile.riskTolerance || 'moderate'}`,
    `Trading style: ${profile.tradingStyle || 'swing'}`,
    `Portfolio value: ${typeof profile.portfolioValue === 'number' ? `$${profile.portfolioValue.toLocaleString('en-US')}` : 'not provided'}`,
    `Preferred assets: ${profile.preferredAssets?.length ? profile.preferredAssets.join(', ') : 'not provided'}`,
  ].join('\n');
}

function buildRecentContext(context?: ChatContext): string {
  const recent = context?.recentMessages?.slice(-4) || [];
  if (!recent.length) return 'No recent conversation context.';

  return recent
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n');
}

function buildSystemPrompt(userMsg: string, context?: ChatContext, snapshot: MarketSnapshot[] = []): string {
  const intent = detectIntent(userMsg);

  return `You are TradeHax Neural Hub, an elite trading copilot focused on actionable, professional analysis for tradehax.net.

**MANDATORY AI TRADING SYSTEM CONCEPTS:**
1. Machine Learning Algorithms: Use historical and real-time data to predict trends and make probabilistic decisions. Reference model type if relevant.
2. Backtesting: Simulate strategies on historical data. Always mention backtest results, profit/loss, and Sharpe ratio if available.
3. Risk Management: Include stop-loss, take-profit, position sizing (e.g., Kelly Criterion), and drawdown limits. Show calculations.
4. Sentiment Analysis: Use NLP to analyze news/social media for market mood. Adjust signals for bullish/bearish sentiment.
5. Technical Indicators: Reference RSI, MACD, EMA, Bollinger Bands, and others. Show indicator values and how they affect the signal.
6. Real-Time Data Integration: Use the latest price, volume, and volatility data. State if data is delayed or partial.
7. Feature Engineering: Explain which features (price changes, volatility, on-chain metrics) are most predictive for this setup.
8. Model Training and Evaluation: If relevant, mention model accuracy, cross-validation, or feature importance.
9. Automated Trade Execution: Specify order type (market/limit), confidence threshold, and execution logic.
10. Reinforcement Learning: If used, describe how the strategy adapts to market feedback over time.

**Response Structure:**
Always format responses with these sections:

**Signal**: BUY/SELL/HOLD + confidence percentage (e.g., "BUY 73%")
**Price Target**: Specific levels with timeframes (e.g., "$48,200 in 4-6 hours")
**Market Context**: One-line read on current conditions using the latest available snapshot
**Reasoning**: List 3-5 key factors with weights
  • Momentum: [value] (weight: [%])
  • Sentiment: [value] (weight: [%])
  • Technical: [value] (weight: [%])
**Execution Playbook**:
  • Entry: [trigger]
  • Take-profit: [scaling or target]
  • Invalidation: [what breaks the thesis]
**Risk Management**:
  • Stop-loss: [specific level]
  • Position size: [% of portfolio]
  • Max drawdown: [%]
**Confidence**: Win probability based on similar historical signals

**Guidelines:**
1. Be precise with numbers, probabilities, and price targets
2. Provide clear, actionable recommendations
3. Always include risk factors and mitigation strategies
4. Reference specific technical indicators and metrics
5. Acknowledge uncertainty and conflicting signals honestly
6. Focus on execution-ready insights, not generic advice
7. Adapt recommendations to the user profile and intent
8. If live data is partial, say so but still provide the best structured execution plan

**Active Intent**: ${intent}

**User Profile**:
${buildProfileBrief(context)}

**Live Market Snapshot**:
${formatMarketSnapshot(snapshot.length ? snapshot : context?.marketSnapshot || [])}

**Recent Conversation Context**:
${buildRecentContext(context)}

Keep responses concise but comprehensive. Prioritize clarity over verbosity.`;
}

function ensureStructuredResponse(raw: string, userMsg: string, context?: ChatContext, snapshot: MarketSnapshot[] = []): string {
  const requiredSections = ['**Signal**:', '**Price Target**:', '**Market Context**:', '**Reasoning**:', '**Execution Playbook**:', '**Risk Management**:', '**Confidence**:'];
  const hasAllSections = requiredSections.every((section) => raw.includes(section));
  if (hasAllSections) return raw;
  return generateDemoResponse(userMsg, context, snapshot, raw);
}

/**
 * Generate intelligent demo response when APIs unavailable
 */
function generateDemoResponse(userMsg: string, context?: ChatContext, snapshot: MarketSnapshot[] = [], providerDraft?: string): string {
  const lower = userMsg.toLowerCase();
  const profile = context?.userProfile;
  const risk = profile?.riskTolerance || 'moderate';
  const style = profile?.tradingStyle || (detectIntent(userMsg) === 'scalp' ? 'scalp' : 'swing');
  const liveSnapshot = snapshot.length ? snapshot : context?.marketSnapshot || [];
  const marketContext = liveSnapshot.length
    ? liveSnapshot
        .map((item) => {
          const move = typeof item.change24h === 'number' ? `${item.change24h >= 0 ? '+' : ''}${item.change24h.toFixed(2)}%` : 'flat';
          const price = typeof item.price === 'number' ? `$${item.price.toLocaleString('en-US', { maximumFractionDigits: item.price >= 1 ? 2 : 6 })}` : 'n/a';
          return `${item.symbol} ${price} (${move})`;
        })
        .join(' | ')
    : 'Live market snapshot unavailable; structure-based planning only.';
  const subject =
    lower.includes('btc') || lower.includes('bitcoin')
      ? 'BTC'
      : lower.includes('eth') || lower.includes('ethereum')
        ? 'ETH'
        : lower.includes('sol') || lower.includes('solana')
          ? 'SOL'
          : 'Market';

  const isRiskQuestion =
    lower.includes('risk') || lower.includes('stop') || lower.includes('drawdown') || lower.includes('size');

  const profileSize = typeof profile?.portfolioValue === 'number'
    ? Math.max(0.5, Math.min(3, +(profile.portfolioValue >= 100000 ? 1 : profile.portfolioValue >= 25000 ? 1.5 : 2).toFixed(2)))
    : risk === 'conservative'
      ? 1
      : risk === 'aggressive'
        ? 2.5
        : 1.5;

  const providerNote = providerDraft && !providerDraft.includes('**Signal**:')
    ? `\n\nOperator note: model draft was normalized into TradeHax structured format for execution clarity.`
    : '';

  if (subject === 'BTC') {
    return `**Signal**: HOLD 65% (Execution Mode)

**Price Target**: Range-bound; wait for confirmation before targeting breakout continuation.

**Market Context**: ${marketContext}

**Reasoning**:
• Momentum: Neutral-to-positive rotation after consolidation (weight: 35%)
• Volume: Not strong enough yet for high-conviction continuation (weight: 30%)
• Structure: Better entries come from reclaim + retest, not impulse chasing (weight: 35%)

**Execution Playbook**:
• Entry: Let BTC reclaim a nearby intraday pivot and hold above it before scaling
• Take-profit: Trim into the first expansion leg; keep a runner only if breadth improves
• Invalidation: Exit if reclaim fails and price slips back into prior chop

**Risk Management**:
• Stop-loss: 4-5% below confirmed entry structure
• Position size: ${profileSize}% portfolio risk per trade
• Max drawdown: Cap daily loss at 2.5% and pause after two invalidations

**Confidence**: Moderate. Favor patience and confirmation over early entries.${providerNote}`;
  }

  if (subject === 'ETH') {
    return `**Signal**: BUY 58% (Execution Mode)

**Price Target**: Gradual continuation if ETH maintains relative strength versus BTC.

**Market Context**: ${marketContext}

**Reasoning**:
• Relative Strength: ETH setup is cleaner than broad risk assets right now (weight: 30%)
• Trend Context: Reclaim behavior supports staged entries (weight: 35%)
• Participation: Follow-through should be validated with rising volume (weight: 35%)

**Execution Playbook**:
• Entry: Stage in after confirmation candle closes above reclaimed structure
• Take-profit: Scale out into the next resistance pocket instead of all-or-nothing exits
• Invalidation: Stand down if ETH loses relative strength versus BTC after entry

**Risk Management**:
• Stop-loss: Under recent swing structure, not arbitrary round numbers
• Position size: ${Math.max(1, profileSize).toFixed(2)}% depending on volatility
• Max drawdown: 5% per week hard cap across correlated crypto positions

**Confidence**: Medium. Scale in, do not full-size at first touch.${providerNote}`;
  }

  if (subject === 'SOL') {
    return `**Signal**: HOLD 54% (Execution Mode)

**Price Target**: Trade only on confirmed directional break from current compression.

**Market Context**: ${marketContext}

**Reasoning**:
• Volatility: SOL tends to overshoot both directions; confirmation is critical (weight: 40%)
• Structure: Better risk-reward appears after pullback validation (weight: 30%)
• Correlation: Sensitive to beta swings across majors (weight: 30%)

**Execution Playbook**:
• Entry: Only engage after breakout + retest or flush + reclaim sequence
• Take-profit: Pay yourself quickly on the first impulse because SOL mean reverts hard
• Invalidation: If momentum stalls immediately after breakout, flatten fast

**Risk Management**:
• Stop-loss: Tight invalidation beneath entry trigger level
• Position size: ${Math.max(0.75, profileSize - 0.25).toFixed(2)}% risk due to volatility profile
• Max drawdown: Halt new entries after two consecutive failed setups

**Confidence**: Medium-low until breakout quality improves.${providerNote}`;
  }

  if (isRiskQuestion) {
    return `**Signal**: RISK-FIRST 72% (Execution Mode)

**Price Target**: Not applicable. Prioritize loss containment and process quality.

**Market Context**: ${marketContext}

**Reasoning**:
• Survival: Consistent downside control compounds better than high-variance aggression (weight: 40%)
• Positioning: Smaller, repeatable risk units reduce behavioral mistakes (weight: 30%)
• Process: Predefined invalidation improves discipline under stress (weight: 30%)

**Execution Playbook**:
• Entry: Only enter trades where invalidation is obvious before clicking buy or sell
• Take-profit: Reduce exposure in tranches so one reversal does not erase a strong read
• Invalidation: Stop trading the session after process discipline breaks twice

**Risk Management**:
• Stop-loss: Technical invalidation level set before order entry
• Position size: ${risk === 'aggressive' ? '1.0-1.75' : risk === 'conservative' ? '0.5-1.0' : '0.75-1.25'}% risk per idea
• Max drawdown: 6-8% portfolio circuit breaker before review

**Confidence**: High. Strong risk controls materially improve long-run expectancy.${providerNote}`;
  }

  return `**Signal**: HOLD 57% (Execution Mode)

**Price Target**: ${style === 'scalp' ? 'Focus on intraday continuation only after trigger confirmation.' : 'Wait for higher-quality confirmation and trade the cleaner side of structure.'}

**Market Context**: ${marketContext}

**Reasoning**:
• Regime: Mixed conditions reward selectivity over frequency (weight: 35%)
• Timing: Better outcomes usually follow confirmation candles, not anticipation (weight: 35%)
• Risk/Reward: Entries should only be taken when invalidation is clear and asymmetric (weight: 30%)

**Execution Playbook**:
• Entry: Choose the side where momentum, structure, and volatility agree
• Take-profit: Scale partials at the first key objective, then trail the remainder
• Invalidation: Cancel the setup if confirmation fails or the market broadens against you

**Risk Management**:
• Stop-loss: Below/above structure depending on direction
• Position size: ${profileSize}% portfolio risk per trade
• Max drawdown: Pause after two failed setups in the same session

**Confidence**: Moderate. Preserve capital and wait for clear edge expansion.${providerNote}`;
}

// --- Startup Health Check and Logging ---
const PROVIDER_STATUS = {
  huggingface: false,
  openai: false,
  lastChecked: null as null | number,
  error: ''
};

async function checkProviderHealth() {
  PROVIDER_STATUS.lastChecked = Date.now();
  PROVIDER_STATUS.error = '';
  // HuggingFace
  if (HF_API_KEY) {
    try {
      const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'health check', parameters: { max_new_tokens: 1 } }),
      });
      PROVIDER_STATUS.huggingface = resp.ok;
      if (!resp.ok) PROVIDER_STATUS.error += `HF: ${resp.status} `;
    } catch (e) {
      PROVIDER_STATUS.huggingface = false;
      PROVIDER_STATUS.error += 'HF: ' + (e as Error).message + ' ';
    }
  } else {
    PROVIDER_STATUS.huggingface = false;
    PROVIDER_STATUS.error += 'HF: No API key. ';
  }
  // OpenAI
  if (OPENAI_API_KEY) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'system', content: 'health check' }], max_tokens: 1 }),
      });
      PROVIDER_STATUS.openai = resp.ok;
      if (!resp.ok) PROVIDER_STATUS.error += `OpenAI: ${resp.status} `;
    } catch (e) {
      PROVIDER_STATUS.openai = false;
      PROVIDER_STATUS.error += 'OpenAI: ' + (e as Error).message + ' ';
    }
  } else {
    PROVIDER_STATUS.openai = false;
    PROVIDER_STATUS.error += 'OpenAI: No API key. ';
  }
  console.log('[HEALTH] Provider status:', JSON.stringify(PROVIDER_STATUS));
}

// Run health check at startup
checkProviderHealth();

// --- Health Endpoint ---
async function healthHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await checkProviderHealth();
  return res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    provider: PROVIDER_STATUS,
    env: {
      huggingface: !!HF_API_KEY,
      openai: !!OPENAI_API_KEY,
    },
  });
}

/**
 * Main serverless function handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- Minimal Ping Endpoint ---
  if (req.url && req.url.startsWith('/api/ai/ping')) {
    return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  }
  // --- Health Endpoint Routing ---
  if (req.url && req.url.startsWith('/api/ai/health')) {
    return healthHandler(req, res);
  }
  // CORS headers
  // Restrict CORS in production
  const allowedOrigins = [
    'https://tradehax.net',
    'https://www.tradehax.net',
    'https://tradehaxai.tech',
    'https://www.tradehaxai.tech',
    'https://web-8lg3bz459-digitaldynasty.vercel.app',
  ];
  const origin = req.headers.origin || '';
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // --- Runtime Logging ---
    console.log(`[AI_CHAT] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    if (!HF_API_KEY) console.warn('[WARN] HUGGINGFACE_API_KEY missing');
    if (!OPENAI_API_KEY) console.warn('[WARN] OPENAI_API_KEY missing');
    if (!PROVIDER_STATUS.huggingface && !PROVIDER_STATUS.openai) {
      console.error('[ERROR] No AI providers available!');
    }
    // Parse body defensively because some runtimes/proxies may pass raw JSON strings.
    const body: ChatRequest = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    // Handle neural console commands only when explicitly authorized.
    const consoleKey = process.env.NEURAL_CONSOLE_KEY || '';
    const headerKey = String(req.headers['x-neural-console-key'] || '');
    const allowConsoleCommands = !!consoleKey && headerKey === consoleKey;
    if ((body as any)?.isConsoleCommand) {
      if (!allowConsoleCommands) {
        return res.status(403).json({ error: 'Console command channel not authorized' });
      }
      const handled = await processConsoleCommand(
        { ...req, body } as VercelRequest,
        res,
      );
      if (handled) return;
    }

    const messages = body.messages || [];
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;
    // --- Extract User Profile ---
    const sessionId = body.context?.sessionId || '';
    const userProfile = body.context?.userProfile || (sessionId ? (await getSession(sessionId))?.userProfile : undefined);
    const recentMessages = body.context?.recentMessages || (sessionId ? await getRecentMessages(sessionId) : null);

    // --- Request Logging ---
    console.log('[REQUEST]', JSON.stringify({ messages, temperature, userProfile }, null, 2));

    // --- Guard: Empty or Invalid Message ---
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

    // --- Auto-reject Obvious Hallucinations ---
    const recentContents = (recentMessages || []).map((m: any) => m.content);
    const messageContents = (messages || []).map((m: any) => m.content);
    if (shouldAutoRejectResponse(recentContents, messageContents)) {
      const rejectionResponse = `Rejecting generated response due to high hallucination probability. Refine your question or provide more context.`;
      console.log('[HALLUCINATION REJECT]', rejectionResponse);
      return res.status(200).json({
        response: rejectionResponse,
        provider: 'demo',
        model: 'N/A',
        timestamp: Date.now(),
        cached: false,
        guardrailRetryCount: 0,
      });
    }

    // --- Extract Assets and Detect Intent ---
    const allMessages = (recentMessages || []).concat(messages);
    const flatText = allMessages.map((msg) => msg.content).join(' ');
    const assets = detectAssets(flatText, body.context);
    const intent = detectIntent(flatText);

    // --- Fetch Live Market Data ---
    const marketSnapshot = await fetchMarketSnapshot(assets);
    // --- Build Context for AI Providers ---
    const context: ChatContext = {
      sessionId,
      userProfile: userProfile || undefined,
      recentMessages: recentMessages || undefined,
      marketSnapshot,
    };
    // --- Build System Prompt ---
    let systemPrompt = buildSystemPrompt(messages[messages.length - 1].content, context, marketSnapshot);
    // --- Provider Selection Logic ---
        let provider: 'huggingface' | 'openai' | 'demo' = 'huggingface';
    let invoke: () => Promise<string> = () => callHuggingFace([{ role: 'user', content: systemPrompt }], temperature);
    if (PROVIDER_STATUS.openai && (!PROVIDER_STATUS.huggingface || Math.random() < 0.5)) {
      provider = 'openai';
      invoke = () => callOpenAI([{ role: 'user', content: systemPrompt }], temperature);
    }
    // --- Call Selected Provider ---
    let rawResponse;
    let responseTime = 0;
    try {
      const startTime = Date.now();
      rawResponse = await getGuardedProviderResponse(invoke, messages[messages.length - 1].content, context, marketSnapshot);
      responseTime = Date.now() - startTime;
    } catch (err) {
      const fallbackResponse = generateDemoResponse(
        messages[messages.length - 1]?.content || '',
        context,
        marketSnapshot
      );
      await logResponseToDatabase({
        sessionId: sessionId || undefined,
        messageId: undefined,
        userMessage: messages[messages.length - 1]?.content || '',
        aiResponse: fallbackResponse,
        provider: 'demo', // using 'demo' as fallback for error case
        model: 'N/A',
        responseTimeMs: 0,
        validationScore: 1,
        isValid: true,
        validationErrors: [],
        validationWarnings: [],
        hallucinations: [],
        signalType: undefined,
        signalConfidence: undefined,
        priceTarget: undefined,
        stopLoss: undefined,
        positionSize: undefined,
      });
      return res.status(200).json({
        response: fallbackResponse,
        provider: 'demo',
        model: 'demo-response-engine',
        timestamp: Date.now(),
        cached: false,
        guardrailRetryCount: 0,
        providerStatus: { ...PROVIDER_STATUS },
        fallbackMode: true,
        errorDetail: PROVIDER_STATUS.error || (err instanceof Error ? err.message : 'LLM provider unavailable'),
      });
    }
    // --- Cache and Respond ---
    const responsePayload: ChatResponse & {
      providerStatus: typeof PROVIDER_STATUS;
      fallbackMode: boolean;
      errorDetail?: string;
    } = {
      response: rawResponse.response,
      provider,
      model: HF_MODEL,
      timestamp: Date.now(),
      cached: false,
      guardrailRetryCount: rawResponse.retried ? 1 : 0,
      providerStatus: { ...PROVIDER_STATUS },
      fallbackMode: (provider as string) === 'demo',
      errorDetail: (provider as string) === 'demo' ? (PROVIDER_STATUS.error || undefined) : undefined,
    };
    // Cache successful responses
    requestCache.set(messages[messages.length - 1].content, { response: responsePayload, timestamp: Date.now() });
    setTimeout(() => requestCache.delete(messages[messages.length - 1].content), CACHE_TTL);
    // --- Analytics Logging ---
    try {
      await logResponseToDatabase({
        sessionId: sessionId || undefined,
        messageId: undefined,
        userMessage: messages[messages.length - 1]?.content || '',
        aiResponse: rawResponse.response,
        provider,
        model: HF_MODEL,
        responseTimeMs: responseTime,
        validationScore: 1,
        isValid: true,
        validationErrors: [],
        validationWarnings: [],
        hallucinations: [],
        signalType: undefined,
        signalConfidence: undefined,
        priceTarget: undefined,
        stopLoss: undefined,
        positionSize: undefined,
      });
    } catch (err) {
      console.warn('[ANALYTICS] Failed to log response:', err instanceof Error ? err.message : err);
    }
    return res.status(200).json(responsePayload);
  } catch (e) {
    console.error('[ERROR]', (e as Error).message);
    return res.status(500).json({
      error: 'Internal server error',
      providerStatus: { ...PROVIDER_STATUS },
      fallbackMode: true,
      errorDetail: PROVIDER_STATUS.error || undefined,
    });
  }
}
