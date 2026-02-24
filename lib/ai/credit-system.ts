import { HAX_TOKEN_CONFIG } from "../trading/hax-token";

/**
 * TradeHax Credit & Token System
 * Manages access to GLM-4.7 Uncensored API.
 */
export interface UserCredits {
  userId: string;
  balance: number;
  tokenBalance?: number; // Real $HAX token balance
}

const CREDIT_COSTS = {
  STANDARD: 10,
  UNCENSORED: 50,
  IMAGE_GEN: 75, // Cost for AI image generation
  OVERCLOCK: 100,
  HFT_SIGNAL: 250,
  GUITAR_LESSON: 500
};

export type CreditTier = keyof typeof CREDIT_COSTS;

type CreditPackId = "starter" | "pro" | "elite";

type CreditPack = {
  id: CreditPackId;
  label: string;
  credits: number;
  priceUsd: number;
};

type CreditPurchaseEvent = {
  id: string;
  userId: string;
  packId: CreditPackId;
  credits: number;
  priceUsd: number;
  provider: string;
  createdAt: string;
};

type CreditSpendEvent = {
  id: string;
  userId: string;
  tier: CreditTier;
  cost: number;
  createdAt: string;
};

type CreditStore = {
  balances: Map<string, number>;
  purchases: CreditPurchaseEvent[];
  spend: CreditSpendEvent[];
};

type CreditStorageMode = "memory" | "supabase";

type SupabaseCreditConfig = {
  baseUrl: string;
  serviceKey: string;
  balancesTable: string;
  ledgerTable: string;
};

type SupabaseCreditBalanceRow = {
  user_id: string;
  balance: number;
  updated_at?: string;
};

type SupabaseCreditLedgerRow = {
  id: string;
  user_id: string;
  event_type: "purchase" | "spend";
  tier?: CreditTier | null;
  pack_id?: CreditPackId | null;
  credits?: number | null;
  price_usd?: number | null;
  provider?: string | null;
  balance_after?: number | null;
  created_at: string;
};

export type CreditLedgerEntry = {
  id: string;
  userId: string;
  eventType: "purchase" | "spend";
  tier?: CreditTier;
  packId?: CreditPackId;
  credits?: number;
  priceUsd?: number;
  provider?: string;
  balanceAfter?: number;
  createdAt: string;
};

export const AI_CREDIT_PACKS: CreditPack[] = [
  { id: "starter", label: "Starter Pack", credits: 1_000, priceUsd: 5 },
  { id: "pro", label: "Pro Pack", credits: 5_000, priceUsd: 20 },
  { id: "elite", label: "Elite Pack", credits: 15_000, priceUsd: 50 },
];

function getStore(): CreditStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_AI_CREDIT_STORE__?: CreditStore;
  };

  if (!globalRef.__TRADEHAX_AI_CREDIT_STORE__) {
    globalRef.__TRADEHAX_AI_CREDIT_STORE__ = {
      balances: new Map<string, number>(),
      purchases: [],
      spend: [],
    };
  }

  return globalRef.__TRADEHAX_AI_CREDIT_STORE__;
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeUserId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

function resolveStorageMode(): CreditStorageMode {
  const raw = String(process.env.TRADEHAX_AI_CREDITS_STORAGE || "").trim().toLowerCase();
  if (raw === "memory" || raw === "supabase") {
    return raw as CreditStorageMode;
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase";
  }

  return "memory";
}

function getSupabaseConfig(): SupabaseCreditConfig | null {
  const baseUrl = String(process.env.SUPABASE_URL || "").trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!baseUrl || !serviceKey) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    serviceKey,
    balancesTable: String(
      process.env.TRADEHAX_SUPABASE_AI_CREDITS_TABLE || "tradehax_ai_credit_balances",
    ).trim(),
    ledgerTable: String(
      process.env.TRADEHAX_SUPABASE_AI_CREDITS_LEDGER_TABLE || "tradehax_ai_credit_ledger",
    ).trim(),
  };
}

