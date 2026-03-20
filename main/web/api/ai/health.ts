import type { VercelRequest, VercelResponse } from '@vercel/node';

const HF_TOKEN_KEYS = [
  'HUGGINGFACE_API_KEY',
  'HF_API_TOKEN',
  'HF_API_TOKEN_REICH',
  'HF_API_TOKEN_ALT1',
  'HF_API_TOKEN_ALT2',
  'HF_API_TOKEN_ALT3',
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasHf = HF_TOKEN_KEYS.some((k) => {
    const v = process.env[k];
    return typeof v === 'string' && v.trim().length > 0;
  });

  return res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    provider: {
      huggingface: hasHf,
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
}

