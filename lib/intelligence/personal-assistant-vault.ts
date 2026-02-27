import { sanitizePlainText } from "@/lib/security";
import { promises as fs } from "node:fs";
import path from "node:path";

export type PersonalSource = "manual" | "webhook" | "system";

export type PersonalAssistantVault = {
  ownerId: string;
  displayName: string;
  strategyNotes: string;
  preferredSymbols: string[];
  preferredTimeframes: string[];
  macroWatchlist: string[];
  dataSources: string[];
  updatedAt: string;
  lastWebhookAt?: string;
  webhookEventsIngested: number;
};

const DATA_DIR = path.join(process.cwd(), "data", "admin");
const DATA_FILE = path.join(DATA_DIR, "personal-assistant-vault.json");

function nowIso() {
  return new Date().toISOString();
}

function normalizeStringArray(values: unknown, maxItems: number, maxLen: number, upper = false) {
  if (!Array.isArray(values)) return [];
  const out = values
    .map((value) => sanitizePlainText(String(value || ""), maxLen))
    .map((value) => (upper ? value.toUpperCase() : value))
    .filter(Boolean);
  return Array.from(new Set(out)).slice(0, maxItems);
}

function toDefaultVault(ownerId: string): PersonalAssistantVault {
  return {
    ownerId,
    displayName: "TradeHax Owner",
    strategyNotes: "",
    preferredSymbols: ["BTC", "ETH", "SOL"],
    preferredTimeframes: ["15m", "1h", "4h"],
    macroWatchlist: ["CPI", "NFP", "FOMC", "DXY", "US10Y"],
    dataSources: [],
    updatedAt: nowIso(),
    webhookEventsIngested: 0,
  };
}

async function readFileVault(): Promise<PersonalAssistantVault | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<PersonalAssistantVault>;
    if (!parsed || typeof parsed !== "object") return null;

    const ownerId = sanitizePlainText(String(parsed.ownerId || "acct_tradehax_owner"), 80).toLowerCase() || "acct_tradehax_owner";
    return {
      ownerId,
      displayName: sanitizePlainText(String(parsed.displayName || "TradeHax Owner"), 60) || "TradeHax Owner",
      strategyNotes: sanitizePlainText(String(parsed.strategyNotes || ""), 1_000),
      preferredSymbols: normalizeStringArray(parsed.preferredSymbols, 24, 16, true),
      preferredTimeframes: normalizeStringArray(parsed.preferredTimeframes, 16, 16, false),
      macroWatchlist: normalizeStringArray(parsed.macroWatchlist, 30, 24, true),
      dataSources: normalizeStringArray(parsed.dataSources, 30, 50, false),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
      lastWebhookAt: typeof parsed.lastWebhookAt === "string" ? parsed.lastWebhookAt : undefined,
      webhookEventsIngested: Math.max(0, Number(parsed.webhookEventsIngested || 0)),
    };
  } catch {
    return null;
  }
}

async function writeFileVault(vault: PersonalAssistantVault) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(vault, null, 2), "utf-8");
}

export async function getPersonalAssistantVault(ownerId: string) {
  const normalizedOwner = sanitizePlainText(ownerId, 80).toLowerCase() || "acct_tradehax_owner";
  const loaded = await readFileVault();
  if (!loaded) {
    const initial = toDefaultVault(normalizedOwner);
    await writeFileVault(initial);
    return initial;
  }

  if (loaded.ownerId !== normalizedOwner) {
    return {
      ...loaded,
      ownerId: normalizedOwner,
      updatedAt: nowIso(),
    };
  }

  return loaded;
}

export async function updatePersonalAssistantVault(
  ownerId: string,
  patch: Partial<Pick<PersonalAssistantVault, "displayName" | "strategyNotes" | "preferredSymbols" | "preferredTimeframes" | "macroWatchlist" | "dataSources">>,
  source: PersonalSource,
) {
  const current = await getPersonalAssistantVault(ownerId);

  const next: PersonalAssistantVault = {
    ...current,
    displayName:
      typeof patch.displayName === "string"
        ? sanitizePlainText(patch.displayName, 60) || current.displayName
        : current.displayName,
    strategyNotes:
      typeof patch.strategyNotes === "string"
        ? sanitizePlainText(patch.strategyNotes, 1_000)
        : current.strategyNotes,
    preferredSymbols:
      patch.preferredSymbols !== undefined
        ? normalizeStringArray(patch.preferredSymbols, 24, 16, true)
        : current.preferredSymbols,
    preferredTimeframes:
      patch.preferredTimeframes !== undefined
        ? normalizeStringArray(patch.preferredTimeframes, 16, 16, false)
        : current.preferredTimeframes,
    macroWatchlist:
      patch.macroWatchlist !== undefined
        ? normalizeStringArray(patch.macroWatchlist, 30, 24, true)
        : current.macroWatchlist,
    dataSources:
      patch.dataSources !== undefined
        ? normalizeStringArray(patch.dataSources, 30, 50, false)
        : current.dataSources,
    updatedAt: nowIso(),
  };

  if (source === "webhook") {
    next.lastWebhookAt = nowIso();
  }

  await writeFileVault(next);
  return next;
}

export async function markPersonalWebhookIngestion(ownerId: string, sourceName: string, events: number) {
  const current = await getPersonalAssistantVault(ownerId);
  const normalizedSource = sanitizePlainText(sourceName, 50);
  const nextSources = normalizedSource
    ? Array.from(new Set([normalizedSource, ...current.dataSources])).slice(0, 30)
    : current.dataSources;

  const next: PersonalAssistantVault = {
    ...current,
    dataSources: nextSources,
    webhookEventsIngested: current.webhookEventsIngested + Math.max(0, Math.floor(events)),
    lastWebhookAt: nowIso(),
    updatedAt: nowIso(),
  };

  await writeFileVault(next);
  return next;
}
