/**
 * POST /api/ai/generate
 * Generate text from a prompt using Hugging Face
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const client = getLLMClient();
    const response = await client.generate(body.prompt);

    return NextResponse.json({
      ok: true,
      text: response.text,
      model: response.model,
      tokensUsed: response.tokensUsed,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 },
    );
  }
}
