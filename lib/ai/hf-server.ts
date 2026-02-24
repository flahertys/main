/**
 * Hugging Face Server-Side Configuration
 */

import { HFLLMClient, type LLMConfig } from "./hf-client";

let llmClient: HFLLMClient | null = null;
const llmClientCache = new Map<string, HFLLMClient>();

type LLMClientOverrides = Partial<Pick<LLMConfig, "modelId" | "temperature" | "maxTokens" | "topP">>;

const MAX_CLIENT_CACHE_SIZE = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseEnvFloat(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

function parseEnvInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

function normalizeOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getResolvedConfig(overrides?: LLMClientOverrides): LLMConfig {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error(
      "HF_API_TOKEN not set. Set it in .env.local or environment variables.",
    );
  }

  const envTemperature = parseEnvFloat(process.env.LLM_TEMPERATURE, 0.7, 0, 2);
  const envMaxTokens = parseEnvInt(process.env.LLM_MAX_LENGTH, 512, 16, 4096);
  const envTopP = parseEnvFloat(process.env.LLM_TOP_P, 0.95, 0.1, 1);

  return {
    modelId: overrides?.modelId || process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1",
    apiToken: token,
    useLocal: process.env.HF_USE_LOCAL_MODEL === "true",
    temperature: normalizeOptionalNumber(overrides?.temperature) ?? envTemperature,
    maxTokens: normalizeOptionalNumber(overrides?.maxTokens) ?? envMaxTokens,
    topP: normalizeOptionalNumber(overrides?.topP) ?? envTopP,
  };
}

function setCachedClient(cacheKey: string, client: HFLLMClient) {
  if (!llmClientCache.has(cacheKey) && llmClientCache.size >= MAX_CLIENT_CACHE_SIZE) {
    const firstKey = llmClientCache.keys().next().value;
    if (typeof firstKey === "string") {
      llmClientCache.delete(firstKey);
    }
  }
  llmClientCache.set(cacheKey, client);
}

function getCacheKey(config: LLMConfig) {
  return [
    config.modelId,
    String(config.temperature ?? ""),
    String(config.maxTokens ?? ""),
    String(config.topP ?? ""),
    config.useLocal ? "local" : "remote",
  ].join("|");
}

/**
 * Initialize LLM client (server-side only)
 */
export function initializeLLMClient(): HFLLMClient {
  if (llmClient) return llmClient;

  const config = getResolvedConfig();

  llmClient = new HFLLMClient(config);
  setCachedClient(getCacheKey(config), llmClient);
  return llmClient;
}

/**
 * Get existing client or create new one
 */
export function getLLMClient(overrides?: LLMClientOverrides): HFLLMClient {
  if (!overrides || Object.keys(overrides).length === 0) {
    if (!llmClient) {
      return initializeLLMClient();
    }
    return llmClient;
  }

  const config = getResolvedConfig(overrides);
  const cacheKey = getCacheKey(config);
  const cached = llmClientCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const client = new HFLLMClient(config);
  setCachedClient(cacheKey, client);
  return client;
}

/**
 * Format prompt for better results
 */
export function formatPrompt(
  prompt: string,
  context?: string,
): string {
  if (context) {
    return `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`;
  }
  return prompt;
}

/**
 * Safe API call with error handling
 */
export async function safeGenerate(prompt: string): Promise<string> {
  try {
    const client = getLLMClient();
    const response = await client.generate(prompt);
    return response.text;
  } catch (error) {
    console.error("LLM generation error:", error);
    return `Error generating response: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
