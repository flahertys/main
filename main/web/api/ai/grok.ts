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

const XAI_API_KEY = process.env.XAI_API_KEY || "";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Missing or invalid 'message' field" });
    return;
  }

  try {
    // Get session if provided
    let session;
    if (sessionId) {
      session = await getSession(sessionId);
    }

    // Build conversation messages
    const messages: ChatMessage[] = [];

    // Add conversation context if provided
    if (conversationContext && Array.isArray(conversationContext)) {
      messages.push(...conversationContext);
    } else if (session) {
      // Get recent messages from session
      const recentMessages = await getRecentMessages(sessionId, 5);
      messages.push(...recentMessages);
    }

    // Add current message
    messages.push({ role: "user", content: message });

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
      maxTokens: 2048,
    });

    let fullResponse = "";
    let tokenCount = 0;

    // Stream chunks to client
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Get final usage stats
    const usage = await result.usage;

    // Send completion event with metadata
    res.write(
      `data: ${JSON.stringify({
        done: true,
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        },
      })}\n\n`
    );

    res.end();
  } catch (error: any) {
    console.error("Grok-4 API Error:", error);

    // Send error through stream
    res.write(
      `data: ${JSON.stringify({
        error: error.message || "Failed to get response from Grok-4",
        code: error.status || 500,
      })}\n\n`
    );
    res.end();
  }
}

export default handleGrokRequest;

