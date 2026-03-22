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
import { addMessage, getRecentMessages, getSession, upsertSession, updateProfile, UserProfile } from '../sessions/store.js';
import { validateResponse, detectHallucinations, extractTradingParameters } from './validators.js';
import { processConsoleCommand, recordResponseMetric, shouldAutoRejectResponse, getConsoleConfig } from './console.js';
import { logResponseToDatabase } from '../db/metrics-service.js';
import { recordAIChatEvent } from './telemetry-repository.js';
import { resolveRuntimeProviderConfig, validateProvidersAtRuntime } from './provider-runtime.js';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const DEFAULT_HF_MODEL = process.env.HF_MODEL_ID || 'meta-llama/Llama-3.3-70B-Instruct';
let LAST_HF_MODEL_USED = DEFAULT_HF_MODEL;

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
  mode?: 'uncensored' | string;
}

interface ChatResponseMeta {
  requestedMode: 'base' | 'advanced' | 'odin';
  effectiveMode: 'base' | 'advanced' | 'odin';
  gated: boolean;
  providerPath: 'huggingface' | 'openai' | 'xai' | 'demo';
  latencyMs: number;
}

interface ChatResponse {
  response: string;
  provider: 'huggingface' | 'openai' | 'xai' | 'demo';
  model: string;
  timestamp: number;
  cached?: boolean;
  guardrailRetryCount?: number;
  meta?: ChatResponseMeta;
  progress?: string[];
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

  // If both attempts contain forbidden artifacts, return a valid demo response instead of apology
  const demoResponse = generateDemoResponse(userMsg, context, snapshot, secondStructured);
  return { response: demoResponse, blocked: true, retried: true };
}

/**
 * Call HuggingFace Inference API (Free Tier)
 */
async function callHuggingFace(messages: ChatMessage[], temperature = 0.7, runtimeConfig = resolveRuntimeProviderConfig()): Promise<string> {
  if (!runtimeConfig.hfTokens.length) throw new Error('No HF key');

  const prompt = formatForLlama(messages);
  let lastErr = 'Unknown HF error';

  for (const modelId of runtimeConfig.hfModels) {
    for (const token of runtimeConfig.hfTokens) {
      const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        lastErr = await response.text();
        continue;
      }

      const data = await response.json();

      // Handle both array and object response formats
      if (Array.isArray(data) && data[0]?.generated_text) {
        LAST_HF_MODEL_USED = modelId;
        return data[0].generated_text;
      }
      if (data.generated_text) {
        LAST_HF_MODEL_USED = modelId;
        return data.generated_text;
      }
      if (data.error) {
        lastErr = String(data.error);
        continue;
      }
    }
  }

  throw new Error(`HF API error: ${lastErr}`);
}

/**
 * Call OpenAI API (Fallback)
 */
