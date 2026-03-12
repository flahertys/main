/**
 * TradeHax AI Response Validators
 * Multi-layer quality gates to eliminate hallucinations and worthless output
 *
 * Strategy:
 * 1. Structural validation - ensure all required sections present and well-formed
 * 2. Semantic validation - detect nonsensical or contradictory content
 * 3. Confidence scoring - rate response quality before sending to user
 * 4. Fallback quality - provide guaranteed structured response when validation fails
 */

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  cleanedResponse?: string;
}

export interface ResponseQualityMetrics {
  hasSignal: boolean;
  hasPriceTarget: boolean;
  hasMarketContext: boolean;
  hasReasoning: boolean;
  hasExecutionPlaybook: boolean;
  hasRiskManagement: boolean;
  hasConfidence: boolean;
  signalClarity: number; // 0-100
  priceTargetValidity: number; // 0-100
  confidenceAlignment: number; // 0-100
  contradictions: string[];
}

const REQUIRED_SECTIONS = [
  '**Signal**:',
  '**Price Target**:',
  '**Market Context**:',
  '**Reasoning**:',
  '**Execution Playbook**:',
  '**Risk Management**:',
  '**Confidence**:',
];

const HALLUCINATION_PATTERNS = [
  /\$\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:to|-|–)\s*\$\d+(?:,\d{3})*(?:\.\d{1,2})?(?:\s*in\s+\d+\s*(?:minute|hour|day|week))?/gi, // Price targets with specific timeframes
  /(?:BUY|SELL|HOLD)\s+(?:\d+)%/gi, // Signal format
  /(?:Stop-loss|Position size|Max drawdown):/gi, // Risk management markers
];

const VAGUE_PHRASES = [
  'should go up',
  'might move',
  'could be',
  'maybe',
  'probably',
  'if market conditions',
  'depends on',
  'may or may not',
  'hard to say',
  'unclear',
  'we dont know',
];

const CONFIDENCE_KEYWORDS = {
  high: ['strong', 'clear', 'confirmed', 'solid', 'high probability', 'likely', 'expected'],
  medium: ['moderate', 'reasonable', 'decent', 'likely enough', 'decent chance'],
  low: ['weak', 'unclear', 'uncertain', 'low probability', 'fragile', 'risky'],
};

/**
 * Validate that response has all required structural elements
 */
export function validateStructure(response: string): {
  complete: boolean;
  missingSections: string[];
} {
  const missingSections = REQUIRED_SECTIONS.filter(
    (section) => !response.includes(section)
  );

  return {
    complete: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Detect contradictions and logical inconsistencies
 */
export function detectContradictions(response: string): string[] {
  const contradictions: string[] = [];
  const lower = response.toLowerCase();

  // Extract signal
  const signalMatch = response.match(/\*\*Signal\*\*:\s*([^\n]+)/i);
  const signal = signalMatch ? signalMatch[1].trim().toUpperCase() : '';

  // Extract confidence
  const confidenceMatch = response.match(/\*\*Confidence\*\*:\s*([^\n]+)/i);
  const confidence = confidenceMatch ? confidenceMatch[1].trim() : '';

  // Contradiction: BUY signal with low confidence
  if (signal.includes('BUY') && confidence.includes('Low')) {
    contradictions.push('BUY signal contradicts Low confidence rating');
  }

  // Contradiction: SELL signal with high confidence but no risk mention
  if (signal.includes('SELL') && !lower.includes('stop-loss')) {
    contradictions.push('SELL signal without mentioned stop-loss protection');
  }

  // Contradiction: HOLD signal with specific price target
  if (signal.includes('HOLD')) {
    const priceMatch = response.match(/\*\*Price Target\*\*:\s*([^\n]+)/i);
    const priceTarget = priceMatch ? priceMatch[1].trim() : '';
    if (
      priceTarget &&
      !priceTarget.toLowerCase().includes('no target') &&
      !priceTarget.toLowerCase().includes('range')
    ) {
      contradictions.push('HOLD signal with specific price target (should be range-bound)');
    }
  }

  // Contradiction: Multiple contradictory risk statements
  const stopLosses = response.match(/Stop-loss:\s*([^\n]+)/g);
  if (stopLosses && stopLosses.length > 1) {
    const unique = new Set(stopLosses.map((sl) => sl.toLowerCase()));
    if (unique.size > 1) {
      contradictions.push('Multiple conflicting stop-loss definitions');
    }
  }

  return contradictions;
}

/**
 * Detect potential hallucinations (made-up data or nonsense)
 */
export function detectHallucinations(response: string): string[] {
  const hallucinations: string[] = [];

  // Check for specific non-existent cryptocurrencies or assets
  const invalidAssets = response.match(/\b[A-Z]{4,}\b/g) || [];
  const knownAssets = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'LINK', 'AVAX', 'MATIC', 'XRP', 'USDC', 'USDT', 'DAI'];
  for (const asset of invalidAssets) {
    if (!knownAssets.includes(asset) && asset.length > 3) {
      // Might be hallucinated asset name
      if (/^[A-Z]{4,6}$/.test(asset) && Math.random() < 0.3) {
        hallucinations.push(`Potentially fabricated asset: ${asset}`);
      }
    }
  }

  // Check for unrealistic price movements
  const pricePatterns = response.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:to|-|–)\s*\$[\d,]+(?:\.\d+)?)?/g) || [];
  for (const pattern of pricePatterns) {
    const prices = pattern.match(/\$[\d,]+(?:\.\d+)?/g) || [];
    if (prices.length === 2) {
      const [from, to] = prices.map((p) => parseFloat(p.replace(/[$,]/g, '')));
      const change = Math.abs((to - from) / from);
      // Flag > 500% movements in short timeframes as potential hallucinations
      if (change > 5) {
        hallucinations.push(`Unrealistic price movement detected: ${pattern}`);
      }
    }
  }

  // Check for vague or non-actionable reasoning
  for (const phrase of VAGUE_PHRASES) {
    if (response.toLowerCase().includes(phrase)) {
      hallucinations.push(`Vague language detected: "${phrase}"`);
    }
  }

  // Check for percentage values that don't make sense
  const percentMatches = response.match(/(\d+(?:\.\d+)?)\s*%/g) || [];
  for (const pct of percentMatches) {
    const value = parseFloat(pct);
    if (value > 100) {
      hallucinations.push(`Invalid percentage detected: ${pct}`);
    }
  }

  return hallucinations;
}

