import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ProviderHealth {
  name: string;
  ok: boolean;
  latencyMs: number;
  detail: string;
}

async function timedFetch(url: string, timeoutMs = 2500): Promise<{ ok: boolean; latencyMs: number; status?: number; error?: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'TradeHax/1.0' },
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      latencyMs: Date.now() - start,
      status: response.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error?.message || 'network_error',
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const checks = await Promise.all([
    timedFetch('https://api.binance.com/api/v3/ping'),
    timedFetch('https://api.coingecko.com/api/v3/ping'),
  ]);

  const providers: ProviderHealth[] = [
    {
      name: 'binance',
      ok: checks[0].ok,
      latencyMs: checks[0].latencyMs,
      detail: checks[0].ok ? `HTTP ${checks[0].status}` : (checks[0].error || `HTTP ${checks[0].status}`),
    },
    {
      name: 'coingecko',
      ok: checks[1].ok,
      latencyMs: checks[1].latencyMs,
      detail: checks[1].ok ? `HTTP ${checks[1].status}` : (checks[1].error || `HTTP ${checks[1].status}`),
    },
    {
      name: 'huggingface-key',
      ok: Boolean(process.env.HUGGINGFACE_API_KEY),
      latencyMs: 0,
      detail: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'missing',
    },
    {
      name: 'openai-key',
      ok: Boolean(process.env.OPENAI_API_KEY),
      latencyMs: 0,
      detail: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    },
  ];

  const okCount = providers.filter((p) => p.ok).length;
  const dataProvidersUp = providers.filter((p) => ['binance', 'coingecko'].includes(p.name) && p.ok).length;

  return res.status(200).json({
    status: dataProvidersUp > 0 ? 'degraded-ok' : 'degraded',
    providers,
    summary: {
      checks: providers.length,
      passing: okCount,
      dataProvidersUp,
      timestamp: Date.now(),
    },
  });
}

