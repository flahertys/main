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
import { resolveRuntimeProviderConfig, validateProvidersAtRuntime } from './provider-runtime.js';

interface ProviderStatus {
  name: 'huggingface' | 'openai' | 'xai' | 'demo';
  reachable: boolean;
  lastCheckMs: number;
  reason?: 'ok' | 'missing_key' | 'invalid_key_format' | 'auth_failed' | 'provider_down' | 'timeout' | 'network_error' | 'unknown';
  validated?: boolean;
  configured?: boolean;
  keyValid?: boolean;
  statusCode?: number;
  averageLatency?: number;
  errorCount?: number;
}

interface ModeStatus {
  mode: 'base' | 'advanced' | 'odin' | 'polyclaw';
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
let providerCheckCache: { providers: ProviderStatus[]; timestamp: number } | null = null;
const HEALTH_CHECK_CACHE_TTL = 30000; // 30 seconds

async function checkProvidersHealth(): Promise<ProviderStatus[]> {
  if (providerCheckCache && Date.now() - providerCheckCache.timestamp < HEALTH_CHECK_CACHE_TTL) {
    return providerCheckCache.providers;
  }

  const snapshot = await validateProvidersAtRuntime();
  const runtimeConfig = resolveRuntimeProviderConfig();
  const providers: ProviderStatus[] = [
    {
      name: 'huggingface',
      reachable: snapshot.huggingface.reachable,
      lastCheckMs: snapshot.huggingface.latencyMs,
      reason: snapshot.huggingface.reason,
      validated: snapshot.huggingface.validated,
      configured: runtimeConfig.hfTokens.length > 0,
      keyValid: snapshot.huggingface.keyValid,
      statusCode: snapshot.huggingface.statusCode,
    },
    {
      name: 'openai',
      reachable: snapshot.openai.reachable,
      lastCheckMs: snapshot.openai.latencyMs,
      reason: snapshot.openai.reason,
      validated: snapshot.openai.validated,
      configured: !!runtimeConfig.openAiKey,
      keyValid: snapshot.openai.keyValid,
      statusCode: snapshot.openai.statusCode,
    },
    {
      name: 'xai',
      reachable: snapshot.xai.reachable,
      lastCheckMs: snapshot.xai.latencyMs,
      reason: snapshot.xai.reason,
      validated: snapshot.xai.validated,
      configured: !!runtimeConfig.xAiKey,
      keyValid: snapshot.xai.keyValid,
      statusCode: snapshot.xai.statusCode,
    },
  ];

  providerCheckCache = { providers, timestamp: Date.now() };
  return providers;
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
    {
      mode: 'polyclaw',
      available: true,
      gatingActive: false,
      unlockReason: 'Native Polymarket Assistant mode',
    },
  ];
}

/**
 * Calculate overall health status
 */
function calculateOverallHealth(providers: ProviderStatus[]): 'healthy' | 'degraded' | 'unavailable' {
  // Demo is a local fallback; it should not count as a real upstream provider.
  const upstreamProviders = providers.filter((p) => p.name !== 'demo');
  const configuredProviders = upstreamProviders.filter((p) => p.configured);

  if (configuredProviders.length === 0) {
    // APIs remain available via demo mode, but no live upstream configured.
    return 'degraded';
  }

  const hasHardConfigFailure = configuredProviders.some(
    (p) => p.reason === 'invalid_key_format' || p.reason === 'auth_failed'
  );
  if (hasHardConfigFailure) {
    return 'degraded';
  }

  const validatedCount = configuredProviders.filter((p) => p.validated).length;
  if (validatedCount >= 1) {
    return 'healthy';
  }

  return 'degraded';
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
    const demoProvider: ProviderStatus = {
      name: 'demo',
      reachable: true,
      lastCheckMs: 1,
      reason: 'ok',
      validated: true,
      configured: true,
      keyValid: true,
    };
    const providers: ProviderStatus[] = [...await checkProvidersHealth(), demoProvider];
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
        { name: 'xai', reachable: false, lastCheckMs: 0 },
        { name: 'demo', reachable: true, lastCheckMs: 1 },
      ],
      modes: [
        { mode: 'base', available: true, gatingActive: false },
        { mode: 'advanced', available: true, gatingActive: false },
        { mode: 'odin', available: false, gatingActive: true, unlockReason: 'Health check error' },
        { mode: 'polyclaw', available: true, gatingActive: false },
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
