import { persistBehaviorRecord } from "@/lib/ai/behavior-persistence";
import { sanitizePlainText } from "@/lib/security";

export type InteractionCategory =
  | "GUITAR"
  | "HFT"
  | "MARKET"
  | "BEHAVIOR"
  | "NAVIGATION"
  | "INTELLIGENCE"
  | "DISCORD"
  | "IMAGE";

type InteractionConsent = {
  analytics?: boolean;
  training?: boolean;
};

type InteractionSource =
  | "ai_chat"
  | "ai_custom"
  | "ai_image"
  | "ai_navigator"
  | "intelligence"
  | "discord"
  | "system";

type InteractionMetadataValue = string | number | boolean;

type InteractionMetadata = Record<string, InteractionMetadataValue>;

export interface InteractionLog {
  timestamp: string;
  category: InteractionCategory;
  prompt: string;
  response: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  source?: InteractionSource;
  consent?: InteractionConsent;
}

export type IngestedInteractionRecord = {
  id: string;
  ingestedAt: string;
  timestamp: string;
  category: InteractionCategory;
  source: InteractionSource;
  userKey: string;
  prompt: string;
  response: string;
  metadata: InteractionMetadata;
  trainingEligible: boolean;
};

export type BehaviorUserProfile = {
  userKey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  events: number;
  trainingEligibleEvents: number;
  categories: Record<string, number>;
  sources: Record<string, number>;
  routes: Record<string, number>;
};

export type BehaviorIngestionSummary = {
  generatedAt: string;
  windowMinutes: number;
  storedRecords: number;
  maxRecords: number;
  acceptedEvents: number;
  droppedNoConsent: number;
  droppedInvalidPayload: number;
  trainingEligibleEvents: number;
  uniqueProfiles: number;
  categories: Record<string, number>;
  sources: Record<string, number>;
};

type IngestionResult =
  | { accepted: true; record: IngestedInteractionRecord }
  | { accepted: false; reason: "analytics_consent_required" | "invalid_payload" };

type BehaviorStore = {
  records: IngestedInteractionRecord[];
  profiles: Map<string, BehaviorUserProfile>;
  droppedNoConsent: number;
  droppedInvalidPayload: number;
};

const CATEGORY_KEYS: InteractionCategory[] = [
  "GUITAR",
  "HFT",
  "MARKET",
  "BEHAVIOR",
  "NAVIGATION",
  "INTELLIGENCE",
  "DISCORD",
  "IMAGE",
];

function nowIso() {
  return new Date().toISOString();
}

function getStore(): BehaviorStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_BEHAVIOR_STORE__?: BehaviorStore;
  };

  if (!globalRef.__TRADEHAX_BEHAVIOR_STORE__) {
    globalRef.__TRADEHAX_BEHAVIOR_STORE__ = {
      records: [],
      profiles: new Map(),
      droppedNoConsent: 0,
      droppedInvalidPayload: 0,
    };
  }

  return globalRef.__TRADEHAX_BEHAVIOR_STORE__;
}

function resolveMaxRecords() {
  const raw = Number.parseInt(process.env.TRADEHAX_BEHAVIOR_MAX_RECORDS || "5000", 10);
  if (!Number.isFinite(raw)) {
    return 5000;
  }
  return Math.min(25_000, Math.max(100, raw));
}

function resolveDefaultTrainingConsent() {
  return process.env.TRADEHAX_DEFAULT_TRAINING_CONSENT === "true";
}

function resolveImplicitAnalyticsConsent() {
  return process.env.TRADEHAX_ALLOW_IMPLICIT_ANALYTICS_CONSENT === "true";
}

function sanitizeCategory(value: unknown): InteractionCategory {
  if (typeof value !== "string") {
    return "BEHAVIOR";
  }
  const normalized = value.trim().toUpperCase();
  if (CATEGORY_KEYS.includes(normalized as InteractionCategory)) {
    return normalized as InteractionCategory;
  }
  return "BEHAVIOR";
}

function sanitizeSource(value: unknown): InteractionSource {
  if (value === "ai_chat") return "ai_chat";
  if (value === "ai_custom") return "ai_custom";
  if (value === "ai_image") return "ai_image";
  if (value === "ai_navigator") return "ai_navigator";
  if (value === "intelligence") return "intelligence";
  if (value === "discord") return "discord";
  return "system";
}

