/**
 * POST /api/ai/generate-image
 * Generate images with Hugging Face Inference API
 */

import {
    checkCredits,
    deductCredits,
    getCreditSnapshot,
} from "@/lib/ai/credit-system";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { resolveHfApiToken } from "@/lib/ai/env-tokens";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isFiniteNumberInRange,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { HfInference } from "@huggingface/inference";
import { NextRequest, NextResponse } from "next/server";

interface ImageRequest {
  prompt: string;
  model?: string;
  negativePrompt?: string;
  style?: "trading" | "nft" | "hero" | "general";
  width?: number;
  height?: number;
  safetyMode?: "open" | "standard";
  userId?: string;
}

const DEFAULT_IMAGE_MODEL = "stabilityai/stable-diffusion-2-1";
const DEFAULT_STANDARD_NEGATIVE =
  "blurry, low quality, watermark, logo, text overlay, disfigured, deformed";

const IMAGE_MODEL_ALIASES: Record<string, string> = {
  NEURAL_DIFF_V4: "stabilityai/stable-diffusion-2-1",
  FLUX_CORE_X: "black-forest-labs/FLUX.1-schnell",
  ASTRA_LINK: "stabilityai/stable-diffusion-xl-base-1.0",
};

export const runtime = "nodejs";

function normalizeDimension(value: unknown, fallback: number) {
  if (!isFiniteNumberInRange(value, 256, 1536)) {
    return fallback;
  }

  const numeric = Number(value);
  return Math.round(numeric / 8) * 8;
}

function createStyledPrompt(prompt: string, style: ImageRequest["style"]) {
  const cleaned = sanitizePlainText(prompt, 800);
  switch (style) {
    case "trading":
      return `Ultra-detailed institutional crypto trading dashboard render: ${cleaned}. cinematic lighting, clean data visualization, high contrast, 8k.`;
    case "nft":
      return `Original high-detail cyberpunk NFT artwork: ${cleaned}. vibrant color palette, studio quality, collectible-grade composition.`;
    case "hero":
      return `Website hero background art for TradeHax: ${cleaned}. dramatic depth, dark futuristic aesthetic, no readable text, 8k.`;
    default:
      return cleaned;
  }
}

function parseErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorText = (payload as { error?: unknown }).error;
    if (typeof errorText === "string" && errorText.trim().length > 0) {
      return errorText;
    }
  }
  return "Image generation failed at Hugging Face.";
}

function resolveImageModel(requestedModel: unknown) {
  const envDefault = process.env.HF_IMAGE_MODEL_ID || DEFAULT_IMAGE_MODEL;

  if (typeof requestedModel !== "string") {
    return envDefault;
  }

  const trimmed = requestedModel.trim();
  if (!trimmed || trimmed.length > 120) {
    return envDefault;
  }

  if (IMAGE_MODEL_ALIASES[trimmed]) {
    return IMAGE_MODEL_ALIASES[trimmed];
  }

  return /^[a-zA-Z0-9._\-/]+$/.test(trimmed) ? trimmed : envDefault;
}

function createSvgFallbackDataUrl(prompt: string, width: number, height: number, style: ImageRequest["style"]) {
  const safePrompt = sanitizePlainText(prompt, 120).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeStyle = sanitizePlainText(style ?? "general", 32).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060b1b"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.22)}" r="${Math.max(26, Math.round(Math.min(width, height) * 0.09))}" fill="#22d3ee" fill-opacity="0.25"/>
  <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.74)}" r="${Math.max(22, Math.round(Math.min(width, height) * 0.08))}" fill="#34d399" fill-opacity="0.2"/>
  <text x="${Math.round(width * 0.06)}" y="${Math.round(height * 0.12)}" fill="#67e8f9" font-family="Inter, Arial, sans-serif" font-size="${Math.max(18, Math.round(width * 0.025))}" font-weight="700">TradeHax Neural Image Preview</text>
  <text x="${Math.round(width * 0.06)}" y="${Math.round(height * 0.2)}" fill="#d1fae5" font-family="Inter, Arial, sans-serif" font-size="${Math.max(14, Math.round(width * 0.018))}">Style: ${safeStyle}</text>
  <foreignObject x="${Math.round(width * 0.06)}" y="${Math.round(height * 0.28)}" width="${Math.round(width * 0.88)}" height="${Math.round(height * 0.58)}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; color: #e5e7eb; font-size: ${Math.max(14, Math.round(width * 0.017))}px; line-height: 1.45;">
      Prompt: ${safePrompt}
    </div>
  </foreignObject>
