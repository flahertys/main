import type { VercelRequest, VercelResponse } from '@vercel/node';

const REQUIRED_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'HUGGINGFACE_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'TRADEHAX_ADMIN_KEY',
  'TRADEHAX_SUPERUSER_CODE',
];

function hasAnyEnv(keys: string[]): boolean {
  return keys.some((k) => {
    const v = process.env[k];
    return typeof v === 'string' && v.trim().length > 0;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const results: Record<string, string> = {};
  for (const key of REQUIRED_KEYS) {
    results[key] = process.env[key] ? 'OK' : 'MISSING';
  }

  results.HUGGINGFACE_PROVIDER_KEY = hasAnyEnv([
    'HUGGINGFACE_API_KEY',
    'HF_API_TOKEN',
    'HF_API_TOKEN_REICH',
    'HF_API_TOKEN_ALT1',
    'HF_API_TOKEN_ALT2',
    'HF_API_TOKEN_ALT3',
    'web_HF_API_TOKEN',
  ])
    ? 'OK'
    : 'MISSING';

  results.OPENAI_PROVIDER_KEY = hasAnyEnv(['OPENAI_API_KEY', 'web_OPENAI_API_KEY'])
    ? 'OK'
    : 'MISSING';

  results.SUPABASE_SERVER_KEY = hasAnyEnv(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'web_SUPABASE_SERVICE_ROLE_KEY'])
    ? 'OK'
    : 'MISSING';

  results.SUPABASE_CLIENT_KEY =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
      ? 'OK'
      : 'MISSING';

  // Optionally, add external service checks here (e.g., ping Stripe, Supabase)

  res.status(200).json({
    status: 'ok',
    env: results,
    timestamp: new Date().toISOString(),
  });
}

