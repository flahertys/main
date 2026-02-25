// src/app/api/hf-server.ts - Server-side Hugging Face inference endpoint for TradeHax.net
import { HfInference } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

const hf = new HfInference(process.env.HF_API_TOKEN);

export async function POST(req: NextRequest) {
  const { prompt, task = 'text-generation', parameters = {} } = await req.json();

  try {
    let result;
    switch (task) {
      case 'text-generation':
        result = await hf.textGeneration({
          model: process.env.HF_MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.1',
          inputs: prompt,
          parameters: {
            max_new_tokens: (parameters as any).max_length || parseInt(process.env.LLM_MAX_LENGTH || '768'),
            temperature: (parameters as any).temperature || parseFloat(process.env.LLM_TEMPERATURE || '0.85'),
            top_p: (parameters as any).top_p || parseFloat(process.env.LLM_TOP_P || '0.95'),
            ...(parameters as object),
          },
        });
        break;
      case 'image-generation':
        result = await hf.textToImage({
          model: process.env.HF_IMAGE_MODEL_ID || 'stabilityai/stable-diffusion-2-1',
          inputs: prompt,
          parameters: {
            num_inference_steps: (parameters as any).steps || parseInt(process.env.HF_IMAGE_STEPS || '30'),
            guidance_scale: (parameters as any).guidance_scale || parseFloat(process.env.HF_IMAGE_GUIDANCE_SCALE || '6.5'),
            negative_prompt: (parameters as any).negative_prompt || process.env.HF_IMAGE_NEGATIVE_PROMPT_DEFAULT,
            ...(parameters as object),
          },
        });
        break;
      // Add more tasks as needed for multi-purpose (e.g., summarization)
      default:
        return NextResponse.json({ error: 'Unsupported task' }, { status: 400 });
    }
    return NextResponse.json({ output: result });
  } catch (error) {
    console.error('HF Inference Error:', error);
    return NextResponse.json({ error: 'Inference failed' }, { status: 500 });
  }
}
