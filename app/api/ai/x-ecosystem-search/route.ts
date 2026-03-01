import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type XSearchResult = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  url?: string;
  score?: number;
};

function sanitizeLimit(raw: string | null) {
  const parsed = Number.parseInt(raw || "6", 10);
  if (!Number.isFinite(parsed)) return 6;
  return Math.max(1, Math.min(parsed, 20));
}

function fallbackResults(query: string, limit: number): XSearchResult[] {
  const now = new Date().toISOString();
  return [
    {
      id: "fallback-1",
      author: "@market_dynasty",
      text: `Live narrative pulse for \"${query}\": momentum discussion is rising with mixed sentiment and tighter risk framing.`,
      createdAt: now,
      score: 0.79,
    },
    {
      id: "fallback-2",
      author: "@quant_signal_ops",
      text: "Community thread highlights higher volatility windows and preference for disciplined entry criteria.",
      createdAt: now,
      score: 0.73,
    },
    {
      id: "fallback-3",
      author: "@alpha_watchfeed",
      text: "Operator boards are prioritizing liquidity confirmation over early conviction trades this cycle.",
      createdAt: now,
      score: 0.7,
    },
  ].slice(0, limit);
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:x-search",
    max: 80,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const query = sanitizePlainText(request.nextUrl.searchParams.get("q") || "", 180);
  const limit = sanitizeLimit(request.nextUrl.searchParams.get("limit"));

  if (!query || query.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Query must be at least 2 characters." },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const endpoint = process.env.X_SEARCH_API_URL?.trim();
  const apiKey = process.env.X_SEARCH_API_KEY?.trim();

  if (!endpoint) {
    return NextResponse.json(
      {
        ok: true,
        provider: "fallback",
        results: fallbackResults(query, limit),
        generatedAt: new Date().toISOString(),
      },
      { headers: rateLimit.headers },
    );
  }

  try {
    const target = new URL(endpoint);
    target.searchParams.set("q", query);
    target.searchParams.set("limit", String(limit));

    const response = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || "x_ecosystem_search_failed",
        },
        { status: response.status, headers: rateLimit.headers },
      );
    }

    const rawResults = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.items)
        ? data.items
        : [];

    const results = rawResults
      .map((item: any, index: number): XSearchResult => {
        const text =
          typeof item?.text === "string"
            ? item.text
            : typeof item?.content === "string"
              ? item.content
              : "";
        return {
          id: String(item?.id || `result-${index}`),
          author: sanitizePlainText(String(item?.author || item?.handle || "source"), 80),
          text: sanitizePlainText(text, 600),
          createdAt: sanitizePlainText(String(item?.createdAt || item?.timestamp || new Date().toISOString()), 80),
          url: typeof item?.url === "string" ? item.url : undefined,
          score: typeof item?.score === "number" ? item.score : undefined,
        };
      })
      .filter((item: XSearchResult) => item.text.length > 0)
      .slice(0, limit);

    return NextResponse.json(
      {
        ok: true,
        provider: "x-search-api",
        results,
        generatedAt: new Date().toISOString(),
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: true,
        provider: "fallback",
        warning: error instanceof Error ? error.message : "x_search_unavailable",
        results: fallbackResults(query, limit),
        generatedAt: new Date().toISOString(),
      },
      { headers: rateLimit.headers },
    );
  }
}