</svg>`;

  const encoded = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
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
    keyPrefix: "ai:image",
    max: 24,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: ImageRequest = await request.json();

    const prompt = sanitizePlainText(String(body.prompt ?? ""), 800);
    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const userId = await resolveRequestUserId(request, body.userId);
    const hasCredits = await checkCredits(userId, "IMAGE_GEN");
    if (!hasCredits) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_CREDITS",
          message: "Image generation needs more AI credits.",
          credits: await getCreditSnapshot(userId),
          billing: {
            topUpPath: "/billing",
            creditsPath: "/api/monetization/ai-credits",
          },
        },
        { status: 402, headers: rateLimit.headers },
      );
    }

    const token = resolveHfApiToken();

    const style = body.style ?? "general";
    const width = normalizeDimension(body.width, style === "hero" ? 1536 : 1024);
    const height = normalizeDimension(body.height, style === "hero" ? 864 : 1024);
    const requestedSafetyMode = body.safetyMode === "standard" ? "standard" : "open";
    const openMode =
      requestedSafetyMode === "open" && process.env.TRADEHAX_IMAGE_OPEN_MODE !== "false";

    const negativePromptRaw =
      typeof body.negativePrompt === "string" ? sanitizePlainText(body.negativePrompt, 500) : "";
    const negativePrompt =
      negativePromptRaw ||
      (openMode
        ? ""
        : process.env.HF_IMAGE_NEGATIVE_PROMPT_DEFAULT || DEFAULT_STANDARD_NEGATIVE);

    const model = resolveImageModel(body.model);
    if (!token) {
      const fallbackUrl = createSvgFallbackDataUrl(prompt, width, height, style);
      return NextResponse.json(
        {
          ok: true,
          url: fallbackUrl,
          prompt,
          style,
          width,
          height,
          mimeType: "image/svg+xml",
          model: "local:fallback-svg",
          openMode,
          safetyMode: openMode ? "open" : "standard",
          fallback: true,
          warning:
            "Hugging Face token missing (HF_API_TOKEN or alias); returned local preview image.",
        },
        { headers: rateLimit.headers },
      );
    }
    const styledPrompt = createStyledPrompt(prompt, style);

    const guidanceScaleRaw = Number.parseFloat(process.env.HF_IMAGE_GUIDANCE_SCALE || "6.5");
    const guidanceScale = Number.isFinite(guidanceScaleRaw) ? guidanceScaleRaw : 6.5;

    const stepsRaw = Number.parseInt(process.env.HF_IMAGE_STEPS || "30", 10);
    const numInferenceSteps = Number.isFinite(stepsRaw) ? Math.max(10, Math.min(60, stepsRaw)) : 30;
    let imageBuffer: Buffer;
    let mimeType = "image/png";

    try {
      const hf = new HfInference(token);
      const imageResult = await hf.textToImage({
        model,
        inputs: styledPrompt,
        parameters: {
          negative_prompt: negativePrompt || undefined,
          width,
          height,
          guidance_scale: guidanceScale,
          num_inference_steps: numInferenceSteps,
        },
      });

      const imageBlob =
        typeof imageResult === "string"
          ? new Blob([imageResult], { type: "image/png" })
          : imageResult;

      const blobType = String(imageBlob.type || "").trim();
      if (blobType) {
        mimeType = blobType;
      }

      imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    } catch (hfError) {
      const fallbackUrl = createSvgFallbackDataUrl(prompt, width, height, style);
      return NextResponse.json(
        {
          ok: true,
          url: fallbackUrl,
          prompt,
          style,
          width,
          height,
          mimeType: "image/svg+xml",
          model: "local:fallback-svg",
          openMode,
          safetyMode: openMode ? "open" : "standard",
          fallback: true,
          warning: parseErrorMessage({
            error: hfError instanceof Error ? hfError.message : String(hfError),
          }),
        },
        { headers: rateLimit.headers },
      );
    }

    if (imageBuffer.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Empty image payload from Hugging Face.",
        },
        { status: 502, headers: rateLimit.headers },
      );
    }

    const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

    try {
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: "IMAGE",
        source: "ai_image",
        prompt,
        response: `IMAGE_GENERATED model=${model} style=${style} ${width}x${height}`,
        metadata: {
          route: "/api/ai/generate-image",
          model,
          style,
          width,
          height,
          open_mode: openMode,
        },
        consent: {
          analytics: true,
          training: false,
        },
      });
    } catch (ingestionError) {
      console.warn("Image generation ingestion skipped:", ingestionError);
    }

    const debit = await deductCredits(userId, "IMAGE_GEN");
    if (!debit.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_CREDITS",
          message: "Image generated but credits were depleted before finalization.",
          credits: await getCreditSnapshot(userId),
          billing: {
            topUpPath: "/billing",
            creditsPath: "/api/monetization/ai-credits",
          },
        },
        { status: 402, headers: rateLimit.headers },
      );
    }

    return NextResponse.json({
      ok: true,
      url: dataUrl,
      prompt,
      style,
      width,
      height,
      mimeType,
      model,
      openMode,
      safetyMode: openMode ? "open" : "standard",
      credits: {
        spent: debit.cost,
        remaining: debit.remaining,
      },
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Image generation failed",
      },
      { status: 500 },
    );
  }
}
