/**
 * AI Chat Telemetry Recording Endpoint
 * Allows frontend to emit telemetry events (mode selection, wallet unlock, etc.)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { recordAIChatEvent, type AIChatTelemetryEvent } from './telemetry-repository.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: Partial<AIChatTelemetryEvent> = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    // Validate required fields
    if (!body.eventType) {
      return res.status(400).json({ error: 'Missing eventType' });
    }

    // Record event
    const success = await recordAIChatEvent({
      eventType: body.eventType as any,
      timestamp: body.timestamp || Date.now(),
      sessionId: body.sessionId,
      userId: body.userId,
      mode: body.mode,
      requestedMode: body.requestedMode,
      effectiveMode: body.effectiveMode,
      providerPath: body.providerPath,
      latencyMs: body.latencyMs,
      model: body.model,
      cached: body.cached,
      gated: body.gated,
      guardedRetryCount: body.guardedRetryCount,
      userMessageLength: body.userMessageLength,
      responseLength: body.responseLength,
      hallucinated: body.hallucinated,
      errorMessage: body.errorMessage,
      metadata: body.metadata,
    });

    return res.status(200).json({
      recorded: success,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[TELEMETRY_API] Error:', err instanceof Error ? err.message : err);
    return res.status(200).json({
      recorded: false,
      error: err instanceof Error ? err.message : 'Failed to record telemetry',
    });
  }
}

