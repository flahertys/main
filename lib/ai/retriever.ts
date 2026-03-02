import {
  queryHfDatasetIntelligence,
  type HfDatasetIntelligenceRow,
} from "@/lib/ai/hf-dataset-intelligence";
import {
    listPersistedRetrievalEmbeddings,
    persistRetrievalEmbeddingsSnapshot,
    type RetrievalEmbeddingInputRow,
} from "@/lib/ai/retrieval-persistence";
import { SITE_ROUTE_CATALOG } from "@/lib/ai/site-map";
import { sanitizePlainText } from "@/lib/security";
import { HfInference } from "@huggingface/inference";
import { Index } from "@upstash/vector";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type RetrievalChunk = {
  id: string;
  title: string;
  path: string;
  score: number;
  snippet: string;
  sourceType: "route" | "doc";
};

type RetrievalDoc = {
  id: string;
  title: string;
  path: string;
  text: string;
  tags: string[];
  sourceType: "route" | "doc";
  chunkIndex: number;
};

type CorpusCache = {
  docs: RetrievalDoc[];
  builtAt: number;
};

const MAX_MARKDOWN_FILES = 220;
const MAX_DOC_CHUNKS = 850;
const CORPUS_REBUILD_MS = 5 * 60_000;
const EMBED_PREFILTER_LIMIT = 28;
const MAX_PERSISTED_ROWS = 8_000;
const UPSTASH_RETRIEVAL_BOOST = 1.04;
const UPSTASH_MAX_TOP_K = 20;

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "out",
  "dist",
  "coverage",
  "archive",
  "public",
]);

let upstashWarningLogged = false;

function getGlobalCaches() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_RETRIEVAL_CORPUS__?: CorpusCache;
    __TRADEHAX_RETRIEVAL_EMBEDDINGS__?: Map<string, number[]>;
    __TRADEHAX_RETRIEVAL_SNAPSHOT_HYDRATED_AT__?: number;
  };

  if (!globalRef.__TRADEHAX_RETRIEVAL_EMBEDDINGS__) {
    globalRef.__TRADEHAX_RETRIEVAL_EMBEDDINGS__ = new Map<string, number[]>();
  }

  return {
    get corpus() {
      return globalRef.__TRADEHAX_RETRIEVAL_CORPUS__;
    },
    set corpus(value: CorpusCache | undefined) {
      globalRef.__TRADEHAX_RETRIEVAL_CORPUS__ = value;
    },
    embeddingCache: globalRef.__TRADEHAX_RETRIEVAL_EMBEDDINGS__,
    get hydratedAt() {
      return globalRef.__TRADEHAX_RETRIEVAL_SNAPSHOT_HYDRATED_AT__ || 0;
    },
    set hydratedAt(value: number) {
      globalRef.__TRADEHAX_RETRIEVAL_SNAPSHOT_HYDRATED_AT__ = value;
    },
  };
}

function normalizeMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]*\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[>*_~|-]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function titleFromPath(filePath: string) {
  const base = path.basename(filePath).replace(/\.(md|mdx)$/i, "");
  return base
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function chunkText(content: string, maxChars = 900, overlapChars = 120) {
  const normalized = normalizeMarkdown(content);
  if (!normalized) return [] as string[];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }

      for (let index = 0; index < sentence.length; index += maxChars - overlapChars) {
        chunks.push(sentence.slice(index, index + maxChars).trim());
      }
      continue;
    }

    if ((current + " " + sentence).trim().length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      const tail = current.slice(Math.max(0, current.length - overlapChars));
      current = `${tail} ${sentence}`.trim();
      continue;
    }

    current = `${current} ${sentence}`.trim();
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter(Boolean);
}

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function textEmbeddingKey(value: string) {
  const normalized = sanitizePlainText(value, 4_000);
  return hashText(normalized);
}

function contentHashFromText(value: string) {
  return hashText(normalizeMarkdown(value));
}

function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    const va = a[index] as number;
    const vb = b[index] as number;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (!Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }

  return dot / denominator;
}

