/**
 * TradeHax Neural Console
 * Real-time command control for AI engine behavior
 *
 * Commands:
 * - /ai-status: Check current AI provider and health
 * - /validate-response: Run full validation on response
 * - /force-demo: Force demo mode for testing
 * - /set-temperature: Adjust AI creativity (0.1-1.0)
 * - /enable-strict: Enable strict hallucination filtering
 * - /metrics: Show real-time AI quality metrics
 * - /audit-cache: Review cached responses for quality
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateResponse, detectHallucinations, extractTradingParameters } from './validators';

export interface ConsoleCommand {
  command: string;
  args?: Record<string, any>;
  timestamp: number;
  source: string;
}

export interface ConsoleMetrics {
  totalRequests: number;
  validResponses: number;
  invalidResponses: number;
  hallucinationDetections: number;
  averageQualityScore: number;
  lastErrors: string[];
  providerStats: Record<string, { count: number; avgScore: number }>;
}

// In-memory metrics store
const metrics: ConsoleMetrics = {
  totalRequests: 0,
  validResponses: 0,
  invalidResponses: 0,
  hallucinationDetections: 0,
  averageQualityScore: 0,
  lastErrors: [],
  providerStats: {
    huggingface: { count: 0, avgScore: 0 },
    openai: { count: 0, avgScore: 0 },
    demo: { count: 0, avgScore: 0 },
  },
};

// Command history for audit trail
const commandHistory: ConsoleCommand[] = [];
const MAX_HISTORY = 100;

// Global configuration
export const consoleConfig = {
  strictMode: false,
  forceDemo: false,
  temperature: 0.7,
  hallucAutoReject: true,
  responseTimeoutMs: 30000,
};

/**
 * Process neural console command
 */
export async function processConsoleCommand(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  const { command, args } = req.body || {};

  if (!command) return false;

  const cmd: ConsoleCommand = {
    command,
    args,
    timestamp: Date.now(),
    source: req.headers['x-forwarded-for']?.toString() || 'unknown',
  };

  // Add to history
  commandHistory.push(cmd);
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory.shift();
  }

  console.log(`[NEURAL_CONSOLE] ${command}`, args);

  switch (command) {
    case 'ai-status':
      return handleAiStatus(res);

    case 'validate-response':
      return handleValidateResponse(res, args);

    case 'force-demo':
      return handleForceDemo(res, args);

    case 'set-temperature':
      return handleSetTemperature(res, args);

    case 'enable-strict':
      return handleEnableStrict(res, args);

    case 'metrics':
      return handleMetrics(res);

    case 'audit-cache':
      return handleAuditCache(res);

    case 'health-check':
      return handleHealthCheck(res);

    default:
      res.status(400).json({ error: 'Unknown console command', command });
      return true;
  }
}

/**
 * Check AI provider status
 */
function handleAiStatus(res: VercelResponse): boolean {
  const hfKey = process.env.HUGGINGFACE_API_KEY ? 'configured' : 'missing';
  const openaiKey = process.env.OPENAI_API_KEY ? 'configured' : 'missing';

  res.status(200).json({
    status: 'operational',
    providers: {
      huggingface: hfKey,
      openai: openaiKey,
    },
    config: consoleConfig,
    timestamp: Date.now(),
  });

  return true;
}

/**
 * Validate a specific response
 */
function handleValidateResponse(res: VercelResponse, args?: any): boolean {
  if (!args?.response) {
    res.status(400).json({ error: 'response parameter required' });
    return true;
  }

  const validation = validateResponse(args.response);
  const hallucinations = detectHallucinations(args.response);
  const params = extractTradingParameters(args.response);

  res.status(200).json({
    validation,
    hallucinations,
    parameters: params,
    recommendedAction: validation.isValid ? 'APPROVE' : 'REJECT',
  });

  return true;
}

/**
 * Force demo mode (for testing or when providers fail)
 */
function handleForceDemo(res: VercelResponse, args?: any): boolean {
  const enabled = args?.enabled !== false;
  consoleConfig.forceDemo = enabled;

  res.status(200).json({
    message: `Demo mode ${enabled ? 'enabled' : 'disabled'}`,
    config: consoleConfig,
  });

  return true;
}

/**
 * Set AI temperature for creativity vs consistency tradeoff
 */
