#!/usr/bin/env node

/**
 * TradeHax AI Environment Doctor
 *
 * Validates production-grade LLM/GPT environment standards:
 * - credentials and required model config
 * - reliability/fallback settings
 * - numeric guardrails
 * - canary/routing governance
 * - safety toggles
 *
 * Exit codes:
 * - 0: pass (or warnings in non-strict mode)
 * - 1: failed checks (or warnings in --strict mode)
 */

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const strictMode = process.argv.includes("--strict");

const state = {
  pass: 0,
  warn: 0,
  fail: 0,
};

function print(kind, label, detail) {
  if (kind === "PASS") state.pass += 1;
  if (kind === "WARN") state.warn += 1;
  if (kind === "FAIL") state.fail += 1;

  const icon = kind === "PASS" ? "✅" : kind === "WARN" ? "⚠️" : "❌";
  console.log(`${icon} [${kind}] ${label}${detail ? `: ${detail}` : ""}`);
}

function get(key) {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
}

function has(key) {
  return get(key).length > 0;
}

function isPlaceholder(value) {
  const raw = String(value || "").toLowerCase();
  return (
    raw.includes("changeme")
    || raw.includes("replace")
    || raw.includes("your_")
    || raw.includes("<")
    || raw.includes("placeholder")
  );
}

