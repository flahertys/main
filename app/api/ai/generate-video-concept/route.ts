import { getLLMClient } from "@/lib/ai/hf-server";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type VideoConceptRequest = {
  goal?: string;
  format?: "short" | "ad" | "explainer";
  style?: "concise" | "coach" | "operator";
  objective?: string;
  context?: unknown;
};

function sanitizeFormat(value: unknown): "short" | "ad" | "explainer" {
  if (value === "short" || value === "ad" || value === "explainer") {
    return value;
  }
  return "short";
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw) as {
      concept?: string;
      scenes?: string[];
      cta?: string;
      visualDirection?: string;
    };
  } catch {
    return null;
  }
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
    keyPrefix: "ai:video-concept",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as VideoConceptRequest;
    const goal = sanitizePlainText(String(body.goal || ""), 1_600);
    const format = sanitizeFormat(body.format);
    const style = body.style === "concise" || body.style === "coach" || body.style === "operator" ? body.style : "operator";
    const objective = sanitizePlainText(String(body.objective || ""), 200);

    if (!goal) {
      return NextResponse.json(
        { ok: false, error: "Video concept goal is required." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const contextText = body.context && typeof body.context === "object"
      ? sanitizePlainText(JSON.stringify(body.context), 1_200)
      : "";

    const prompt = [
      "You are an elite creative director for fintech AI products.",
      "Generate a production-ready video concept payload as strict JSON.",
      "Return JSON only with keys: concept, scenes, cta, visualDirection.",
      `Format: ${format}.`,
      `Style: ${style}.`,
      objective ? `Objective: ${objective}` : "",
      contextText ? `Context: ${contextText}` : "",
      `User goal: ${goal}`,
      "Requirements:",
      "- concept: one sentence",
      "- scenes: array of 4-7 concise scene instructions",
      "- cta: one short call to action",
      "- visualDirection: one sentence for lighting/style/camera tone",
    ].filter(Boolean).join("\n");

    const client = getLLMClient({ modelId: process.env.HF_MODEL_ID || "Qwen/Qwen2.5-7B-Instruct" });
    const completion = await client.generate(prompt, {
      maxTokens: 600,
      temperature: 0.55,
      topP: 0.9,
    });

    const parsed = safeJsonParse(completion.text);

    if (!parsed) {
      return NextResponse.json(
        {
          ok: true,
          format,
          model: completion.model,
          concept: `Video concept for ${format}: ${goal.slice(0, 140)}`,
          scenes: [
            "Hook shot: establish core problem in 2-3 seconds.",
            "Introduce TradeHax AI solution with bold UI action.",
            "Show credibility signals: metrics, safety, reliability.",
            "Deliver key transformation outcome in one visual beat.",
            "End on clear CTA with branded closing frame.",
          ],
          cta: "Start your AI workflow on TradeHax today.",
          visualDirection: "High-contrast fintech cinematic style, clean overlays, punchy motion transitions.",
          warning: "Model returned non-JSON; fallback concept used.",
        },
        { headers: rateLimit.headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        format,
        model: completion.model,
        concept: sanitizePlainText(String(parsed.concept || ""), 220) || `Video concept for ${format}`,
        scenes: Array.isArray(parsed.scenes)
          ? parsed.scenes.map((scene) => sanitizePlainText(String(scene), 180)).filter(Boolean).slice(0, 7)
          : [],
        cta: sanitizePlainText(String(parsed.cta || ""), 140),
        visualDirection: sanitizePlainText(String(parsed.visualDirection || ""), 220),
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Video concept generation failed",
      },
      { status: 500 },
    );
  }
}
