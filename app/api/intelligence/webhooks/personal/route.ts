import { requireAdminAccessWithSession } from "@/lib/admin-access";
import { getOwnerUserId } from "@/lib/admin-config";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { recordTradingOutcome } from "@/lib/ai/trading-personalization";
import { markPersonalWebhookIngestion } from "@/lib/intelligence/personal-assistant-vault";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { enforceRateLimit, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

type IncomingEvent = {
  category?: "INTELLIGENCE" | "MARKET" | "BEHAVIOR" | "NAVIGATION" | "DISCORD" | "IMAGE";
  prompt?: string;
  response?: string;
  training?: boolean;
  analytics?: boolean;
  metadata?: Record<string, unknown>;
};

type IncomingTradeOutcome = {
  symbol?: string;
  regime?: "bull" | "bear" | "sideways" | "volatile" | "macro_shock";
  side?: "long" | "short";
  pnlPercent?: number;
  confidence?: number;
  indicatorsUsed?: Array<"rsi" | "volume" | "bollinger_bands" | "macd" | "vwap" | "moon_cycles">;
  notes?: string;
};

function getWebhookSecret() {
  return String(process.env.TRADEHAX_PERSONAL_WEBHOOK_SECRET || "").trim();
}

function parseSignature(headerValue: string | null) {
  if (!headerValue) return "";
  const cleaned = headerValue.trim();
  if (cleaned.startsWith("sha256=")) {
    return cleaned.slice("sha256=".length);
  }
  return cleaned;
}

function verifyWebhookSignature(input: {
  body: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const expected = crypto
    .createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.body}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isFreshTimestamp(timestamp: string) {
  const parsed = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(parsed)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - parsed) <= 300;
}

export async function POST(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:webhooks:personal",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const rawBody = await request.text();
  const signature = parseSignature(request.headers.get("x-tradehax-signature"));
  const timestamp = String(request.headers.get("x-tradehax-timestamp") || "").trim();
  const secret = getWebhookSecret();

  let authMode = "webhook_signature";
  let isAuthorized = false;

  if (secret && signature && timestamp && isFreshTimestamp(timestamp)) {
    isAuthorized = verifyWebhookSignature({
      body: rawBody,
      timestamp,
      signature,
      secret,
    });
  }

  if (!isAuthorized) {
    const adminGate = await requireAdminAccessWithSession(request, rateLimit.headers);
    if (!adminGate.response) {
      isAuthorized = true;
      authMode = adminGate.access.mode || "session_admin";
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized webhook payload.",
      },
      {
        status: 403,
        headers: rateLimit.headers,
      },
    );
  }

  let payload: {
    source?: string;
    events?: IncomingEvent[];
    tradeOutcomes?: IncomingTradeOutcome[];
  };

  try {
    payload = JSON.parse(rawBody) as {
      source?: string;
      events?: IncomingEvent[];
      tradeOutcomes?: IncomingTradeOutcome[];
    };
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON payload.",
      },
      {
        status: 400,
        headers: rateLimit.headers,
      },
    );
  }

  const source = sanitizePlainText(String(payload.source || "external"), 60) || "external";
  const userId = await resolveRequestUserId(request, getOwnerUserId());

  const events = Array.isArray(payload.events) ? payload.events.slice(0, 200) : [];
  const outcomes = Array.isArray(payload.tradeOutcomes) ? payload.tradeOutcomes.slice(0, 120) : [];

  let accepted = 0;

  for (const event of events) {
    const prompt = sanitizePlainText(String(event.prompt || ""), 800);
    const response = sanitizePlainText(String(event.response || ""), 1_200);
    if (!prompt && !response) continue;

    const result = await ingestBehavior({
      timestamp: new Date().toISOString(),
      category:
        event.category === "MARKET" ||
        event.category === "BEHAVIOR" ||
        event.category === "NAVIGATION" ||
        event.category === "DISCORD" ||
        event.category === "IMAGE"
          ? event.category
          : "INTELLIGENCE",
      source: "intelligence",
      userId,
      prompt: prompt || `WEBHOOK_EVENT ${source}`,
      response: response || "event_ingested",
      metadata: {
        route: "/api/intelligence/webhooks/personal",
        source,
        auth_mode: authMode,
        ...(event.metadata || {}),
      },
      consent: {
        analytics: event.analytics !== false,
        training: event.training === true,
      },
    });

    if (result.accepted) {
      accepted += 1;
    }
  }

  let outcomesAccepted = 0;

  for (const outcome of outcomes) {
    const symbol = sanitizePlainText(String(outcome.symbol || ""), 16).toUpperCase();
    if (!symbol) continue;

    const pnl = Number(outcome.pnlPercent ?? 0);
    const confidence = Number(outcome.confidence ?? 0.5);

    recordTradingOutcome({
      userId,
      symbol,
      regime: outcome.regime || "sideways",
      side: outcome.side === "short" ? "short" : "long",
      pnlPercent: Number.isFinite(pnl) ? pnl : 0,
      confidence: Number.isFinite(confidence) ? confidence : 0.5,
      indicatorsUsed: Array.isArray(outcome.indicatorsUsed) ? outcome.indicatorsUsed : [],
      notes: outcome.notes,
    });

    outcomesAccepted += 1;
  }

  await markPersonalWebhookIngestion(userId, source, accepted + outcomesAccepted);

  return NextResponse.json(
    {
      ok: true,
      authMode,
      source,
      userId,
      acceptedEvents: accepted,
      acceptedOutcomes: outcomesAccepted,
    },
    {
      headers: rateLimit.headers,
    },
  );
}
