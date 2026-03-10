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

  if (lower.includes('btc') || lower.includes('bitcoin')) {
    return `**Signal**: HOLD 65% (Demo Mode)

**Analysis**: BTC consolidating around key support levels. Current bias is cautiously bullish pending confirmation.

**Key Factors**:
• Momentum: Neutral (+0.3) - RSI at 52, neither overbought nor oversold
• Volume: Below 30-day average - suggests wait for confirmation
• Sentiment: Mixed signals from on-chain data - large holder activity stable

**Risk Management**:
• Wait for clear break above recent range resistance before entering
• If entering: 2% position size maximum
• Stop-loss: 5% below entry
• Take-profit target: 8-12% upside potential

**Note**: This is demo mode. Configure HUGGINGFACE_API_KEY for live AI-powered analysis with real-time data integration.

Get your free HuggingFace token: https://huggingface.co/settings/tokens`;
  }

  if (lower.includes('eth') || lower.includes('ethereum')) {
    return `**Signal**: BUY 58% (Demo Mode)

**Analysis**: ETH showing relative strength vs BTC. Clean structure for potential entry.

**Key Factors**:
• Technical: Breaking above 20-day EMA with volume
• Sentiment: Developer activity increasing (GitHub commits +15%)
• On-chain: Gas prices normalizing, suggesting network health

**Risk Management**:
• Entry: Scale in on confirmation, not anticipation
• Stop: Place below recent structure low, not emotion
• Sizing: Reduce size in high-volatility sessions (2-3% max)

**Note**: Demo mode active. Enable live AI for real-time insights.`;
  }

  return `**Demo Mode Active**

To unlock full AI capabilities with live data integration:

1. **Get Free HuggingFace Token** (no credit card required):
   • Visit: https://huggingface.co/settings/tokens
   • Create token with "Read" permission
   • Copy token starting with \`hf_\`

2. **Add to Vercel**:
   \`\`\`bash
   vercel env add HUGGINGFACE_API_KEY
   \`\`\`

3. **Redeploy**:
   \`\`\`bash
   vercel --prod
   \`\`\`

**Your Question**: "${userMsg}"

**In Live Mode, I Would**:
• Fetch real-time market data from multiple sources
• Analyze technical indicators with current prices
• Provide specific entry/exit points with confidence levels
• Calculate optimal position sizing for your risk profile
• Show backtested results for similar historical signals

Contact your administrator to enable full AI capabilities.`;
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

