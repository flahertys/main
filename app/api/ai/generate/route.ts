/**
 * POST /api/ai/generate
 * Generate text from a prompt using Hugging Face
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import { applyOdinChatTuning, resolveOdinRuntimeProfile } from "@/lib/ai/odin-profile";
import { canConsumeFeature, tryConsumeFeatureUsageSecure } from "@/lib/monetization/engine";
import { resolveRequestUserId } from "@/lib/monetization/identity";
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
  odinProfile?: "standard" | "alpha" | "overclock";
  userId?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

const DEFAULT_GENERATE_MODEL = process.env.HF_MODEL_ID || "Qwen/Qwen2.5-7B-Instruct";

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
    const userId = await resolveRequestUserId(request, body.userId);

    const allowance = canConsumeFeature(userId, "ai_chat", 1);
    if (!allowance.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: allowance.reason ?? "Usage limit reached.",
          allowance,
        },
        { status: 429, headers: rateLimit.headers },
      );
    }

    const modelId = sanitizeModelId(body.model);
    const odinProfile = resolveOdinRuntimeProfile({
      request,
      requestedProfile: body.odinProfile,
    });
    const baseTemperature = numberInRange(body.temperature, 0, 2) ?? 0.7;
    const baseMaxTokens = numberInRange(body.maxTokens, 16, 2_048) ?? 512;
    const baseTopP = numberInRange(body.topP, 0.1, 1) ?? 0.9;
    const tuned = applyOdinChatTuning(odinProfile, {
      temperature: baseTemperature,
      maxTokens: baseMaxTokens,
      topP: baseTopP,
    });

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const client = getLLMClient({ modelId, temperature: tuned.temperature, maxTokens: tuned.maxTokens, topP: tuned.topP });
    const response = await client.generate(prompt, {
      modelId,
      temperature: tuned.temperature,
      maxTokens: tuned.maxTokens,
      topP: tuned.topP,
    });

    const idempotencyKey = request.headers.get("x-idempotency-key") || "";
    const usageCommit = tryConsumeFeatureUsageSecure(userId, "ai_chat", 1, {
      source: "api:ai:generate",
      metadata: {
        model: modelId,
        odin_profile: odinProfile.id,
      },
      idempotencyKey,
      idempotencyScope: `generate:${modelId}:${odinProfile.id}:${prompt}`,
    });
    if (!usageCommit.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: usageCommit.allowance.reason ?? "Usage limit reached.",
          allowance: usageCommit.allowance,
        },
        { status: 429, headers: rateLimit.headers },
      );
    }

    return NextResponse.json({
      ok: true,
      userId,
      text: response.text,
      model: response.model,
      odinProfile: odinProfile.id,
      tokensUsed: response.tokensUsed,
      usage: {
        feature: "ai_chat",
        remainingToday: usageCommit.allowance.remainingToday,
        remainingThisWeek: usageCommit.allowance.remainingThisWeek ?? null,
        weeklyLimit: usageCommit.allowance.weeklyLimit ?? null,
        usedThisWeek: usageCommit.allowance.usedThisWeek ?? null,
        replayed: usageCommit.replayed,
      },
      settings: {
        temperature: tuned.temperature,
        maxTokens: tuned.maxTokens,
        topP: tuned.topP,
      },
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Generate API error:", error);

    const message = error instanceof Error ? error.message : "Generation failed";
    const missingConfig = /hf_api_token not set|hf token not set|hugging face token missing/i.test(message);

    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: missingConfig
          ? "Set HF_API_TOKEN (or HUGGINGFACE_API_TOKEN / HUGGING_FACE_HUB_TOKEN) to enable live model generation."
          : undefined,
      },
      { status: missingConfig ? 503 : 500 },
    );
  }
}
