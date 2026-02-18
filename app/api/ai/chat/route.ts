/**
 * POST /api/ai/chat
 * Chat endpoint with conversation history
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    if (body.messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 },
      );
    }

    // Get last user message
    const lastUserMessage = [...body.messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 },
      );
    }

    const client = getLLMClient();

    // Build context from conversation
    let prompt = body.systemPrompt
      ? `System: ${body.systemPrompt}\n\n`
      : "";

    for (const msg of body.messages) {
      prompt += `${msg.role}: ${msg.content}\n`;
    }

    prompt += "assistant:";

    const response = await client.generate(prompt);

    return NextResponse.json({
      ok: true,
      message: {
        role: "assistant" as const,
        content: response.text,
      },
      model: response.model,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Chat failed",
      },
      { status: 500 },
    );
  }
}
