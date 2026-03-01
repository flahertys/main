/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import { getTradingBehaviorProfile } from "@/lib/ai/trading-personalization";
import { sanitizePlainText } from "@/lib/security";
import { HfInference } from "@huggingface/inference";
import crypto from "node:crypto";

export type HivemindMemorySource =
  | "user_behavior"
  | "trade_outcome"
  | "manual"
  | "system"
  | "intelligence";

export type HivemindMemoryRecord = {
  id: string;
  userId: string;
  text: string;
  source: HivemindMemorySource;
  route?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
};

export type HivemindMemoryQueryResult = {
  id: string;
  userId: string;
  source: HivemindMemorySource;
  text: string;
  route?: string;
  tags: string[];
  score: number;
  createdAt: string;
};

type HivemindMemoryStore = {
  records: Map<string, HivemindMemoryRecord>;
  embeddingCache: Map<string, number[]>;
};

function nowIso() {
  return new Date().toISOString();
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_HIVEMIND_MEMORY_INDEX__?: HivemindMemoryStore;
  };

  if (!globalRef.__TRADEHAX_HIVEMIND_MEMORY_INDEX__) {
    globalRef.__TRADEHAX_HIVEMIND_MEMORY_INDEX__ = {
      records: new Map<string, HivemindMemoryRecord>(),
      embeddingCache: new Map<string, number[]>(),
    };
  }

  return globalRef.__TRADEHAX_HIVEMIND_MEMORY_INDEX__;
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeUserId(value: unknown) {
  return sanitizePlainText(String(value || "anonymous"), 100).toLowerCase() || "anonymous";
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => sanitizePlainText(String(item || ""), 40).toLowerCase())
    .filter(Boolean)
    .slice(0, 24);
}

function tokenize(value: string) {
  return sanitizePlainText(value, 2_000)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 120);
}

function lexicalSimilarity(left: string, right: string) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  const denominator = Math.max(leftTokens.size, rightTokens.size);
  return denominator > 0 ? overlap / denominator : 0;
}

function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const va = Number(a[index] || 0);
    const vb = Number(b[index] || 0);
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return dot / denominator;
}

function getEmbeddingModel() {
  return String(
    process.env.TRADEHAX_HIVEMIND_MEMORY_EMBEDDING_MODEL ||
      process.env.TRADEHAX_EMBEDDING_MODEL ||
      "sentence-transformers/all-MiniLM-L6-v2",
  ).trim();
}

function getEmbeddingClient() {
  const token = String(process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN || "").trim();
  if (!token) return null;
  return new HfInference(token);
}

function toEmbeddingVector(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [] as number[];
  }

  if (typeof raw[0] === "number") {
    return (raw as number[]).map((value) => Number(value));
  }

  if (Array.isArray(raw[0])) {
    const matrix = raw as number[][];
    const width = matrix[0]?.length || 0;
    if (width === 0) return [];
    const accum = new Array<number>(width).fill(0);
    let rows = 0;
    for (const row of matrix) {
      if (!Array.isArray(row) || row.length !== width) continue;
      for (let index = 0; index < width; index += 1) {
        accum[index] += Number(row[index] || 0);
      }
      rows += 1;
    }
    if (rows === 0) return [];
    return accum.map((value) => value / rows);
  }

  return [] as number[];
}

async function embedText(text: string) {
  const cleaned = sanitizePlainText(text, 4_000);
  const store = getStore();
  const key = hashValue(`embed:${cleaned}`);
  const cached = store.embeddingCache.get(key);
  if (cached) return cached;

  const client = getEmbeddingClient();
  if (!client) return null;

  try {
    const response = await client.featureExtraction({
      model: getEmbeddingModel(),
      inputs: cleaned,
    });
    const vector = toEmbeddingVector(response);
    if (vector.length > 0) {
      store.embeddingCache.set(key, vector);
      if (store.embeddingCache.size > 2_000) {
        const first = store.embeddingCache.keys().next().value;
        if (first) store.embeddingCache.delete(first);
      }
      return vector;
    }
    return null;
  } catch {
    return null;
  }
}

