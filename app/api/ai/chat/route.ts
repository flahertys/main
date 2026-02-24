import { resolveServerConsent } from "@/lib/ai/consent-server";
import { checkCredits, deductCredits, getCreditSnapshot } from "@/lib/ai/credit-system";
import { buildTradeHaxSystemPrompt } from "@/lib/ai/custom-llm/system-prompt";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { getLLMClient } from "@/lib/ai/hf-server";
import { NeuralQuery, processNeuralCommand } from "@/lib/ai/kernel";
import { formatRetrievalContext, retrieveRelevantContext } from "@/lib/ai/retriever";
import { canConsumeFeature, consumeFeatureUsage, tierSupportsNeuralMode } from "@/lib/monetization/engine";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { getSubscription } from "@/lib/monetization/store";
import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type NeuralTier = "STANDARD" | "UNCENSORED" | "OVERCLOCK" | "HFT_SIGNAL" | "GUITAR_LESSON";
type ChatRole = "user" | "assistant";

type ChatRequestBody = {
  message?: string;
  messages?: Array<{ role?: string; content?: string }>;
  model?: string;
  tier?: string;
  context?: unknown;
  userId?: string;
  systemPrompt?: string;
  consent?: {
    analytics?: boolean;
    training?: boolean;
  };
};

type ResponseStyle = "concise" | "coach" | "operator";

const DEFAULT_CHAT_MODEL = process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1";

const COMMAND_PREFIXES = [
  "HELP",
  "COMMANDS",
  "MENU",
  "STATUS",
  "PORTFOLIO",
  "WALLET",
  "ASSETS",
  "BILLING",
  "UPGRADE",
  "SUBSCRIBE",
  "BOOK",
  "LESSONS",
  "SCHEDULE",
  "GAME",
  "GAMES",
  "RUNNER",
  "SIMULATE",
  "DAO",
  "GOVERNANCE",
  "STAKING",
  "POOL",
] as const;

function parseNeuralTier(value: unknown): NeuralTier {
  const normalized = typeof value === "string" ? value.toUpperCase().trim() : "STANDARD";
  if (
    normalized === "STANDARD" ||
    normalized === "UNCENSORED" ||
    normalized === "OVERCLOCK" ||
    normalized === "HFT_SIGNAL" ||
    normalized === "GUITAR_LESSON"
  ) {
    return normalized;
  }
  return "STANDARD";
}

function resolveCategoryForTier(tier: NeuralTier) {
  if (tier === "HFT_SIGNAL") return "HFT" as const;
  if (tier === "GUITAR_LESSON") return "GUITAR" as const;
  return "BEHAVIOR" as const;
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
    .slice(-14);
}

function serializeContext(context: unknown) {
  if (typeof context === "string") {
    return sanitizePlainText(context, 2_000);
  }

  if (context && typeof context === "object") {
    try {
      return sanitizePlainText(JSON.stringify(context), 2_000);
    } catch {
      return "";
    }
  }

  return "";
}

function mergeContext(baseContext: unknown, retrievalContext: string) {
  if (!retrievalContext) {
    return baseContext;
  }

  if (baseContext && typeof baseContext === "object" && !Array.isArray(baseContext)) {
    return {
      ...(baseContext as Record<string, unknown>),
      retrieved_context: retrievalContext,
    };
  }

  if (typeof baseContext === "string" && baseContext.trim().length > 0) {
    return {
      provided_context: baseContext,
      retrieved_context: retrievalContext,
    };
  }

  return {
    retrieved_context: retrievalContext,
  };
}

function isCommandLike(input: string) {
  const upper = input.trim().toUpperCase();
  if (!upper) {
    return false;
  }

  return COMMAND_PREFIXES.some((prefix) => upper === prefix || upper.startsWith(`${prefix} `));
}

