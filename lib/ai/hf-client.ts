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

class HFLLMClient {
  private client: HfInference | null = null;
  private modelId: string;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.modelId = config.modelId;

    if (!config.useLocal && config.apiToken) {
      this.client = new HfInference(config.apiToken);
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
      let text = "";

      try {
        const response = await this.client.chatCompletion({
          model: resolvedModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: resolvedMaxTokens,
          temperature: resolvedTemperature,
          top_p: resolvedTopP,
          stream: false,
        });

        const content = response?.choices?.[0]?.message?.content;
        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          text = content
            .map((part) => (typeof part?.text === "string" ? part.text : ""))
            .join("")
            .trim();
        }
      } catch (chatError) {
        const fallbackResponse = await this.client.textGeneration({
          model: resolvedModel,
          inputs: prompt,
          parameters: {
            max_new_tokens: resolvedMaxTokens,
            temperature: resolvedTemperature,
            top_p: resolvedTopP,
            do_sample: true,
            return_full_text: false,
          },
        });

        if (typeof fallbackResponse === "string") {
          text = fallbackResponse;
        } else if (Array.isArray(fallbackResponse) && fallbackResponse.length > 0) {
          const first = fallbackResponse[0] as Record<string, unknown>;
          text = (first.generated_text as string) || "";
        }

        if (!text.trim()) {
          throw chatError;
        }
      }

      return {
        text,
        model: resolvedModel,
      };
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
      try {
        const stream = this.client.chatCompletionStream({
          model: resolvedModel,
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
      } catch {
        const stream = await this.client.textGenerationStream({
          model: resolvedModel,
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
      }
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
      "mistral-7b-instruct": "mistralai/Mistral-7B-Instruct-v0.1",
      "llama3-8b-instruct": "meta-llama/Meta-Llama-3-8B-Instruct",
      "qwen2.5-7b-instruct": "Qwen/Qwen2.5-7B-Instruct",

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

