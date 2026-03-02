#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const DEFAULT_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const DEFAULT_HF_QUERIES = ["trading", "crypto", "market structure", "risk management"];
const IGNORE_DIRS = new Set([".git", ".next", "node_modules", "dist", "out", "coverage", "archive", "public"]);

function getEnv(name, fallback = "") {
  const value = process.env[name];
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function parseIntEnv(name, fallback, min, max) {
  const raw = getEnv(name, String(fallback));
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function parseBoolEnv(name, fallback) {
  const raw = getEnv(name, fallback ? "true" : "false").toLowerCase();
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function normalizeText(value, max = 1800) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function walkMarkdownFiles(rootDir, relativeDir = "") {
  const absoluteDir = path.join(rootDir, relativeDir);
  let entries = [];
  try {
    entries = await fs.promises.readdir(absoluteDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const output = [];
  for (const entry of entries) {
    const entryName = String(entry.name);
    const childRelative = path.join(relativeDir, entryName);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entryName)) continue;
      const nested = await walkMarkdownFiles(rootDir, childRelative);
      output.push(...nested);
      continue;
    }

    if (!entry.isFile()) continue;
    if (/\.(md|mdx)$/i.test(entryName)) {
      output.push(childRelative.replace(/\\/g, "/"));
    }
  }

  return output;
}

async function collectLocalDocs(maxDocs) {
  const include = parseBoolEnv("TRADEHAX_HF_INGEST_INCLUDE_LOCAL_DOCS", true);
  if (!include) return [];

  const files = await walkMarkdownFiles(process.cwd());
  const rows = [];

  for (const rel of files.slice(0, maxDocs)) {
    const abs = path.resolve(process.cwd(), rel);
    try {
      const raw = await fs.promises.readFile(abs, "utf8");
      const text = normalizeText(raw, 2200);
      if (!text) continue;

      rows.push({
        id: `local-${rel.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
        title: rel,
        path: `/${rel}`,
        text,
        source: "local-doc",
      });
    } catch {
      // skip unreadable file
    }
  }

  return rows;
}

async function fetchHfDatasets(query, limit, token) {
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
    return [];
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) return [];

  return rows.slice(0, limit).map((row, index) => {
    const id = normalizeText(row?.id || `dataset-${query}-${index}`, 200);
    const description = normalizeText(row?.description || "", 1000);
    const tags = Array.isArray(row?.tags) ? row.tags.slice(0, 5).join(", ") : "";
    const text = normalizeText(`${description} ${tags ? `Tags: ${tags}` : ""}`, 1800);

    return {
      id: `hfds-${id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: id,
      path: `hf://dataset/${id}`,
      text: text || "Hugging Face dataset intelligence entry.",
      source: "hf-dataset",
    };
  });
}

function toVector(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  if (typeof raw[0] === "number") {
    return raw.map((value) => Number(value));
  }

  if (Array.isArray(raw[0])) {
    const matrix = raw;
    const width = matrix[0]?.length || 0;
    if (!width) return [];
    const accum = new Array(width).fill(0);
    let rows = 0;

    for (const row of matrix) {
      if (!Array.isArray(row) || row.length !== width) continue;
      for (let index = 0; index < width; index += 1) {
        accum[index] += Number(row[index] || 0);
      }
      rows += 1;
    }

    if (!rows) return [];
    return accum.map((value) => value / rows);
  }

  return [];
}

async function embedText(text, token, model) {
  const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${encodeURIComponent(model)}`, {
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
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "embedding error");
    throw new Error(`HF embedding failed: ${response.status} ${err.slice(0, 180)}`);
  }

  const json = await response.json();
  const vector = toVector(json);
  if (!vector.length) {
    throw new Error("HF embedding returned empty vector.");
  }

  return vector;
}

async function main() {
  const upstashUrl = getEnv("UPSTASH_VECTOR_REST_URL");
  const upstashToken = getEnv("UPSTASH_VECTOR_REST_TOKEN");
  const hfToken = getEnv("HF_API_TOKEN") || getEnv("HUGGINGFACE_API_TOKEN") || getEnv("HF_TOKEN");

  if (!upstashUrl || !upstashToken) {
    throw new Error("Missing UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN.");
  }

  if (!hfToken) {
    throw new Error("Missing Hugging Face token (HF_API_TOKEN, HUGGINGFACE_API_TOKEN, or HF_TOKEN).");
  }

  const model = getEnv("TRADEHAX_EMBEDDING_MODEL", DEFAULT_EMBED_MODEL);
  const maxLocalDocs = parseIntEnv("TRADEHAX_HF_INGEST_MAX_DOCS", 80, 1, 500);
  const queryLimit = parseIntEnv("TRADEHAX_HF_INGEST_QUERY_LIMIT", 6, 1, 30);
  const hfQueriesRaw = getEnv("TRADEHAX_HF_INGEST_QUERIES", DEFAULT_HF_QUERIES.join(","));
  const hfQueries = hfQueriesRaw
    .split(",")
    .map((entry) => normalizeText(entry, 80))
    .filter(Boolean)
    .slice(0, 10);

  const [{ Index }, localDocs, ...hfPerQuery] = await Promise.all([
    import("@upstash/vector"),
    collectLocalDocs(maxLocalDocs),
    ...hfQueries.map((query) => fetchHfDatasets(query, queryLimit, hfToken)),
  ]);

  const index = new Index({
    url: upstashUrl,
    token: upstashToken,
  });

  const hfDocs = hfPerQuery.flat();
  const allDocs = [...localDocs, ...hfDocs];

  if (!allDocs.length) {
    console.log("No documents found to ingest.");
    return;
  }

  console.log(`Ingesting ${allDocs.length} intelligence docs into Upstash...`);

  let upserted = 0;
  let skipped = 0;

  for (let i = 0; i < allDocs.length; i += 1) {
    const doc = allDocs[i];
    try {
      const vector = await embedText(doc.text, hfToken, model);
      await index.upsert([
        {
          id: doc.id,
          vector,
          metadata: {
            title: doc.title,
            path: doc.path,
            sourceType: "doc",
            source: doc.source,
            text: doc.text,
            ingestedAt: new Date().toISOString(),
          },
        },
      ]);
      upserted += 1;
      if (upserted % 10 === 0) {
        console.log(`Progress: ${upserted}/${allDocs.length}`);
      }
    } catch (error) {
      skipped += 1;
      console.warn(`Skipped ${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`Done. Upserted: ${upserted}, Skipped: ${skipped}, Total: ${allDocs.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
