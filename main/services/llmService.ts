// LLM/AI integration for neural hub
import { NEURAL_HUB_CONFIG } from '../lib/trading/neural-hub-pipeline';

export async function callNeuralHub(prompt: string, modelId?: string, maxTokens: number = 512): Promise<string> {
  // Use robust token fallback logic
  const token =
    process.env.HF_API_TOKEN ||
    process.env.HF_API_TOKEN_REICH ||
    process.env.HF_API_TOKEN_ALT1 ||
    process.env.HF_API_TOKEN_ALT2 ||
    process.env.HF_API_TOKEN_ALT3 ||
    process.env.NEXT_PUBLIC_HF_API_TOKEN;
  if (!token) {
    console.error('❌ No Hugging Face API token found in environment variables.');
    return 'AI service not available - missing API token';
  }
  try {
    const response = await fetch(
      `${NEURAL_HUB_CONFIG.endpoints.inference}/${modelId || NEURAL_HUB_CONFIG.modelId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            top_p: 0.95,
          },
        }),
      }
    );
    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Invalid HF token - authentication failed');
        return 'Invalid API token - please check configuration';
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data[0]?.generated_text || 'No response from AI';
  } catch (error) {
    console.error('❌ Neural Hub API error:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
