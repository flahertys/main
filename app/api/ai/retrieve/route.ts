import { retrieveRelevantContext } from "@/lib/ai/retriever";
import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type RetrieveBody = {
  query?: string;
  limit?: number;
};

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:retrieve",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as RetrieveBody;
    const query = sanitizePlainText(String(body.query || ""), 500);
    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "Query is required.",
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    const rawLimit = Number.isFinite(body.limit) ? Number(body.limit) : 6;
    const limit = Math.min(12, Math.max(1, Math.floor(rawLimit)));
    const chunks = retrieveRelevantContext(query, limit);

    return NextResponse.json(
      {
        ok: true,
        query,
        count: chunks.length,
        chunks,
      },
      {
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    console.error("retrieve route error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to retrieve context.",
      },
      {
        status: 500,
      },
    );
  }
}
