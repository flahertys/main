import { requireAdminAccess } from "@/lib/admin-access";
import {
  getHivemindMemoryIndexStatus,
  listHivemindMemoryRecords,
  queryHivemindMemory,
  syncHivemindMemoryFromProfile,
  upsertHivemindMemoryRecord,
  type HivemindMemorySource,
} from "@/lib/ai/hivemind-memory-index";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type MemoryMutationRequest = {
  action?: "upsert" | "query" | "sync_profile";
  userId?: string;
  text?: string;
  source?: HivemindMemorySource;
  route?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  id?: string;
  query?: string;
  limit?: number;
  minScore?: number;
};

function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseFloatValue(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:hivemind:memory:get",
    max: 45,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  const search = request.nextUrl.searchParams;
  const userId = search.get("userId") || undefined;
  const limit = parseInteger(search.get("limit"), 100, 1, 500);
  const query = sanitizePlainText(String(search.get("q") || ""), 1_000);
  const queryLimit = parseInteger(search.get("queryLimit"), 8, 1, 30);
  const minScore = parseFloatValue(search.get("minScore"), 0.15, 0, 1);

  const status = getHivemindMemoryIndexStatus();
  const records = listHivemindMemoryRecords({ userId, limit });
  const matches = query ? await queryHivemindMemory({ userId, query, limit: queryLimit, minScore }) : [];

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      status,
      records,
      matches,
    },
    {
      headers: {
        ...rateLimit.headers,
        "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
      },
    },
  );
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
    keyPrefix: "ai:admin:hivemind:memory:post",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  try {
    const body = (await request.json()) as MemoryMutationRequest;
    const action = body.action || "upsert";

    if (action === "query") {
      const query = sanitizePlainText(String(body.query || ""), 1_000);
      if (!query) {
        return NextResponse.json(
          {
            ok: false,
            error: "query is required for action=query.",
          },
          { status: 400, headers: rateLimit.headers },
        );
      }

      const matches = await queryHivemindMemory({
        userId: body.userId,
        query,
        limit: typeof body.limit === "number" ? body.limit : 8,
        minScore: typeof body.minScore === "number" ? body.minScore : 0.15,
      });

      return NextResponse.json(
        {
          ok: true,
          action,
          matches,
          status: getHivemindMemoryIndexStatus(),
        },
        {
          headers: {
            ...rateLimit.headers,
            "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
          },
        },
      );
    }

    if (action === "sync_profile") {
      const userId = sanitizePlainText(String(body.userId || ""), 100);
      if (!userId) {
        return NextResponse.json(
          {
            ok: false,
            error: "userId is required for action=sync_profile.",
          },
          { status: 400, headers: rateLimit.headers },
        );
      }

      const synced = await syncHivemindMemoryFromProfile(userId);
      return NextResponse.json(
        {
          ok: true,
          action,
          synced,
          status: getHivemindMemoryIndexStatus(),
        },
        {
          headers: {
            ...rateLimit.headers,
            "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
          },
        },
      );
    }

    const text = sanitizePlainText(String(body.text || ""), 3_200);
    const userId = sanitizePlainText(String(body.userId || ""), 100);
    if (!text || !userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "userId and text are required for action=upsert.",
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const record = await upsertHivemindMemoryRecord({
      id: body.id,
      userId,
      text,
      source: body.source,
      route: body.route,
      tags: Array.isArray(body.tags) ? body.tags : [],
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        record,
        status: getHivemindMemoryIndexStatus(),
      },
      {
        headers: {
          ...rateLimit.headers,
          "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process memory mutation.",
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
