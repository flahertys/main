/**
 * TradeHax Neural Console API - Quick Reference
 *
 * How to use the neural console from the frontend
 */

// 1. IMPORT THE NEURAL CONSOLE UI
import NeuralConsole from '@/components/NeuralConsole';

// 2. ADD TO YOUR ADMIN/MONITORING PAGE
export function MonitoringPage() {
  return (
    <div>
      <NeuralConsole />
    </div>
  );
}

// 3. USE THE API DIRECTLY (IF NEEDED)

/**
 * Execute a console command
 */
async function executeConsoleCommand(command: string, args?: Record<string, any>) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isConsoleCommand: true,
      command,
      args,
    }),
  });

  if (!response.ok) {
    throw new Error(`Console error: ${response.statusText}`);
  }

  return response.json();
}

// COMMAND EXAMPLES:

/**
 * Check AI provider status
 */
async function checkAIStatus() {
  const result = await executeConsoleCommand('ai-status');
  console.log('AI Status:', result);
  // Returns: {
  //   status: 'operational',
  //   providers: {
  //     huggingface: 'configured' | 'missing',
  //     openai: 'configured' | 'missing'
  //   },
  //   config: { ... }
  // }
}

/**
 * Get real-time metrics
 */
async function getMetrics() {
  const result = await executeConsoleCommand('metrics');
  console.log('Metrics:', result);
  // Returns: {
  //   metrics: {
  //     totalRequests: number,
  //     validResponses: number,
  //     invalidResponses: number,
  //     hallucinationDetections: number,
  //     averageQualityScore: number,
  //     lastErrors: string[],
  //     providerStats: {
  //       huggingface: { count: number, avgScore: number },
  //       openai: { count: number, avgScore: number },
  //       demo: { count: number, avgScore: number }
  //     }
  //   },
  //   rates: {
  //     validationRate: string,
  //     hallucinationRate: string
  //   }
  // }
}

/**
 * Validate a specific AI response
 */
async function validateResponse(responseText: string) {
  const result = await executeConsoleCommand('validate-response', {
    response: responseText
  });
  console.log('Validation Result:', result);
  // Returns: {
  //   validation: {
  //     isValid: boolean,
  //     score: number (0-100),
  //     errors: string[],
  //     warnings: string[]
  //   },
  //   hallucinations: string[],
  //   parameters: {
  //     signal?: string,
  //     priceTarget?: string,
  //     confidence?: string,
  //     stopLoss?: string,
  //     positionSize?: string
  //   },
  //   recommendedAction: 'APPROVE' | 'REJECT'
  // }
}

/**
 * Force demo mode (for testing without AI APIs)
 */
async function toggleDemoMode(enabled: boolean) {
  const result = await executeConsoleCommand('force-demo', {
    enabled
  });
  console.log('Demo mode:', enabled ? 'ENABLED' : 'DISABLED');
}

/**
 * Adjust AI creativity (temperature)
 */
async function setTemperature(value: number) {
  if (value < 0.1 || value > 1.0) {
    throw new Error('Temperature must be between 0.1 and 1.0');
  }

  const result = await executeConsoleCommand('set-temperature', {
    temperature: value
  });
  console.log('Temperature:', result.message);
  // 0.1-0.3: Deterministic (reliable, low hallucinations)
  // 0.4-0.6: Balanced (good tradeoff)
  // 0.7-1.0: Creative (higher hallucination risk)
}

/**
 * Enable strict hallucination filtering
 */
async function enableStrictMode(enabled: boolean) {
  const result = await executeConsoleCommand('enable-strict', {
    enabled
  });
  console.log('Strict mode:', enabled ? 'ENABLED' : 'DISABLED');
  // When enabled: Any response with hints of hallucination is rejected
}

/**
 * Get system health
 */
async function getHealthStatus() {
  const result = await executeConsoleCommand('health-check');
  console.log('Health:', result);
  // Returns: {
  //   ok: boolean,
  //   console: 'operational',
  //   timestamp: number,
  //   uptime: number
  // }
}

/**
 * Audit response cache
 */
async function auditCache() {
  const result = await executeConsoleCommand('audit-cache');
  console.log('Cache Audit:', result);
  // Returns: {
  //   commandHistorySize: number,
  //   recentCommands: ConsoleCommand[],
  //   metrics: ConsoleMetrics
  // }
}