function sanitizeModelId(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_CHAT_MODEL;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) {
    return DEFAULT_CHAT_MODEL;
  }

  const isSafe = /^[a-zA-Z0-9._\-/]+$/.test(trimmed);
  return isSafe ? trimmed : DEFAULT_CHAT_MODEL;
}

function buildPromptFromConversation(args: {
  inputMessage: string;
  messages: Array<{ role: ChatRole; content: string }>;
  context: unknown;
  systemPrompt?: string;
  openMode?: boolean;
}) {
  const contextText = serializeContext(args.context);
  const resolvedSystemPrompt =
    typeof args.systemPrompt === "string" && args.systemPrompt.trim().length > 0
      ? sanitizePlainText(args.systemPrompt, 3_000)
      : buildTradeHaxSystemPrompt({ openMode: args.openMode });

  const lines = [`System:\n${resolvedSystemPrompt}`];

  const responseStyle =
    args.context && typeof args.context === "object" && !Array.isArray(args.context)
      ? ((args.context as Record<string, unknown>).responseStyle as ResponseStyle | undefined)
      : undefined;

  if (responseStyle === "concise") {
    lines.push("Style directive:\nRespond in concise bullets. Keep under 120 words unless user asks for detail.");
  } else if (responseStyle === "operator") {
    lines.push(
      "Style directive:\nRespond with an operator checklist: objective, steps, risks, and explicit next action.",
    );
  } else if (responseStyle === "coach") {
    lines.push(
      "Style directive:\nRespond in coaching tone with clear reasoning, then end with one actionable next step.",
    );
  }

  if (contextText) {
    lines.push(`Context:\n${contextText}`);
  }

  if (args.messages.length > 0) {
    for (const msg of args.messages) {
      lines.push(`${msg.role}: ${msg.content}`);
    }
  } else {
    lines.push(`user: ${args.inputMessage}`);
  }

  lines.push("assistant:");
  return lines.join("\n\n");
}

