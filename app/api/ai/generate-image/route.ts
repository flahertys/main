/**
 * POST /api/ai/generate-image
 * Generate images with Hugging Face Inference API
 */

import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isFiniteNumberInRange,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { NextRequest, NextResponse } from "next/server";

interface ImageRequest {
  prompt: string;
  negativePrompt?: string;
  style?: "trading" | "nft" | "hero" | "general";
  width?: number;
  height?: number;
}

const DEFAULT_IMAGE_MODEL = "stabilityai/stable-diffusion-2-1";
const DEFAULT_STANDARD_NEGATIVE =
  "blurry, low quality, watermark, logo, text overlay, disfigured, deformed";

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

    const token = process.env.HF_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "HF_API_TOKEN is not configured.",
        },
        { status: 500, headers: rateLimit.headers },
      );
    }

    const style = body.style ?? "general";
    const width = normalizeDimension(body.width, style === "hero" ? 1536 : 1024);
    const height = normalizeDimension(body.height, style === "hero" ? 864 : 1024);
    const openMode = process.env.TRADEHAX_IMAGE_OPEN_MODE !== "false";

    const negativePromptRaw =
      typeof body.negativePrompt === "string" ? sanitizePlainText(body.negativePrompt, 500) : "";
    const negativePrompt =
      negativePromptRaw ||
      (openMode
        ? ""
        : process.env.HF_IMAGE_NEGATIVE_PROMPT_DEFAULT || DEFAULT_STANDARD_NEGATIVE);

    const model = process.env.HF_IMAGE_MODEL_ID || DEFAULT_IMAGE_MODEL;
    const endpoint = `https://api-inference.huggingface.co/models/${model}`;
    const styledPrompt = createStyledPrompt(prompt, style);

    const guidanceScaleRaw = Number.parseFloat(process.env.HF_IMAGE_GUIDANCE_SCALE || "6.5");
    const guidanceScale = Number.isFinite(guidanceScaleRaw) ? guidanceScaleRaw : 6.5;

    const stepsRaw = Number.parseInt(process.env.HF_IMAGE_STEPS || "30", 10);
    const numInferenceSteps = Number.isFinite(stepsRaw) ? Math.max(10, Math.min(60, stepsRaw)) : 30;

    const hfResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({
        inputs: styledPrompt,
        parameters: {
          negative_prompt: negativePrompt || undefined,
          width,
          height,
          guidance_scale: guidanceScale,
          num_inference_steps: numInferenceSteps,
        },
        options: {
          wait_for_model: true,
          use_cache: false,
        },
      }),
      cache: "no-store",
    });

    const contentType = hfResponse.headers.get("content-type") || "";
    if (!hfResponse.ok || contentType.includes("application/json")) {
      let payload: unknown = null;
      try {
        payload = await hfResponse.json();
      } catch {
        payload = null;
      }

      return NextResponse.json(
        {
          ok: false,
          error: parseErrorMessage(payload),
          providerStatus: hfResponse.status,
        },
        { status: 502, headers: rateLimit.headers },
      );
    }

    const imageBuffer = Buffer.from(await hfResponse.arrayBuffer());
    if (imageBuffer.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Empty image payload from Hugging Face.",
        },
        { status: 502, headers: rateLimit.headers },
      );
    }

    const mimeType = contentType.split(";")[0] || "image/png";
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
