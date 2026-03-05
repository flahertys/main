import type { RequestHandler } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

type RateRecord = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateRecord>();

function getClientKey(ipRaw: string | undefined) {
  const ip = (ipRaw || 'unknown').split(',')[0].trim();
  return ip || 'unknown';
}

function cleanup(now: number) {
  for (const [key, value] of rateStore.entries()) {
    if (value.resetAt <= now) {
      rateStore.delete(key);
    }
  }
}

export const logAccess: RequestHandler = (req, _res, next) => {
  console.log(`[AI] ${req.method} ${req.path}`);
  next();
};

export const apiKeyAuth: RequestHandler = (req, res, next) => {
  const configuredKey = process.env.AI_SERVER_API_KEY?.trim();
  if (!configuredKey) {
    return next();
  }

  const provided = (req.header('x-api-key') || '').trim();
  if (provided !== configuredKey) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  next();
};

export const limiter: RequestHandler = (req, res, next) => {
  const now = Date.now();
  cleanup(now);

  const key = getClientKey(req.ip || req.socket?.remoteAddress);
  const existing = rateStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (existing.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ ok: false, error: 'Too many requests' });
    return;
  }

  existing.count += 1;
  rateStore.set(key, existing);
  next();
};
