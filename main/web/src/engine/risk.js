export function computeRiskPlan(signal, profile = {}) {
  const riskTolerance = profile.riskTolerance || "moderate";
  const equity = Number(profile.equity || 25000);

  const baseRiskPct = riskTolerance === "conservative" ? 0.0075 : riskTolerance === "aggressive" ? 0.02 : 0.0125;
  const confidenceFactor = Math.max(0.6, Math.min(1.25, signal.confidence / 70));

  const riskPct = baseRiskPct * confidenceFactor;
  const riskDollars = equity * riskPct;

  const stopPct = signal.action === "HOLD" ? 0.01 : 0.015;
  const targetPct = signal.action === "HOLD" ? 0.01 : 0.03;

  return {
    riskPct,
    riskDollars,
    stopPct,
    targetPct,
    maxConcurrentPositions: riskTolerance === "aggressive" ? 5 : 3,
  };
}

