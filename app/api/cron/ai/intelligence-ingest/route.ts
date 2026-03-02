import { NextRequest, NextResponse } from "next/server";
import { Index } from "@upstash/vector";
import crypto from "node:crypto";

const DEFAULT_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const DEFAULT_HF_QUERIES = ["trading", "crypto", "market structure", "risk management"];
const UPSERT_BATCH_SIZE = 20;

type IngestDoc = {
  id: string;
  title: string;
  path: string;
  text: string;
  source: "hf-dataset";
  contentHash: string;
};

function isAuthorizedCronRequest(request: NextRequest) {
  const expected = String(process.env.TRADEHAX_CRON_SECRET || "").trim();
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const vercelCron = request.headers.get("x-vercel-cron");

  if (expected && bearer === expected) {
    return true;
  }
  if (vercelCron === "1") {
    return true;
  }
  return false;
}

function getEnv(name: string, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function parseBool(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseIntEnv(name: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(getEnv(name, String(fallback)), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeText(value: unknown, max = 1800) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeId(value: string, fallback = "doc") {
  return normalizeText(value, 220)
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

function hashContent(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function toVector(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) return [] as number[];

  if (typeof raw[0] === "number") {
    return (raw as number[]).map((value) => Number(value));
  }

  if (Array.isArray(raw[0])) {
    const matrix = raw as number[][];
    const width = matrix[0]?.length || 0;
    if (!width) return [] as number[];

    const accum = new Array<number>(width).fill(0);
    let rows = 0;

    for (const row of matrix) {
      if (!Array.isArray(row) || row.length !== width) continue;
      for (let index = 0; index < width; index += 1) {
        accum[index] += Number(row[index] || 0);
      }
      rows += 1;
    }

    if (!rows) return [] as number[];
    return accum.map((value) => value / rows);
  }

  return [] as number[];
}

async function embedText(text: string, token: string, model: string) {
  const response = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${encodeURIComponent(model)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const err = await response.text().catch(() => "embedding error");
    throw new Error(`HF embedding failed: ${response.status} ${err.slice(0, 180)}`);
  }

  const json = (await response.json()) as unknown;
  const vector = toVector(json);
  if (!vector.length) {
    throw new Error("HF embedding returned empty vector.");
  }

  return vector;
}

async function fetchHfDatasets(query: string, limit: number, token: string) {
  const url = `https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&limit=${Math.max(limit * 2, 6)}&full=true`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as IngestDoc[];
  }

  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows)) return [] as IngestDoc[];

  return rows.slice(0, limit).map((row, index) => {
    const entry = row as { id?: string; description?: string; tags?: string[] };
    const id = normalizeText(entry?.id || `dataset-${query}-${index}`, 200);
    const description = normalizeText(entry?.description || "", 1000);
    const tags = Array.isArray(entry?.tags) ? entry.tags.slice(0, 5).join(", ") : "";
    const text = normalizeText(`${description} ${tags ? `Tags: ${tags}` : ""}`, 1800) || "Hugging Face dataset intelligence entry.";

    return {
      id: `hfds-${normalizeId(id, `dataset-${index}`)}`,
      title: id,
      path: `hf://dataset/${id}`,
      text,
      source: "hf-dataset",
      contentHash: hashContent(`${id}\n${text}`),
    } satisfies IngestDoc;
  });
}

async function fetchExistingMetadata(index: Index, ids: string[]) {
  const map = new Map<string, Record<string, unknown>>();
  if (!ids.length) return map;

  const rows = await index.fetch(ids, { includeMetadata: true });
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const id = normalizeText(row.id || "", 240);
    if (!id) continue;
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    map.set(id, metadata as Record<string, unknown>);
  }

  return map;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized cron request.",
      },
      {
        status: 401,
      },
    );
  }

  const upstashUrl = getEnv("UPSTASH_VECTOR_REST_URL");
  const upstashToken = getEnv("UPSTASH_VECTOR_REST_TOKEN");
  const hfToken = getEnv("HF_API_TOKEN") || getEnv("HUGGINGFACE_API_TOKEN") || getEnv("HF_TOKEN");

  if (!upstashUrl || !upstashToken || !hfToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing required ingestion credentials (Upstash and/or Hugging Face token).",
      },
      {
        status: 500,
      },
    );
  }

  const model = getEnv("TRADEHAX_EMBEDDING_MODEL", DEFAULT_EMBED_MODEL);
  const queryLimit = parseIntEnv("TRADEHAX_HF_INGEST_QUERY_LIMIT", 6, 1, 30);
  const deltaEnabled = parseBool(getEnv("TRADEHAX_HF_INGEST_DELTA_ENABLED", "true"), true);
  const forceUpsert = parseBool(getEnv("TRADEHAX_HF_INGEST_FORCE_UPSERT", "false"), false);

  const hfQueriesRaw = getEnv("TRADEHAX_HF_INGEST_QUERIES", DEFAULT_HF_QUERIES.join(","));
  const hfQueries = hfQueriesRaw
    .split(",")
    .map((entry) => normalizeText(entry, 80))
    .filter(Boolean)
    .slice(0, 10);

  try {
    const [perQuery, index] = await Promise.all([
      Promise.all(hfQueries.map((query) => fetchHfDatasets(query, queryLimit, hfToken))),
      Promise.resolve(
        new Index({
          url: upstashUrl,
          token: upstashToken,
        }),
      ),
    ]);

    const deduped = new Map<string, IngestDoc>();
    for (const docs of perQuery) {
      for (const doc of docs) {
        deduped.set(doc.id, doc);
      }
    }

    const allDocs = Array.from(deduped.values());
    if (!allDocs.length) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No Hugging Face intelligence docs discovered.",
      });
    }

    const existing = deltaEnabled && !forceUpsert
      ? await fetchExistingMetadata(index, allDocs.map((doc) => doc.id))
      : new Map<string, Record<string, unknown>>();

    const docsToUpsert = allDocs.filter((doc) => {
      if (!deltaEnabled || forceUpsert) return true;
      const metadata = existing.get(doc.id);
      const previousHash = normalizeText(metadata?.contentHash || "", 120);
      return previousHash !== doc.contentHash;
    });

    let upserted = 0;
    let skippedErrored = 0;

    for (let start = 0; start < docsToUpsert.length; start += UPSERT_BATCH_SIZE) {
      const chunk = docsToUpsert.slice(start, start + UPSERT_BATCH_SIZE);
      const payload: Array<{
        id: string;
        vector: number[];
        metadata: Record<string, unknown>;
      }> = [];

      for (const doc of chunk) {
        try {
          const vector = await embedText(doc.text, hfToken, model);
          payload.push({
            id: doc.id,
            vector,
            metadata: {
              title: doc.title,
              path: doc.path,
              sourceType: "doc",
              source: doc.source,
              text: doc.text,
              contentHash: doc.contentHash,
              ingestedAt: new Date().toISOString(),
            },
          });
        } catch {
          skippedErrored += 1;
        }
      }

      if (!payload.length) continue;
      await index.upsert(payload);
      upserted += payload.length;
    }

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      mode: "hf-dataset-cron",
      model,
      totals: {
        discovered: allDocs.length,
        queued: docsToUpsert.length,
        upserted,
        skippedUnchanged: allDocs.length - docsToUpsert.length,
        skippedErrored,
      },
      ingestConfig: {
        deltaEnabled,
        forceUpsert,
        queryLimit,
        queries: hfQueries,
      },
    });
  } catch (error) {
    console.error("intelligence ingest cron error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to run intelligence ingest cron.",
      },
      {
        status: 500,
      },
    );
  }
}