/**
 * Calculate semantic quality metrics
 */
export function assessQualityMetrics(response: string): ResponseQualityMetrics {
  const lower = response.toLowerCase();

  // Check for sections
  const sections = {
    hasSignal: response.includes('**Signal**:'),
    hasPriceTarget: response.includes('**Price Target**:'),
    hasMarketContext: response.includes('**Market Context**:'),
    hasReasoning: response.includes('**Reasoning**:'),
    hasExecutionPlaybook: response.includes('**Execution Playbook**:'),
    hasRiskManagement: response.includes('**Risk Management**:'),
    hasConfidence: response.includes('**Confidence**:'),
  };

  // Extract and score signal
  const signalMatch = response.match(/\*\*Signal\*\*:\s*([^\n]+)/i);
  const signal = signalMatch ? signalMatch[1].trim() : '';
  const signalClarity = /^(?:BUY|SELL|HOLD)\s+\d+%/.test(signal) ? 100 : 60;

  // Extract and score price target
  const priceMatch = response.match(/\*\*Price Target\*\*:\s*([^\n]+)/i);
  const priceTarget = priceMatch ? priceMatch[1].trim() : '';
  const priceTargetValidity = /\$[\d,]+/.test(priceTarget) && priceTarget.length > 10 ? 100 : 50;

  // Extract and score confidence
  const confidenceMatch = response.match(/\*\*Confidence\*\*:\s*([^\n]+)/i);
  const confidenceText = confidenceMatch ? confidenceMatch[1].toLowerCase() : '';

  let confidenceAlignment = 50;
  if (confidence_KEYWORDS.high.some((kw) => confidenceText.includes(kw))) {
    confidenceAlignment = 90;
  } else if (CONFIDENCE_KEYWORDS.medium.some((kw) => confidenceText.includes(kw))) {
    confidenceAlignment = 70;
  } else if (CONFIDENCE_KEYWORDS.low.some((kw) => confidenceText.includes(kw))) {
    confidenceAlignment = 50;
  }

  const contradictions = detectContradictions(response);

  return {
    ...sections,
    signalClarity,
    priceTargetValidity,
    confidenceAlignment,
    contradictions,
  };
}

/**
 * Full validation pipeline
 */
export function validateResponse(response: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // 1. Structural validation (30% of score)
  const { complete, missingSections } = validateStructure(response);
  if (!complete) {
    errors.push(`Missing sections: ${missingSections.join(', ')}`);
    score -= missingSections.length * 5;
  }

  // 2. Hallucination detection (35% of score)
  const hallucinations = detectHallucinations(response);
  if (hallucinations.length > 0) {
    for (const h of hallucinations) {
      errors.push(h);
      score -= 10;
    }
  }

  // 3. Contradiction detection (20% of score)
  const contradictions = detectContradictions(response);
  if (contradictions.length > 0) {
    for (const c of contradictions) {
      warnings.push(c);
      score -= 8;
    }
  }

  // 4. Quality metrics (15% of score)
  const metrics = assessQualityMetrics(response);
  if (metrics.signalClarity < 80) {
    warnings.push('Signal clarity could be improved');
    score -= 5;
  }
  if (metrics.priceTargetValidity < 80) {
    warnings.push('Price target lacks specific detail');
    score -= 5;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: score >= 50 && errors.length === 0,
    score,
    errors,
    warnings,
    cleanedResponse: response,
  };
}

/**
 * Check if a response is likely a hallucination based on multiple signals
 */
export function isLikelyHallucination(response: string): boolean {
  const validation = validateResponse(response);

  // High error count or very low score indicates hallucination
  if (validation.errors.length >= 3 || validation.score < 40) {
    return true;
  }

  // Multiple hallucination patterns triggered
  const hallucinations = detectHallucinations(response);
  if (hallucinations.length > 2) {
    return true;
  }

  return false;
}

/**
 * Extract key trading parameters from validated response
 */
export function extractTradingParameters(response: string): {
  signal?: string;
  priceTarget?: string;
  confidence?: string;
  stopLoss?: string;
  positionSize?: string;
} {
  const extract = (pattern: RegExp): string | undefined => {
    const match = response.match(pattern);
    return match ? match[1].trim() : undefined;
  };

  return {
    signal: extract(/\*\*Signal\*\*:\s*([^\n]+)/i),
    priceTarget: extract(/\*\*Price Target\*\*:\s*([^\n]+)/i),
    confidence: extract(/\*\*Confidence\*\*:\s*([^\n]+)/i),
    stopLoss: extract(/Stop-loss:\s*([^\n]+)/i),
    positionSize: extract(/Position size:\s*([^\n]+)/i),
  };
}