function meanPoolMatrix(matrix: number[][]) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    return [] as number[];
  }

  const width = matrix[0]?.length || 0;
  if (width === 0) {
    return [] as number[];
  }

  const accum = new Array<number>(width).fill(0);
  let rowCount = 0;

  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== width) {
      continue;
    }

    for (let index = 0; index < width; index += 1) {
      accum[index] += Number(row[index] || 0);
    }
    rowCount += 1;
  }

  if (rowCount === 0) {
    return [] as number[];
  }

  return accum.map((value) => value / rowCount);
}

function toEmbeddingVector(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [] as number[];
  }

  if (typeof raw[0] === "number") {
    return (raw as number[]).map((value) => Number(value));
  }

  if (Array.isArray(raw[0])) {
    return meanPoolMatrix(raw as number[][]);
  }

  return [] as number[];
}

function getEmbeddingModel() {
  return String(process.env.TRADEHAX_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2").trim();
}

function getEmbeddingClient() {
  const token = String(
    process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN || "",
  ).trim();
  if (!token) {
    return null;
  }
  return new HfInference(token);
}

function getUpstashVectorIndex() {
  const url = String(process.env.UPSTASH_VECTOR_REST_URL || "").trim();
  const token = String(process.env.UPSTASH_VECTOR_REST_TOKEN || "").trim();
  if (!url || !token) {
    return null;
  }

  return new Index({
    url,
    token,
  });
}

function resolveUpstashSourceType(value: unknown): "route" | "doc" {
  if (value === "route") return "route";
  return "doc";
}

function parseUpstashScore(raw: unknown) {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

async function queryUpstashRetrieval(args: { queryVector: number[]; limit: number }) {
  const index = getUpstashVectorIndex();
  if (!index || !Array.isArray(args.queryVector) || args.queryVector.length === 0) {
    return [] as RetrievalChunk[];
  }

  const bounded = Math.min(UPSTASH_MAX_TOP_K, Math.max(1, args.limit));

  try {
    const response = await index.query({
      vector: args.queryVector,
      topK: bounded,
      includeMetadata: true,
    });

    const rows = Array.isArray(response) ? response : [];
    return rows
      .map((row, idx) => {
        const metadata =
          row && typeof row === "object" && "metadata" in row
            ? ((row as { metadata?: unknown }).metadata as Record<string, unknown> | undefined)
            : undefined;
        const title = sanitizePlainText(String(metadata?.title || metadata?.name || "Knowledge Base"), 120) || "Knowledge Base";
        const path = sanitizePlainText(String(metadata?.path || metadata?.sourcePath || "upstash://vector"), 280) || "upstash://vector";
        const snippet =
          sanitizePlainText(
            String(metadata?.text || metadata?.snippet || metadata?.content || metadata?.summary || ""),
            240,
          ) || "External retrieval context loaded from vector store.";

        const idFromRow =
          row && typeof row === "object" && "id" in row
            ? sanitizePlainText(String((row as { id?: unknown }).id || ""), 140)
            : "";

        const scoreRaw =
          row && typeof row === "object" && "score" in row
            ? (row as { score?: unknown }).score
            : 0;

        const score = Math.max(0, parseUpstashScore(scoreRaw) * UPSTASH_RETRIEVAL_BOOST);

        return {
          id: idFromRow || `upstash-${idx}-${hashText(`${title}:${path}:${snippet}`)}`,
          title,
          path,
          score: Number.parseFloat(score.toFixed(3)),
          snippet,
          sourceType: resolveUpstashSourceType(metadata?.sourceType),
        } satisfies RetrievalChunk;
      })
      .filter((chunk) => chunk.snippet.length > 0);
  } catch (error) {
    if (!upstashWarningLogged) {
      upstashWarningLogged = true;
      console.warn("upstash retrieval skipped", error);
    }
    return [] as RetrievalChunk[];
  }
}

function mergeRetrievalResults(local: RetrievalChunk[], external: RetrievalChunk[], limit: number) {
  const merged = [...local, ...external];
  const dedup = new Map<string, RetrievalChunk>();

  for (const chunk of merged) {
    const key = `${chunk.path.toLowerCase()}::${chunk.snippet.toLowerCase().slice(0, 80)}`;
    const existing = dedup.get(key);
    if (!existing || chunk.score > existing.score) {
      dedup.set(key, chunk);
    }
  }

  return Array.from(dedup.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((chunk) => ({
      ...chunk,
      score: Number.parseFloat(chunk.score.toFixed(3)),
    }));
}

function mapHfRowsToChunks(rows: HfDatasetIntelligenceRow[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    path: row.path,
    score: Number.parseFloat(row.score.toFixed(3)),
    snippet: sanitizePlainText(row.snippet, 240),
    sourceType: "doc" as const,
  }));
}

async function walkMarkdownFiles(rootDir: string, relativeDir = ""): Promise<string[]> {
  const absoluteDir = path.join(rootDir, relativeDir);
  let entries: Array<{
    name: string | Buffer;
    isDirectory: () => boolean;
    isFile: () => boolean;
  }> = [];
  try {
    entries = (await fs.readdir(absoluteDir, { withFileTypes: true })) as unknown as Array<{
      name: string | Buffer;
      isDirectory: () => boolean;
      isFile: () => boolean;
    }>;
  } catch {
    return [];
  }

  const output: string[] = [];
  for (const entry of entries) {
    const entryName = String(entry.name);
    const childRelative = path.join(relativeDir, entryName);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entryName)) {
        continue;
      }
      const nested = await walkMarkdownFiles(rootDir, childRelative);
      output.push(...nested);
      if (output.length >= MAX_MARKDOWN_FILES) {
        return output.slice(0, MAX_MARKDOWN_FILES);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (/\.(md|mdx)$/i.test(entryName)) {
      output.push(childRelative.replace(/\\/g, "/"));
      if (output.length >= MAX_MARKDOWN_FILES) {
        return output.slice(0, MAX_MARKDOWN_FILES);
      }
    }
  }

  return output;
}

