import { resolveHfApiToken } from "@/lib/ai/env-tokens";
import { HfInference } from "@huggingface/inference";
import { NextRequest, NextResponse } from "next/server";

function getHfClient() {
  const token = resolveHfApiToken();
  if (!token) {
    return null;
  }
  return new HfInference(token);
}

type HFTask = "text-generation" | "image-generation";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    prompt?: string;
    task?: HFTask;
    parameters?: Record<string, unknown>;
  };

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const task: HFTask = body.task || "text-generation";
  const parameters = body.parameters || {};
  const hf = getHfClient();
  if (!hf) {
    return NextResponse.json(
      {
        error:
          "Hugging Face token missing. Set HF_API_TOKEN (or HUGGINGFACE_API_TOKEN / HUGGING_FACE_HUB_TOKEN).",
      },
      { status: 503 },
    );
  }

  try {
    if (task === "text-generation") {
      const result = await hf.textGeneration({
        model: process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1",
        inputs: prompt,
        parameters: {
          max_new_tokens: Number(parameters.max_length ?? process.env.LLM_MAX_LENGTH ?? "768"),
          temperature: Number(parameters.temperature ?? process.env.LLM_TEMPERATURE ?? "0.85"),
          top_p: Number(parameters.top_p ?? process.env.LLM_TOP_P ?? "0.95"),
          ...(parameters as object),
        },
      });
      return NextResponse.json({ output: result });
    }

    if (task === "image-generation") {
      const result = await hf.textToImage({
        model: process.env.HF_IMAGE_MODEL_ID || "stabilityai/stable-diffusion-2-1",
        inputs: prompt,
        parameters: {
          num_inference_steps: Number(parameters.steps ?? process.env.HF_IMAGE_STEPS ?? "30"),
          guidance_scale: Number(parameters.guidance_scale ?? process.env.HF_IMAGE_GUIDANCE_SCALE ?? "6.5"),
          negative_prompt:
            String(parameters.negative_prompt ?? process.env.HF_IMAGE_NEGATIVE_PROMPT_DEFAULT ?? "").trim() ||
            undefined,
          ...(parameters as object),
        },
      });
      return NextResponse.json({ output: result });
    }

    return NextResponse.json({ error: "Unsupported task" }, { status: 400 });
  } catch (error) {
    console.error("HF Inference Error:", error);
    return NextResponse.json({ error: "Inference failed" }, { status: 500 });
  }
}