function getStorageConfig() {
  const mode = resolveStorageMode();
  const supabase = getSupabaseConfig();
  return {
    mode,
    supabase,
    shouldUseSupabase: mode === "supabase" && Boolean(supabase),
  };
}

function getSupabaseHeaders(config: SupabaseCreditConfig, extraHeaders?: HeadersInit) {
  return {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };
}

async function requestSupabaseJson<T>(
  config: SupabaseCreditConfig,
  path: string,
  init: RequestInit = {},
  timeoutMs = 8_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${config.baseUrl}/rest/v1/${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: getSupabaseHeaders(config, init.headers),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase ${response.status}: ${text.slice(0, 240)}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    const text = await response.text();
    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

function encodeEq(value: string) {
  return `eq.${encodeURIComponent(value)}`;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getInitialCredits() {
  const parsed = Number.parseInt(process.env.TRADEHAX_AI_FREE_CREDITS || "250", 10);
  if (!Number.isFinite(parsed)) {
    return 250;
  }
  return Math.max(0, Math.min(2_500, parsed));
}

async function getSupabaseBalance(userId: string) {
  const storage = getStorageConfig();
  if (!storage.shouldUseSupabase || !storage.supabase) {
    return null;
  }

  const rows = await requestSupabaseJson<SupabaseCreditBalanceRow[]>(
    storage.supabase,
    `${storage.supabase.balancesTable}?user_id=${encodeEq(userId)}&limit=1`,
    { method: "GET" },
  );

  if (!Array.isArray(rows) || !rows[0]) {
    return null;
  }

  const balance = Number(rows[0].balance);
  if (!Number.isFinite(balance)) {
    return null;
  }

  return Math.max(0, Math.floor(balance));
}

async function upsertSupabaseBalance(userId: string, balance: number) {
  const storage = getStorageConfig();
  if (!storage.shouldUseSupabase || !storage.supabase) {
    return;
  }

  await requestSupabaseJson<unknown>(
    storage.supabase,
    `${storage.supabase.balancesTable}?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([
        {
          user_id: userId,
          balance,
          updated_at: nowIso(),
        },
      ]),
    },
  );
}

async function insertSupabaseLedgerEvent(input: {
  id: string;
  userId: string;
  eventType: "purchase" | "spend";
  tier?: CreditTier;
  packId?: CreditPackId;
  credits?: number;
  priceUsd?: number;
  provider?: string;
  balanceAfter: number;
  createdAt: string;
}) {
  const storage = getStorageConfig();
  if (!storage.shouldUseSupabase || !storage.supabase) {
    return;
  }

  await requestSupabaseJson<unknown>(
    storage.supabase,
    `${storage.supabase.ledgerTable}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([
        {
          id: input.id,
          user_id: input.userId,
          event_type: input.eventType,
          tier: input.tier || null,
          pack_id: input.packId || null,
          credits: typeof input.credits === "number" ? input.credits : null,
          price_usd: typeof input.priceUsd === "number" ? input.priceUsd : null,
          provider: input.provider || null,
          balance_after: input.balanceAfter,
          created_at: input.createdAt,
        },
      ]),
    },
  );
}

async function ensureBalance(userId: string) {
  const normalizedUserId = sanitizeUserId(userId);
  const store = getStore();
  const existing = store.balances.get(normalizedUserId);
  if (typeof existing === "number" && Number.isFinite(existing)) {
    return existing;
  }

  const storage = getStorageConfig();
  if (storage.shouldUseSupabase) {
    try {
      const remote = await getSupabaseBalance(normalizedUserId);
      if (typeof remote === "number") {
        store.balances.set(normalizedUserId, remote);
        return remote;
      }
    } catch {
      // Fall through to local seed + memory fallback.
    }
  }

  const seeded = getInitialCredits();
  store.balances.set(normalizedUserId, seeded);

  if (storage.shouldUseSupabase) {
    try {
      await upsertSupabaseBalance(normalizedUserId, seeded);
    } catch {
      // Memory fallback remains authoritative when network/storage fails.
    }
  }

  return seeded;
}

async function setBalance(userId: string, nextBalance: number) {
  const normalizedUserId = sanitizeUserId(userId);
  const store = getStore();
  const normalized = Math.max(0, Math.floor(nextBalance));
  store.balances.set(normalizedUserId, normalized);

  const storage = getStorageConfig();
  if (storage.shouldUseSupabase) {
    try {
      await upsertSupabaseBalance(normalizedUserId, normalized);
    } catch {
      // Keep local balance if persistent storage is unavailable.
    }
  }

  return normalized;
}

function appendSpendEvent(event: CreditSpendEvent) {
  const store = getStore();
  store.spend.push(event);
  if (store.spend.length > 25_000) {
    store.spend = store.spend.slice(-20_000);
  }
}

function appendPurchaseEvent(event: CreditPurchaseEvent) {
  const store = getStore();
  store.purchases.push(event);
  if (store.purchases.length > 10_000) {
    store.purchases = store.purchases.slice(-8_000);
  }
}

function getPackById(packId: unknown) {
  if (packId !== "starter" && packId !== "pro" && packId !== "elite") {
    return null;
  }

  return AI_CREDIT_PACKS.find((pack) => pack.id === packId) ?? null;
}

export function getCreditCost(tier: CreditTier) {
  return CREDIT_COSTS[tier];
}

export async function getCreditBalance(userId: string): Promise<UserCredits> {
  const normalizedUserId = sanitizeUserId(userId);
  const balance = await ensureBalance(normalizedUserId);
  return {
    userId: normalizedUserId,
    balance,
  };
}

export async function getCreditSnapshot(userId: string) {
  const normalizedUserId = sanitizeUserId(userId);
  const { balance } = await getCreditBalance(normalizedUserId);
  return {
    userId: normalizedUserId,
    balance,
    costs: CREDIT_COSTS,
    estimatedRequestsRemaining: {
      standard: Math.floor(balance / CREDIT_COSTS.STANDARD),
      uncensored: Math.floor(balance / CREDIT_COSTS.UNCENSORED),
      image: Math.floor(balance / CREDIT_COSTS.IMAGE_GEN),
    },
    packs: AI_CREDIT_PACKS,
  };
}

export async function checkCredits(userId: string, tier: CreditTier): Promise<boolean> {
  const normalizedUserId = sanitizeUserId(userId);
  const balance = await ensureBalance(normalizedUserId);
  const cost = CREDIT_COSTS[tier];
  return balance >= cost;
}

export async function deductCredits(userId: string, tier: CreditTier) {
  const normalizedUserId = sanitizeUserId(userId);
  const cost = CREDIT_COSTS[tier];

  const current = await ensureBalance(normalizedUserId);
  if (current < cost) {
    return {
      success: false,
      cost,
      remaining: current,
    };
  }

  const remaining = await setBalance(normalizedUserId, current - cost);
  const eventId = createId("spend");
  const createdAt = nowIso();

  appendSpendEvent({
    id: eventId,
    userId: normalizedUserId,
    tier,
    cost,
    createdAt,
  });

  try {
    await insertSupabaseLedgerEvent({
      id: eventId,
      userId: normalizedUserId,
      eventType: "spend",
      tier,
      credits: cost,
      balanceAfter: remaining,
      createdAt,
    });
  } catch {
    // No-op: memory fallback already recorded.
  }

  return {
    success: true,
    cost,
    remaining,
  };
}

export async function purchaseCredits(userId: string, packId: unknown, provider = "stripe") {
  const normalizedUserId = sanitizeUserId(userId);
  const pack = getPackById(packId);
  if (!pack) {
    return {
      ok: false,
      error: "Unknown credit pack.",
      snapshot: await getCreditSnapshot(normalizedUserId),
    };
  }

  const current = await ensureBalance(normalizedUserId);
  const next = await setBalance(normalizedUserId, current + pack.credits);
  const eventId = createId("credit");
  const createdAt = nowIso();

  appendPurchaseEvent({
    id: eventId,
    userId: normalizedUserId,
    packId: pack.id,
    credits: pack.credits,
    priceUsd: pack.priceUsd,
    provider,
    createdAt,
  });

  try {
    await insertSupabaseLedgerEvent({
      id: eventId,
      userId: normalizedUserId,
      eventType: "purchase",
      packId: pack.id,
      credits: pack.credits,
      priceUsd: pack.priceUsd,
      provider,
      balanceAfter: next,
      createdAt,
    });
  } catch {
    // No-op: memory fallback already recorded.
  }

  return {
    ok: true,
    balance: next,
    pack,
    snapshot: await getCreditSnapshot(normalizedUserId),
  };
}

export async function listCreditLedgerEntries(input?: { userId?: string; limit?: number }) {
  const store = getStore();
  const normalizedUserId = input?.userId ? sanitizeUserId(input.userId) : "";
  const limit = Math.max(1, Math.min(500, Math.floor(input?.limit ?? 100)));
  const storage = getStorageConfig();

  if (storage.shouldUseSupabase && storage.supabase) {
    try {
      const userFilter = normalizedUserId ? `&user_id=${encodeEq(normalizedUserId)}` : "";
      const rows = await requestSupabaseJson<SupabaseCreditLedgerRow[]>(
        storage.supabase,
        `${storage.supabase.ledgerTable}?order=created_at.desc&limit=${limit}${userFilter}`,
        { method: "GET" },
      );

      if (Array.isArray(rows)) {
        return rows.map((row) => ({
          id: row.id,
          userId: sanitizeUserId(String(row.user_id || "unknown")),
          eventType: row.event_type,
          tier: row.tier || undefined,
          packId: row.pack_id || undefined,
          credits: typeof row.credits === "number" ? row.credits : undefined,
          priceUsd: typeof row.price_usd === "number" ? row.price_usd : undefined,
          provider: row.provider || undefined,
          balanceAfter: typeof row.balance_after === "number" ? row.balance_after : undefined,
          createdAt: row.created_at,
        })) satisfies CreditLedgerEntry[];
      }
    } catch {
      // fall through to memory events when Supabase read is unavailable.
    }
  }

  const merged: CreditLedgerEntry[] = [
    ...store.purchases.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      eventType: "purchase" as const,
      packId: entry.packId,
      credits: entry.credits,
      priceUsd: entry.priceUsd,
      provider: entry.provider,
      createdAt: entry.createdAt,
    })),
    ...store.spend.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      eventType: "spend" as const,
      tier: entry.tier,
      credits: entry.cost,
      createdAt: entry.createdAt,
    })),
  ];

  return merged
    .filter((entry) => (normalizedUserId ? entry.userId === normalizedUserId : true))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function listCreditPacks() {
  return AI_CREDIT_PACKS;
}

/**
 * Web3 Token Integration (Solana)
 * Deducts $HAX tokens for high-performance requests.
 */
export async function deductTokens(walletAddress: string, amount: number) {
  console.log(`[WEB3_TOKEN] Charging ${amount} $HAX to ${walletAddress} (Mint: ${HAX_TOKEN_CONFIG.MINT_ADDRESS})`);

  // Real implementation would build a transfer instruction
  // 1. Get associated token account (ATA)
  // 2. Build transfer transaction
  // 3. Return TX for signing

  return {
    txId: "0x_REAL_SOLANA_TX_ID_PROTOTYPE",
    mint: HAX_TOKEN_CONFIG.MINT_ADDRESS,
    status: "pending_signature"
  };
}