async function buildRouteDocs() {
  return SITE_ROUTE_CATALOG.map((route, index) => ({
    id: `route-${route.path}`,
    title: route.title,
    path: route.path,
    text: `${route.summary} Audience: ${route.audience}. Tags: ${route.tags.join(", ")}`,
    tags: route.tags,
    sourceType: "route" as const,
    chunkIndex: index,
  }));
}

async function buildMarkdownDocs() {
  const workspaceRoot = process.cwd();
  const files = await walkMarkdownFiles(workspaceRoot);
  const docs: RetrievalDoc[] = [];

  for (const relativePath of files) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    try {
      const raw = await fs.readFile(absolutePath, "utf8");
      const chunks = chunkText(raw, 900, 120);
      if (chunks.length === 0) {
        continue;
      }

      const title = titleFromPath(relativePath);
      const tagHints = relativePath
        .replace(/\.(md|mdx)$/i, "")
        .split(/[\/._-]+/)
        .map((token) => token.toLowerCase())
        .filter((token) => token.length >= 3)
        .slice(0, 12);

      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index] as string;
        const id = `doc-${hashText(`${relativePath}:${index}:${chunk.slice(0, 120)}`)}`;
        docs.push({
          id,
          title,
          path: `/${relativePath}`,
          text: chunk,
          tags: tagHints,
          sourceType: "doc",
          chunkIndex: index,
        });

        if (docs.length >= MAX_DOC_CHUNKS) {
          return docs;
        }
      }
    } catch {
      // Skip unreadable docs and continue.
    }
  }

  return docs;
}

