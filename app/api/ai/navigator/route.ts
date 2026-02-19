import { resolveServerConsent } from "@/lib/ai/consent-server";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { getLLMClient } from "@/lib/ai/hf-server";
import { interpretNavigationIntent } from "@/lib/ai/site-intent";
import { buildSiteMapContext } from "@/lib/ai/site-map";
import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type NavigatorRequestBody = {
  message?: string;
  sessionId?: string;
  userId?: string;
  currentPath?: string;
  consent?: {
    analytics?: boolean;
    training?: boolean;
  };
};

function buildFallbackResponse(args: {
  message: string;
  intent: string;
  suggestions: Array<{ title: string; path: string; reason: string }>;
}) {
  const topSuggestions = args.suggestions.slice(0, 3);
  if (topSuggestions.length === 0) {
    return "I can help you navigate TradeHax. Try asking for AI tools, trading intelligence, billing, services, or games.";
  }

  const bullets = topSuggestions
    .map((item, index) => `${index + 1}. ${item.title} (${item.path}) — ${item.reason}`)
    .join("\n");

  return `I read your request as: ${args.intent}.\n\nBest places to go next:\n${bullets}\n\nIf you want, I can give a step-by-step path based on your goal.`;
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:navigator",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as NavigatorRequestBody;
    const message = sanitizePlainText(String(body.message || ""), 1200);
    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Message is required.",
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    const intent = interpretNavigationIntent(message);
    const userId = sanitizePlainText(String(body.userId || body.sessionId || "anonymous"), 128).toLowerCase() || "anonymous";
    const siteMapContext = buildSiteMapContext(14);

    const prompt = [
      "You are the TradeHax Site Navigator assistant.",
      "Goal: Help new users navigate the site quickly with clear, concise steps.",
      "Rules:",
      "- Recommend 2 to 4 routes max.",
      "- Include exact route paths (e.g., /ai-hub).",
      "- Keep response under 180 words.",
      "- Mention one suggested next action.",
      "- If unsure, default to /, /ai-hub, /pricing.",
      "",
      `Detected intent: ${intent.intent}`,
      `User message: ${message}`,
      "",
      "Top route candidates:",
      intent.suggestions
        .slice(0, 4)
        .map((item) => `- ${item.title} (${item.path}): ${item.reason}`)
        .join("\n"),
      "",
      "Site map context:",
      siteMapContext,
      "",
      "Return a practical user-facing answer.",
    ].join("\n");

    let response = "";
    try {
      const llmClient = getLLMClient();
      const generated = await llmClient.generate(prompt);
      response = sanitizePlainText(generated.text || "", 2400);
    } catch {
      response = "";
    }

    if (!response) {
      response = buildFallbackResponse({
        message,
        intent: intent.intent,
        suggestions: intent.suggestions,
      });
    }

    try {
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: "BEHAVIOR",
        source: "ai_navigator",
        userId,
        prompt: message,
        response,
        metadata: {
          route: "/api/ai/navigator",
          current_path: sanitizePlainText(String(body.currentPath || ""), 180),
          intent: intent.intent,
          suggestions: intent.suggestions.length,
        },
        consent: await resolveServerConsent(userId, body.consent),
      });
    } catch (error) {
      console.warn("navigator ingestion skipped", error);
    }

    return NextResponse.json(
      {
        ok: true,
        response,
        intent: intent.intent,
        suggestions: intent.suggestions,
        timestamp: new Date().toISOString(),
      },
      {
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    console.error("navigator error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Navigator request failed.",
      },
      {
        status: 500,
      },
    );
  }
}
