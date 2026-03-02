import { sanitizePlainText } from "@/lib/security";

type HfDatasetApiRow = {
  id?: string;
  description?: string;
  likes?: number;
  downloads?: number;
  tags?: string[];
  cardData?: Record<string, unknown>;
};

export type HfDatasetIntelligenceRow = {
  id: string;
  title: string;
  path: string;
  snippet: string;
  score: number;
};

type HfCacheEntry = {
  createdAt: number;
  rows: HfDatasetIntelligenceRow[];
};

const HF_DATASETS_API = "https://huggingface.co/api/datasets";
const HF_CACHE_TTL_MS = 2 * 60_000;
const HF_REQUEST_TIMEOUT_MS = 1_400;

function parseBoolean(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function getDatasetIntelEnabled() {
  return parseBoolean(String(process.env.TRADEHAX_HF_DATASET_INTEL_ENABLED || "true"), true);
}

function getDatasetIntelLimit() {
  const parsed = Number.parseInt(String(process.env.TRADEHAX_HF_DATASET_INTEL_LIMIT || "4"), 10);
  if (!Number.isFinite(parsed)) {
    return 4;
  }
  return Math.max(1, Math.min(10, parsed));
}

function getHfToken() {
  return String(
    process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN || "",
  ).trim();
}

function getHfCacheStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_HF_DATASET_INTEL_CACHE__?: Map<string, HfCacheEntry>;
  };

  if (!globalRef.__TRADEHAX_HF_DATASET_INTEL_CACHE__) {
    globalRef.__TRADEHAX_HF_DATASET_INTEL_CACHE__ = new Map<string, HfCacheEntry>();
  }

  return globalRef.__TRADEHAX_HF_DATASET_INTEL_CACHE__;
}

function makeSnippet(row: HfDatasetApiRow) {
  const description = sanitizePlainText(String(row.description || ""), 190);

  const tags = Array.isArray(row.tags)
    ? row.tags.map((tag) => sanitizePlainText(String(tag || ""), 32)).filter(Boolean).slice(0, 4)
    : [];

  const cardData = row.cardData && typeof row.cardData === "object" ? row.cardData : {};
  const taskCategories = Array.isArray(cardData.task_categories)
    ? cardData.task_categories
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "id" in entry) return String((entry as { id?: unknown }).id || "");
        return "";
      })
      .filter(Boolean)
      .slice(0, 3)
    : [];

  const language = Array.isArray(cardData.language)
    ? cardData.language.map((entry) => String(entry || "")).filter(Boolean).slice(0, 3)
    : [];

  const metadataSegments = [
    taskCategories.length ? `Tasks: ${taskCategories.join(", ")}` : "",
    language.length ? `Language: ${language.join(", ")}` : "",
    tags.length ? `Tags: ${tags.join(", ")}` : "",
  ].filter(Boolean);

  const metadata = sanitizePlainText(metadataSegments.join(" | "), 150);

  if (description && metadata) {
    return `${description} (${metadata})`;
  }

  return description || metadata || "Hugging Face dataset intelligence source.";
}

function computeScore(row: HfDatasetApiRow, position: number) {
  const likes = Math.max(0, Number(row.likes || 0));
  const downloads = Math.max(0, Number(row.downloads || 0));
  const positionScore = Math.max(0, 1 - position * 0.1);
  const popularity = Math.min(0.45, Math.log10(downloads + 1) / 10 + likes / 10_000);
  return Number.parseFloat(Math.max(0.05, positionScore + popularity).toFixed(3));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function queryHfDatasetIntelligence(query: string, requestedLimit?: number) {
  if (!getDatasetIntelEnabled()) {
    return [] as HfDatasetIntelligenceRow[];
  }

  const normalizedQuery = sanitizePlainText(query, 160).trim();
  if (!normalizedQuery) {
    return [] as HfDatasetIntelligenceRow[];
  }

  const limit = Math.max(1, Math.min(10, requestedLimit || getDatasetIntelLimit()));
  const cacheKey = `${normalizedQuery.toLowerCase()}::${limit}`;
  const cacheStore = getHfCacheStore();
  const cached = cacheStore.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < HF_CACHE_TTL_MS) {
    return cached.rows;
  }

  const token = getHfToken();
  const searchLimit = Math.max(limit * 2, 6);
  const url = `${HF_DATASETS_API}?search=${encodeURIComponent(normalizedQuery)}&limit=${searchLimit}&full=true`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      HF_REQUEST_TIMEOUT_MS,
    );

    if (!response.ok) {
      return [] as HfDatasetIntelligenceRow[];
    }

    const json = (await response.json()) as unknown;
    const rows = Array.isArray(json) ? (json as HfDatasetApiRow[]) : [];

    const mapped = rows
      .map((row, index) => {
        const datasetId = sanitizePlainText(String(row.id || ""), 180);
        if (!datasetId) return null;

        return {
          id: `hfds-${datasetId}`,
          title: datasetId,
          path: `hf://dataset/${datasetId}`,
          snippet: makeSnippet(row),
          score: computeScore(row, index),
        } satisfies HfDatasetIntelligenceRow;
      })
      .filter((row): row is HfDatasetIntelligenceRow => Boolean(row))
      .slice(0, limit);

    cacheStore.set(cacheKey, {
      createdAt: Date.now(),
      rows: mapped,
    });

    if (cacheStore.size > 180) {
      const first = cacheStore.keys().next().value;
      if (first) {
        cacheStore.delete(first);
      }
    }

    return mapped;
  } catch {
    return [] as HfDatasetIntelligenceRow[];
  }
}
