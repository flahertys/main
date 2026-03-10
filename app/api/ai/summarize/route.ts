/**
 * POST /api/ai/summarize
 * Summarize long text using Hugging Face
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import { callAiMicroPredict } from "@/lib/ai/micro-client";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { enforceRedisRateLimit } from "@/lib/security-redis";
import { NextRequest, NextResponse } from "next/server";

interface SummarizeRequest {
  text: string;
  maxLength?: number;
}

function resolveMaxLength(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 256;
  }
  return Math.min(1024, Math.max(64, Math.floor(value)));
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const redisRateLimit = await enforceRedisRateLimit(request, {
    keyPrefix: "ai:summarize",
    max: 36,
    windowMs: 60_000,
  });
  const rateLimit =
    redisRateLimit ??
    enforceRateLimit(request, {
      keyPrefix: "ai:summarize",
      max: 36,
      windowMs: 60_000,
    });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: SummarizeRequest = await request.json();
    const text = sanitizePlainText(String(body.text ?? ""), 12_000);

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Text is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Truncate text if too long
    const maxChars = 1024;
    const truncatedText =
      text.length > maxChars
        ? text.slice(0, maxChars) + "..."
        : text;

    const microResponse = await callAiMicroPredict({
      prompt: `Summarize this text in concise bullets and one-line takeaway:\n\n${truncatedText}`,
      temperature: 0.5,
      maxTokens: resolveMaxLength(body.maxLength),
      topP: 0.9,
    });

    const response =
      microResponse && microResponse.text
        ? {
          text: microResponse.text,
          model: microResponse.model ?? "ai-micro",
        }
        : await (async () => {
          const client = getLLMClient();
          return client.summarize(truncatedText);
        })();

    return NextResponse.json({
      ok: true,
      summary: response.text,
      model: response.model,
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Summarize API error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Summarization failed",
      },
      { status: 500 },
    );
  }
}
