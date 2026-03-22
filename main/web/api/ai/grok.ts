/**
 * Grok-4 API Endpoint
 * XAI's Grok-4 Model for Trading Insights and Analysis
 *
 * Features:
 * - XAI Grok-4 model access
 * - Streaming responses
 * - Trading context awareness
 * - Session-based conversation history
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { xai } from "@ai-sdk/xai";
import { streamText } from "ai";
import { getSession, getRecentMessages } from "../sessions/store.js";
import { recordAIChatEvent } from "./telemetry-repository.js";

const XAI_API_KEY = process.env.XAI_API_KEY || "";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_MESSAGE_LENGTH = 8000;
const MAX_CONTEXT_MESSAGES = 12;

function toChatMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  if (role !== "system" && role !== "user" && role !== "assistant") return null;
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  if (!trimmed) return null;
  return {
    role,
    content: trimmed.slice(0, MAX_MESSAGE_LENGTH),
  };
}

function sanitizeContextMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(toChatMessage)
    .filter((msg): msg is ChatMessage => !!msg)
    .slice(-MAX_CONTEXT_MESSAGES);
}

const SYSTEM_PROMPT = `You are Grok, an advanced AI assistant created by xAI specializing in cryptocurrency trading and market analysis.
You provide insightful analysis of crypto markets, trading strategies, and DeFi opportunities.
You are knowledgeable about blockchain technology, smart contracts, and emerging crypto trends.
Your responses should be direct, insightful, and actionable for traders.
Always consider risk management in your recommendations.`;

async function handleGrokRequest(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  // Validate API key
  if (!XAI_API_KEY) {
    res.status(500).json({
      error: "XAI_API_KEY not configured",
      message: "Grok-4 service is not available",
    });
    return;
  }

  const { message, sessionId, conversationContext } = req.body;
  const requestId =
    String(req.headers["x-request-id"] || "").trim() ||
    `grok-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Missing or invalid 'message' field" });
    return;
  }

  const normalizedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!normalizedMessage) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  const requestStart = Date.now();

  try {
    await recordAIChatEvent({
      eventType: "chat_started",
      timestamp: requestStart,
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      mode: "advanced",
      requestedMode: "grok",
      effectiveMode: "grok",
      userMessageLength: normalizedMessage.length,
      metadata: { requestId, provider: "xai", endpoint: "/api/ai/grok" },
    });

    // Get session if provided
    let session;
    if (sessionId) {
      session = await getSession(sessionId);
    }

    // Build conversation messages
    const messages: ChatMessage[] = [];

    // Add conversation context if provided
    if (conversationContext && Array.isArray(conversationContext)) {
      messages.push(...sanitizeContextMessages(conversationContext));
    } else if (session) {
      // Get recent messages from session
      const recentMessages = await getRecentMessages(sessionId, 5);
      messages.push(...sanitizeContextMessages(recentMessages));
    }

    // Add current message
    messages.push({ role: "user", content: normalizedMessage });

    // Set response headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Call Grok-4 with streaming
    const result = await streamText({
      model: xai("grok-4"),
      system: SYSTEM_PROMPT,
      messages: messages as any,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    let fullResponse = "";

    // Stream chunks to client
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Get final usage stats
    const usage = await result.usage;
    const usageSafe = usage as {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };

    // Send completion event with metadata
    res.write(
      `data: ${JSON.stringify({
        done: true,
        requestId,
        usage: {
          promptTokens: usageSafe.inputTokens ?? 0,
          completionTokens: usageSafe.outputTokens ?? 0,
          totalTokens:
            usageSafe.totalTokens ??
            (usageSafe.inputTokens ?? 0) + (usageSafe.outputTokens ?? 0),
        },
      })}\n\n`
    );

    await recordAIChatEvent({
      eventType: "chat_completed",
      timestamp: Date.now(),
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      mode: "advanced",
      requestedMode: "grok",
      effectiveMode: "grok",
      latencyMs: Date.now() - requestStart,
      model: "grok-4",
      userMessageLength: normalizedMessage.length,
      responseLength: fullResponse.length,
      metadata: { requestId, provider: "xai", endpoint: "/api/ai/grok" },
    });

    res.end();
  } catch (error: any) {
    console.error("Grok-4 API Error:", error);

    await recordAIChatEvent({
      eventType: "api_fallback",
      timestamp: Date.now(),
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      mode: "advanced",
      requestedMode: "grok",
      effectiveMode: "grok",
      latencyMs: Date.now() - requestStart,
      errorMessage: error?.message || "Failed to get response from Grok-4",
      metadata: { requestId, provider: "xai", endpoint: "/api/ai/grok" },
    });

    // Send error through stream
    res.write(
      `data: ${JSON.stringify({
        requestId,
        error: error.message || "Failed to get response from Grok-4",
        code: error.status || 500,
      })}\n\n`
    );
    res.end();
  }
}

export default handleGrokRequest;