export async function upsertHivemindMemoryRecord(input: {
  userId: string;
  text: string;
  source?: HivemindMemorySource;
  route?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  id?: string;
}) {
  const store = getStore();
  const userId = normalizeUserId(input.userId);
  const text = sanitizePlainText(String(input.text || ""), 3_200);
  if (!text) {
    throw new Error("Memory text is required.");
  }

  const source = input.source || "manual";
  const tags = normalizeTags(input.tags);
  const id = input.id || `hmem_${hashValue(`${userId}:${source}:${text}`)}`;
  const existing = store.records.get(id);
  const createdAt = existing?.createdAt || nowIso();
  const embedding = await embedText(text);

  const record: HivemindMemoryRecord = {
    id,
    userId,
    text,
    source,
    route: input.route ? sanitizePlainText(input.route, 180) : undefined,
    tags,
    metadata:
      input.metadata && typeof input.metadata === "object"
        ? Object.fromEntries(
            Object.entries(input.metadata)
              .slice(0, 40)
              .map(([key, value]) => [sanitizePlainText(key, 60), value]),
          )
        : {},
    embedding: embedding || existing?.embedding,
    createdAt,
    updatedAt: nowIso(),
  };

  store.records.set(id, record);
  return record;
}

export async function queryHivemindMemory(input: {
  userId?: string;
  query: string;
  limit?: number;
  minScore?: number;
}) {
  const store = getStore();
  const limit = Math.min(30, Math.max(1, Math.floor(input.limit || 8)));
  const minScore = Math.min(1, Math.max(0, Number(input.minScore ?? 0.15)));
  const query = sanitizePlainText(String(input.query || ""), 1_000);
  if (!query) return [] as HivemindMemoryQueryResult[];

  const normalizedUser = input.userId ? normalizeUserId(input.userId) : null;
  const queryEmbedding = await embedText(query);

  const ranked: HivemindMemoryQueryResult[] = [];
  for (const record of store.records.values()) {
    if (normalizedUser && record.userId !== normalizedUser) {
      continue;
    }

    let score = lexicalSimilarity(query, `${record.text} ${record.tags.join(" ")}`);
    if (queryEmbedding && record.embedding && record.embedding.length === queryEmbedding.length) {
      const semantic = (cosineSimilarity(queryEmbedding, record.embedding) + 1) / 2;
      score = score * 0.35 + semantic * 0.65;
    }

    if (score < minScore) {
      continue;
    }

    ranked.push({
      id: record.id,
      userId: record.userId,
      source: record.source,
      text: record.text,
      route: record.route,
      tags: record.tags,
      createdAt: record.createdAt,
      score: Number.parseFloat(score.toFixed(4)),
    });
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function listHivemindMemoryRecords(input?: { userId?: string; limit?: number }) {
  const store = getStore();
  const limit = Math.min(500, Math.max(1, Math.floor(input?.limit || 100)));
  const normalizedUser = input?.userId ? normalizeUserId(input.userId) : null;

  const rows = Array.from(store.records.values())
    .filter((record) => (normalizedUser ? record.userId === normalizedUser : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);

  return rows;
}

export async function syncHivemindMemoryFromProfile(userId: string) {
  const profile = getTradingBehaviorProfile(userId);
  const inserted: HivemindMemoryRecord[] = [];

  for (const outcome of profile.recentOutcomes.slice(0, 80)) {
    const text = [
      `Trade outcome for ${outcome.symbol}`,
      `Regime: ${outcome.regime}`,
      `Side: ${outcome.side}`,
      `PnL: ${outcome.pnlPercent.toFixed(2)}%`,
      `Confidence: ${outcome.confidence.toFixed(2)}`,
      `Indicators: ${outcome.indicatorsUsed.join(", ") || "none"}`,
      outcome.notes ? `Notes: ${outcome.notes}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const memory = await upsertHivemindMemoryRecord({
      id: `hmem_trade_${outcome.id}`,
      userId: profile.userId,
      text,
      source: "trade_outcome",
      tags: [outcome.symbol.toLowerCase(), outcome.regime, outcome.side, ...outcome.indicatorsUsed],
      metadata: {
        outcomeId: outcome.id,
        pnlPercent: outcome.pnlPercent,
        confidence: outcome.confidence,
      },
    });

    inserted.push(memory);
  }

  return {
    userId: profile.userId,
    inserted: inserted.length,
    latest: inserted.slice(0, 5),
  };
}

export function getHivemindMemoryIndexStatus() {
  const store = getStore();
  const records = Array.from(store.records.values());
  const recordsWithEmbeddings = records.filter((record) => Array.isArray(record.embedding) && record.embedding.length > 0).length;

  const bySource = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.source] = (acc[record.source] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: nowIso(),
    totalRecords: records.length,
    recordsWithEmbeddings,
    embeddingModel: getEmbeddingModel(),
    embeddingConfigured: Boolean(getEmbeddingClient()),
    usersTracked: new Set(records.map((record) => record.userId)).size,
    bySource,
  };
}
