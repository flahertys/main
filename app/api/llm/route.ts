import { buildTradeHaxSystemPrompt } from "@/lib/ai/custom-llm/system-prompt";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { getLLMClient } from "@/lib/ai/hf-server";
import { canConsumeFeature, consumeFeatureUsage } from "@/lib/monetization/engine";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type LlmTask = "generate" | "summarize" | "qa" | "chat";

type ChatRole = "user" | "assistant";

type LlmMessage = {
  role?: string;
  content?: string;
};

type LlmRequest = {
  task?: string;
  userId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  prompt?: string;
  text?: string;
  question?: string;
  context?: string;
  messages?: LlmMessage[];
};

const DEFAULT_MODEL = process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1";

function normalizeTask(task: unknown): LlmTask {
  if (task === "generate" || task === "summarize" || task === "qa" || task === "chat") {
    return task;
  }
  return "generate";
}

function sanitizeModelId(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_MODEL;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) {
    return DEFAULT_MODEL;
  }

  return /^[a-zA-Z0-9._\-/]+$/.test(trimmed) ? trimmed : DEFAULT_MODEL;
}

function numberInRange(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.min(max, Math.max(min, value));
}

function normalizeMessages(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as Array<{ role: ChatRole; content: string }>;
  }

  const allowedRoles = new Set<ChatRole>(["user", "assistant"]);
  return raw
    .map((entry) => {
      const role = typeof entry?.role === "string" ? (entry.role.toLowerCase() as ChatRole) : null;
      const content =
        typeof entry?.content === "string" ? sanitizePlainText(entry.content, 2_000) : "";
      if (!role || !allowedRoles.has(role) || !content) {
        return null;
      }
      return { role, content };
    })
    .filter((entry): entry is { role: ChatRole; content: string } => Boolean(entry))
    .slice(-20);
}

function buildChatPrompt(messages: Array<{ role: ChatRole; content: string }>, context?: string) {
  const systemPrompt = buildTradeHaxSystemPrompt({
    openMode: process.env.TRADEHAX_LLM_OPEN_MODE !== "false",
  });

  const lines = [`System:\n${systemPrompt}`];

  if (context) {
    lines.push(`Context:\n${context}`);
  }

  if (messages.length > 0) {
    for (const message of messages) {
      lines.push(`${message.role}: ${message.content}`);
    }
  }

  lines.push("assistant:");
  return lines.join("\n\n");
}

function buildTaskPrompt(task: LlmTask, body: LlmRequest) {
  const prompt = sanitizePlainText(String(body.prompt ?? ""), 8_000);
  const text = sanitizePlainText(String(body.text ?? ""), 12_000);
  const context = sanitizePlainText(String(body.context ?? ""), 8_000);
  const question = sanitizePlainText(String(body.question ?? ""), 2_000);

  if (task === "summarize") {
    if (!text) {
      return { error: "text is required for summarize" };
    }

    const sourceText = text.length > 10_000 ? `${text.slice(0, 10_000)}...` : text;
    return {
      prompt: `Summarize the following text in concise bullets and a one-line takeaway:\n\n${sourceText}\n\nSummary:`,
      originalInput: text,
    };
  }

  if (task === "qa") {
    if (!context || !question) {
      return { error: "context and question are required for qa" };
    }

    return {
      prompt: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer with directly supported points only.`,
      originalInput: question,
    };
  }

  if (task === "chat") {
    const messages = normalizeMessages(body.messages);
    if (messages.length === 0 && !prompt) {
      return { error: "messages or prompt is required for chat" };
    }

    const mergedMessages =
      messages.length > 0
        ? messages
        : [{ role: "user" as const, content: prompt }];

    return {
      prompt: buildChatPrompt(mergedMessages, context),
      originalInput: mergedMessages[mergedMessages.length - 1]?.content || prompt,
    };
  }

  if (!prompt) {
    return { error: "prompt is required for generate" };
  }

  return {
    prompt,
    originalInput: prompt,
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/llm",
    tasks: ["generate", "summarize", "qa", "chat"],
    defaultModel: DEFAULT_MODEL,
  });
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
    keyPrefix: "ai:llm",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as LlmRequest;
    const task = normalizeTask(body.task);

    const prepared = buildTaskPrompt(task, body);
    if ("error" in prepared) {
      return NextResponse.json(
        { ok: false, error: prepared.error },
        { status: 400, headers: rateLimit.headers },
      );
    }

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
    const temperature = numberInRange(body.temperature, 0, 2);
    const maxTokens = numberInRange(body.maxTokens, 16, 2_048);
    const topP = numberInRange(body.topP, 0.1, 1);

    const client = getLLMClient({ modelId, temperature, maxTokens, topP });
    const generated = await client.generate(prepared.prompt, {
      modelId,
      temperature,
      maxTokens,
      topP,
    });

    try {
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: "BEHAVIOR",
        source: "system",
        userId,
        prompt: prepared.originalInput,
        response: generated.text,
        metadata: {
          route: "/api/llm",
          task,
          model: modelId,
        },
        consent: {
          analytics: true,
          training: false,
        },
      });
    } catch (ingestionError) {
      console.warn("LLM route ingestion skipped:", ingestionError);
    }

    consumeFeatureUsage(userId, "ai_chat", 1, "api:llm", {
      task,
      model: modelId,
    });

    return NextResponse.json(
      {
        ok: true,
        task,
        userId,
        result: generated.text,
        model: generated.model,
        settings: {
          temperature: temperature ?? null,
          maxTokens: maxTokens ?? null,
          topP: topP ?? null,
        },
        usage: {
          feature: "ai_chat",
          remainingToday: allowance.remainingToday,
        },
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("LLM API error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "LLM request failed",
      },
      { status: 500 },
    );
  }
}
