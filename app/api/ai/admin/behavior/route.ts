import { requireAdminAccess } from "@/lib/admin-access";
import {
    getBehaviorPersistenceStatus,
    listPersistedBehaviorRecords,
} from "@/lib/ai/behavior-persistence";
import {
    getBehaviorIngestionSummary,
    getBehaviorProfiles,
    getBehaviorRecords,
} from "@/lib/ai/data-ingestion";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function parseBoolean(value: string | null, fallback = false) {
  if (value === null) return fallback;
  return value === "1" || value === "true" || value === "yes";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:behavior",
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
  const windowMinutes = parseInteger(search.get("windowMinutes"), 1_440, 5, 10_080);
  const profileLimit = parseInteger(search.get("profileLimit"), 50, 1, 500);
  const recordLimit = parseInteger(search.get("recordLimit"), 100, 1, 800);
  const includePersisted = parseBoolean(search.get("includePersisted"), true);

  const summary = getBehaviorIngestionSummary(windowMinutes);
  const profiles = getBehaviorProfiles(profileLimit);
  const records = getBehaviorRecords(recordLimit);
  const persistence = await getBehaviorPersistenceStatus();
  const persistedRecords =
    includePersisted && persistence.shouldUseSupabase
      ? await listPersistedBehaviorRecords({
          limit: Math.min(300, recordLimit),
        })
      : [];

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      summary,
      persistence,
      profiles,
      records,
      persistedRecords,
    },
    {
      headers: {
        ...rateLimit.headers,
        "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
      },
    },
  );
}