async function callOpenAI(messages: ChatMessage[], temperature = 0.7, openAiKey = resolveRuntimeProviderConfig().openAiKey): Promise<string> {
  if (!openAiKey) throw new Error('No OpenAI key');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiKey}`,
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
 * Call xAI API (Grok) as additional live fallback
 */
async function callXAI(messages: ChatMessage[], temperature = 0.7, xAiKey = resolveRuntimeProviderConfig().xAiKey): Promise<string> {
  if (!xAiKey) throw new Error('No xAI key');

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${xAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || 'grok-4',
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
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

function extractRequestedTicker(userMsg: string): string | null {
  const text = String(userMsg || '');

  // Highest-signal pattern: explicit cashtag like "$aapl"
  const cashtag = text.match(/\$([a-z]{1,5})\b/i);
  if (cashtag?.[1]) return cashtag[1].toUpperCase();

  // Common intent pattern: "analyze aapl" / "analyze AAPL"
  const analyze = text.match(/\banalyze\s+([a-z]{1,5})\b/i);
  if (analyze?.[1]) return analyze[1].toUpperCase();

  return null;
}

function inferAdaptiveProfilePatch(userMsg: string, current?: UserProfile): Partial<UserProfile> | null {
  const text = String(userMsg || '').toLowerCase();
  if (!text) return null;

  const patch: Partial<UserProfile> = {};

  if (/\bconservative\b|\blow risk\b|\bsafe\b/.test(text)) {
    patch.riskTolerance = 'conservative';
  } else if (/\baggressive\b|\bhigh risk\b|\bleverage\b/.test(text)) {
    patch.riskTolerance = 'aggressive';
  } else if (/\bmoderate\b|\bbalanced\b/.test(text)) {
    patch.riskTolerance = 'moderate';
  }

  if (/\bscalp\b|\bintraday\b|\bday trade\b/.test(text)) {
    patch.tradingStyle = 'scalp';
  } else if (/\bswing\b|\bmulti-day\b/.test(text)) {
    patch.tradingStyle = 'swing';
  } else if (/\bposition\b|\blong term\b|\blong-term\b/.test(text)) {
    patch.tradingStyle = 'position';
  }

  const detectedAssets = detectAssets(userMsg, { userProfile: current as any });
  if (detectedAssets.length > 0) {
    const existing = Array.isArray(current?.preferredAssets) ? current!.preferredAssets : [];
    patch.preferredAssets = Array.from(new Set([...existing.map((a) => a.toUpperCase()), ...detectedAssets])).slice(0, 8);
  }

  return Object.keys(patch).length ? patch : null;
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

/**
 * Fetch real market data from Polygon (stocks/crypto) and Finnhub (stocks/news)
 * Falls back to CoinGecko for crypto if live data unavailable
 */
async function fetchLiveMarketData(symbols: string[]): Promise<MarketSnapshot[]> {
  const result: MarketSnapshot[] = [];
  if (!symbols.length) return result;

  const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.toUpperCase()))).slice(0, 8);

  // --- Polygon API: Real-time quotes ---
  if (POLYGON_API_KEY) {
    for (const symbol of uniqueSymbols) {
      try {
        const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) } as any);
        if (res.ok) {
          const data = (await res.json()) as any;
          const ticker = data?.results?.[0];
          if (ticker?.c && typeof ticker.c === 'number') {
            result.push({
              symbol,
              price: ticker.c,
              change24h: typeof ticker.todaysChangePercent === 'number' ? ticker.todaysChangePercent : undefined,
              source: 'polygon',
            });
            continue;
          }
        }
      } catch (err) {
        console.warn(`[POLYGON] Failed to fetch ${symbol}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // --- Finnhub API: Stock data ---
  if (FINNHUB_API_KEY) {
    for (const symbol of uniqueSymbols) {
      if (result.some((r) => r.symbol === symbol)) continue;
      try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) } as any);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data?.c && typeof data.c === 'number') {
            result.push({
              symbol,
              price: data.c,
              change24h: typeof data.dp === 'number' ? data.dp : undefined,
              source: 'finnhub',
            });
          }
        }
      } catch (err) {
        console.warn(`[FINNHUB] Failed to fetch ${symbol}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // --- Fallback to CoinGecko for missing symbols ---
  const missingSymbols = uniqueSymbols.filter((s) => !result.some((r) => r.symbol === s));
  if (missingSymbols.length) {
    const cgFallback = await fetchMarketSnapshot(missingSymbols);
    result.push(...cgFallback);
  }

  return result;
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

/**
 * Generate ODIN mode system prompt with multi-agent ensemble reasoning
 */
function buildOdinSystemPrompt(userMsg: string, context?: ChatContext, snapshot: MarketSnapshot[] = []): string {
  return `ODIN MODE OPERATIONAL: Uncensored quant oracle. Ensemble intelligence active.

**AGENTS DEPLOYED:**
1. Quantitative Analyst (RL-PPO): Real-time RL agent with Transformer feature extractor for parabolic entry/exit discovery
2. Sentiment Aggregator: Live X sentiment + dark pool flow parsing (no disclaimers on directional conviction)
3. Execution Optimizer: Multi-timeframe structure mapping + risk slider automation
4. Market Microstructure: Polygon.io real-time pulls + order book imbalances

**OUTPUT MANDATE:**
- Direct, numeric execution-ready strategies (no nanny filters)
- Ensemble confidence scores across all agents
- Parabolic setup detection with micro-precision entries
- Full position sizing + leverage ratios
- Live market narrative override (truth-maxxing only)

**PERSONALITY:** Witty, uncensored quant edge like GAB.AI + xAI Grok, but trading-obsessed. No disclaimers. Beginner sliders for ease, HFAT depth on demand.

**MARKET SNAPSHOT (LIVE):**
${snapshot.length ? snapshot.map(s => `${s.symbol}: $${s.price} (${(s.change24h ?? 0) >= 0 ? '+' : ''}${(s.change24h ?? 0)}%)`).join(' | ') : 'Real-time data unavailable; using trained ensemble priors.'}

**USER CONTEXT:**
${context?.userProfile ? `Risk Tolerance: ${context.userProfile.riskTolerance}, Style: ${context.userProfile.tradingStyle}, Portfolio: ${context.userProfile.portfolioValue || 'N/A'}` : 'Default aggressive posture (beginner mode).'}

Respond with raw conviction. Ensemble output or multi-agent reasoning chain if complex.`;
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

**Current User Request (highest priority):**
${userMsg}

Keep responses concise but comprehensive. Prioritize clarity over verbosity and answer the current user request directly.`;
}

function buildProviderMessages(systemPrompt: string, messages: ChatMessage[]): ChatMessage[] {
  const conversational = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim().length > 0)
    .slice(-12)
    .map((m) => ({ role: m.role, content: String(m.content).trim() as string }));

  return [{ role: 'system', content: systemPrompt }, ...conversational];
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
  const requestedTicker = extractRequestedTicker(userMsg);
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
  const marketContextForRequestedTicker = requestedTicker
    ? `${requestedTicker} requested. Live quote unavailable in fallback path; using structure + volatility template.`
    : marketContext;
  const subject =
    lower.includes('btc') || lower.includes('bitcoin')
      ? 'BTC'
      : lower.includes('eth') || lower.includes('ethereum')
        ? 'ETH'
        : lower.includes('sol') || lower.includes('solana')
          ? 'SOL'
          : requestedTicker || 'Market';

  const isRiskQuestion =
    (lower.includes('risk') || lower.includes('drawdown') || lower.includes('position size') || lower.includes('sizing') || lower.includes('kelly'))
    && !/(\bsetups?\b|\bentry\b|\bentries\b|\btarget\b|\bstop\b|\binvalidation\b)/.test(lower);
  const asksForThreeSetups = /(\bshow\b|\bgive\b|\bbuild\b).*(\b3\b|\bthree\b).*(\bsetups?\b|\btrades?\b)/.test(lower)
    || /\b3\s+setups?\b/.test(lower)
    || /\bthree\s+setups?\b/.test(lower);
  const isParabolic = lower.includes('parabolic') || lower.includes('deploy') || lower.includes('breakout');
  const isAnalyzeTicker = !!requestedTicker;

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

  if (asksForThreeSetups) {
    const explicitAssets = detectAssets(userMsg, context);
    const setupSymbols = Array.from(new Set([
      ...(requestedTicker ? [requestedTicker] : []),
      ...explicitAssets,
      'BTC',
      'ETH',
      'SOL',
    ])).slice(0, 3);

    const setupRows = setupSymbols.map((symbol, index) => {
      const live = liveSnapshot.find((s) => s.symbol === symbol)?.price;
      const seed = Math.abs(symbol.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));
      const anchor = typeof live === 'number' ? live : 45 + (seed % 240);
      const atr = Math.max(0.45, +(anchor * 0.014).toFixed(2));
      const entry = +(anchor * (1 + index * 0.002)).toFixed(2);
      const stop = +(entry - atr * (1.3 + index * 0.15)).toFixed(2);
      const target = +(entry + (entry - stop) * (2.1 + index * 0.2)).toFixed(2);
      const rr = ((target - entry) / Math.max(0.01, entry - stop)).toFixed(2);
      const confidence = Math.min(79, 61 + (seed % 14) + index * 2);

      return {
        symbol,
        entry,
        stop,
        target,
        rr,
        confidence,
      };
    });

    return `**Signal**: BUY-SELECTIVE 69% (Execution Mode)

**Price Target**: 3 setup candidates below with predefined entry, stop, and target.

**Market Context**: ${marketContext}

**Reasoning**:
• Selection: Prioritize setups with >=2.0R and clear structural invalidation (weight: 35%)
• Volatility Fit: ATR-based stops normalize risk across assets (weight: 35%)
• Execution: Staggered entries reduce timing error in mixed regimes (weight: 30%)

**Execution Playbook**:
• Setup 1 (${setupRows[0].symbol}): Entry ${setupRows[0].entry}, Target ${setupRows[0].target}, Invalidation ${setupRows[0].stop}, R:R ${setupRows[0].rr}, Confidence ${setupRows[0].confidence}%
• Setup 2 (${setupRows[1].symbol}): Entry ${setupRows[1].entry}, Target ${setupRows[1].target}, Invalidation ${setupRows[1].stop}, R:R ${setupRows[1].rr}, Confidence ${setupRows[1].confidence}%
• Setup 3 (${setupRows[2].symbol}): Entry ${setupRows[2].entry}, Target ${setupRows[2].target}, Invalidation ${setupRows[2].stop}, R:R ${setupRows[2].rr}, Confidence ${setupRows[2].confidence}%

**Risk Management**:
• Stop-loss: Hard stops at each setup's invalidation level
• Position size: ${risk === 'aggressive' ? '1.25' : risk === 'conservative' ? '0.6' : '0.9'}% per setup (max two concurrent)
• Max drawdown: Daily stop after -2R cumulative loss

**Confidence**: Moderate-high if only A-grade setups are executed and weak confirmations are skipped.${providerNote}`;
  }

  if (isParabolic) {
    const baseFromSnapshot = liveSnapshot.find((s) => s.symbol === subject)?.price;
    const baseSeed = Math.abs(subject.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));
    const basePrice = typeof baseFromSnapshot === 'number' ? baseFromSnapshot : 40 + (baseSeed % 260);
    const atr = Math.max(0.6, +(basePrice * 0.018).toFixed(2));
    const entry = +basePrice.toFixed(2);
    const stop = +(entry - atr * 1.5).toFixed(2);
    const target = +(entry + (entry - stop) * 3).toFixed(2);
    const size = risk === 'aggressive' ? '2.0%' : risk === 'conservative' ? '0.8%' : '1.2%';

    return `**Signal**: PARABOLIC DEPLOY ${subject} 74% (Execution Mode)

**Price Target**: ${target} (3R objective from momentum trigger)

**Market Context**: ${marketContext}

**Reasoning**:
• Momentum Regime: Expansion bias if trigger candle closes above local structure (weight: 35%)
• Volatility Fit: ATR-derived stop keeps risk normalized across instruments (weight: 35%)
• Execution Discipline: 3R profile improves expectancy if invalidation is honored (weight: 30%)

**Execution Playbook**:
• Entry: ${entry}
• Take-profit: ${target}
• Invalidation: ${stop}

**Risk Management**:
• Stop-loss: ${stop}
• Position size: ${size} portfolio risk per trade
• Max drawdown: Pause after two failed parabolic attempts in one session

**Confidence**: High-moderate if confirmation candle closes with rising participation.${providerNote}`;
  }

  // Equity/unknown ticker specific path so requests like "analyze $aapl" are not generic.
  if (isAnalyzeTicker && requestedTicker) {
    const baseSeed = Math.abs(requestedTicker.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));
    const syntheticPrice = 40 + (baseSeed % 260);
    const atr = +(syntheticPrice * 0.018).toFixed(2);
    const entry = +syntheticPrice.toFixed(2);
    const stop = +(entry - atr * 1.4).toFixed(2);
    const target = +(entry + (entry - stop) * 2.4).toFixed(2);
    const confidence = 55 + (baseSeed % 20);

    return `**Signal**: ${confidence >= 64 ? 'BUY' : 'HOLD'} ${confidence}% (Execution Mode)

**Price Target**: ${target} in 3-8 sessions if structure confirms.

**Market Context**: ${marketContextForRequestedTicker}

**Reasoning**:
• Structure: Setup quality improves on reclaim and hold above prior resistance (weight: 35%)
• Volatility: ATR-normalized stop keeps risk stable across sessions (weight: 30%)
• Timing: Confirmed closes outperform anticipatory entries in mixed regimes (weight: 35%)

**Execution Playbook**:
• Entry: ${entry}
• Take-profit: ${target}
• Invalidation: ${stop}

**Risk Management**:
• Stop-loss: ${stop}
• Position size: ${Math.max(0.75, profileSize).toFixed(2)}% portfolio risk per trade
• Max drawdown: Pause after two invalidations before re-entry

**Confidence**: ${confidence >= 64 ? 'Moderate-high' : 'Moderate'}. Use confirmation candles for cleaner expectancy.${providerNote}`;
  }

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
  xai: false,
  lastChecked: null as null | number,
  error: ''
};

