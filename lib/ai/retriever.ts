import { SITE_ROUTE_CATALOG } from "@/lib/ai/site-map";
import { sanitizePlainText } from "@/lib/security";

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
};

const DOC_KNOWLEDGE: RetrievalDoc[] = [
  {
    id: "doc-deploy-quickstart",
    title: "Deployment Quickstart",
    path: "/DEPLOYMENT_QUICKSTART.md",
    text: "Use local quality checks before deployment. Ensure Vercel environment variables, domain configuration, and deployment preflight pass.",
    tags: ["deploy", "vercel", "preflight", "production"],
    sourceType: "doc",
  },
  {
    id: "doc-testing-guide",
    title: "Testing Guide",
    path: "/TESTING_GUIDE.md",
    text: "Run lint, type-check, and build to validate application quality. Prioritize root-cause fixes and avoid shipping unverified changes.",
    tags: ["testing", "lint", "type-check", "build", "quality"],
    sourceType: "doc",
  },
  {
    id: "doc-monetization",
    title: "Monetization Guide",
    path: "/MONETIZATION_GUIDE.md",
    text: "Monetization controls include plan gating, billing routes, and usage tracking to enforce feature access across AI workflows.",
    tags: ["billing", "pricing", "plans", "premium"],
    sourceType: "doc",
  },
  {
    id: "doc-intelligence-summary",
    title: "Intelligence Build Log",
    path: "/INTELLIGENCE_BUILD_LOG.md",
    text: "Intelligence surfaces focus on market context, signal workflows, and operational visibility for active traders.",
    tags: ["intelligence", "market", "signals", "analytics"],
    sourceType: "doc",
  },
];

function tokenize(input: string) {
  return sanitizePlainText(input, 800)
    .toLowerCase()
    .split(/[^a-z0-9/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 24);
}

function getCorpus(): RetrievalDoc[] {
  const routeDocs: RetrievalDoc[] = SITE_ROUTE_CATALOG.map((route) => ({
    id: `route-${route.path}`,
    title: route.title,
    path: route.path,
    text: `${route.summary} Audience: ${route.audience}`,
    tags: route.tags,
    sourceType: "route",
  }));

  return [...routeDocs, ...DOC_KNOWLEDGE];
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
  return score;
}

function toChunk(doc: RetrievalDoc, score: number): RetrievalChunk {
  return {
    id: doc.id,
    title: doc.title,
    path: doc.path,
    score: Number.parseFloat(score.toFixed(3)),
    snippet: sanitizePlainText(doc.text, 220),
    sourceType: doc.sourceType,
  };
}

export function retrieveRelevantContext(query: string, limit = 4) {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [] as RetrievalChunk[];
  }

  const bounded = Math.min(12, Math.max(1, Math.floor(limit)));
  return getCorpus()
    .map((doc) => ({ doc, score: scoreDocument(doc, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, bounded)
    .map((entry) => toChunk(entry.doc, entry.score));
}

export function formatRetrievalContext(chunks: RetrievalChunk[]) {
  return chunks
    .slice(0, 6)
    .map((chunk, index) => `${index + 1}. [${chunk.sourceType}] ${chunk.title} (${chunk.path}) - ${chunk.snippet}`)
    .join("\n");
}
