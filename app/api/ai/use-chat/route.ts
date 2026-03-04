import {
    applyAccuracyConfidenceAdjustment,
    recordAccuracyGovernorEvent,
    resolveAccuracyGovernorPlan,
} from "@/lib/ai/accuracy-governor";
import {
    getAdaptiveRoutingHints,
    recordAdaptiveRoutingOutcome,
} from "@/lib/ai/adaptive-routing-memory";
import {
    recordComplexProblemPlannerEvent,
    resolveComplexProblemPlan,
} from "@/lib/ai/complex-problem-planner";
import { checkCredits, deductCredits, getCreditSnapshot } from "@/lib/ai/credit-system";
import { buildTradeHaxSystemPrompt } from "@/lib/ai/custom-llm/system-prompt";
import { getLLMClient } from "@/lib/ai/hf-server";
import {
    buildPersonalizedDirective,
    resolvePersonalizedIntelligenceContext,
} from "@/lib/ai/individualized-intelligence";
import { NeuralQuery, processNeuralCommand } from "@/lib/ai/kernel";
import { buildLiveMarketContext } from "@/lib/ai/market-freshness";
import { applyOdinChatTuning, resolveOdinRuntimeProfile } from "@/lib/ai/odin-profile";
import {
    getPersonalizedTrajectorySnapshot,
    recordPersonalizedTrajectoryEvent,
} from "@/lib/ai/personalized-trajectory-memory";
import {
    inferPredictionDomain,
    recordPredictionTelemetry,
    resolveAdaptiveInferenceTuning,
    resolveLlmPreset,
    resolvePredictionModel,
} from "@/lib/ai/prediction-routing";
import {
  recordAdversarialVerifierEvent,
  resolveAdversarialVerifierPlan,
  verifyResponseAdversarially,
} from "@/lib/ai/response-verifier";
import { enqueueRetrainExportCandidate } from "@/lib/ai/retrain-export-queue";
import { cacheManager } from "@/lib/ai/response-cache";
import { formatRetrievalContext, retrieveRelevantContext } from "@/lib/ai/retriever";
import { recordStreamTelemetry } from "@/lib/ai/telemetry-store";
import {
    canConsumeFeature,
    tierSupportsNeuralMode,
    tryConsumeFeatureUsageSecure,
} from "@/lib/monetization/engine";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { createUIMessageStream, createUIMessageStreamResponse, UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

type ChatRole = "system" | "user" | "assistant";
type NeuralTier = "STANDARD" | "UNCENSORED" | "OVERCLOCK" | "HFT_SIGNAL" | "GUITAR_LESSON";

type ChatMessage = {
  role?: string;
  content?: string;
  parts?: Array<{
    type?: string;
    text?: string;
  }>;
};

type UseChatRequest = {
  messages?: Array<UIMessage | ChatMessage>;
  context?: unknown;
  preset?: string;
  model?: string;
  sloProfile?: SloProfile;
  responseStyle?: "concise" | "coach" | "operator";
  freedomMode?: "uncensored" | "standard";
  objective?: string;
  tier?: string;
  idempotencyKey?: string;
};

type ModelHealthEntry = {
  successes: number;
  failures: number;
  totalLatencyMs: number;
};

type QualitySummary = {
  score: number;
  classification: "elite" | "strong" | "moderate" | "weak";
};

type SloProfile = "latency" | "balanced" | "quality";

type SlashCommandId = "plan" | "risk" | "parabolic" | "odinsignal" | "sop" | "counter" | "debrief";

type SlashCommandResolution = {
  command: SlashCommandId | null;
  argument: string;
  prompt: string;
};

function parseSloProfile(value: unknown): SloProfile {
  if (value === "latency" || value === "quality" || value === "balanced") {
    return value;
  }
  return "balanced";
}

function sanitizeModelId(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) {
    return fallback;
  }

  const isSafe = /^[a-zA-Z0-9._\-/]+$/.test(trimmed);
  return isSafe ? trimmed : fallback;
}

function parseNeuralTier(value: unknown, freedomMode: UseChatRequest["freedomMode"]): NeuralTier {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (
    normalized === "STANDARD" ||
    normalized === "UNCENSORED" ||
    normalized === "OVERCLOCK" ||
    normalized === "HFT_SIGNAL" ||
    normalized === "GUITAR_LESSON"
  ) {
    return normalized;
  }

  return freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD";
}

function extractContentFromMessage(message: ChatMessage) {
  const direct = sanitizePlainText(String(message?.content || ""), 4_000);
  if (direct) return direct;

  if (!Array.isArray(message?.parts)) return "";
  const fromParts = message.parts
    .filter((part) => part?.type === "text" && typeof part?.text === "string")
    .map((part) => part.text?.trim() || "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return sanitizePlainText(fromParts, 4_000);
}

function normalizeConversation(messages: unknown) {
  if (!Array.isArray(messages)) {
    return [] as Array<{ role: ChatRole; content: string }>;
  }

  const allowedRoles = new Set<ChatRole>(["system", "user", "assistant"]);
  return messages
    .map((entry) => {
      const message = entry as ChatMessage;
      const role = (message?.role || "").toLowerCase() as ChatRole;
      if (!allowedRoles.has(role)) return null;
      const content = extractContentFromMessage(message);
      if (!content) return null;
      return { role, content };
    })
    .filter((entry): entry is { role: ChatRole; content: string } => Boolean(entry))
    .slice(-14);
}

function resolveLastUserPrompt(messages: Array<{ role: ChatRole; content: string }>) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === "user" && message.content) {
      return message.content;
    }
  }
  return "";
}

