type ProviderName = 'huggingface' | 'openai';

type ProviderReason =
  | 'ok'
  | 'missing_key'
  | 'invalid_key_format'
  | 'auth_failed'
  | 'provider_down'
  | 'timeout'
  | 'network_error'
  | 'unknown';

export interface ProviderProbeResult {
  name: ProviderName;
  reachable: boolean;
  validated: boolean;
  latencyMs: number;
  reason: ProviderReason;
  statusCode?: number;
  detail?: string;
  keyValid?: boolean;
}

export interface RuntimeProviderSnapshot {
  checkedAt: number;
  huggingface: ProviderProbeResult;
  openai: ProviderProbeResult;
}

export interface RuntimeProviderConfig {
  hfTokens: string[];
  openAiKey: string;
  hfModels: string[];
}

const HF_TOKEN_KEYS = [
  'HUGGINGFACE_API_KEY',
  'HF_API_TOKEN',
  'HF_API_TOKEN_REICH',
  'HF_API_TOKEN_ALT1',
  'HF_API_TOKEN_ALT2',
  'HF_API_TOKEN_ALT3',
  'web_HF_API_TOKEN',
] as const;

function resolveEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function withTimeout(timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

function classifyFailure(statusCode?: number, detail?: string): ProviderReason {
  if (!statusCode) return 'unknown';
  if (statusCode === 401 || statusCode === 403) return 'auth_failed';
  if (statusCode === 408) return 'timeout';
  if (statusCode >= 500) return 'provider_down';

  // HF may return 404 while model is still loading or unavailable.
  if (statusCode === 404 && detail && /loading|unavailable|not found/i.test(detail)) {
    return 'provider_down';
  }

  if (statusCode >= 400) return 'unknown';
  return 'ok';
}

/**
 * Detect placeholder, demo, or obviously invalid keys
 */
function isInvalidKeyFormat(key: string, provider: 'huggingface' | 'openai'): boolean {
  if (!key || key.length < 10) return true;

  const lower = key.toLowerCase();

  // Detect common placeholder patterns
  const placeholders = [
    'xxx', 'demo', 'test', 'placeholder', 'invalid', 'fake',
    'pk_test', 'sk_test', 'null', 'undefined', '0000', 'aaaa', 'bbbb'
  ];

  if (placeholders.some(p => lower.includes(p))) {
    return true;
  }

  // HuggingFace keys should start with 'hf_'
  if (provider === 'huggingface') {
    if (!key.startsWith('hf_')) return true;
    if (key.length < 20) return true; // HF tokens are typically longer
  }

  // OpenAI keys should start with 'sk-' or 'sk_'
  if (provider === 'openai') {
    if (!key.match(/^sk[-_]/i)) return true;
    if (key.length < 20) return true; // OpenAI tokens are typically longer
  }

  return false;
}

export function resolveRuntimeProviderConfig(): RuntimeProviderConfig {
  const hfTokens = Array.from(new Set(
    HF_TOKEN_KEYS
      .map((key) => process.env[key])
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value): value is string => value.length > 0),
  ));

  const hfModel = resolveEnv('HF_MODEL_ID') || 'meta-llama/Llama-3.3-70B-Instruct';
  const hfFallbackModels = resolveEnv('HF_FALLBACK_MODELS')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  const hfModels = Array.from(new Set([hfModel, ...hfFallbackModels]));

  return {
    hfTokens,
    openAiKey: resolveEnv('OPENAI_API_KEY', 'web_OPENAI_API_KEY'),
    hfModels,
  };
}