function tokenize(input: string) {
  return sanitizePlainText(input, 800)
    .toLowerCase()
    .split(/[^a-z0-9/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 24);
}

async function hydrateEmbeddingsFromSnapshot(docs: RetrievalDoc[]) {
  const caches = getGlobalCaches();
  const model = getEmbeddingModel();

  const rows = await listPersistedRetrievalEmbeddings(model, MAX_PERSISTED_ROWS);
  if (!rows.length) {
    return {
      hydrated: 0,
      rows: 0,
    };
  }

  const index = new Map<string, number[]>();
  for (const row of rows) {
    if (!Array.isArray(row.embedding) || row.embedding.length === 0) {
      continue;
    }
    index.set(`${row.doc_id}:${row.content_hash}`, row.embedding);
  }

  let hydrated = 0;
  for (const doc of docs) {
    const contentHash = contentHashFromText(doc.text);
    const vector = index.get(`${doc.id}:${contentHash}`);
    if (!vector) continue;

    caches.embeddingCache.set(textEmbeddingKey(doc.text), vector);
    hydrated += 1;
  }

  caches.hydratedAt = Date.now();
  return {
    hydrated,
    rows: rows.length,
  };
}

async function getCorpus(options?: { forceRebuild?: boolean; hydrateSnapshot?: boolean }) {
  const caches = getGlobalCaches();
  const now = Date.now();
  const forceRebuild = options?.forceRebuild === true;

  if (!forceRebuild && caches.corpus && now - caches.corpus.builtAt < CORPUS_REBUILD_MS) {
    return caches.corpus.docs;
  }

  const [routeDocs, markdownDocs] = await Promise.all([buildRouteDocs(), buildMarkdownDocs()]);
  const docs = [...routeDocs, ...markdownDocs];

  if (options?.hydrateSnapshot !== false) {
    try {
      await hydrateEmbeddingsFromSnapshot(docs);
    } catch (error) {
      console.warn("retrieval snapshot hydration skipped", error);
    }
  }

  caches.corpus = {
    docs,
    builtAt: now,
  };
  return docs;
}

function scoreDocument(doc: RetrievalDoc, tokens: string[]) {
  const haystack = `${doc.title} ${doc.text} ${doc.tags.join(" ")}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (doc.tags.some((tag) => tag.includes(token) || token.includes(tag))) {
      score += 2.2;
    }
    if (doc.title.toLowerCase().includes(token)) {
      score += 1.5;
    }
    if (haystack.includes(token)) {
      score += 0.9;
    }
    if (doc.path.toLowerCase() === token || doc.path.toLowerCase().includes(token)) {
      score += 1.1;
    }
  }
  if (doc.sourceType === "doc") {
    score += 0.15;
  }
  return score;
}

function toChunk(doc: RetrievalDoc, score: number): RetrievalChunk {
  return {
    id: doc.id,
    title: doc.title,
    path: doc.path,
    score: Number.parseFloat(score.toFixed(3)),
    snippet: sanitizePlainText(doc.text, 240),
    sourceType: doc.sourceType,
  };
}

async function embedTextWithCache(text: string) {
  const caches = getGlobalCaches();
  const normalized = sanitizePlainText(text, 4_000);
  const key = textEmbeddingKey(normalized);
  const cached = caches.embeddingCache.get(key);
  if (cached) {
    return cached;
  }

  const client = getEmbeddingClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.featureExtraction({
      model: getEmbeddingModel(),
      inputs: normalized,
    });
    const vector = toEmbeddingVector(response);
    if (vector.length > 0) {
      caches.embeddingCache.set(key, vector);
      if (caches.embeddingCache.size > 1_200) {
        const firstKey = caches.embeddingCache.keys().next().value;
        if (firstKey) {
          caches.embeddingCache.delete(firstKey);
        }
      }
      return vector;
    }
    return null;
  } catch {
    return null;
  }
}

export async function retrieveRelevantContext(query: string, limit = 4) {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [] as RetrievalChunk[];
  }

  const bounded = Math.min(12, Math.max(1, Math.floor(limit)));
  const corpus = await getCorpus();
  const queryVector = await embedTextWithCache(query);

  const lexicalRanked = corpus
    .map((doc) => ({ doc, lexicalScore: scoreDocument(doc, tokens) }))
    .filter((entry) => entry.lexicalScore > 0)
    .sort((left, right) => right.lexicalScore - left.lexicalScore)
    .slice(0, EMBED_PREFILTER_LIMIT);

  if (lexicalRanked.length === 0) {
    const hfDatasetRows = await queryHfDatasetIntelligence(query, Math.min(6, bounded));
    const hfChunks = mapHfRowsToChunks(hfDatasetRows);

    if (!queryVector) {
      return hfChunks.slice(0, bounded);
    }

    const upstashResults = await queryUpstashRetrieval({
      queryVector,
      limit: bounded,
    });

    if (upstashResults.length === 0) {
      return hfChunks.slice(0, bounded);
    }

    if (hfChunks.length === 0) {
      return upstashResults.slice(0, bounded);
    }

    return mergeRetrievalResults(upstashResults, hfChunks, bounded);
  }

  if (!queryVector) {
    const lexicalOnly = lexicalRanked
      .slice(0, bounded)
      .map((entry) => toChunk(entry.doc, entry.lexicalScore));

    const hfDatasetRows = await queryHfDatasetIntelligence(query, Math.min(6, bounded));
    const hfChunks = mapHfRowsToChunks(hfDatasetRows);

    if (hfChunks.length === 0) {
      return lexicalOnly;
    }

    return mergeRetrievalResults(lexicalOnly, hfChunks, bounded);
  }

  const maxLexical = lexicalRanked[0]?.lexicalScore || 1;

  const reranked = await Promise.all(
    lexicalRanked.map(async (entry) => {
      const candidateVector = await embedTextWithCache(entry.doc.text);
      const cosine = candidateVector ? cosineSimilarity(queryVector, candidateVector) : 0;
      const lexicalNormalized = entry.lexicalScore / maxLexical;
      const cosineNormalized = (cosine + 1) / 2;
      const finalScore = lexicalNormalized * 0.35 + cosineNormalized * 0.65;

      return {
        doc: entry.doc,
        score: finalScore,
      };
    }),
  );

  const localResults = reranked
    .sort((left, right) => right.score - left.score)
    .slice(0, bounded)
    .map((entry) => toChunk(entry.doc, entry.score));

  const [upstashResults, hfDatasetRows] = await Promise.all([
    queryUpstashRetrieval({
      queryVector,
      limit: Math.min(UPSTASH_MAX_TOP_K, bounded * 2),
    }),
    queryHfDatasetIntelligence(query, Math.min(6, bounded)),
  ]);

  const hfChunks = mapHfRowsToChunks(hfDatasetRows);
  const externalResults = [...upstashResults, ...hfChunks];

  if (externalResults.length === 0) {
    return localResults;
  }

  return mergeRetrievalResults(localResults, externalResults, bounded);
}

export async function rebuildAndPersistRetrievalSnapshot() {
  const embeddingClient = getEmbeddingClient();
  if (!embeddingClient) {
    throw new Error("HF_API_TOKEN is required for retrieval snapshot generation.");
  }

  const model = getEmbeddingModel();
  const docs = await getCorpus({ forceRebuild: true, hydrateSnapshot: false });
  const caches = getGlobalCaches();

  const rows: RetrievalEmbeddingInputRow[] = [];
  let cachedVectors = 0;
  let generatedVectors = 0;

  for (const doc of docs) {
    const key = textEmbeddingKey(doc.text);
    let vector = caches.embeddingCache.get(key);
    if (vector && vector.length > 0) {
      cachedVectors += 1;
    } else {
      vector = await embedTextWithCache(doc.text);
      if (vector && vector.length > 0) {
        generatedVectors += 1;
      }
    }

    if (!vector || vector.length === 0) {
      continue;
    }

    rows.push({
      id: `ret_${hashText(`${model}:${doc.id}`)}`,
      model,
      doc_id: doc.id,
      title: doc.title,
      path: doc.path,
      source_type: doc.sourceType,
      chunk_index: doc.chunkIndex,
      content_hash: contentHashFromText(doc.text),
      text: sanitizePlainText(doc.text, 4_000),
      tags: doc.tags.slice(0, 24),
      embedding: vector,
    });
  }

  const persisted = await persistRetrievalEmbeddingsSnapshot({
    model,
    rows,
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    model,
    docsIndexed: docs.length,
    vectorsPrepared: rows.length,
    vectorsFromCache: cachedVectors,
    vectorsGenerated: generatedVectors,
    persisted,
  };
}

export function formatRetrievalContext(chunks: RetrievalChunk[]) {
  return chunks
    .slice(0, 6)
    .map((chunk, index) => `${index + 1}. [${chunk.sourceType}] ${chunk.title} (${chunk.path}) - ${chunk.snippet}`)
    .join("\n");
}
