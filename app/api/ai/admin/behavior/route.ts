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

type AggregationRecord = {
  source: string;
  category: string;
  metadata?: Record<string, unknown>;
  ingestedAt?: string;
  created_at?: string;
};

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

function increment(map: Record<string, number>, key: string, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function toRecordCollection(records: unknown[]) {
  return records.filter((item): item is AggregationRecord => Boolean(item && typeof item === "object"));
}

function toChartPayload(recordsInput: unknown[]) {
  const records = toRecordCollection(recordsInput);
  const intents: Record<string, number> = {};
  const routes: Record<string, number> = {};
  const eventsByHour: Record<string, number> = {};
  const funnel = {
    widget_opened: 0,
    prompt_sent: 0,
    suggestion_clicked: 0,
    chat_messages: 0,
  };

  for (const record of records) {
    const metadata = record.metadata && typeof record.metadata === "object" ? record.metadata : {};
    const event = typeof metadata.event === "string" ? metadata.event : "";
    const intent = typeof metadata.intent === "string" ? metadata.intent : "unknown";
    const route =
      typeof metadata.current_path === "string"
        ? metadata.current_path
        : typeof metadata.path === "string"
          ? metadata.path
          : typeof metadata.route === "string"
            ? metadata.route
            : "unknown";

    increment(intents, intent);
    increment(routes, route);

    if (event.includes("widget_toggled")) funnel.widget_opened += 1;
    if (event.includes("prompt_sent")) funnel.prompt_sent += 1;
    if (event.includes("suggestion_clicked")) funnel.suggestion_clicked += 1;
    if (record.source === "ai_chat") funnel.chat_messages += 1;

    const timestampRaw = record.ingestedAt || record.created_at || "";
    const parsed = Date.parse(String(timestampRaw));
    if (Number.isFinite(parsed)) {
      const hour = new Date(parsed).getUTCHours().toString().padStart(2, "0");
      increment(eventsByHour, `${hour}:00`);
    }
  }

  const topIntents = Object.entries(intents)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  const routeHeatmap = Object.entries(routes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, value]) => ({ label, value }));

  const hourlyTrend = Object.entries(eventsByHour)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));

  return {
    funnel,
    topIntents,
    routeHeatmap,
    hourlyTrend,
  };
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
  const chartRecords = [
    ...records,
    ...persistedRecords,
  ];
  const charts = toChartPayload(chartRecords);

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      summary,
      persistence,
      profiles,
      records,
      persistedRecords,
      charts,
    },
    {
      headers: {
        ...rateLimit.headers,
        "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
      },
    },
  );
}
