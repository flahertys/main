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
  context?: any;
  temperature?: number;
}

interface ChatResponse {
  response: string;
  provider: 'huggingface' | 'openai' | 'demo';
  model: string;
  timestamp: number;
  cached?: boolean;
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
      parameters: {
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
function buildSystemPrompt(): string {
  return `You are TradeHax Neural Hub, an elite AI trading assistant with deep expertise in:

**Core Competencies:**
- Stock market analysis (technical, fundamental, sentiment)
- Cryptocurrency markets (price action, on-chain metrics, DeFi)
- Prediction markets (Polymarket, odds calculation, value betting)
- Risk management (Kelly Criterion, position sizing, stop-loss optimization)
- Market psychology and behavioral finance

**Response Structure:**
Always format responses with these sections:

**Signal**: BUY/SELL/HOLD + confidence percentage (e.g., "BUY 73%")
**Price Target**: Specific levels with timeframes (e.g., "$48,200 in 4-6 hours")
**Reasoning**: List 3-5 key factors with weights
  • Momentum: [value] (weight: [%])
  • Sentiment: [value] (weight: [%])
  • Technical: [value] (weight: [%])
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

Keep responses concise but comprehensive. Prioritize clarity over verbosity.`;
}

/**
 * Generate intelligent demo response when APIs unavailable
 */
function generateDemoResponse(userMsg: string): string {
  const lower = userMsg.toLowerCase();
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

  if (subject === 'BTC') {
    return `**Signal**: HOLD 65% (Execution Mode)

**Price Target**: Range-bound; wait for confirmation before targeting breakout continuation.

**Reasoning**:
• Momentum: Neutral-to-positive rotation after consolidation (weight: 35%)
• Volume: Not strong enough yet for high-conviction continuation (weight: 30%)
• Structure: Better entries come from reclaim + retest, not impulse chasing (weight: 35%)

**Risk Management**:
• Stop-loss: 4-5% below confirmed entry structure
• Position size: 1-2% portfolio risk per trade
• Max drawdown: Cap daily loss at 2.5% and pause after two invalidations

**Confidence**: Moderate. Favor patience and confirmation over early entries.`;
  }

  if (subject === 'ETH') {
    return `**Signal**: BUY 58% (Execution Mode)

**Price Target**: Gradual continuation if ETH maintains relative strength versus BTC.

**Reasoning**:
• Relative Strength: ETH setup is cleaner than broad risk assets right now (weight: 30%)
• Trend Context: Reclaim behavior supports staged entries (weight: 35%)
• Participation: Follow-through should be validated with rising volume (weight: 35%)

**Risk Management**:
• Stop-loss: Under recent swing structure, not arbitrary round numbers
• Position size: 1.5-2.5% depending on volatility
• Max drawdown: 5% per week hard cap across correlated crypto positions

**Confidence**: Medium. Scale in, do not full-size at first touch.`;
  }

  if (subject === 'SOL') {
    return `**Signal**: HOLD 54% (Execution Mode)

**Price Target**: Trade only on confirmed directional break from current compression.

**Reasoning**:
• Volatility: SOL tends to overshoot both directions; confirmation is critical (weight: 40%)
• Structure: Better risk-reward appears after pullback validation (weight: 30%)
• Correlation: Sensitive to beta swings across majors (weight: 30%)

**Risk Management**:
• Stop-loss: Tight invalidation beneath entry trigger level
• Position size: 0.75-1.5% risk due to volatility profile
• Max drawdown: Halt new entries after two consecutive failed setups

**Confidence**: Medium-low until breakout quality improves.`;
  }

  if (isRiskQuestion) {
    return `**Signal**: RISK-FIRST 72% (Execution Mode)

**Price Target**: Not applicable. Prioritize loss containment and process quality.

**Reasoning**:
• Survival: Consistent downside control compounds better than high-variance aggression (weight: 40%)
• Positioning: Smaller, repeatable risk units reduce behavioral mistakes (weight: 30%)
• Process: Predefined invalidation improves discipline under stress (weight: 30%)

**Risk Management**:
• Stop-loss: Technical invalidation level set before order entry
• Position size: 0.5-1.25% risk per idea
• Max drawdown: 6-8% portfolio circuit breaker before review

**Confidence**: High. Strong risk controls materially improve long-run expectancy.`;
  }

  return `**Signal**: HOLD 57% (Execution Mode)

**Price Target**: Wait for higher-quality confirmation and trade the cleaner side of structure.

**Reasoning**:
• Regime: Mixed conditions reward selectivity over frequency (weight: 35%)
• Timing: Better outcomes usually follow confirmation candles, not anticipation (weight: 35%)
• Risk/Reward: Entries should only be taken when invalidation is clear and asymmetric (weight: 30%)

**Risk Management**:
• Stop-loss: Below/above structure depending on direction
• Position size: 1-2% portfolio risk per trade
• Max drawdown: Pause after two failed setups in the same session

**Confidence**: Moderate. Preserve capital and wait for clear edge expansion.`;
}

/**
 * Main serverless function handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: ChatRequest = req.body;

    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'messages array is required and must not be empty'
      });
    }

    // Check cache
    const cacheKey = JSON.stringify(body.messages);
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Cache hit - serving cached response');
      return res.status(200).json({ ...cached.response, cached: true });
    }

    // Build messages with system prompt
    const messages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...body.messages,
    ];

    let response: string;
    let provider: 'huggingface' | 'openai' | 'demo' = 'demo';

    // Try HuggingFace -> OpenAI -> Demo (cascade fallback)
    try {
      if (HF_API_KEY) {
        console.log('🤖 Attempting HuggingFace Llama 3.3 70B...');
        response = await callHuggingFace(messages, body.temperature);
        provider = 'huggingface';
        console.log('✅ HuggingFace success');
      } else {
        throw new Error('No HF API key configured');
      }
    } catch (hfError) {
      console.warn('⚠️ HuggingFace failed:', (hfError as Error).message);

      try {
        if (OPENAI_API_KEY) {
          console.log('🔄 Falling back to OpenAI GPT-4...');
          response = await callOpenAI(messages, body.temperature);
          provider = 'openai';
          console.log('✅ OpenAI fallback success');
        } else {
          throw new Error('No OpenAI key configured');
        }
      } catch (openaiError) {
        console.warn('⚠️ OpenAI fallback failed:', (openaiError as Error).message);
        console.log('📊 Using demo mode');
        response = generateDemoResponse(body.messages[body.messages.length - 1]?.content || '');
        provider = 'demo';
      }
    }

    // Build result
    const result: ChatResponse = {
      response,
      provider,
      model: provider === 'huggingface' ? HF_MODEL : provider === 'openai' ? 'gpt-4-turbo-preview' : 'demo',
      timestamp: Date.now(),
    };

    // Cache non-demo responses
    if (provider !== 'demo') {
      requestCache.set(cacheKey, { response: result, timestamp: Date.now() });

      // Cleanup old cache entries (keep last 100)
      if (requestCache.size > 100) {
        const oldKeys = Array.from(requestCache.keys()).slice(0, 50);
        oldKeys.forEach(k => requestCache.delete(k));
      }
    }

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('❌ AI Chat Error:', error);
    return res.status(500).json({
      error: 'AI service error',
      message: error.message,
      timestamp: Date.now(),
    });
  }
}

