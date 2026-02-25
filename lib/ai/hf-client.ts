/**
 * Hugging Face API Client
 * Supports both Inference API and local models
 */

import { HfInference } from "@huggingface/inference";

export interface LLMConfig {
  modelId: string;
  apiToken?: string;
  useLocal: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed?: number;
  model: string;
}

export interface GenerateOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface StreamMessage {
  token?: {
    text: string;
  };
  generated_text?: string;
}

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

function parseFallbackModelsEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function dedupeModels(models: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const model of models) {
    const key = model.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(model);
    }
  }
  return output;
}

function isProviderUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("no inference provider") ||
    message.includes("inference provider available") ||
    message.includes("provider unavailable")
  );
}

function isRetryableGenerationError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    isProviderUnavailableError(error) ||
    message.includes("not supported for task") ||
    message.includes("supported task:") ||
    message.includes("task text-generation") ||
    message.includes("model is loading") ||
    message.includes("overloaded") ||
    message.includes("temporarily unavailable") ||
    message.includes("503") ||
    message.includes("504")
  );
}

class HFLLMClient {
  private client: HfInference | null = null;
  private modelId: string;
  private config: LLMConfig;
  private readonly fallbackModels: string[];

  constructor(config: LLMConfig) {
    this.config = config;
    this.modelId = config.modelId;
    const envFallbacks = parseFallbackModelsEnv(process.env.HF_FALLBACK_MODELS);
    this.fallbackModels = dedupeModels([
      ...envFallbacks,
      "Qwen/Qwen2.5-7B-Instruct",
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "HuggingFaceH4/zephyr-7b-beta",
      "mistralai/Mistral-Nemo-Instruct-2407",
    ]);

    if (!config.useLocal && config.apiToken) {
      this.client = new HfInference(config.apiToken);
    }
  }

