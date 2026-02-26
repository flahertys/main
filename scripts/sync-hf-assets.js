#!/usr/bin/env node

/**
 * Sync TradeHax AI assets to the authenticated Hugging Face account.
 *
 * What it does:
 * 1) Detects target HF username via /api/whoami-v2
 * 2) Creates dataset repos (if missing)
 * 3) Uploads local dataset files to those repos
 * 4) Creates model repos (if missing)
 * 5) Uploads README model cards so repos are fully documented
 *
 * Env (optional):
 * - HF_API_TOKEN (required)
 * - HF_TARGET_USER (override detected user)
 * - HF_DATASET_VISIBILITY (public|private, default: public)
 * - HF_MODEL_VISIBILITY (public|private, default: public)
 * - HF_MODEL_REPO_NAMES (comma list)
 * - HF_SYNC_DRY_RUN=true (preview only)
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const HF_API_TOKEN = String(process.env.HF_API_TOKEN || "").trim();
const HF_TARGET_USER = String(process.env.HF_TARGET_USER || "").trim();
const DRY_RUN = String(process.env.HF_SYNC_DRY_RUN || "false").toLowerCase() === "true";

const HF_DATASET_VISIBILITY = String(process.env.HF_DATASET_VISIBILITY || "public").toLowerCase();
const HF_MODEL_VISIBILITY = String(process.env.HF_MODEL_VISIBILITY || "public").toLowerCase();

const DEFAULT_MODEL_REPOS = [
  "tradehax-mistral-finetuned",
  "tradehax-neural-router",
  "tradehax-gpt-ops",
];

const modelRepoNames = String(process.env.HF_MODEL_REPO_NAMES || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const MODEL_REPOS = modelRepoNames.length > 0 ? modelRepoNames : DEFAULT_MODEL_REPOS;

const DATASET_ASSETS = [
  {
    repo: String(process.env.HF_DATASET_NAME || "tradehax-behavioral").trim() || "tradehax-behavioral",
    files: [
      {
        sourcePath: path.join(ROOT, "data", "custom-llm", "train.jsonl"),
        targetPath: "train.jsonl",
      },
    ],
    title: "TradeHax Behavioral Dataset",
    description: "Primary behavioral training rows used by the TradeHax AI experience.",
  },
  {
    repo: "tradehax-ai-training-set",
    files: [
      {
        sourcePath: path.join(ROOT, "ai-training-set.jsonl"),
        targetPath: "ai-training-set.jsonl",
      },
    ],
    title: "TradeHax AI Training Set",
    description: "Core Q&A and route-planning dataset exported for Hugging Face training workflows.",
  },
  {
    repo: "tradehax-crypto-education",
    files: [
      {
        sourcePath: path.join(ROOT, "tradehax-crypto-education.jsonl"),
        targetPath: "tradehax-crypto-education.jsonl",
      },
    ],
    title: "TradeHax Crypto Education",
    description: "Education-focused crypto and Web3 learning dataset.",
  },
  {
    repo: "tradehax-training-expanded",
    files: [
      {
        sourcePath: path.join(ROOT, "tradehax-training-expanded.jsonl"),
        targetPath: "tradehax-training-expanded.jsonl",
      },
    ],
    title: "TradeHax Expanded Training",
    description: "Expanded production-oriented dataset for advanced model behavior.",
  },
  {
    repo: "tradehax-domain-priority",
    files: [
      {
        sourcePath: path.join(ROOT, "tradehax-domain-priority.jsonl"),
        targetPath: "tradehax-domain-priority.jsonl",
      },
    ],
    title: "TradeHax Domain Priority",
    description: "Domain routing and prioritization dataset for TradeHax model orchestration.",
  },
  {
    repo: "tradehax-market-seed",
    files: [
      {
        sourcePath: path.join(ROOT, "data", "external-datasets", "kalshi-seed.jsonl"),
        targetPath: "kalshi-seed.jsonl",
      },
    ],
    title: "TradeHax Market Seed",
    description: "External market seed rows (Kalshi-style events) used for strategy bootstrapping.",
  },
  {
    repo: "tradehax-xai-grok-image-capabilities",
    files: [
      {
        sourcePath: path.join(ROOT, "data", "external-datasets", "xai-grok-image-capabilities.jsonl"),
        targetPath: "xai-grok-image-capabilities.jsonl",
      },
    ],
    title: "TradeHax xAI/Grok Image Capabilities",
    description: "Capability-alignment prompts and responses for xAI/Grok-inspired visual generation behavior.",
  },
  {
    repo: "tradehax-xai-grok-trading-visual-prompts",
    files: [
      {
        sourcePath: path.join(ROOT, "data", "external-datasets", "xai-grok-trading-visual-prompts.jsonl"),
        targetPath: "xai-grok-trading-visual-prompts.jsonl",
      },
    ],
    title: "TradeHax xAI/Grok Trading Visual Prompts",
    description: "Curated trading-scene image prompts and negative prompts tuned for xAI/Grok-inspired visual style.",
  },
  {
    repo: "tradehax-tradebot-training",
    files: [
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "train.chat.jsonl"),
        targetPath: "train.chat.jsonl",
      },
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "train.raw.jsonl"),
        targetPath: "train.raw.jsonl",
      },
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "validation.chat.jsonl"),
        targetPath: "validation.chat.jsonl",
      },
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "validation.raw.jsonl"),
        targetPath: "validation.raw.jsonl",
      },
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "manifest.json"),
        targetPath: "manifest.json",
      },
    ],
    title: "TradeHax Tradebot Training",
    description: "Tradebot supervised and validation corpora plus manifest metadata.",
  },
  {
    repo: "tradehax-tradebot-evaluation",
    files: [
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "eval-suite.jsonl"),
        targetPath: "eval-suite.jsonl",
      },
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "eval-responses.jsonl"),
        targetPath: "eval-responses.jsonl",
      },
      {
        sourcePath: path.join(ROOT, "data", "tradebot", "eval-score.json"),
        targetPath: "eval-score.json",
      },
    ],
    title: "TradeHax Tradebot Evaluation",
    description: "Evaluation prompts, generated responses, and scoring outputs for tradebot quality checks.",
  },
];

if (!HF_API_TOKEN) {
  console.error("❌ HF_API_TOKEN is required. Set it in .env.local/.env or shell env.");
  process.exit(1);
}

const HEADERS = {
  Authorization: `Bearer ${HF_API_TOKEN}`,
};

async function hfJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...HEADERS,
    },
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload && payload.error
      ? payload.error
      : `${response.status} ${response.statusText}`;
    throw new Error(`HF request failed (${url}): ${message}`);
  }

  return payload;
}

async function resolveTargetUser() {
  if (HF_TARGET_USER) return HF_TARGET_USER;
  const whoami = await hfJson("https://huggingface.co/api/whoami-v2");
  const name = String(whoami?.name || "").trim();
  if (!name) {
    throw new Error("Could not resolve authenticated HF username from whoami-v2.");
  }
  return name;
}

async function ensureRepo({ type, name, privateRepo }) {
  const visibility = privateRepo ? "private" : "public";
  if (DRY_RUN) {
    console.log(`🧪 [dry-run] ensure ${type} repo: ${name} (${visibility})`);
    return;
  }

  try {
    await hfJson("https://huggingface.co/api/repos/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        name,
        private: privateRepo,
      }),
    });
    console.log(`✅ Created ${type} repo: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    if (
      normalized.includes("already exists")
      || normalized.includes("already created this")
      || normalized.includes("409")
    ) {
      console.log(`ℹ️  ${type} repo exists: ${name}`);
      return;
    }
    throw error;
  }
}

async function commitFiles({ typePlural, repoId, summary, files }) {
  if (DRY_RUN) {
    console.log(`🧪 [dry-run] commit -> ${typePlural}/${repoId} (${files.length} file(s))`);
    for (const file of files) {
      console.log(`    - ${file.path} (${file.content.length} chars, ${file.encoding})`);
    }
    return;
  }

  const [namespace, repo] = String(repoId).split("/");
  if (!namespace || !repo) {
    throw new Error(`Invalid repo id: ${repoId}`);
  }

  const payload = {
    summary,
    files,
  };

  await hfJson(`https://huggingface.co/api/${typePlural}/${namespace}/${repo}/commit/main`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  for (const file of files) {
    console.log(`✅ Committed: ${repoId}/${file.path}`);
  }
}

function datasetReadme(asset, targetUser) {
  return `# ${asset.title}\n\n${asset.description}\n\n- Owner: ${targetUser}\n- Repo: ${asset.repo}\n- Synced by: scripts/sync-hf-assets.js\n`;
}

function modelReadme(modelRepo, targetUser) {
  return `---\nlanguage:\n- en\ntags:\n- tradehax\n- finance\n- llm\n- gpt\n- neural-network\nlicense: apache-2.0\nbase_model:\n- Qwen/Qwen2.5-7B-Instruct\npipeline_tag: text-generation\n---\n\n# ${modelRepo}\n\nTradeHax model workspace for ${targetUser}.\n\nThis repository is provisioned for:\n- Fine-tuned checkpoint uploads\n- LoRA adapter artifacts\n- Model card/version history\n\nTo publish trained artifacts, use your training pipeline to push to:\n\n\`${targetUser}/${modelRepo}\`\n`;
}

async function main() {
  const targetUser = await resolveTargetUser();
  console.log(`🎯 Target HF user: ${targetUser}`);

  const datasetPrivate = HF_DATASET_VISIBILITY === "private";
  const modelPrivate = HF_MODEL_VISIBILITY === "private";

  let uploadedDatasets = 0;
  for (const asset of DATASET_ASSETS) {
    const assetFiles = Array.isArray(asset.files)
      ? asset.files
      : [{ sourcePath: asset.sourcePath, targetPath: asset.targetPath }];

    const missingFiles = assetFiles.filter((file) => !fs.existsSync(file.sourcePath));
    if (missingFiles.length > 0) {
      for (const missingFile of missingFiles) {
        console.log(`⚠️  Skipping missing dataset file: ${path.relative(ROOT, missingFile.sourcePath)}`);
      }
      continue;
    }

    await ensureRepo({
      type: "dataset",
      name: asset.repo,
      privateRepo: datasetPrivate,
    });

    const datasetRepoId = `${targetUser}/${asset.repo}`;
    const readmeContent = datasetReadme(asset, targetUser);
    const datasetFilesPayload = assetFiles.map((file) => ({
      path: file.targetPath,
      content: fs.readFileSync(file.sourcePath).toString("base64"),
      encoding: "base64",
    }));

    await commitFiles({
      typePlural: "datasets",
      repoId: datasetRepoId,
      summary: `Sync dataset asset(s): ${asset.repo}`,
      files: [
        ...datasetFilesPayload,
        {
          path: "README.md",
          content: readmeContent,
          encoding: "utf-8",
        },
      ],
    });

    uploadedDatasets += 1;
  }

  let provisionedModels = 0;
  for (const modelRepo of MODEL_REPOS) {
    await ensureRepo({
      type: "model",
      name: modelRepo,
      privateRepo: modelPrivate,
    });

    const modelRepoId = `${targetUser}/${modelRepo}`;
    await commitFiles({
      typePlural: "models",
      repoId: modelRepoId,
      summary: "Bootstrap TradeHax model repo card",
      files: [
        {
          path: "README.md",
          content: modelReadme(modelRepo, targetUser),
          encoding: "utf-8",
        },
      ],
    });

    provisionedModels += 1;
  }

  console.log("\n🎉 HF asset sync complete.");
  console.log(`   Datasets synced: ${uploadedDatasets}`);
  console.log(`   Model repos provisioned: ${provisionedModels}`);
  console.log(`   Profile: https://huggingface.co/${targetUser}`);
}

main().catch((error) => {
  console.error("❌ HF asset sync failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
