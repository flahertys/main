/**
 * POST /api/ai/generate
 * Generate text from a prompt using Hugging Face
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:generate",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: GenerateRequest = await request.json();
    const prompt = sanitizePlainText(String(body.prompt ?? ""), 4_000);

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const client = getLLMClient();
    const response = await client.generate(prompt);

    return NextResponse.json({
      ok: true,
      text: response.text,
      model: response.model,
      tokensUsed: response.tokensUsed,
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 },
    );
  }
}
