/**
 * Hugging Face Server-Side Configuration
 */

import { HFLLMClient, type LLMConfig } from "./hf-client";

let llmClient: HFLLMClient | null = null;

/**
 * Initialize LLM client (server-side only)
 */
export function initializeLLMClient(): HFLLMClient {
  if (llmClient) return llmClient;

  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error(
      "HF_API_TOKEN not set. Set it in .env.local or environment variables.",
    );
  }

  const config: LLMConfig = {
    modelId: process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1",
    apiToken: token,
    useLocal: process.env.HF_USE_LOCAL_MODEL === "true",
    temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
    maxTokens: parseInt(process.env.LLM_MAX_LENGTH || "512"),
    topP: parseFloat(process.env.LLM_TOP_P || "0.95"),
  };

  llmClient = new HFLLMClient(config);
  return llmClient;
}

/**
 * Get existing client or create new one
 */
export function getLLMClient(): HFLLMClient {
  if (!llmClient) {
    return initializeLLMClient();
  }
  return llmClient;
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