function handleSetTemperature(res: VercelResponse, args?: any): boolean {
  const temp = parseFloat(args?.temperature || 0.7);

  if (isNaN(temp) || temp < 0.1 || temp > 1.0) {
    res.status(400).json({
      error: 'Temperature must be between 0.1 and 1.0',
      received: args?.temperature,
    });
    return true;
  }

  consoleConfig.temperature = temp;

  res.status(200).json({
    message: `Temperature set to ${temp}`,
    note: temp < 0.4 ? 'Deterministic mode - reliable but less creative'
        : temp < 0.7 ? 'Balanced mode'
        : 'Creative mode - higher risk of hallucinations',
  });

  return true;
}

/**
 * Enable strict mode (reject anything with hints of hallucination)
 */
function handleEnableStrict(res: VercelResponse, args?: any): boolean {
  const enabled = args?.enabled !== false;
  consoleConfig.strictMode = enabled;
  consoleConfig.hallucAutoReject = enabled;

  res.status(200).json({
    message: `Strict hallucination filtering ${enabled ? 'enabled' : 'disabled'}`,
    config: consoleConfig,
  });

  return true;
}

/**
 * Return current metrics
 */
function handleMetrics(res: VercelResponse): boolean {
  const validationRate =
    metrics.totalRequests > 0
      ? ((metrics.validResponses / metrics.totalRequests) * 100).toFixed(1)
      : 'N/A';

  const hallucinationRate =
    metrics.totalRequests > 0
      ? ((metrics.hallucinationDetections / metrics.totalRequests) * 100).toFixed(1)
      : 'N/A';

  res.status(200).json({
    metrics,
    rates: {
      validationRate: `${validationRate}%`,
      hallucinationRate: `${hallucinationRate}%`,
    },
    config: consoleConfig,
    timestamp: Date.now(),
  });

  return true;
}

/**
 * Audit cache (review stored responses for quality)
 */
function handleAuditCache(res: VercelResponse): boolean {
  // This would require access to the cache from chat.ts
  // For now, return command history which serves as an audit trail

  res.status(200).json({
    message: 'Audit data',
    commandHistorySize: commandHistory.length,
    recentCommands: commandHistory.slice(-10),
    metrics,
  });

  return true;
}

/**
 * Health check for the console itself
 */
function handleHealthCheck(res: VercelResponse): boolean {
  res.status(200).json({
    ok: true,
    console: 'operational',
    timestamp: Date.now(),
    uptime: Date.now(),
  });

  return true;
}

/**
 * Record response quality for metrics tracking
 */
export function recordResponseMetric(
  response: string,
  provider: 'huggingface' | 'openai' | 'demo',
  validationResult: any
): void {
  metrics.totalRequests++;

  if (validationResult.isValid) {
    metrics.validResponses++;
  } else {
    metrics.invalidResponses++;
  }

  if (detectHallucinations(response).length > 0) {
    metrics.hallucinationDetections++;
  }

  // Update provider stats
  const providerStat = metrics.providerStats[provider];
  const newCount = providerStat.count + 1;
  const newAvg =
    (providerStat.avgScore * providerStat.count + validationResult.score) / newCount;

  metrics.providerStats[provider] = {
    count: newCount,
    avgScore: newAvg,
  };

  // Update overall average
  const totalScore = Object.values(metrics.providerStats).reduce(
    (sum, stat) => sum + stat.avgScore * stat.count,
    0
  );
  const totalCount = Object.values(metrics.providerStats).reduce(
    (sum, stat) => sum + stat.count,
    0
  );
  metrics.averageQualityScore = totalCount > 0 ? totalScore / totalCount : 0;

  // Keep last 5 errors
  if (!validationResult.isValid) {
    metrics.lastErrors.push(
      `${new Date().toISOString()}: ${validationResult.errors.join('; ')}`
    );
    if (metrics.lastErrors.length > 5) {
      metrics.lastErrors.shift();
    }
  }
}

/**
 * Get current console configuration
 */
export function getConsoleConfig() {
  return { ...consoleConfig };
}

/**
 * Check if response should be auto-rejected based on strict mode
 */
export function shouldAutoRejectResponse(
  validation: any,
  hallucinations: string[]
): boolean {
  if (!consoleConfig.hallucAutoReject) return false;

  // In strict mode, reject if any hallucinations detected
  if (consoleConfig.strictMode && hallucinations.length > 0) {
    return true;
  }

  // Always reject if quality score too low
  if (validation.score < 40) {
    return true;
  }

  return false;
}