  private async generateWithModel(
    prompt: string,
    modelId: string,
    args: {
      maxTokens: number;
      temperature: number;
      topP: number;
    },
  ): Promise<string> {
    if (!this.client) {
      throw new Error("HF client not initialized. Check API token.");
    }

    try {
      const response = await this.client.chatCompletion({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: args.maxTokens,
        temperature: args.temperature,
        top_p: args.topP,
        stream: false,
      });

      const content = response?.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        const contentParts = content as Array<{ text?: string } | null | undefined>;
        return contentParts
          .map((part) => (typeof part?.text === "string" ? part.text : ""))
          .join("")
          .trim();
      }

      return "";
    } catch (chatError) {
      let fallbackResponse: unknown;
      try {
        fallbackResponse = await this.client.textGeneration({
          model: modelId,
          inputs: prompt,
          parameters: {
            max_new_tokens: args.maxTokens,
            temperature: args.temperature,
            top_p: args.topP,
            do_sample: true,
            return_full_text: false,
          },
        });
      } catch (textGenError) {
        const textGenMessage = textGenError instanceof Error ? textGenError.message.toLowerCase() : String(textGenError).toLowerCase();
        if (textGenMessage.includes("not supported for task") || textGenMessage.includes("supported task:")) {
          throw chatError;
        }
        throw textGenError;
      }

      if (typeof fallbackResponse === "string") {
        return fallbackResponse;
      }

      if (Array.isArray(fallbackResponse) && fallbackResponse.length > 0) {
        const first = fallbackResponse[0] as Record<string, unknown>;
        return (first.generated_text as string) || "";
      }

      throw chatError;
    }
  }

  /**
   * Generate text using Inference API
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("HF client not initialized. Check API token.");
    }

    const resolvedModel = options?.modelId || this.modelId;
    const resolvedMaxTokens = options?.maxTokens ?? this.config.maxTokens ?? 512;
    const resolvedTemperature = options?.temperature ?? this.config.temperature ?? 0.7;
    const resolvedTopP = options?.topP ?? this.config.topP ?? 0.95;

    try {
      const candidateModels = dedupeModels([resolvedModel, ...this.fallbackModels]);
      let lastError: unknown = null;

      for (const candidate of candidateModels) {
        try {
          const text = await this.generateWithModel(prompt, candidate, {
            maxTokens: resolvedMaxTokens,
            temperature: resolvedTemperature,
            topP: resolvedTopP,
          });

          if (typeof text === "string" && text.trim().length > 0) {
            return {
              text,
              model: candidate,
            };
          }
        } catch (candidateError) {
          lastError = candidateError;
          if (!isRetryableGenerationError(candidateError)) {
            break;
          }
          continue;
        }
      }

      throw lastError || new Error("No text generated by any candidate model.");
    } catch (error) {
      throw new Error(
        `HF generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Stream text generation (for real-time responses)
   */
  async *generateStream(
    prompt: string,
    options?: GenerateOptions,
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error("HF client not initialized. Check API token.");
    }

    const resolvedModel = options?.modelId || this.modelId;
    const resolvedMaxTokens = options?.maxTokens ?? this.config.maxTokens ?? 512;
    const resolvedTemperature = options?.temperature ?? this.config.temperature ?? 0.7;
    const resolvedTopP = options?.topP ?? this.config.topP ?? 0.95;

    try {
      const candidateModels = dedupeModels([resolvedModel, ...this.fallbackModels]);
      let lastError: unknown = null;

      for (const candidate of candidateModels) {
        try {
          try {
            const stream = this.client.chatCompletionStream({
              model: candidate,
              messages: [{ role: "user", content: prompt }],
              max_tokens: resolvedMaxTokens,
              temperature: resolvedTemperature,
              top_p: resolvedTopP,
              stream: true,
            });

            for await (const chunk of stream) {
              const message = chunk as ChatCompletionChunk;
              const content = message.choices?.[0]?.delta?.content;
              if (typeof content === "string" && content.length > 0) {
                yield content;
              }
            }
            return;
          } catch {
            const stream = await this.client.textGenerationStream({
              model: candidate,
              inputs: prompt,
              parameters: {
                max_new_tokens: resolvedMaxTokens,
                temperature: resolvedTemperature,
                top_p: resolvedTopP,
                do_sample: true,
              },
            });

            for await (const chunk of stream) {
              const message = chunk as StreamMessage;
              if (message.token?.text) {
                yield message.token.text;
              }
              if (message.generated_text) {
                break;
              }
            }
            return;
          }
        } catch (candidateError) {
          lastError = candidateError;
          if (!isRetryableGenerationError(candidateError)) {
            break;
          }
          continue;
        }
      }

      throw lastError || new Error("Streaming failed across all candidate models.");
    } catch (error) {
      throw new Error(
        `HF streaming failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Chat-like conversation
   */
  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<LLMResponse> {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `${conversationText}\nassistant:`;
    return this.generate(prompt);
  }

  /**
   * Summarize text
   */
  async summarize(text: string): Promise<LLMResponse> {
    const prompt = `Summarize the following text:\n\n${text}\n\nSummary:`;
    return this.generate(prompt);
  }

  /**
   * Q&A
   */
  async qa(context: string, question: string): Promise<LLMResponse> {
    const prompt = `Context: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
    return this.generate(prompt);
  }

  /**
   * Check model availability
   */
  async checkModelAvailability(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.chatCompletion({
        model: this.modelId,
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
        stream: false,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available models from Hugging Face
   */
  static getRecommendedModels(): Record<string, string> {
    return {
      // General LLMs
      "llama3-8b-instruct": "meta-llama/Meta-Llama-3-8B-Instruct",
      "qwen2.5-7b-instruct": "Qwen/Qwen2.5-7B-Instruct",
      "zephyr-7b-beta": "HuggingFaceH4/zephyr-7b-beta",
      "mistral-nemo-instruct": "mistralai/Mistral-Nemo-Instruct-2407",

      // Lightweight / fast
      "distilgpt2": "distilgpt2",
      "phi-2": "microsoft/phi-2",

      // Image models (for /api/ai/generate-image)
      "sd-2-1": "stabilityai/stable-diffusion-2-1",
      "flux-schnell": "black-forest-labs/FLUX.1-schnell",
    };
  }
}

export { HFLLMClient };

