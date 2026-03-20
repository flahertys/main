/**
 * ODIN Live Status Endpoint
 * Exposes AI provider health, mode availability, and SLO metrics
 * Implements "hard fail-open" philosophy: always returns valid JSON, no 5xx errors
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getRecentEventsInMemory,
  calculateLatencyPercentiles,
  calculateSuccessRate,
  countEventsByType,
  isTelemetryHealthy,
} from './telemetry-repository.js';

interface ProviderStatus {
  name: 'huggingface' | 'openai' | 'demo';
  reachable: boolean;
  lastCheckMs: number;
  averageLatency?: number;
  errorCount?: number;
}

interface ModeStatus {
  mode: 'base' | 'advanced' | 'odin';
  available: boolean;
  gatingActive: boolean;
  unlockReason?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  timestamp: string;
  providers: ProviderStatus[];
  modes: ModeStatus[];
  telemetry: {
    healthy: boolean;
    eventsRecorded: number;
    eventTypes: Record<string, number>;
  };
  slos: {
    base: { latencyP50Ms?: number; latencyP95Ms?: number; successRate?: number };
    advanced: { latencyP50Ms?: number; latencyP95Ms?: number; successRate?: number };
    odin: { latencyP50Ms?: number; latencyP95Ms?: number; successRate?: number };
  };
  uptime: {
    lastRestartMs?: number;
    servingRequestsSince?: string;
  };
}

// Track health check metrics
let startTime = Date.now();
let providerCheckCache: Map<string, { status: ProviderStatus; timestamp: number }> = new Map();
const HEALTH_CHECK_CACHE_TTL = 30000; // 30 seconds

const HF_TOKEN_KEYS = [
  'HUGGINGFACE_API_KEY',
  'HF_API_TOKEN',
  'HF_API_TOKEN_REICH',
  'HF_API_TOKEN_ALT1',
  'HF_API_TOKEN_ALT2',
  'HF_API_TOKEN_ALT3',
] as const;

/**
 * Check if HuggingFace API is reachable
 * Fail-open: always returns true if we can't verify (assume working)
 */
async function checkHuggingFaceHealth(): Promise<ProviderStatus> {
  const cached = providerCheckCache.get('huggingface');
  if (cached && Date.now() - cached.timestamp < HEALTH_CHECK_CACHE_TTL) {
    return cached.status;
  }

  const start = Date.now();
  try {
    const hasHf = HF_TOKEN_KEYS.some((k) => {
      const v = process.env[k];
      return typeof v === 'string' && v.trim().length > 0;
    });

    if (!hasHf) {
      // No key = not configured, assume demo mode
      return { name: 'huggingface', reachable: false, lastCheckMs: Date.now() - start };
    }

    const timeout = parseInt(process.env.AI_HEALTH_CHECK_HF_TIMEOUT_MS || '5000', 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://api-inference.huggingface.co/status', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    const status: ProviderStatus = {
      name: 'huggingface',
      reachable: response.ok,
      lastCheckMs: latency,
    };

    providerCheckCache.set('huggingface', { status, timestamp: Date.now() });
    return status;
  } catch (err) {
    // Fail-open: assume reachable if we can't verify
    const latency = Date.now() - start;
    const status: ProviderStatus = {
      name: 'huggingface',
      reachable: true, // Optimistic: assume working until proven otherwise
      lastCheckMs: latency,
    };

    providerCheckCache.set('huggingface', { status, timestamp: Date.now() });
    return status;
  }
}

/**
 * Check if OpenAI API is reachable
 * Fail-open: always returns true if we can't verify (assume working)
 */
