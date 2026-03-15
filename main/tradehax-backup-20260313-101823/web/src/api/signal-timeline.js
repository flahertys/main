import { getHighQualitySignals } from '../api/db/metrics-repository';

export async function GET(req) {
  // Parse query parameters for filtering (symbol, days, minScore, etc.)
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const days = parseInt(url.searchParams.get('days') || '30', 10);
  const minScore = parseInt(url.searchParams.get('minScore') || '70', 10);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  // Fetch high-quality signals, optionally filter by symbol
  let signals = await getHighQualitySignals(minScore, days, limit);
  if (symbol) {
    signals = signals.filter((s) => s.symbol === symbol);
  }

  // Map to timeline format
  const timeline = signals.map((s) => ({
    id: s.id,
    symbol: s.symbol,
    action: s.action,
    generatedAt: s.generatedAt,
    outcome: s.outcome,
    returnPct: s.returnPct,
    similarity: s.similarity || 1,
  }));

  return Response.json({ timeline });
}