/**
 * POST /api/ai/chat
 * TradeHax AI Chat Endpoint
 * Supports both single 'message' (Neural Terminal) and 'messages' array (Chat standard)
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceTrustedOrigin(req);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(req, {
    keyPrefix: "ai:chat",
    max: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await req.json()) as ChatRequestBody;
    const normalizedMessages = normalizeMessages(body.messages);
    const requestedMessage =
      typeof body.message === "string" ? sanitizePlainText(body.message, 2_000) : "";
    const inputMessage =
      requestedMessage ||
      (normalizedMessages.length > 0
        ? normalizedMessages[normalizedMessages.length - 1]?.content
        : "");

    if (!inputMessage) {
      return NextResponse.json(
        { ok: false, error: "No message provided" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const userId = await resolveRequestUserId(req, body.userId);
    const subscription = getSubscription(userId);
    const neuralTier = parseNeuralTier(body.tier);
    const requestedModel = sanitizeModelId(body.model);
    const retrievalChunks = await retrieveRelevantContext(inputMessage, 5);
    const retrievalContext = formatRetrievalContext(retrievalChunks);
    const mergedContext = mergeContext(body.context, retrievalContext);
    const consent = await resolveServerConsent(userId, body.consent);

    if (!tierSupportsNeuralMode(userId, neuralTier)) {
      return NextResponse.json(
        {
          ok: false,
          error: "TIER_UPGRADE_REQUIRED",
          message: `Your current plan does not include ${neuralTier} mode.`,
        },
        { status: 403, headers: rateLimit.headers },
      );
    }

    const allowance = canConsumeFeature(userId, "ai_chat", 1);
    if (!allowance.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "USAGE_LIMIT_REACHED",
          message: allowance.reason,
          allowance,
        },
        { status: 429, headers: rateLimit.headers },
      );
    }

    // 1. Credit Gate
    const hasCredits = await checkCredits(userId, neuralTier);
    if (!hasCredits) {
      const creditSnapshot = await getCreditSnapshot(userId);
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_CREDITS",
          message: "You do not have enough AI credits for this request.",
          credits: creditSnapshot,
          billing: {
            topUpPath: "/billing",
            creditsPath: "/api/monetization/ai-credits",
          },
        },
        { status: 402, headers: rateLimit.headers },
      );
    }

    // Prepare query for kernel
    const query: NeuralQuery = {
      text: inputMessage,
      tier: neuralTier as any,
      context: mergedContext as NeuralQuery["context"],
    };

    const commandLike = isCommandLike(inputMessage);
    let response = "";
    let kernelResponse = "";
    let provider = "kernel";
    let fallbackReason = "";

    if (commandLike) {
      kernelResponse = await processNeuralCommand(query);
      response = kernelResponse;
    }

    const shouldTryHf = !commandLike || response.startsWith("AI_RESPONSE: ANALYZING_QUERY");
    if (shouldTryHf) {
      try {
        const client = getLLMClient({ modelId: requestedModel });
        const prompt = buildPromptFromConversation({
          inputMessage,
          messages: normalizedMessages,
          context: mergedContext,
          systemPrompt:
            typeof body.systemPrompt === "string" && body.systemPrompt.trim().length > 0
              ? body.systemPrompt
              : buildTradeHaxSystemPrompt({
                  openMode: neuralTier !== "STANDARD",
                  audienceTier: subscription.tier === "pro" || subscription.tier === "elite" ? "premium" : "learner",
                  guardrailMode: "strict_ip",
                }),
          openMode: neuralTier !== "STANDARD",
        });
        const hfResponse = await client.generate(prompt, { modelId: requestedModel });
        if (hfResponse.text.trim().length > 0) {
          response = hfResponse.text.trim();
          provider = "huggingface";
        }
      } catch (hfError) {
        fallbackReason = hfError instanceof Error ? hfError.message : "Primary model failed";
        console.warn("HF primary generation failed. Falling back to kernel response.", hfError);
      }
    }

    if (!response) {
      if (!kernelResponse) {
        kernelResponse = await processNeuralCommand(query);
      }
      response = kernelResponse;
      provider = "kernel";
    }

    try {
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: resolveCategoryForTier(neuralTier),
        source: "ai_chat",
        userId,
        prompt: inputMessage,
        response,
        metadata: {
          route: "/api/ai/chat",
          tier: neuralTier,
          command_like: commandLike,
          used_hf: shouldTryHf,
          model: requestedModel,
          provider,
          fallback_reason: fallbackReason,
          retrieved_chunks: retrievalChunks.length,
          retrieved_sources: retrievalChunks.map((chunk) => chunk.path).slice(0, 6).join(","),
        },
        consent,
      });
    } catch (ingestionError) {
      console.warn("AI chat ingestion skipped:", ingestionError);
    }

    // 4. Deduct Credits
    const debit = await deductCredits(userId, neuralTier);
    if (!debit.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_CREDITS",
          message: "Credits were depleted before this response could be finalized.",
          credits: await getCreditSnapshot(userId),
          billing: {
            topUpPath: "/billing",
            creditsPath: "/api/monetization/ai-credits",
          },
        },
        { status: 402, headers: rateLimit.headers },
      );
    }
    consumeFeatureUsage(userId, "ai_chat", 1, "api:ai:chat", {
      tier: neuralTier,
    });

    // Simulated latency for realism
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
      ok: true,
      response,
      message: {
        role: "assistant",
        content: response
      },
      status: "SUCCESS",
      provider,
      model: requestedModel,
      warning: fallbackReason || undefined,
      usage: {
        feature: "ai_chat",
        remainingToday: allowance.remainingToday,
      },
      credits: {
        spent: debit.cost,
        remaining: debit.remaining,
      },
      timestamp: new Date().toISOString()
    }, { headers: rateLimit.headers });

  } catch (error: any) {
    console.error("Neural API Error:", error);
    return NextResponse.json({
      ok: false,
      error: "NEURAL_LINK_FAILURE",
      details: error.message
    }, { status: 500 });
  }
}