async function checkOpenAIHealth(): Promise<ProviderStatus> {
  const cached = providerCheckCache.get('openai');
  if (cached && Date.now() - cached.timestamp < HEALTH_CHECK_CACHE_TTL) {
    return cached.status;
  }

  const start = Date.now();
  try {
    const oaKey = process.env.OPENAI_API_KEY || '';
    if (!oaKey) {
      return { name: 'openai', reachable: false, lastCheckMs: Date.now() - start };
    }

    const timeout = parseInt(process.env.AI_HEALTH_CHECK_OA_TIMEOUT_MS || '5000', 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${oaKey}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    const status: ProviderStatus = {
      name: 'openai',
      reachable: response.ok,
      lastCheckMs: latency,
    };

    providerCheckCache.set('openai', { status, timestamp: Date.now() });
    return status;
  } catch (err) {
    // Fail-open: assume reachable if we can't verify
    const latency = Date.now() - start;
    const status: ProviderStatus = {
      name: 'openai',
      reachable: true,
      lastCheckMs: latency,
    };

    providerCheckCache.set('openai', { status, timestamp: Date.now() });
    return status;
  }
}

/**
 * Determine mode availability based on gating configuration
 */
function getModeStatus(): ModeStatus[] {
  const odinUnlocked = process.env.TRADEHAX_ODIN_OPEN_MODE === 'true' || !!process.env.TRADEHAX_ODIN_KEY;

  return [
    {
      mode: 'base',
      available: true,
      gatingActive: false,
      unlockReason: undefined,
    },
    {
      mode: 'advanced',
      available: true,
      gatingActive: false,
      unlockReason: undefined,
    },
    {
      mode: 'odin',
      available: odinUnlocked,
      gatingActive: !odinUnlocked,
      unlockReason: odinUnlocked
        ? 'ODIN_OPEN_MODE or ODIN_KEY configured'
        : 'ODIN locked - wallet unlock required',
    },
  ];
}

/**
 * Calculate overall health status
 */
function calculateOverallHealth(providers: ProviderStatus[]): 'healthy' | 'degraded' | 'unavailable' {
  const reachableCount = providers.filter((p) => p.reachable).length;

  if (reachableCount === 0) {
    // All providers down, but we have demo mode
    return 'degraded';
  }

  if (reachableCount < providers.length) {
    return 'degraded';
  }

  return 'healthy';
}

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

  try {
    // Parallel health checks
    const [hfStatus, oaStatus] = await Promise.all([
      checkHuggingFaceHealth(),
      checkOpenAIHealth(),
    ]);

    const providers = [hfStatus, oaStatus, { name: 'demo' as const, reachable: true, lastCheckMs: 1 }];
    const modes = getModeStatus();
    const recentEvents = getRecentEventsInMemory(1000);
    const eventTypes = countEventsByType(recentEvents);
    const telemetryHealthy = isTelemetryHealthy();

    // Calculate SLO metrics
    const slos = {
      base: {
        latencyP50Ms: calculateLatencyPercentiles('base', recentEvents, [50])[50] ?? undefined,
        latencyP95Ms: calculateLatencyPercentiles('base', recentEvents, [95])[95] ?? undefined,
        successRate: calculateSuccessRate('base', recentEvents) || undefined,
      },
      advanced: {
        latencyP50Ms: calculateLatencyPercentiles('advanced', recentEvents, [50])[50] ?? undefined,
        latencyP95Ms: calculateLatencyPercentiles('advanced', recentEvents, [95])[95] ?? undefined,
        successRate: calculateSuccessRate('advanced', recentEvents) || undefined,
      },
      odin: {
        latencyP50Ms: calculateLatencyPercentiles('odin', recentEvents, [50])[50] ?? undefined,
        latencyP95Ms: calculateLatencyPercentiles('odin', recentEvents, [95])[95] ?? undefined,
        successRate: calculateSuccessRate('odin', recentEvents) || undefined,
      },
    };

    const response: HealthCheckResponse = {
      status: calculateOverallHealth(providers),
      timestamp: new Date().toISOString(),
      providers,
      modes,
      telemetry: {
        healthy: telemetryHealthy,
        eventsRecorded: recentEvents.length,
        eventTypes,
      },
      slos,
      uptime: {
        lastRestartMs: Date.now() - startTime,
        servingRequestsSince: new Date(startTime).toISOString(),
      },
    };

    return res.status(200).json(response);
  } catch (err) {
    // Fail-open: even if everything breaks, return valid health response
    const response: HealthCheckResponse = {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      providers: [
        { name: 'huggingface', reachable: false, lastCheckMs: 0 },
        { name: 'openai', reachable: false, lastCheckMs: 0 },
        { name: 'demo', reachable: true, lastCheckMs: 1 },
      ],
      modes: [
        { mode: 'base', available: true, gatingActive: false },
        { mode: 'advanced', available: true, gatingActive: false },
        { mode: 'odin', available: false, gatingActive: true, unlockReason: 'Health check error' },
      ],
      telemetry: {
        healthy: false,
        eventsRecorded: 0,
        eventTypes: {},
      },
      slos: {
        base: {},
        advanced: {},
        odin: {},
      },
      uptime: {
        lastRestartMs: Date.now() - startTime,
      },
    };

    return res.status(200).json(response);
  }
}

