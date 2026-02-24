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
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

const DEFAULT_GENERATE_MODEL = process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1";

function sanitizeModelId(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_GENERATE_MODEL;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) {
    return DEFAULT_GENERATE_MODEL;
  }

  return /^[a-zA-Z0-9._\-/]+$/.test(trimmed) ? trimmed : DEFAULT_GENERATE_MODEL;
}

function numberInRange(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.min(max, Math.max(min, value));
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
    const modelId = sanitizeModelId(body.model);
    const temperature = numberInRange(body.temperature, 0, 2);
    const maxTokens = numberInRange(body.maxTokens, 16, 2_048);
    const topP = numberInRange(body.topP, 0.1, 1);

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const client = getLLMClient({ modelId, temperature, maxTokens, topP });
    const response = await client.generate(prompt, {
      modelId,
      temperature,
      maxTokens,
      topP,
    });

    return NextResponse.json({
      ok: true,
      text: response.text,
      model: response.model,
      tokensUsed: response.tokensUsed,
      settings: {
        temperature: temperature ?? null,
        maxTokens: maxTokens ?? null,
        topP: topP ?? null,
      },
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Generate API error:", error);

    const message = error instanceof Error ? error.message : "Generation failed";
    const missingConfig = message.includes("HF_API_TOKEN not set");

    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: missingConfig
          ? "Set HF_API_TOKEN in environment variables to enable live model generation."
          : undefined,
      },
      { status: missingConfig ? 503 : 500 },
    );
  }
}
