/**
 * TradeHax AI Signals Endpoint
 * Generates trading signals for Polymarket opportunities using quant analysis
 *
 * Usage:
 * POST /api/signals/ai-signals
 * Body: {
 *   mode: "signals" | "chat",
 *   context?: { markets data },
 *   messages?: ChatMessage[],
 *   system?: string
 * }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const HF_API_TOKENS = Array.from(new Set([
  process.env.HUGGINGFACE_API_KEY,
  process.env.HF_API_TOKEN,
  process.env.HF_API_TOKEN_REICH,
  process.env.HF_API_TOKEN_ALT1,
  process.env.HF_API_TOKEN_ALT2,
  process.env.HF_API_TOKEN_ALT3,
].map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v): v is string => v.length > 0)));
const HF_API_KEY = HF_API_TOKENS[0] || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const HF_MODEL = process.env.HF_MODEL_ID || "meta-llama/Llama-3.3-70B-Instruct";
const HF_FALLBACK_MODELS = (process.env.HF_FALLBACK_MODELS || "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const HF_MODELS = Array.from(new Set([HF_MODEL, ...HF_FALLBACK_MODELS]));
let LAST_HF_MODEL_USED = HF_MODELS[0] || HF_MODEL;

interface TradeSignal {
  question: string;
  action: string;
  edge: number;
  confidence: number;
  kelly: number;
  tf: string;
  fibLevel: string;
  thesis: string;
  risk: string;
}

interface SignalRequest {
  mode: "signals" | "chat";
  context?: any;
  messages?: Array<{ role: string; content: string }>;
  system?: string;
}

interface SignalResponse {
  signals?: TradeSignal[];
  reply?: string;
  text?: string;
  content?: string;
  provider: "huggingface" | "openai" | "local" | "demo";
  cached?: boolean;
}

// Format messages for Llama 3.3 chat template
function formatForLlama(messages: Array<{ role: string; content: string }>): string {
  let prompt = "<|begin_of_text|>";

  for (const msg of messages) {
    const tag = msg.role;
    prompt += `<|start_header_id|>${tag}<|end_header_id|>\n${msg.content}<|eot_id|>`;
  }

  prompt += "<|start_header_id|>assistant<|end_header_id|>\n";
  return prompt;
}

// Generate local signals when AI is unavailable
function generateLocalSignals(context: any): TradeSignal[] {
  if (!context || !Array.isArray(context)) {
    return [];
  }

  return context.slice(0, 6).map((m: any) => ({
    question: (m.q || m.question || "Unknown market").slice(0, 120),
    action: m.action || "SKIP",
    edge: typeof m.ev === "number" ? Math.abs(m.ev) : 0,
    confidence: Math.max(0.35, Math.min(0.94, 0.5 + Math.abs(m.ev || 0) * 2)),
    kelly: typeof m.kelly === "number" ? m.kelly : 0,
    tf: m.tf || "SWING",
    fibLevel: m.fib || "50.0%",
    thesis: (m.grade || "C") + " grade, EV strong",
    risk: m.uma > 0.55 ? "HIGH" : m.uma > 0.3 ? "MED" : "LOW"
  }));
}

// Call HuggingFace Inference API
async function callHuggingFace(
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7
): Promise<string> {
  if (!HF_API_TOKENS.length) throw new Error("No HF key");

  const prompt = formatForLlama(messages);
  let lastErr = "Unknown HF error";

  for (const modelId of HF_MODELS) {
    for (const token of HF_API_TOKENS) {
      const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            temperature,
            max_new_tokens: 512,
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

      if (Array.isArray(data) && data[0]?.generated_text) {
        LAST_HF_MODEL_USED = modelId;
        return data[0].generated_text;
      }
      if ((data as any).generated_text) {
        LAST_HF_MODEL_USED = modelId;
        return (data as any).generated_text;
      }
      if ((data as any).error) {
        lastErr = String((data as any).error);
        continue;
      }
    }
  }

  throw new Error(`HF API error: ${lastErr}`);
}

// Call OpenAI API
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7
): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("No OpenAI key");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages,
      temperature,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return (data as any).choices[0]?.message?.content || "";
}

// Parse JSON safely
function parseJsonSafe(raw: any): any {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Extract signals from AI response
function extractSignals(aiResponse: string, context: any): TradeSignal[] {
  // Try to parse as JSON first
  const parsed = parseJsonSafe(aiResponse);
  if (parsed && Array.isArray(parsed.signals)) {
    return parsed.signals;
  }

  if (parsed && Array.isArray(parsed)) {
    return parsed;
  }

  // Fallback to context-based signals
  return generateLocalSignals(context);
}

// CORS helper
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Main handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  setCorsHeaders(res);

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body as SignalRequest;
    const { mode, context, messages, system } = body;

    // Signals mode - generate trading recommendations
    if (mode === "signals") {
      // Try AI-powered signals first
      let signals: TradeSignal[] = [];

      try {
        if (HF_API_KEY || OPENAI_API_KEY) {
          // Build messages for AI
          const aiMessages: Array<{ role: string; content: string }> = [
            {
              role: "system",
              content: `You are an elite quant trading AI. Analyze these prediction markets and generate 3-5 high-conviction trading signals. Return a JSON array with objects containing: question, action (BUY_YES/BUY_NO/ARB/SKIP), edge (0-1), confidence (0.3-1), kelly ($), tf (SCALP/SWING/POSITION/MACRO), fibLevel, thesis, risk (LOW/MED/HIGH).

Context:\n${JSON.stringify(context, null, 2)}

Return ONLY valid JSON array, no markdown code blocks.`
            }
          ];

          let aiResponse = "";

          // Try HuggingFace first
          if (HF_API_KEY) {
            try {
              aiResponse = await callHuggingFace(aiMessages, 0.6);
            } catch (e) {
              console.log("HF failed, trying OpenAI:", e);
            }
          }

          // Fallback to OpenAI
          if (!aiResponse && OPENAI_API_KEY) {
            try {
              aiResponse = await callOpenAI(aiMessages, 0.6);
            } catch (e) {
              console.log("OpenAI also failed:", e);
            }
          }

          if (aiResponse) {
            signals = extractSignals(aiResponse, context);
          }
        }
      } catch (e) {
        console.log("AI generation failed, using local fallback:", e);
      }

      // Fallback to local signals
      if (signals.length === 0) {
        signals = generateLocalSignals(context);
      }

      res.status(200).json({
        signals: signals.slice(0, 6),
        provider: HF_API_TOKENS.length ? "huggingface" : OPENAI_API_KEY ? "openai" : "local"
      });
      return;
    }

    // Chat mode - conversational trading analysis
    if (mode === "chat") {
      if (!messages || messages.length === 0) {
        res.status(400).json({ error: "Chat mode requires messages" });
        return;
      }

      let reply = "";

      try {
        // Try to get AI response
        if (HF_API_KEY) {
          try {
            reply = await callHuggingFace(messages, 0.7);
          } catch (e) {
            console.log("HF chat failed:", e);
          }
        }

        if (!reply && OPENAI_API_KEY) {
          try {
            reply = await callOpenAI(messages, 0.7);
          } catch (e) {
            console.log("OpenAI chat failed:", e);
          }
        }
      } catch (e) {
        console.log("Chat generation error:", e);
      }

      if (!reply) {
        reply = "I'm working with limited AI capacity right now. Check the market data and let me know what markets interest you most!";
      }

      res.status(200).json({
        reply: reply.slice(0, 1024),
        text: reply.slice(0, 1024),
        content: reply.slice(0, 1024),
        provider: "demo"
      });
      return;
    }

    res.status(400).json({ error: "Unknown mode. Use 'signals' or 'chat'" });
  } catch (e) {
    console.error("Handler error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

