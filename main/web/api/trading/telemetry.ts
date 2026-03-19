import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTelemetrySnapshot,
  incrementTelemetryCounter,
  isTelemetryEvent,
} from './proof-store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, counters: await getTelemetrySnapshot() });
  }

  if (req.method === 'POST') {
    const eventName = String(req.body?.event || '');
    if (!isTelemetryEvent(eventName)) {
      return res.status(400).json({ error: 'Unsupported telemetry event' });
    }

    await incrementTelemetryCounter(eventName);
    return res.status(200).json({ ok: true, counters: await getTelemetrySnapshot() });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