function resolveSlashCommandPrompt(input: string): SlashCommandResolution {
  const trimmed = sanitizePlainText(input, 4_000).trim();
  if (!trimmed.startsWith("/")) {
    return {
      command: null,
      argument: "",
      prompt: trimmed,
    };
  }

  const [rawCommand, ...rest] = trimmed.slice(1).split(" ");
  const command = sanitizePlainText(rawCommand, 40).toLowerCase();
  const argument = sanitizePlainText(rest.join(" "), 1_200).trim();

  if (command === "plan") {
    return {
      command: "plan",
      argument,
      prompt: `Create an execution plan with objective, milestones, timeline, risk controls, and one immediate next action.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  if (command === "risk") {
    return {
      command: "risk",
      argument,
      prompt: `Run a risk analysis with probabilities, downside impact, mitigation checklist, invalidation points, and capital preservation rules.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  if (command === "parabolic") {
    return {
      command: "parabolic",
      argument,
      prompt: `Build a high-momentum scenario map with bullish/base/bear cases, trigger levels, position sizing guardrails, and strict failure conditions.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  if (command === "odinsignal") {
    return {
      command: "odinsignal",
      argument,
      prompt: `Generate an ODIN signal brief with bias, confidence, catalyst stack, scenario probabilities, invalidation, and one actionable operator instruction.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  if (command === "sop") {
    return {
      command: "sop",
      argument,
      prompt: `Create a production-ready SOP with objective, prerequisites, step-by-step execution, monitoring checks, escalation path, and rollback criteria.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  if (command === "counter") {
    return {
      command: "counter",
      argument,
      prompt: `Challenge the current thesis with the strongest counter-argument set: invalidation evidence, alternate scenarios, asymmetric risks, and a decision threshold for rejecting the original plan.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  if (command === "debrief") {
    return {
      command: "debrief",
      argument,
      prompt: `Run a post-execution debrief with: what worked, what failed, root causes, process violations, risk-control adherence, and a revised execution protocol for the next iteration.${argument ? ` Context: ${argument}` : ""}`,
    };
  }

  return {
    command: null,
    argument,
    prompt: trimmed,
  };
}

function serializeContext(context: unknown) {
  if (typeof context === "string") {
    return sanitizePlainText(context, 2_200);
  }

  if (context && typeof context === "object") {
    try {
      return sanitizePlainText(JSON.stringify(context), 2_200);
    } catch {
      return "";
    }
  }

  return "";
}

function readRolloutPercent() {
  const parsed = Number.parseInt(String(process.env.TRADEHAX_USE_CHAT_ROLLOUT_PERCENT || "100"), 10);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(100, parsed));
}

function stablePercentFromKey(key: string) {
  const hex = crypto.createHash("sha256").update(key).digest("hex").slice(0, 8);
  const intValue = Number.parseInt(hex, 16);
  if (!Number.isFinite(intValue)) return 100;
  return intValue % 100;
}

function isStreamingLaneEnabledForUser(request: NextRequest, userId: string) {
  if (String(process.env.TRADEHAX_USE_CHAT_FORCE_ENABLED || "").toLowerCase() === "true") {
    return true;
  }

  const headerOptIn = (request.headers.get("x-tradehax-streaming-beta") || "").toLowerCase();
  if (headerOptIn === "1" || headerOptIn === "true" || headerOptIn === "on") {
    return true;
  }

  const rolloutPercent = readRolloutPercent();
  if (rolloutPercent >= 100) return true;
  if (rolloutPercent <= 0) return false;

  return stablePercentFromKey(userId) < rolloutPercent;
}

function buildIdempotencyScope(input: {
  userId: string;
  prompt: string;
  conversation: string;
  objective: string;
  tier: NeuralTier;
  model: string;
  presetId: string;
}) {
  const seed = [
    input.userId,
    input.prompt.slice(0, 500),
    input.conversation.slice(0, 1_500),
    input.objective.slice(0, 200),
    input.tier,
    input.model,
    input.presetId,
  ].join("|");

  return crypto.createHash("sha256").update(seed).digest("hex");
}

function getModelHealthStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_MODEL_HEALTH__?: Map<string, ModelHealthEntry>;
  };

  if (!globalRef.__TRADEHAX_MODEL_HEALTH__) {
    globalRef.__TRADEHAX_MODEL_HEALTH__ = new Map<string, ModelHealthEntry>();
  }

  return globalRef.__TRADEHAX_MODEL_HEALTH__;
}

function recordModelHealth(modelId: string, success: boolean, latencyMs: number) {
  const store = getModelHealthStore();
  const existing =
    store.get(modelId) ||
    ({
      successes: 0,
      failures: 0,
      totalLatencyMs: 0,
    } as ModelHealthEntry);

  if (success) {
    existing.successes += 1;
  } else {
    existing.failures += 1;
  }

  existing.totalLatencyMs += Math.max(1, Math.floor(latencyMs));
  store.set(modelId, existing);
}

function scoreModelHealth(modelId: string) {
  const entry = getModelHealthStore().get(modelId);
  if (!entry) return 0;

  const calls = entry.successes + entry.failures;
  const failureRate = calls > 0 ? entry.failures / calls : 0;
  const avgLatency = calls > 0 ? entry.totalLatencyMs / calls : 0;
  return failureRate * 100 + avgLatency / 220;
}

function parseFallbackModels() {
  const raw = String(process.env.TRADEHAX_STREAM_MODEL_FALLBACKS || "");
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
}

function modelLatencyHint(modelId: string) {
  const normalized = modelId.toLowerCase();
  let score = 0;

  if (/\b(70b|72b|65b|34b)\b/.test(normalized)) score += 22;
  if (/\b(13b|14b|15b)\b/.test(normalized)) score += 12;
  if (/\b(7b|8b)\b/.test(normalized)) score -= 3;
  if (/mini|small|flash|fast|turbo|schnell/.test(normalized)) score -= 8;

  return score;
}

function modelQualityHint(modelId: string) {
  const normalized = modelId.toLowerCase();
  let score = 0;

  if (/\b(70b|72b|65b|34b)\b/.test(normalized)) score -= 20;
  if (/\b(13b|14b|15b)\b/.test(normalized)) score -= 10;
  if (/\b(7b|8b)\b/.test(normalized)) score += 3;
  if (/instruct|chat/.test(normalized)) score -= 4;
  if (/mini|small|flash|fast/.test(normalized)) score += 7;

  return score;
}

function applySloPreset(profile: SloProfile, presetValues: { temperature: number; maxTokens: number; topP: number }) {
  if (profile === "latency") {
    return {
      temperature: Math.max(0.35, Math.min(0.65, presetValues.temperature * 0.85)),
      topP: Math.max(0.8, Math.min(0.9, presetValues.topP * 0.9)),
      maxTokens: Math.max(280, Math.min(520, Math.floor(presetValues.maxTokens * 0.55))),
      targetLatencyMs: 1800,
    };
  }

  if (profile === "quality") {
    return {
      temperature: Math.max(0.6, Math.min(0.85, presetValues.temperature * 1.05)),
      topP: Math.max(0.9, Math.min(0.98, presetValues.topP * 1.03)),
      maxTokens: Math.max(900, Math.min(1800, Math.floor(presetValues.maxTokens * 1.2))),
      targetLatencyMs: 5200,
    };
  }

  return {
    temperature: presetValues.temperature,
    topP: presetValues.topP,
    maxTokens: presetValues.maxTokens,
    targetLatencyMs: 3200,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rankModelCandidates(primaryModel: string, domainModel: string, sloProfile: SloProfile) {
  const ordered = [primaryModel, domainModel, ...parseFallbackModels()]
    .map((model) => sanitizeModelId(model, "Qwen/Qwen2.5-7B-Instruct"))
    .filter(Boolean);

  const seen = new Set<string>();
  const unique = ordered.filter((model) => {
    if (seen.has(model)) return false;
    seen.add(model);
    return true;
  });

  return unique.sort((a, b) => {
    const aLatencyBias = sloProfile === "latency" ? modelLatencyHint(a) : 0;
    const bLatencyBias = sloProfile === "latency" ? modelLatencyHint(b) : 0;
    const aQualityBias = sloProfile === "quality" ? modelQualityHint(a) : 0;
    const bQualityBias = sloProfile === "quality" ? modelQualityHint(b) : 0;

    const aScore = scoreModelHealth(a) + aLatencyBias + aQualityBias + (a === primaryModel ? -8 : 0);
    const bScore = scoreModelHealth(b) + bLatencyBias + bQualityBias + (b === primaryModel ? -8 : 0);
    return aScore - bScore;
  });
}

function prioritizeCandidatesWithHints(input: {
  candidates: string[];
  preferredModel: string | null;
  avoidModels: string[];
}) {
  const avoid = new Set(input.avoidModels || []);
  const filtered = input.candidates.filter((model) => !avoid.has(model));
  const safeCandidates = filtered.length > 0 ? filtered : input.candidates;

  if (!input.preferredModel || !safeCandidates.includes(input.preferredModel)) {
    return safeCandidates;
  }

  return [
    input.preferredModel,
    ...safeCandidates.filter((model) => model !== input.preferredModel),
  ];
}

function evaluateResponseQuality(text: string): QualitySummary {
  const normalized = text.toLowerCase();
  const lengthScore = Math.min(30, Math.floor(Math.max(0, text.trim().length) / 16));
  const actionable = (normalized.match(/\b(next|step|execute|review|risk|checklist|action)\b/g) || []).length;
  const uncertain = (normalized.match(/\b(maybe|possibly|uncertain|not sure|guess)\b/g) || []).length;
  const structureBoost = /\n- |\n\d+\.|checklist|objective/i.test(text) ? 12 : 0;

  const score = Math.max(
    0,
    Math.min(100, 32 + lengthScore + actionable * 6 + structureBoost - uncertain * 7),
  );

  if (score >= 86) return { score, classification: "elite" };
  if (score >= 70) return { score, classification: "strong" };
  if (score >= 52) return { score, classification: "moderate" };
  return { score, classification: "weak" };
}

async function runLegacyFallbackChat(args: {
  request: NextRequest;
  body: UseChatRequest;
  userPrompt: string;
  normalizedMessages: Array<{ role: ChatRole; content: string }>;
  userId: string;
  idempotencyKey: string;
}) {
  const payload = {
    message: args.userPrompt,
    messages: args.normalizedMessages,
    model: args.body.model,
    preset: args.body.preset,
    tier: args.body.tier || (args.body.freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD"),
    context:
      args.body.context && typeof args.body.context === "object" && !Array.isArray(args.body.context)
        ? {
            ...(args.body.context as Record<string, unknown>),
            objective: args.body.objective,
            responseStyle: args.body.responseStyle,
            fallbackSource: "use-chat-rollout",
          }
        : {
            objective: args.body.objective,
            responseStyle: args.body.responseStyle,
            fallbackSource: "use-chat-rollout",
          },
    userId: args.userId,
  };

  const response = await fetch(`${args.request.nextUrl.origin}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(args.idempotencyKey ? { "x-idempotency-key": args.idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    message?: { content?: string };
    response?: string;
  };

  if (!response.ok || !data?.ok) {
    return {
      ok: false as const,
      status: response.status || 500,
      error: data?.error || "Legacy fallback failed",
    };
  }

  const text =
    typeof data?.message?.content === "string"
      ? data.message.content
      : typeof data?.response === "string"
        ? data.response
        : "Legacy chat returned no content.";

  return {
    ok: true as const,
    text,
  };
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
    keyPrefix: "ai:use-chat",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as UseChatRequest;
    const userId = await resolveRequestUserId(request);
    const sloProfile = parseSloProfile(body.sloProfile);
    const normalizedMessages = normalizeConversation(body.messages);
    const rawUserPrompt = resolveLastUserPrompt(normalizedMessages);
    const slashResolution = resolveSlashCommandPrompt(rawUserPrompt);
    const userPrompt = slashResolution.prompt;

    if (!userPrompt) {
      return NextResponse.json(
        { ok: false, error: "A user message is required." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Cache lookup: check for cached response before expensive checks
    const cachedResponse = await cacheManager.lookup({
      userId,
      userPrompt,
      sloProfile,
      preset: body.preset || "default",
      freedomMode: body.freedomMode || "standard",
      objective: body.objective,
    });

    if (cachedResponse) {
      recordStreamTelemetry({
        userId,
        status: "cached",
        tier: body.tier || (body.freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD"),
        sloProfile,
        model: cachedResponse.model,
        preset: body.preset || "default",
        qualityScore: cachedResponse.qualityScore,
        qualityClass: cachedResponse.qualityClassification,
        responseLatencyMs: Math.max(1, Date.now() - cachedResponse.createdAt),
        cached: true,
      });

      // Fast-path: return cached response instantly
      const cachedStream = createUIMessageStream({
        originalMessages: Array.isArray(body.messages) ? (body.messages as UIMessage[]) : undefined,
        execute: async ({ writer }) => {
          const textPartId = `text-${Date.now()}`;
          writer.write({
            type: "data-status",
            data: {
              status: "cached",
              model: cachedResponse.model,
              cached: true,
              cachedAt: new Date(cachedResponse.createdAt).toISOString(),
            },
            transient: true,
          });

          writer.write({ type: "text-start", id: textPartId });
          writer.write({
            type: "text-delta",
            id: textPartId,
            delta: cachedResponse.responseText,
          });
          writer.write({ type: "text-end", id: textPartId });
          writer.write({
            type: "data-status",
            data: {
              status: "cached-complete",
              model: cachedResponse.model,
              quality: cachedResponse.qualityClassification,
              cached: true,
            },
            transient: true,
          });
        },
      });

      return createUIMessageStreamResponse({
        stream: cachedStream,
        headers: {
          ...rateLimit.headers,
          "X-Cache": "HIT",
          "X-Cache-Age": String(Math.floor((Date.now() - cachedResponse.createdAt) / 1000)),
        },
      });
    }

    if (!isStreamingLaneEnabledForUser(request, userId)) {
      const normalizedMessagesText = normalizedMessages
        .map((msg) => `${msg.role}:${msg.content}`)
        .join("\n")
        .slice(0, 1_200);
      const fallbackScope = crypto
        .createHash("sha256")
        .update(`${userId}|rollout-fallback|${userPrompt}|${normalizedMessagesText}`)
        .digest("hex");
      const fallbackKey =
        typeof body.idempotencyKey === "string" && body.idempotencyKey.trim().length > 0
          ? body.idempotencyKey
          : request.headers.get("x-idempotency-key") || fallbackScope.slice(0, 24);

      const legacy = await runLegacyFallbackChat({
        request,
        body,
        userPrompt,
        normalizedMessages,
        userId,
        idempotencyKey: fallbackKey,
      });

      if (!legacy.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "STREAMING_BETA_NOT_ENABLED",
            message:
              "Streaming lane is rolling out in stages and automatic fallback is currently unavailable.",
            fallbackRoute: "/api/ai/chat",
            fallbackError: legacy.error,
          },
          { status: 409, headers: rateLimit.headers },
        );
      }

      const quality = evaluateResponseQuality(legacy.text);
      const fallbackStream = createUIMessageStream({
        originalMessages: Array.isArray(body.messages) ? (body.messages as UIMessage[]) : undefined,
        execute: async ({ writer }) => {
          const fallbackStartedAt = Date.now();
          const textPartId = `text-${Date.now()}`;
          writer.write({
            type: "data-status",
            data: {
              status: "fallback-streaming",
              provider: "legacy-chat",
              quality,
            },
            transient: true,
          });

          writer.write({ type: "text-start", id: textPartId });
          writer.write({
            type: "text-delta",
            id: textPartId,
            delta: legacy.text,
          });
          writer.write({ type: "text-end", id: textPartId });

          recordStreamTelemetry({
            userId,
            status: "fallback-complete",
            tier: body.tier || (body.freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD"),
            sloProfile,
            model: "legacy-chat",
            preset: body.preset || "default",
            qualityScore: quality.score,
            qualityClass: quality.classification,
            responseLatencyMs: Date.now() - fallbackStartedAt,
            cached: false,
          });

          writer.write({
            type: "data-status",
            data: {
              status: "fallback-complete",
              provider: "legacy-chat",
              quality,
            },
            transient: true,
          });
        },
      });

      return createUIMessageStreamResponse({
        stream: fallbackStream,
        headers: {
          ...rateLimit.headers,
        },
      });
    }

    const neuralTier = parseNeuralTier(body.tier, body.freedomMode);

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

    const hasCredits = await checkCredits(userId, neuralTier);
    if (!hasCredits) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_CREDITS",
          message: "You do not have enough AI credits for this request.",
          credits: await getCreditSnapshot(userId),
        },
        { status: 402, headers: rateLimit.headers },
      );
    }

    const domainSignal = inferPredictionDomain(userPrompt, body.context);
    const preset = resolveLlmPreset({
      inputMessage: userPrompt,
      context: body.context,
      requestedPreset: body.preset,
      tier: neuralTier,
    });

    const selectedModel = sanitizeModelId(
      body.model || preset.modelId || resolvePredictionModel(domainSignal.domain),
      "Qwen/Qwen2.5-7B-Instruct",
    );

    const retrievalChunks = await retrieveRelevantContext(userPrompt, 4);
    const retrievalContext = formatRetrievalContext(retrievalChunks);
    const liveMarket = await buildLiveMarketContext({
      inputMessage: userPrompt,
      context: body.context,
      domain: domainSignal.domain,
    });

    const odinProfile = resolveOdinRuntimeProfile({
      request,
      requestedProfile:
        body.context && typeof body.context === "object" && !Array.isArray(body.context)
          ? (body.context as Record<string, unknown>).odinProfile
          : undefined,
    });

    const tunedPreset = applyOdinChatTuning(odinProfile, {
      temperature: preset.temperature,
      maxTokens: preset.maxTokens,
      topP: preset.topP,
    });

    const personalizedContext = await resolvePersonalizedIntelligenceContext({
      userId,
      domain: domainSignal.domain,
      requestedSlo: sloProfile,
    });

    const complexityPlan = resolveComplexProblemPlan({
      prompt: userPrompt,
      objective: body.objective,
      contextText: serializeContext(body.context),
      conversationDepth: normalizedMessages.length,
      requestedSloProfile: personalizedContext?.tuningHints.preferredSloProfile || sloProfile,
      personalizedContext,
    });

    const initialTrajectorySnapshot = await getPersonalizedTrajectorySnapshot({
      userId,
      horizonHours: 72,
    }).catch(() => null);

    const accuracyPlan = resolveAccuracyGovernorPlan({
      domain: domainSignal.domain,
      requestedSloProfile:
        complexityPlan?.suggestedSloProfile || personalizedContext?.tuningHints.preferredSloProfile || sloProfile,
      prompt: userPrompt,
      objective: body.objective,
      complexityPlan,
      personalizedContext,
      trajectorySnapshot: initialTrajectorySnapshot,
    });

    const verifierPlan = resolveAdversarialVerifierPlan({
      domain: domainSignal.domain,
      prompt: userPrompt,
      objective: body.objective,
      complexityPlan,
      accuracyPlan,
    });

    const requestedAdaptiveSlo =
      accuracyPlan?.suggestedSloProfile
      || complexityPlan?.suggestedSloProfile
      || personalizedContext?.tuningHints.preferredSloProfile
      || sloProfile;

    const hintSeedCandidates = rankModelCandidates(
      selectedModel,
      sanitizeModelId(resolvePredictionModel(domainSignal.domain), selectedModel),
      sloProfile,
    );

    const routingHints = await getAdaptiveRoutingHints({
      domain: domainSignal.domain,
      candidateModels: hintSeedCandidates,
      horizonMinutes: 360,
    });

    const adaptiveTuning = resolveAdaptiveInferenceTuning({
      domain: domainSignal.domain,
      presetId: preset.id,
      sloProfile: requestedAdaptiveSlo,
      routingHints,
    });

    const effectiveSloProfile = adaptiveTuning.effectiveSloProfile as SloProfile;
    const tunedSloBase = applySloPreset(effectiveSloProfile, tunedPreset);
    const tunedSlo = {
      temperature: clamp(
        tunedSloBase.temperature
          * adaptiveTuning.temperatureMultiplier
          * (personalizedContext?.tuningHints.temperatureMultiplier || 1)
          * (complexityPlan?.temperatureMultiplier || 1)
          * (accuracyPlan?.temperatureMultiplier || 1),
        0,
        2,
      ),
      topP: clamp(
        tunedSloBase.topP
          * adaptiveTuning.topPMultiplier
          * (personalizedContext?.tuningHints.topPMultiplier || 1)
          * (complexityPlan?.topPMultiplier || 1)
          * (accuracyPlan?.topPMultiplier || 1),
        0.1,
        1,
      ),
      maxTokens: Math.round(
        clamp(
          tunedSloBase.maxTokens
            * adaptiveTuning.tokenMultiplier
            * (personalizedContext?.tuningHints.tokenMultiplier || 1)
            * (complexityPlan?.tokenMultiplier || 1)
            * (accuracyPlan?.tokenMultiplier || 1),
          128,
          4096,
        ),
      ),
      targetLatencyMs: tunedSloBase.targetLatencyMs,
    };

    const resolvedStyle =
      body.responseStyle === "concise" || body.responseStyle === "operator" || body.responseStyle === "coach"
        ? body.responseStyle
        : (accuracyPlan?.styleBias || complexityPlan?.styleBias || personalizedContext?.tuningHints.styleBias || preset.responseStyle);

    const objective = sanitizePlainText(body.objective || "", 200);
    const conversationSignature = normalizedMessages
      .map((msg) => `${msg.role}:${msg.content}`)
      .join("\n")
      .slice(0, 1_500);

    const promptLines = [
      `System:\n${buildTradeHaxSystemPrompt({
        openMode: body.freedomMode === "uncensored",
        audienceTier: "learner",
        guardrailMode: "strict_ip",
      })}`,
    ];

    if (resolvedStyle === "concise") {
      promptLines.push("Style directive:\nRespond in concise bullets. Keep under 120 words unless detail is requested.");
    } else if (resolvedStyle === "operator") {
      promptLines.push(
        "Style directive:\nRespond with an execution checklist: objective, steps, risks, and one explicit next action.",
      );
    } else {
      promptLines.push(
        "Style directive:\nRespond in coaching tone with clear reasoning and close with one recommended next action.",
      );
    }

    promptLines.push(
      `Domain directive:\nPrimary domain is ${domainSignal.domain} (confidence ${domainSignal.confidence}%). Keep assumptions explicit.`,
    );

    if (objective) {
      promptLines.push(`Objective:\n${objective}`);
    }

    const contextText = serializeContext(body.context);
    if (contextText) {
      promptLines.push(`Provided context:\n${contextText}`);
    }

    if (retrievalContext) {
      promptLines.push(`Retrieved context:\n${retrievalContext}`);
    }

    if (liveMarket.enabled && liveMarket.summary) {
      promptLines.push(`Live market context:\n${liveMarket.summary}`);
    }

    const personalizedDirective = buildPersonalizedDirective(personalizedContext);
    if (personalizedDirective) {
      promptLines.push(personalizedDirective);
    }

    if (complexityPlan) {
      promptLines.push(
        `Complexity directive:\n${complexityPlan.directives.join(" ")}\nMode=${complexityPlan.mode}; Score=${complexityPlan.complexityScore}; StepBudget=${complexityPlan.stepBudget}.`,
      );
    }

    if (accuracyPlan) {
      promptLines.push(`Accuracy directive:\n${accuracyPlan.directives.join(" ")}\nStrictness=${accuracyPlan.strictness}.`);
    }

    for (const msg of normalizedMessages) {
      promptLines.push(`${msg.role}: ${msg.content}`);
    }
    promptLines.push("assistant:");

    const prompt = promptLines.join("\n\n");

    const scope = buildIdempotencyScope({
      userId,
      prompt: userPrompt,
      conversation: conversationSignature,
      objective,
      tier: neuralTier,
      model: selectedModel,
      presetId: preset.id,
    });

    const idempotencyKey =
      typeof body.idempotencyKey === "string" && body.idempotencyKey.trim().length > 0
        ? body.idempotencyKey
        : request.headers.get("x-idempotency-key") || scope.slice(0, 24);

    const usageCommit = tryConsumeFeatureUsageSecure(userId, "ai_chat", 1, {
      source: "api:ai:use-chat",
      metadata: {
        tier: neuralTier,
      },
      idempotencyKey,
      idempotencyScope: scope,
    });

    if (!usageCommit.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "USAGE_LIMIT_REACHED",
          message: usageCommit.allowance.reason,
          allowance: usageCommit.allowance,
        },
        { status: 429, headers: rateLimit.headers },
      );
    }

    let debitCost = 0;
    let debitRemaining = 0;

    if (!usageCommit.replayed) {
      const debit = await deductCredits(userId, neuralTier);
      if (!debit.success) {
        return NextResponse.json(
          {
            ok: false,
            error: "INSUFFICIENT_CREDITS",
            message: "Credits were depleted before this response could be finalized.",
            credits: await getCreditSnapshot(userId),
          },
          { status: 402, headers: rateLimit.headers },
        );
      }
      debitCost = debit.cost;
      debitRemaining = debit.remaining;
    } else {
      const snapshot = await getCreditSnapshot(userId);
      debitRemaining = snapshot.balance;
    }

    const modelCandidatesRaw = rankModelCandidates(
      selectedModel,
      sanitizeModelId(resolvePredictionModel(domainSignal.domain), selectedModel),
      sloProfile,
    );

    const modelCandidates = prioritizeCandidatesWithHints({
      candidates: modelCandidatesRaw,
      preferredModel: routingHints.preferredModel,
      avoidModels: routingHints.avoidModels,
    });

    const stream = createUIMessageStream({
      originalMessages: Array.isArray(body.messages) ? (body.messages as UIMessage[]) : undefined,
      execute: async ({ writer }) => {
        const startedAt = Date.now();
        const textPartId = `text-${Date.now()}`;
        let effectiveModel = selectedModel;
        let assistantText = "";
        let emittedAnyToken = false;
        const failedModels: string[] = [];
        const latencyBudgetThresholdMs = Math.max(850, Math.floor(tunedSlo.targetLatencyMs * 0.7));
        let sloFallbackTriggered = false;
        let sloFallbackFromModel = "";
        let sloFallbackToModel = "";

        writer.write({
          type: "data-status",
          data: {
            status: "streaming",
            userId,
            model: effectiveModel,
            slashCommand: slashResolution.command,
            preset: preset.id,
            sloProfile,
            effectiveSloProfile,
            sloTargetLatencyMs: tunedSlo.targetLatencyMs,
            sloMaxTokens: tunedSlo.maxTokens,
            adaptiveTuning,
            routingHints,
            personalizedContext,
            complexityPlan,
            accuracyPlan,
            verifierPlan,
            tier: neuralTier,
            policyMode: body.freedomMode === "uncensored" ? "open-lawful" : "standard",
            lawfulOnly: true,
            predictionDomain: domainSignal.domain,
            predictionConfidence: domainSignal.confidence,
            candidateModels: modelCandidates,
            usage: {
              remainingToday: usageCommit.allowance.remainingToday,
              remainingThisWeek: usageCommit.allowance.remainingThisWeek ?? null,
              replayed: usageCommit.replayed,
            },
            credits: {
              spent: debitCost,
              remaining: debitRemaining,
            },
            cached: false,
          },
          transient: true,
        });

        writer.write({
          type: "text-start",
          id: textPartId,
        });

        for (const candidateModel of modelCandidates) {
          const attemptStartedAt = Date.now();
          let candidateTokenCount = 0;
          let candidateExceededLatencyBudget = false;
          try {
            const client = getLLMClient({ modelId: candidateModel });
            if (candidateModel !== effectiveModel) {
              writer.write({
                type: "data-status",
                data: {
                  status: "model-switch",
                  from: effectiveModel,
                  to: candidateModel,
                },
                transient: true,
              });
            }

            for await (const chunk of client.generateStream(prompt, {
              modelId: candidateModel,
              temperature: tunedSlo.temperature,
              maxTokens: tunedSlo.maxTokens,
              topP: tunedSlo.topP,
            })) {
              candidateTokenCount += 1;
              const elapsed = Date.now() - attemptStartedAt;

              if (
                sloProfile === "latency" &&
                elapsed > latencyBudgetThresholdMs &&
                candidateTokenCount < 2 &&
                modelCandidates.length > 1
              ) {
                candidateExceededLatencyBudget = true;
                break;
              }

              emittedAnyToken = true;
              assistantText += chunk;
              writer.write({
                type: "text-delta",
                id: textPartId,
                delta: chunk,
              });
            }

            if (candidateExceededLatencyBudget) {
              recordModelHealth(candidateModel, false, Date.now() - attemptStartedAt);
              failedModels.push(candidateModel);

              const fallbackModel = modelCandidates.find((model) => model !== candidateModel && !failedModels.includes(model));
              if (fallbackModel) {
                sloFallbackTriggered = true;
                sloFallbackFromModel = candidateModel;
                sloFallbackToModel = fallbackModel;
                effectiveModel = fallbackModel;
                writer.write({
                  type: "data-status",
                  data: {
                    status: "slo-fallback",
                    reason: "latency-budget-exceeded",
                    thresholdMs: latencyBudgetThresholdMs,
                    elapsedMs: Date.now() - attemptStartedAt,
                    fromModel: candidateModel,
                    toModel: fallbackModel,
                  },
                  transient: true,
                });
              }

              continue;
            }

            effectiveModel = candidateModel;
            recordModelHealth(candidateModel, true, Date.now() - attemptStartedAt);
            break;
          } catch {
            recordModelHealth(candidateModel, false, Date.now() - attemptStartedAt);
            failedModels.push(candidateModel);
            if (emittedAnyToken) {
              writer.write({
                type: "text-delta",
                id: textPartId,
                delta: "\n\n[Notice] Stream degraded near completion. Partial response preserved.",
              });
              break;
            }
          }
        }

        if (!emittedAnyToken) {
          const kernelTier: NeuralQuery["tier"] =
            neuralTier === "UNCENSORED" || neuralTier === "OVERCLOCK"
              ? neuralTier
              : "STANDARD";
          const kernelQuery: NeuralQuery = {
            text: userPrompt,
            tier: kernelTier,
            context:
              body.context && typeof body.context === "object" && !Array.isArray(body.context)
                ? (body.context as NeuralQuery["context"])
                : undefined,
          };
          const kernelFallback = await processNeuralCommand(kernelQuery);
          assistantText = kernelFallback;
          effectiveModel = "kernel-fallback";
          writer.write({
            type: "text-delta",
            id: textPartId,
            delta: kernelFallback,
          });
        }

        const verifierResult = verifyResponseAdversarially({
          plan: verifierPlan,
          prompt: userPrompt,
          objective: body.objective,
          response: assistantText,
        });

        if (verifierResult?.appendix) {
          const appendixText = `\n\n${verifierResult.appendix}`;
          assistantText += appendixText;
          writer.write({
            type: "text-delta",
            id: textPartId,
            delta: appendixText,
          });
        }

        const quality = evaluateResponseQuality(assistantText);
        const responseLatencyMs = Date.now() - startedAt;

        recordComplexProblemPlannerEvent({
          plan: complexityPlan,
          qualityScore: quality.score,
          latencyMs: responseLatencyMs,
        });

        const adjustedPredictionConfidence = applyAccuracyConfidenceAdjustment(
          domainSignal.confidence,
          accuracyPlan,
        );

        recordAccuracyGovernorEvent({
          plan: accuracyPlan,
          qualityScore: quality.score,
          latencyMs: responseLatencyMs,
          adjustedConfidence: adjustedPredictionConfidence,
        });

        recordAdversarialVerifierEvent({
          plan: verifierPlan,
          result: verifierResult,
        });

        recordPredictionTelemetry({
          domain: domainSignal.domain,
          model: effectiveModel,
          confidence: adjustedPredictionConfidence,
          provider: effectiveModel === "kernel-fallback" ? "kernel" : "huggingface",
          fallback: failedModels.length > 0 || !modelCandidates.includes(effectiveModel),
        });

        await recordAdaptiveRoutingOutcome({
          domain: domainSignal.domain,
          model: effectiveModel,
          sloProfile,
          effectiveSloProfile,
          latencyMs: responseLatencyMs,
          qualityScore: quality.score,
          fallbackTriggered: sloFallbackTriggered || failedModels.length > 0,
          trafficPressure: adaptiveTuning.trafficPressure,
          benchmarkMaturity: adaptiveTuning.benchmarkMaturity,
        }).catch(() => {
          // Non-blocking: adaptive memory persistence should never fail user responses.
        });

        await recordPersonalizedTrajectoryEvent({
          userId,
          domain: domainSignal.domain,
          model: effectiveModel,
          sloProfile,
          effectiveSloProfile,
          latencyMs: responseLatencyMs,
          qualityScore: quality.score,
          fallbackTriggered: sloFallbackTriggered || failedModels.length > 0,
          profileWinRate: personalizedContext?.profile.winRate,
          profileAvgPnlPercent: personalizedContext?.profile.avgPnlPercent,
          profileConfidenceAvg: personalizedContext?.profile.confidenceAvg,
          benchmarkMaturity: adaptiveTuning.benchmarkMaturity,
        }).catch(() => {
          // Non-blocking: trajectory memory persistence should never fail user responses.
        });

        const trajectorySnapshot = await getPersonalizedTrajectorySnapshot({
          userId,
          horizonHours: 72,
        }).catch(() => null);

        const shouldQueueRetrainExport =
          Boolean(trajectorySnapshot?.retrain.shouldTrigger)
          && (verifierResult?.riskLevel === "high" || verifierResult?.riskLevel === "critical");

        const retrainQueueResult = shouldQueueRetrainExport
          ? await enqueueRetrainExportCandidate({
              userId,
              domain: domainSignal.domain,
              model: effectiveModel,
              sloProfile,
              effectiveSloProfile,
              qualityScore: quality.score,
              verifierScore: verifierResult?.score,
              verifierRisk: verifierResult?.riskLevel,
              retrainLevel: trajectorySnapshot?.retrain.level,
              reasons: [
                ...(trajectorySnapshot?.retrain.reasons || []),
                ...(verifierResult?.flags || []),
              ].filter(Boolean),
              promptSnippet: userPrompt,
              responseSnippet: assistantText,
            }).catch(() => ({
              queued: false,
              reason: "queue_error",
              mode: "memory" as const,
            }))
          : {
              queued: false,
              reason: "threshold_not_met",
              mode: "memory" as const,
            };

        // Store response in cache after streaming completes
        await cacheManager
          .store({
            userId,
            userPrompt,
            sloProfile,
            preset: body.preset || preset.id || "default",
            freedomMode: body.freedomMode || "standard",
            objective: body.objective,
            tier: neuralTier,
            response: {
              responseText: assistantText,
              model: effectiveModel,
              qualityScore: quality.score,
              qualityClassification: quality.classification,
              tokensUsed: assistantText.split(/\s+/).length,
            },
          })
          .catch(() => {
            // Silent fail on cache storage errors; don't block response
          });

        recordStreamTelemetry({
          userId,
          status: "complete",
          tier: neuralTier,
          sloProfile,
          model: effectiveModel,
          preset: preset.id,
          predictionDomain: domainSignal.domain,
          predictionConfidence: domainSignal.confidence,
          qualityScore: quality.score,
          qualityClass: quality.classification,
          responseLatencyMs,
          cached: false,
          sloFallbackTriggered,
          sloFallbackFromModel: sloFallbackFromModel || undefined,
          sloFallbackToModel: sloFallbackToModel || undefined,
          failedModels,
          creditsSpent: debitCost,
          creditsRemaining: debitRemaining,
        });

        writer.write({
          type: "text-end",
          id: textPartId,
        });

        writer.write({
          type: "data-status",
          data: {
            status: "complete",
            userId,
            model: effectiveModel,
            slashCommand: slashResolution.command,
            preset: preset.id,
            sloProfile,
            effectiveSloProfile,
            sloTargetLatencyMs: tunedSlo.targetLatencyMs,
            sloMaxTokens: tunedSlo.maxTokens,
            adaptiveTuning,
            routingHints,
            personalizedContext,
            trajectorySnapshot,
            complexityPlan,
            accuracyPlan,
            verifierPlan,
            verifierResult,
            retrainQueueResult,
            tier: neuralTier,
            policyMode: body.freedomMode === "uncensored" ? "open-lawful" : "standard",
            lawfulOnly: true,
            predictionDomain: domainSignal.domain,
            predictionConfidence: applyAccuracyConfidenceAdjustment(domainSignal.confidence, accuracyPlan),
            marketFreshnessEnabled: liveMarket.enabled,
            failedModels,
            quality,
            cached: false,
            sloFallbackTriggered,
            sloFallbackFromModel: sloFallbackFromModel || undefined,
            sloFallbackToModel: sloFallbackToModel || undefined,
            responseLatencyMs,
            usage: {
              remainingToday: usageCommit.allowance.remainingToday,
              remainingThisWeek: usageCommit.allowance.remainingThisWeek ?? null,
              replayed: usageCommit.replayed,
            },
            credits: {
              spent: debitCost,
              remaining: debitRemaining,
            },
          },
          transient: true,
        });
      },
    });

    return createUIMessageStreamResponse({
      stream,
      headers: {
        ...rateLimit.headers,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Streaming request failed",
      },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