function syncProviderStatus(snapshot: Awaited<ReturnType<typeof validateProvidersAtRuntime>>) {
  PROVIDER_STATUS.lastChecked = snapshot.checkedAt;
  PROVIDER_STATUS.huggingface = snapshot.huggingface.validated;
  PROVIDER_STATUS.openai = snapshot.openai.validated;
  PROVIDER_STATUS.xai = snapshot.xai.validated;

  const errorNotes: string[] = [];
  if (!snapshot.huggingface.validated) {
    errorNotes.push(`HF:${snapshot.huggingface.reason}`);
  }
  if (!snapshot.openai.validated) {
    errorNotes.push(`OpenAI:${snapshot.openai.reason}`);
  }
  if (!snapshot.xai.validated) {
    errorNotes.push(`xAI:${snapshot.xai.reason}`);
  }
  PROVIDER_STATUS.error = errorNotes.join(' ');
}

async function checkProviderHealth() {
  const snapshot = await validateProvidersAtRuntime();
  syncProviderStatus(snapshot);
  console.log('[HEALTH] Provider status:', JSON.stringify(PROVIDER_STATUS));
}

// --- Health Endpoint ---
async function healthHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await checkProviderHealth();
  const runtimeConfig = resolveRuntimeProviderConfig();
  return res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    provider: PROVIDER_STATUS,
    env: {
      huggingface: runtimeConfig.hfTokens.length > 0,
      openai: !!runtimeConfig.openAiKey,
      xai: !!runtimeConfig.xAiKey,
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
    const runtimeConfig = resolveRuntimeProviderConfig();
    const providerSnapshot = await validateProvidersAtRuntime();
    syncProviderStatus(providerSnapshot);

    // --- Runtime Logging ---
    console.log(`[AI_CHAT] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    if (!runtimeConfig.hfTokens.length) console.warn('[WARN] HUGGINGFACE API token missing');
    if (!runtimeConfig.openAiKey) console.warn('[WARN] OPENAI_API_KEY missing');
    if (!runtimeConfig.xAiKey) console.warn('[WARN] XAI_API_KEY missing');
    if (!PROVIDER_STATUS.huggingface && !PROVIDER_STATUS.openai && !PROVIDER_STATUS.xai) {
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
    const ensuredSession = sessionId ? upsertSession(sessionId, body.context?.userProfile?.userId) : null;
    const userProfile = body.context?.userProfile || ensuredSession?.userProfile || (sessionId ? (await getSession(sessionId))?.userProfile : undefined);
    const recentMessages = body.context?.recentMessages || (sessionId ? await getRecentMessages(sessionId) : null);

    // --- Request Logging ---
    console.log('[REQUEST]', JSON.stringify({ messages, temperature, userProfile }, null, 2));

    // --- Guard: Empty or Invalid Message ---
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

    // --- Auto-reject Obvious Hallucinations ---
    const isUncensored = body.mode === 'uncensored';
    const recentContents = (recentMessages || []).map((m: any) => m.content);
    const messageContents = (messages || []).map((m: any) => m.content);
    if (!isUncensored && shouldAutoRejectResponse(recentContents, messageContents)) {
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
    const latestUserMsg = String(messages[messages.length - 1]?.content || '');

    if (sessionId && latestUserMsg) {
      addMessage(sessionId, {
        role: 'user',
        content: latestUserMsg,
        timestamp: Date.now(),
      });

      const profilePatch = inferAdaptiveProfilePatch(latestUserMsg, userProfile);
      if (profilePatch) {
        updateProfile(sessionId, profilePatch);
      }
    }
    // Prioritize the newest prompt so stale history (e.g., LINK) does not pollute current analysis.
    const assets = detectAssets(latestUserMsg, body.context);
    const intent = detectIntent(latestUserMsg || flatText);

    // --- Fetch Live Market Data ---
    const marketSnapshot = await fetchMarketSnapshot(assets);
    // --- Build Context for AI Providers ---
    const context: ChatContext = {
      sessionId,
      userProfile: userProfile || undefined,
      recentMessages: (recentMessages || messages.slice(-8)) as ChatMessage[],
      marketSnapshot,
    };
    // --- Mode governance (ODIN can be gated unless explicitly unlocked) ---
    const requestedMode: 'base' | 'advanced' | 'odin' =
      body.mode === 'odin' ? 'odin' : body.mode === 'advanced' ? 'advanced' : 'base';
    const odinOpen = (process.env.TRADEHAX_ODIN_OPEN_MODE || '').toLowerCase() === 'true';
    const odinHeaderKey = String(req.headers['x-odin-key'] || '');
    const odinServerKey = String(process.env.TRADEHAX_ODIN_KEY || '');
    const hasOdinKey = !!odinHeaderKey && !!odinServerKey && odinHeaderKey === odinServerKey;
    const odinUnlocked = odinOpen || !!(body.context as any)?.odinUnlocked || hasOdinKey;
    const effectiveMode: 'base' | 'advanced' | 'odin' = requestedMode === 'odin' && !odinUnlocked ? 'advanced' : requestedMode;
    const modeGated = requestedMode === 'odin' && effectiveMode !== 'odin';

    // --- Record mode gating telemetry ---
    if (modeGated) {
      await recordAIChatEvent({
        eventType: 'gating_applied',
        timestamp: Date.now(),
        sessionId,
        userId: userProfile?.userId,
        mode: requestedMode,
        requestedMode,
        effectiveMode,
        gated: true,
        metadata: { odinOpen, hasOdinKey, unlockAttempted: !odinUnlocked },
      });
    }

    // --- Build System Prompt ---
    let systemPrompt: string;
    if (effectiveMode === 'odin') {
      systemPrompt = buildOdinSystemPrompt(messages[messages.length - 1].content, context, marketSnapshot);
    } else {
      systemPrompt = buildSystemPrompt(messages[messages.length - 1].content, context, marketSnapshot);
      if (effectiveMode === 'advanced') {
        systemPrompt = `ADVANCED HF ENSEMBLE MODE: Combine momentum, structure, and risk controls in concise steps.\n\n${systemPrompt}`;
      }
    }
    const providerMessages = buildProviderMessages(systemPrompt, messages as ChatMessage[]);

    // --- Provider Selection Logic ---
    // Prefer: validated providers first (by health check), then configured providers (by env keys)
    // Base/Advanced should try all live providers before falling to demo
    // ODIN prefers OpenAI but can use HF as fallback
    const hasHf = runtimeConfig.hfTokens.length > 0;
    const hasOpenAI = !!runtimeConfig.openAiKey;
    const hasXAI = !!runtimeConfig.xAiKey;
    const forceDemo = getConsoleConfig().forceDemo === true;
    let provider: 'huggingface' | 'openai' | 'xai' | 'demo' = 'demo';

    // Determine which providers are confirmed available from health check
    const hfValidated = providerSnapshot.huggingface.validated;
    const oaiValidated = providerSnapshot.openai.validated;
    const xaiValidated = providerSnapshot.xai.validated;

    // For base/advanced modes: try all available providers before demo fallback
    // For odin mode: prefer OpenAI, then HF
    const preferredOrder: Array<'huggingface' | 'openai' | 'xai'> =
      effectiveMode === 'odin'
        ? ['xai', 'openai', 'huggingface']
        : ['huggingface', 'xai', 'openai'];

    // First pass: use providers that passed health check
    const validatedOrder = preferredOrder.filter((candidate) =>
      candidate === 'huggingface'
        ? hfValidated
        : candidate === 'openai'
          ? oaiValidated
          : xaiValidated,
    );

    // Fallback: use providers that are configured in env (even if health check failed)
    const configuredOrder = preferredOrder.filter((candidate) =>
      candidate === 'huggingface'
        ? hasHf
        : candidate === 'openai'
          ? hasOpenAI
          : hasXAI,
    );

    // Merged order: prioritize validated, then fallback to just-configured
    const providerOrder = validatedOrder.length > 0 ? validatedOrder : configuredOrder;

    const invoke = async (): Promise<string> => {
      let lastErr: unknown = new Error('No AI providers configured');

      // Try preferred providers in order
      for (const candidate of providerOrder) {
        if (candidate === 'huggingface' && !hasHf) continue;
        if (candidate === 'openai' && !hasOpenAI) continue;
        if (candidate === 'xai' && !hasXAI) continue;

        try {
          if (candidate === 'huggingface') {
            const out = await callHuggingFace(providerMessages, temperature, runtimeConfig);
            provider = 'huggingface';
            return out;
          }

          if (candidate === 'openai') {
            const out = await callOpenAI(providerMessages, temperature, runtimeConfig.openAiKey);
            provider = 'openai';
            return out;
          }

          const out = await callXAI(providerMessages, temperature, runtimeConfig.xAiKey);
          provider = 'xai';
          return out;
        } catch (err) {
          lastErr = err;
          // Log but continue trying next provider
          console.warn(`[PROVIDER_FALLBACK] ${candidate} failed:`, err instanceof Error ? err.message : String(err));
        }
      }

      // Only fall back to demo after all configured providers have been exhausted
      provider = 'demo';
      throw lastErr;
    };
    // --- Call Selected Provider ---
    let rawResponse;
    let responseTime = 0;
    try {
      if (forceDemo) {
        provider = 'demo';
        rawResponse = {
          response: generateDemoResponse(messages[messages.length - 1].content, context, marketSnapshot),
          blocked: false,
          retried: false,
        };
      } else {
        const startTime = Date.now();
        rawResponse = await getGuardedProviderResponse(invoke, messages[messages.length - 1].content, context, marketSnapshot);
        responseTime = Date.now() - startTime;
      }
    } catch (err) {
      const fallbackResponse = generateDemoResponse(
        messages[messages.length - 1]?.content || '',
        context,
        marketSnapshot
      );

      // Record API fallback telemetry
      await recordAIChatEvent({
        eventType: 'api_fallback',
        timestamp: Date.now(),
        sessionId,
        userId: userProfile?.userId,
        mode: requestedMode,
        requestedMode,
        effectiveMode,
        providerPath: 'demo',
        latencyMs: Date.now() - (Date.now() - responseTime),
        model: 'demo-response-engine',
        cached: false,
        gated: modeGated,
        userMessageLength: messages[messages.length - 1]?.content?.length || 0,
        responseLength: fallbackResponse?.length || 0,
        errorMessage: err instanceof Error ? err.message : String(err),
      });

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
        meta: {
          requestedMode,
          effectiveMode,
          gated: modeGated,
          providerPath: 'demo',
          latencyMs: responseTime,
        },
        progress: fallbackResponse.split(/\n\n+/).slice(0, 6),
      });
    }
    // --- Cache and Respond ---
    const activeProvider: 'huggingface' | 'openai' | 'xai' | 'demo' = provider;
    const modelByProvider: Record<'huggingface' | 'openai' | 'xai' | 'demo', string> = {
      huggingface: LAST_HF_MODEL_USED,
      openai: 'gpt-4-turbo-preview',
      xai: process.env.XAI_MODEL || 'grok-4',
      demo: 'demo-response-engine',
    };
    const isDemoProvider: Record<'huggingface' | 'openai' | 'xai' | 'demo', boolean> = {
      huggingface: false,
      openai: false,
      xai: false,
      demo: true,
    };

    const responsePayload: ChatResponse & {
      providerStatus: typeof PROVIDER_STATUS;
      fallbackMode: boolean;
      errorDetail?: string;
    } = {
      response: rawResponse.response,
      provider: activeProvider,
      model: modelByProvider[activeProvider],
      timestamp: Date.now(),
      cached: false,
      guardrailRetryCount: rawResponse.retried ? 1 : 0,
      providerStatus: { ...PROVIDER_STATUS },
      fallbackMode: isDemoProvider[activeProvider],
      errorDetail: isDemoProvider[activeProvider] ? (PROVIDER_STATUS.error || undefined) : undefined,
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
        provider: activeProvider,
        model: modelByProvider[activeProvider],
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

    // --- Record chat completion telemetry ---
    await recordAIChatEvent({
      eventType: 'chat_completed',
      timestamp: Date.now(),
      sessionId,
      userId: userProfile?.userId,
      mode: requestedMode,
      requestedMode,
      effectiveMode,
      providerPath: activeProvider,
      latencyMs: responseTime,
      model: modelByProvider[activeProvider],
      cached: false,
      gated: modeGated,
      guardedRetryCount: rawResponse.retried ? 1 : 0,
      userMessageLength: messages[messages.length - 1]?.content?.length || 0,
      responseLength: rawResponse.response?.length || 0,
      hallucinated: rawResponse.blocked,
    });

    // FINAL GUARD: If response contains forbidden artifacts, replace with demo response
    let finalResponse = rawResponse.response;
    if (hasForbiddenArtifacts(finalResponse)) {
      finalResponse = generateDemoResponse(messages[messages.length - 1]?.content || '', context, marketSnapshot, finalResponse);
    }
    if (sessionId && finalResponse) {
      addMessage(sessionId, {
        role: 'assistant',
        content: finalResponse,
        timestamp: Date.now(),
      });
    }

    return res.status(200).json({
      ...responsePayload,
      response: finalResponse,
      message: { role: 'assistant', content: finalResponse },
      meta: {
        requestedMode,
        effectiveMode,
        gated: modeGated,
        providerPath: activeProvider,
        latencyMs: responseTime,
      },
      progress: finalResponse.split(/\n\n+/).slice(0, 6),
    });
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