async function probeHuggingFace(config: RuntimeProviderConfig, timeoutMs: number): Promise<ProviderProbeResult> {
  const start = Date.now();
  if (config.hfTokens.length === 0) {
    return {
      name: 'huggingface',
      reachable: false,
      validated: false,
      latencyMs: Date.now() - start,
      reason: 'missing_key',
      keyValid: false,
    };
  }

  // Pre-validate all tokens for format issues
  const validTokens = config.hfTokens.filter(token => !isInvalidKeyFormat(token, 'huggingface'));
  if (validTokens.length === 0) {
    return {
      name: 'huggingface',
      reachable: false,
      validated: false,
      latencyMs: Date.now() - start,
      reason: 'invalid_key_format',
      detail: 'All HuggingFace tokens have invalid format (expected hf_...)',
      keyValid: false,
    };
  }

  let lastStatus: number | undefined;
  let lastDetail = '';

  for (const modelId of config.hfModels) {
    for (const token of validTokens) {
      const timeout = withTimeout(timeoutMs);
      try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: 'ping',
            parameters: {
              max_new_tokens: 1,
              return_full_text: false,
            },
          }),
          signal: timeout.signal,
        });
        timeout.clear();

        if (response.ok) {
          return {
            name: 'huggingface',
            reachable: true,
            validated: true,
            latencyMs: Date.now() - start,
            reason: 'ok',
            statusCode: response.status,
            keyValid: true,
          };
        }

        const detail = await response.text();
        lastStatus = response.status;
        lastDetail = detail;

        if (response.status === 401 || response.status === 403) {
          return {
            name: 'huggingface',
            reachable: false,
            validated: false,
            latencyMs: Date.now() - start,
            reason: 'auth_failed',
            statusCode: response.status,
            detail,
            keyValid: false,
          };
        }
      } catch (error) {
        timeout.clear();
        if ((error as Error).name === 'AbortError') {
          return {
            name: 'huggingface',
            reachable: false,
            validated: false,
            latencyMs: Date.now() - start,
            reason: 'timeout',
            detail: 'Hugging Face probe timed out',
            keyValid: true, // Key format was OK, just timeout
          };
        }

        lastDetail = (error as Error).message || 'Network error';
      }
    }
  }

  return {
    name: 'huggingface',
    reachable: false,
    validated: false,
    latencyMs: Date.now() - start,
    reason: lastStatus ? classifyFailure(lastStatus, lastDetail) : 'network_error',
    statusCode: lastStatus,
    detail: lastDetail || undefined,
    keyValid: lastStatus !== 401 && lastStatus !== 403, // Only invalid if auth failed
  };
}

async function probeOpenAI(config: RuntimeProviderConfig, timeoutMs: number): Promise<ProviderProbeResult> {
  const start = Date.now();
  if (!config.openAiKey) {
    return {
      name: 'openai',
      reachable: false,
      validated: false,
      latencyMs: Date.now() - start,
      reason: 'missing_key',
      keyValid: false,
    };
  }

  // Pre-validate key format
  if (isInvalidKeyFormat(config.openAiKey, 'openai')) {
    return {
      name: 'openai',
      reachable: false,
      validated: false,
      latencyMs: Date.now() - start,
      reason: 'invalid_key_format',
      detail: 'OpenAI key has invalid format (expected sk-...)',
      keyValid: false,
    };
  }

  const timeout = withTimeout(timeoutMs);
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.openAiKey}`,
      },
      signal: timeout.signal,
    });
    timeout.clear();

    if (response.ok) {
      return {
        name: 'openai',
        reachable: true,
        validated: true,
        latencyMs: Date.now() - start,
        reason: 'ok',
        statusCode: response.status,
        keyValid: true,
      };
    }

    const detail = await response.text();
    const reason = classifyFailure(response.status, detail);
    return {
      name: 'openai',
      reachable: false,
      validated: false,
      latencyMs: Date.now() - start,
      reason,
      statusCode: response.status,
      detail,
      keyValid: response.status !== 401 && response.status !== 403, // Only invalid if auth failed
    };
  } catch (error) {
    timeout.clear();

    if ((error as Error).name === 'AbortError') {
      return {
        name: 'openai',
        reachable: false,
        validated: false,
        latencyMs: Date.now() - start,
        reason: 'timeout',
        detail: 'OpenAI probe timed out',
        keyValid: true, // Key format was OK, just timeout
      };
    }

    return {
      name: 'openai',
      reachable: false,
      validated: false,
      latencyMs: Date.now() - start,
      reason: 'network_error',
      detail: (error as Error).message || 'Network error',
      keyValid: true, // Key format was OK, just network error
    };
  }
}

export async function validateProvidersAtRuntime(options?: {
  hfTimeoutMs?: number;
  openaiTimeoutMs?: number;
}): Promise<RuntimeProviderSnapshot> {
  const config = resolveRuntimeProviderConfig();
  const hfTimeoutMs = options?.hfTimeoutMs ?? parseInt(process.env.AI_HEALTH_CHECK_HF_TIMEOUT_MS || '4500', 10);
  const openaiTimeoutMs = options?.openaiTimeoutMs ?? parseInt(process.env.AI_HEALTH_CHECK_OA_TIMEOUT_MS || '4500', 10);

  const [huggingface, openai] = await Promise.all([
    probeHuggingFace(config, hfTimeoutMs),
    probeOpenAI(config, openaiTimeoutMs),
  ]);

  return {
    checkedAt: Date.now(),
    huggingface,
    openai,
  };
}

