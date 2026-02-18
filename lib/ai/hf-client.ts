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

interface StreamMessage {
  token?: {
    text: string;
  };
  generated_text?: string;
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
  async generate(prompt: string): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("HF client not initialized. Check API token.");
    }

    try {
      const response = await this.client.textGeneration({
        model: this.modelId,
        inputs: prompt,
        parameters: {
          max_new_tokens: this.config.maxTokens || 512,
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 0.95,
          do_sample: true,
          return_full_text: false,
        },
      });

      let text = "";
      if (typeof response === "string") {
        text = response;
      } else if (Array.isArray(response) && response.length > 0) {
        const first = response[0] as Record<string, unknown>;
        text = (first.generated_text as string) || "";
      }

      return {
        text,
        model: this.modelId,
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
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error("HF client not initialized. Check API token.");
    }

    try {
      const stream = await this.client.textGenerationStream({
        model: this.modelId,
        inputs: prompt,
        parameters: {
          max_new_tokens: this.config.maxTokens || 512,
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 0.95,
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
      // Try a minimal request
      await this.client.textGeneration({
        model: this.modelId,
        inputs: "test",
        parameters: { max_new_tokens: 1 },
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
      // Free/Fast Models
      "gpt2": "distilgpt2",
      "distilbert": "distilbert-base-uncased",

      // Small Models
      "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.1",
      "phi-2.5b": "microsoft/phi-2",

      // Medium Models
      "llama2-7b": "meta-llama/Llama-2-7b",
      "falcon-7b": "tiiuae/falcon-7b",

      // Specialized
      "coding": "Salesforce/codet5-large",
      "summarization": "facebook/bart-large-cnn",
      "translation": "Helsinki-NLP/opus-mt-en-es",
    };
  }
}

export { HFLLMClient };