function toRecordId() {
  return `ing_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function redactSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[REDACTED_PHONE]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[REDACTED_IP]")
    .replace(/\b0x[a-fA-F0-9]{40}\b/g, "[REDACTED_WALLET]")
    .replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g, "[REDACTED_ADDRESS]");
}

function sanitizeMetadata(input: Record<string, unknown> | undefined): InteractionMetadata {
  if (!input || typeof input !== "object") {
    return {};
  }

  const output: InteractionMetadata = {};
  const entries = Object.entries(input).slice(0, 24);

  for (const [keyRaw, value] of entries) {
    const key = sanitizePlainText(keyRaw, 40).toLowerCase();
    if (!key) {
      continue;
    }

    if (typeof value === "string") {
      output[key] = redactSensitiveText(sanitizePlainText(value, 180));
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      output[key] = Number.parseFloat(value.toFixed(4));
      continue;
    }
    if (typeof value === "boolean") {
      output[key] = value;
    }
  }

  return output;
}

function stableHash32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function hashValue(value: string) {
  const salt = process.env.TRADEHAX_DATA_HASH_SALT || "tradehax-default-salt";
  const seeded = `${salt}:${value}`;
  const a = stableHash32(`${seeded}:0`);
  const b = stableHash32(`${seeded}:1`);
  const c = stableHash32(`${seeded}:2`);
  const d = stableHash32(`${seeded}:3`);
  return `${a}${b}${c}${d}${a}${c}${b}${d}`;
}

function toUserKey(userId: unknown) {
  const normalized = sanitizePlainText(String(userId || "anonymous"), 128).toLowerCase();
  if (!normalized) {
    return `usr_${hashValue("anonymous").slice(0, 20)}`;
  }
  return `usr_${hashValue(normalized).slice(0, 20)}`;
}

function incrementCounter(
  map: Record<string, number>,
  key: string,
  value = 1,
) {
  if (!key) {
    return;
  }
  map[key] = (map[key] || 0) + value;
}

function toIsoTimestamp(value: unknown) {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return nowIso();
}

function ingestIntoProfile(record: IngestedInteractionRecord, store: BehaviorStore) {
  const existing = store.profiles.get(record.userKey);
  if (existing) {
    existing.lastSeenAt = record.ingestedAt;
    existing.events += 1;
    if (record.trainingEligible) {
      existing.trainingEligibleEvents += 1;
    }
    incrementCounter(existing.categories, record.category);
    incrementCounter(existing.sources, record.source);
    const route = typeof record.metadata.route === "string" ? record.metadata.route : "";
    incrementCounter(existing.routes, route);
    store.profiles.set(record.userKey, existing);
    return;
  }

  const profile: BehaviorUserProfile = {
    userKey: record.userKey,
    firstSeenAt: record.ingestedAt,
    lastSeenAt: record.ingestedAt,
    events: 1,
    trainingEligibleEvents: record.trainingEligible ? 1 : 0,
    categories: {},
    sources: {},
    routes: {},
  };
  incrementCounter(profile.categories, record.category);
  incrementCounter(profile.sources, record.source);
  const route = typeof record.metadata.route === "string" ? record.metadata.route : "";
  incrementCounter(profile.routes, route);
  store.profiles.set(record.userKey, profile);
}

function enforceStoreLimit(store: BehaviorStore) {
  const maxRecords = resolveMaxRecords();
  if (store.records.length <= maxRecords) {
    return;
  }

  const trimmed = store.records.slice(store.records.length - maxRecords);
  store.records = trimmed;
}

function buildTrainingRecord(input: {
  category: string;
  prompt: string;
  response: string;
  metadata?: Record<string, unknown>;
}) {
  const instruction = redactSensitiveText(sanitizePlainText(input.prompt, 1_800));
  const output = redactSensitiveText(sanitizePlainText(input.response, 2_000));
  if (!instruction || !output) {
    return null;
  }

  const context =
    typeof input.metadata?.context === "string"
      ? redactSensitiveText(sanitizePlainText(input.metadata.context, 1_200))
      : "";

  return {
    instruction,
    input: context,
    output,
    category: sanitizeCategory(input.category),
  };
}

/**
 * TradeHax behavioral ingestion with consent, redaction, and pseudonymous profile mapping.
 */
export async function ingestBehavior(log: InteractionLog): Promise<IngestionResult> {
  const store = getStore();
  const analyticsConsent =
    log.consent?.analytics === true || (log.consent?.analytics !== false && resolveImplicitAnalyticsConsent());

  if (!analyticsConsent) {
    store.droppedNoConsent += 1;
    return {
      accepted: false,
      reason: "analytics_consent_required",
    };
  }

  const prompt = redactSensitiveText(sanitizePlainText(String(log.prompt || ""), 2_000));
  const response = redactSensitiveText(sanitizePlainText(String(log.response || ""), 2_000));
  if (!prompt || !response) {
    store.droppedInvalidPayload += 1;
    return {
      accepted: false,
      reason: "invalid_payload",
    };
  }

  const trainingConsent =
    log.consent?.training === true ||
    (log.consent?.training !== false && resolveDefaultTrainingConsent());

  const record: IngestedInteractionRecord = {
    id: toRecordId(),
    ingestedAt: nowIso(),
    timestamp: toIsoTimestamp(log.timestamp),
    category: sanitizeCategory(log.category),
    source: sanitizeSource(log.source),
    userKey: toUserKey(log.userId),
    prompt,
    response,
    metadata: sanitizeMetadata(log.metadata),
    trainingEligible: trainingConsent,
  };

  store.records.push(record);
  ingestIntoProfile(record, store);
  enforceStoreLimit(store);

  try {
    await persistBehaviorRecord(record);
  } catch (error) {
    console.warn(
      "Behavior persistence fallback to memory store:",
      error instanceof Error ? error.message : String(error),
    );
  }

  return {
    accepted: true,
    record,
  };
}

export function getBehaviorRecords(limit = 200) {
  const store = getStore();
  const boundedLimit = Math.min(2_000, Math.max(1, Math.floor(limit)));
  return store.records.slice(-boundedLimit).reverse();
}

export function getBehaviorProfiles(limit = 100) {
  const store = getStore();
  const boundedLimit = Math.min(1_000, Math.max(1, Math.floor(limit)));
  return Array.from(store.profiles.values())
    .sort((left, right) => right.events - left.events)
    .slice(0, boundedLimit);
}

export function getBehaviorIngestionSummary(windowMinutes = 1_440): BehaviorIngestionSummary {
  const store = getStore();
  const boundedWindow = Math.min(7 * 24 * 60, Math.max(5, Math.floor(windowMinutes)));
  const nowMs = Date.now();
  const cutoffMs = nowMs - boundedWindow * 60_000;
  const filtered = store.records.filter((record) => {
    const parsed = Date.parse(record.ingestedAt);
    return Number.isFinite(parsed) && parsed >= cutoffMs;
  });

  const categories: Record<string, number> = {};
  const sources: Record<string, number> = {};
  let trainingEligibleEvents = 0;

  for (const record of filtered) {
    incrementCounter(categories, record.category);
    incrementCounter(sources, record.source);
    if (record.trainingEligible) {
      trainingEligibleEvents += 1;
    }
  }

  return {
    generatedAt: nowIso(),
    windowMinutes: boundedWindow,
    storedRecords: store.records.length,
    maxRecords: resolveMaxRecords(),
    acceptedEvents: filtered.length,
    droppedNoConsent: store.droppedNoConsent,
    droppedInvalidPayload: store.droppedInvalidPayload,
    trainingEligibleEvents,
    uniqueProfiles: store.profiles.size,
    categories,
    sources,
  };
}

/**
 * Formats logs for Hugging Face AutoTrain (JSONL).
 */
export function formatForFineTuning(logs: InteractionLog[]) {
  return logs
    .map((log) =>
      buildTrainingRecord({
        category: log.category,
        prompt: log.prompt,
        response: log.response,
        metadata: log.metadata,
      }),
    )
    .filter((record): record is NonNullable<typeof record> => Boolean(record))
    .map((record) => JSON.stringify(record))
    .join("\n");
}

export function exportFineTuningJsonl(input?: {
  includeBootstrap?: boolean;
  maxRows?: number;
}) {
  const includeBootstrap = input?.includeBootstrap !== false;
  const maxRows = Math.min(25_000, Math.max(10, Math.floor(input?.maxRows || 5_000)));

  const records = getStore().records
    .filter((record) => record.trainingEligible)
    .map((record) =>
      buildTrainingRecord({
        category: record.category,
        prompt: record.prompt,
        response: record.response,
        metadata: record.metadata,
      }),
    )
    .filter((record): record is NonNullable<typeof record> => Boolean(record));

  const bootstrapRecords = includeBootstrap
    ? BOOTSTRAP_DATA.map((record) =>
        buildTrainingRecord({
          category: record.category,
          prompt: record.prompt,
          response: record.response,
          metadata: record.metadata,
        }),
      ).filter((record): record is NonNullable<typeof record> => Boolean(record))
    : [];

  const merged = [...bootstrapRecords, ...records].slice(0, maxRows);
  return merged.map((record) => JSON.stringify(record)).join("\n");
}

/**
 * Predefined patterns for Guitar, HFT, and Market analysis
 * to bootstrap the model before live data accumulates.
 */
export const BOOTSTRAP_DATA: InteractionLog[] = [
  {
    timestamp: new Date().toISOString(),
    category: "GUITAR",
    prompt: "How do I apply Neural Logic to Phish-style improvisation?",
    response:
      "Neural Logic in Phish improv requires mapping the Mixolydian mode to the TradeHax synaptic grid. Use high-bandwidth tension-and-release patterns focused on the 2nd and 6th intervals.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "HFT",
    prompt: "Optimize signal for high-frequency scalp on SOL/USDC.",
    response:
      "HFT_OPTIMIZATION: Deploy 8-point radial sampling on order book depth. Trigger execution when buy-side liquidity density exceeds 1.25x average. Minimize RPC latency via Jito bundles.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "MARKET",
    prompt: "Scan Hyperborea sector for yield spikes.",
    response:
      "MARKET_SCAN: Detecting anomaly in Sector 7G. Mythic artifact concentration rising. Yield projection: 15.4% increase in next 300 seconds.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "BEHAVIOR",
    prompt: "How does TradeHax handle WebDev consulting?",
    response:
      "TRADEHAX_WEBDEV: We specialize in high-performance Next.js architectures with integrated Solana Web3 layers. Our process involves rapid prototyping, neural-terminal UI design, and aggressive optimization for Vercel edge deployment.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "HFT",
    prompt: "What is the core logic of the TradeHax HFT scanner?",
    response:
      "HFT_SCANNER_LOGIC: The system utilizes a multi-threaded polling mechanism across 14+ Solana RPC nodes. It identifies liquidity imbalances in the serum/jupiter order books and executes swaps when the slippage-adjusted arbitrage spread exceeds 0.5%.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "GUITAR",
    prompt: "Explain the TradeHax 'Neural_Theory' curriculum.",
    response:
      "NEURAL_THEORY_02: Focuses on mapping musical scales to neural firing patterns. It teaches students to bypass traditional box thinking and visualize the fretboard as a non-linear data grid for faster modal transitions.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "BEHAVIOR",
    prompt: "How can I book a 1-on-1 session for TradeHax AI?",
    response:
      "BOOKING_PROTOCOL: You can schedule a direct intake via the Neural Console or visit https://calendar.app.google/hhBXuJjfaApoXVzc6. We utilize Google Meet and Zoom for elite-level consultations.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "MARKET",
    prompt: "Analyze the current Shamrock Protocol emission rate.",
    response:
      "SHAMROCK_EMISSION: Current rate is 4.2 $HAX per block. Hyperborea vault density is at 88%. Expect supply-side contraction if yield depth exceeds critical threshold.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "GUITAR",
    prompt: "How do I master the Synaptic Shift technique?",
    response:
      "NEURAL_THEORY_03: Synaptic Shift involves pre-visualizing the target interval 250ms before physical execution. Practice shifting from Ionian to Lydian dominant using the 4th-string anchor node.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "HFT",
    prompt: "What is the radial sampling threshold for SOL/USDC?",
    response:
      "HFT_PARAMETERS: Optimal radial sampling for SOL/USDC is set at 0.05% depth. Trigger sensitivity should be calibrated to 1.25x volume volatility to avoid fakeouts in low-liquidity zones.",
    source: "system",
    consent: { analytics: true, training: true },
  },
  {
    timestamp: new Date().toISOString(),
    category: "BEHAVIOR",
    prompt: "What is the TradeHax mission for 2026?",
    response:
      "MISSION_2026: Total integration of Neural Logic into the decentralized trade-stack. We aim to achieve 99.9% uptime on the Hyperborea simulation and scale the AI-consulting lane to 5,000 elite users.",
    source: "system",
    consent: { analytics: true, training: true },
  },
];