function parseNumber(key) {
  const raw = get(key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function assertRequiredEnv(key, hint) {
  if (!has(key)) {
    print("FAIL", key, `Missing required variable. ${hint}`);
    return;
  }

  const value = get(key);
  if (isPlaceholder(value)) {
    print("FAIL", key, "Looks like a placeholder value.");
    return;
  }

  if (key.includes("TOKEN") || key.includes("KEY")) {
    print("PASS", key, "present (masked)");
  } else {
    print("PASS", key, value);
  }
}

function assertOneOfRequiredEnv(keys, label, hint) {
  const selected = keys.find((key) => has(key));
  if (!selected) {
    print("FAIL", label, `Missing required variable. ${hint}`);
    return;
  }

  const value = get(selected);
  if (isPlaceholder(value)) {
    print("FAIL", label, `Variable ${selected} looks like a placeholder value.`);
    return;
  }

  print("PASS", `${label} (${selected})`, "present (masked)");
}

function assertNumberRange(key, opts) {
  const value = parseNumber(key);
  if (value === null) {
    if (opts.required) {
      print("FAIL", key, "Required numeric value is missing.");
    } else {
      print("WARN", key, `Not set. Suggested range ${opts.min}..${opts.max}.`);
    }
    return;
  }

  if (Number.isNaN(value)) {
    print("FAIL", key, "Value is not a valid number.");
    return;
  }

  if (value < opts.min || value > opts.max) {
    print("FAIL", key, `Out of range (${value}). Expected ${opts.min}..${opts.max}.`);
    return;
  }

  print("PASS", key, String(value));
}

function checkFallbackModels() {
  const fallbackRaw = get("HF_FALLBACK_MODELS");
  if (!fallbackRaw) {
    print("WARN", "HF_FALLBACK_MODELS", "Not configured. Add 2+ comma-separated fallback models.");
    return;
  }

  const models = fallbackRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (models.length < 2) {
    print("WARN", "HF_FALLBACK_MODELS", "Configured with fewer than 2 fallback models.");
    return;
  }

  const dupes = models.length !== new Set(models).size;
  if (dupes) {
    print("WARN", "HF_FALLBACK_MODELS", "Contains duplicates; diversity is recommended.");
    return;
  }

  print("PASS", "HF_FALLBACK_MODELS", `${models.length} fallback models configured`);
}

function checkOpenModeGuardrails() {
  const nodeEnv = get("NODE_ENV") || "development";
  const llmOpenMode = get("TRADEHAX_LLM_OPEN_MODE").toLowerCase();
  const imageOpenMode = get("TRADEHAX_IMAGE_OPEN_MODE").toLowerCase();

  if (nodeEnv === "production" && (llmOpenMode === "true" || imageOpenMode === "true")) {
    print("WARN", "OPEN_MODE_IN_PROD", "Open mode enabled in production. Prefer false unless explicitly intended.");
    return;
  }

  print("PASS", "OPEN_MODE_GUARDRAIL", `NODE_ENV=${nodeEnv}`);
}

function checkCanaryGovernance() {
  const keys = [
    ["TRADEHAX_CANARY_MIN_REQUESTS", 5, 5000],
    ["TRADEHAX_CANARY_MIN_CONFIDENCE_GAIN", 0, 40],
    ["TRADEHAX_CANARY_MAX_FALLBACK_RATE", 0, 100],
    ["TRADEHAX_CANARY_MAX_FALLBACK_DELTA", 0, 100],
    ["TRADEHAX_CANARY_COOLDOWN_MINUTES", 0, 1440],
    ["TRADEHAX_CANARY_WINDOW_SIZE", 20, 20000],
    ["TRADEHAX_CANARY_ROLLOUT_PERCENT", 0, 100],
  ];

  for (const [key, min, max] of keys) {
    assertNumberRange(key, { min, max, required: false });
  }
}

function checkOptionalProviderTokens() {
  const providers = [
    ["Hugging Face", ["HF_API_TOKEN", "HUGGINGFACE_API_TOKEN", "HUGGING_FACE_HUB_TOKEN"]],
    ["OpenAI", ["OPENAI_API_KEY"]],
    ["Azure OpenAI", ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT"]],
    ["GitHub Models", ["GITHUB_TOKEN"]],
    ["Anthropic", ["ANTHROPIC_API_KEY"]],
    ["Groq", ["GROQ_API_KEY"]],
    ["Together", ["TOGETHER_API_KEY"]],
    ["Cohere", ["COHERE_API_KEY"]],
    ["Mistral", ["MISTRAL_API_KEY"]],
    ["DeepSeek", ["DEEPSEEK_API_KEY"]],
  ];

  for (const [label, keys] of providers) {
    const connected = keys.some((key) => has(key));
    if (connected) {
      print("PASS", `${label}_TOKEN_CONNECTION`, "configured (masked)");
    } else {
      print("WARN", `${label}_TOKEN_CONNECTION`, `Not configured. Expected one of: ${keys.join(", ")}`);
    }
  }
}

function checkUpstashVectorConnection() {
  const hasUrl = has("UPSTASH_VECTOR_REST_URL");
  const hasToken = has("UPSTASH_VECTOR_REST_TOKEN");

  if (hasUrl && hasToken) {
    print("PASS", "Upstash_Vector_CONNECTION", "configured (url + token present)");
    return;
  }

  if (hasUrl || hasToken) {
    print(
      "WARN",
      "Upstash_Vector_CONNECTION",
      "Partially configured. Both UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN are required.",
    );
    return;
  }

  print(
    "WARN",
    "Upstash_Vector_CONNECTION",
    "Not configured. Add UPSTASH_VECTOR_REST_URL + UPSTASH_VECTOR_REST_TOKEN for persistent serverless retrieval.",
  );
}

function checkHfDatasetIntelligenceConfig() {
  const enabledRaw = get("TRADEHAX_HF_DATASET_INTEL_ENABLED");
  if (!enabledRaw) {
    print(
      "WARN",
      "HF_Dataset_Intel_ENABLED",
      "Not set. Recommended: true to enable Hugging Face dataset intelligence blending.",
    );
  } else {
    const normalized = enabledRaw.toLowerCase();
    if (["true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
      print("PASS", "HF_Dataset_Intel_ENABLED", enabledRaw);
    } else {
      print("WARN", "HF_Dataset_Intel_ENABLED", "Unrecognized boolean value; expected true/false.");
    }
  }

  assertNumberRange("TRADEHAX_HF_DATASET_INTEL_LIMIT", { min: 1, max: 10, required: false });
}

function checkHfIngestionConfig() {
  const includeLocalDocsRaw = get("TRADEHAX_HF_INGEST_INCLUDE_LOCAL_DOCS");
  if (!includeLocalDocsRaw) {
    print("WARN", "HF_Ingest_INCLUDE_LOCAL_DOCS", "Not set. Recommended: true for local knowledge ingestion.");
  } else {
    const normalized = includeLocalDocsRaw.toLowerCase();
    if (["true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
      print("PASS", "HF_Ingest_INCLUDE_LOCAL_DOCS", includeLocalDocsRaw);
    } else {
      print("WARN", "HF_Ingest_INCLUDE_LOCAL_DOCS", "Unrecognized boolean value; expected true/false.");
    }
  }

  assertNumberRange("TRADEHAX_HF_INGEST_MAX_DOCS", { min: 1, max: 500, required: false });
  assertNumberRange("TRADEHAX_HF_INGEST_QUERY_LIMIT", { min: 1, max: 30, required: false });

  const deltaEnabledRaw = get("TRADEHAX_HF_INGEST_DELTA_ENABLED");
  if (!deltaEnabledRaw) {
    print("WARN", "HF_Ingest_DELTA_ENABLED", "Not set. Recommended: true for incremental ingestion.");
  } else {
    const normalized = deltaEnabledRaw.toLowerCase();
    if (["true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
      print("PASS", "HF_Ingest_DELTA_ENABLED", deltaEnabledRaw);
    } else {
      print("WARN", "HF_Ingest_DELTA_ENABLED", "Unrecognized boolean value; expected true/false.");
    }
  }

  const forceUpsertRaw = get("TRADEHAX_HF_INGEST_FORCE_UPSERT");
  if (!forceUpsertRaw) {
    print("WARN", "HF_Ingest_FORCE_UPSERT", "Not set. Recommended: false for normal delta ingestion.");
  } else {
    const normalized = forceUpsertRaw.toLowerCase();
    if (["true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
      print("PASS", "HF_Ingest_FORCE_UPSERT", forceUpsertRaw);
    } else {
      print("WARN", "HF_Ingest_FORCE_UPSERT", "Unrecognized boolean value; expected true/false.");
    }
  }

  const queries = get("TRADEHAX_HF_INGEST_QUERIES");
  if (!queries) {
    print("WARN", "HF_Ingest_QUERIES", "Not set. Recommended: trading,crypto,market structure,risk management");
  } else {
    const count = queries.split(",").map((entry) => entry.trim()).filter(Boolean).length;
    if (count === 0) {
      print("WARN", "HF_Ingest_QUERIES", "Configured but empty after parsing.");
    } else {
      print("PASS", "HF_Ingest_QUERIES", `${count} query seeds`);
    }
  }
}

function main() {
  console.log("\n🧪 TradeHax AI Environment Doctor\n");

  console.log("[1/5] Core provider + model");
  assertOneOfRequiredEnv(
    ["HF_API_TOKEN", "HUGGINGFACE_API_TOKEN", "HF_TOKEN"],
    "HF_TOKEN",
    "Set a Hugging Face token with repo + inference permissions.",
  );
  assertRequiredEnv("HF_MODEL_ID", "Set your default primary chat model.");
  checkFallbackModels();

  console.log("\n[2/5] Runtime tuning guardrails");
  assertNumberRange("LLM_TEMPERATURE", { min: 0, max: 2, required: false });
  assertNumberRange("LLM_TOP_P", { min: 0.1, max: 1, required: false });
  assertNumberRange("LLM_MAX_LENGTH", { min: 64, max: 8192, required: false });

  console.log("\n[3/5] Preset guardrails");
  const presetTempKeys = [
    "TRADEHAX_PRESET_NAVIGATOR_TEMP",
    "TRADEHAX_PRESET_OPERATOR_TEMP",
    "TRADEHAX_PRESET_ANALYST_TEMP",
    "TRADEHAX_PRESET_CREATIVE_TEMP",
    "TRADEHAX_PRESET_RESEARCH_TEMP",
    "TRADEHAX_PRESET_FALLBACK_TEMP",
  ];
  const presetTopPKeys = [
    "TRADEHAX_PRESET_NAVIGATOR_TOPP",
    "TRADEHAX_PRESET_OPERATOR_TOPP",
    "TRADEHAX_PRESET_ANALYST_TOPP",
    "TRADEHAX_PRESET_CREATIVE_TOPP",
    "TRADEHAX_PRESET_RESEARCH_TOPP",
    "TRADEHAX_PRESET_FALLBACK_TOPP",
  ];

  for (const key of presetTempKeys) {
    assertNumberRange(key, { min: 0, max: 2, required: false });
  }
  for (const key of presetTopPKeys) {
    assertNumberRange(key, { min: 0.1, max: 1, required: false });
  }

  console.log("\n[4/5] Canary governance");
  checkCanaryGovernance();

  console.log("\n[5/5] Safety + mode checks");
  checkOpenModeGuardrails();

  console.log("\n[extra] Optional provider token connections");
  checkOptionalProviderTokens();
  checkUpstashVectorConnection();
  checkHfDatasetIntelligenceConfig();
  checkHfIngestionConfig();

  const total = state.pass + state.warn + state.fail;
  console.log(`\nSummary: ${state.pass} pass, ${state.warn} warn, ${state.fail} fail (${total} checks).`);

  if (state.fail > 0) {
    console.error("\nAI environment doctor failed.");
    process.exit(1);
  }

  if (strictMode && state.warn > 0) {
    console.error("\nAI environment doctor strict mode failed due to warnings.");
    process.exit(1);
  }

  console.log("\nAI environment doctor passed.");
}

main();
