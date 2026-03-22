import { API_ENDPOINTS } from './endpoints';

export interface SiteCapabilities {
  checkedAt: number;
  status: 'healthy' | 'degraded' | 'unavailable';
  liveProviderAvailable: boolean;
  providerReasons: Record<string, string>;
  modes: {
    base: boolean;
    advanced: boolean;
    odin: boolean;
  };
}

const DEFAULT_CAPABILITIES: SiteCapabilities = {
  checkedAt: Date.now(),
  status: 'degraded',
  liveProviderAvailable: false,
  providerReasons: {},
  modes: {
    base: true,
    advanced: true,
    odin: false,
  },
};

let cachedCapabilities: SiteCapabilities | null = null;
let lastCheckedMs = 0;
const CAPABILITY_CACHE_TTL_MS = 20_000;

export async function resolveSiteCapabilities(baseUrl = ''): Promise<SiteCapabilities> {
  if (cachedCapabilities && Date.now() - lastCheckedMs < CAPABILITY_CACHE_TTL_MS) {
    return cachedCapabilities;
  }

  try {
    const endpoint = `${baseUrl}${API_ENDPOINTS.AI_HEALTH}`;
    const response = await fetch(endpoint, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Capability check failed: HTTP ${response.status}`);
    }

    const payload = await response.json();
    const providers = Array.isArray(payload?.providers) ? payload.providers : [];
    const providerReasons = providers.reduce((acc: Record<string, string>, provider: any) => {
      if (provider?.name) acc[provider.name] = provider?.reason || 'unknown';
      return acc;
    }, {});

    const liveProviderAvailable = providers.some(
      (provider: any) => provider?.name !== 'demo' && provider?.validated === true,
    );

    const modesArray = Array.isArray(payload?.modes) ? payload.modes : [];
    const modeMap = modesArray.reduce((acc: Record<string, boolean>, mode: any) => {
      if (mode?.mode) acc[mode.mode] = mode?.available !== false;
      return acc;
    }, {});

    const resolved: SiteCapabilities = {
      checkedAt: Date.now(),
      status: payload?.status || (liveProviderAvailable ? 'healthy' : 'degraded'),
      liveProviderAvailable,
      providerReasons,
      modes: {
        base: modeMap.base ?? true,
        advanced: modeMap.advanced ?? true,
        odin: modeMap.odin ?? false,
      },
    };

    cachedCapabilities = resolved;
    lastCheckedMs = Date.now();
    return resolved;
  } catch {
    return {
      ...DEFAULT_CAPABILITIES,
      checkedAt: Date.now(),
    };
  }
}