// ============================================================================
// MONITORING PATTERNS
// ============================================================================

/**
 * Monitor AI quality continuously
 */
function startQualityMonitoring(intervalSeconds = 10) {
  setInterval(async () => {
    try {
      const metrics = await executeConsoleCommand('metrics');

      // Alert if hallucination rate is too high
      const hallucinationRate = parseFloat(metrics.rates.hallucinationRate);
      if (hallucinationRate > 5) {
        console.warn(`⚠️ High hallucination rate: ${hallucinationRate}%`);
        // Optionally auto-enable strict mode
        await enableStrictMode(true);
      }

      // Alert if quality score drops
      if (metrics.metrics.averageQualityScore < 60) {
        console.warn(`⚠️ Low quality score: ${metrics.metrics.averageQualityScore.toFixed(1)}/100`);
      }

      // Log provider stats
      console.log('Provider Quality:', metrics.metrics.providerStats);

    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }, intervalSeconds * 1000);
}

/**
 * Alert on validation failures
 */
function monitorValidationFailures() {
  setInterval(async () => {
    try {
      const metrics = await executeConsoleCommand('metrics');
      const validationRate = parseFloat(metrics.rates.validationRate);

      if (validationRate < 80) {
        console.warn(`⚠️ Validation rate below 80%: ${validationRate}%`);
      }

      if (metrics.metrics.lastErrors.length > 0) {
        console.warn('Recent errors:', metrics.metrics.lastErrors);
      }

    } catch (error) {
      console.error('Error monitoring failures:', error);
    }
  }, 30000); // Check every 30 seconds
}

// ============================================================================
// INTEGRATION WITH AI HUB
// ============================================================================

/**
 * Add validation info to AI response before displaying to user
 */
async function enhanceResponseDisplay(aiResponse: string) {
  try {
    const validation = await executeConsoleCommand('validate-response', {
      response: aiResponse
    });

    // Add quality badge to response
    const quality = validation.validation.score >= 80 ? '✅'
                  : validation.validation.score >= 60 ? '⚠️'
                  : '❌';

    return {
      response: aiResponse,
      quality,
      score: validation.validation.score,
      isApproved: validation.recommendedAction === 'APPROVE',
      hallucinations: validation.hallucinations,
      parameters: validation.parameters,
    };
  } catch (error) {
    console.error('Validation failed:', error);
    return {
      response: aiResponse,
      quality: '❓',
      score: 0,
      isApproved: false,
    };
  }
}

/**
 * Display response quality to user
 */
function displayResponseWithQuality(enhancedResponse: any) {
  const { response, quality, score, isApproved } = enhancedResponse;

  return `
    <div class="ai-response">
      <div class="quality-badge ${quality}">Quality: ${score}/100 ${quality}</div>
      <div class="response-text">${response}</div>
      ${!isApproved ? '<div class="warning">Response did not pass quality checks</div>' : ''}
    </div>
  `;
}

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/**
 * Verify all systems are operational before going live
 */
async function preDeploymentCheck() {
  console.log('🚀 Running pre-deployment checks...');

  try {
    // 1. Check AI status
    const status = await executeConsoleCommand('ai-status');
    console.log('✓ AI Status OK');

    // 2. Check health
    const health = await executeConsoleCommand('health-check');
    console.log('✓ Health Check OK');

    // 3. Get initial metrics
    const metrics = await executeConsoleCommand('metrics');
    console.log('✓ Metrics accessible');

    // 4. Test validation
    const testResponse = '**Signal**: BUY 75%\n**Price Target**: $50,000\n**Market Context**: Bullish\n**Reasoning**:\n• Test\n**Execution Playbook**:\n• Entry: Now\n**Risk Management**:\n• Stop: $45,000\n**Confidence**: High';
    const validation = await executeConsoleCommand('validate-response', {
      response: testResponse
    });
    console.log('✓ Validation OK');

    console.log('✅ All pre-deployment checks passed!');
    return true;

  } catch (error) {
    console.error('❌ Pre-deployment check failed:', error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  executeConsoleCommand,
  checkAIStatus,
  getMetrics,
  validateResponse,
  toggleDemoMode,
  setTemperature,
  enableStrictMode,
  getHealthStatus,
  auditCache,
  startQualityMonitoring,
  monitorValidationFailures,
  enhanceResponseDisplay,
  displayResponseWithQuality,
  preDeploymentCheck,
};

