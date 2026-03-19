// Advanced Analytics API: Anomaly detection & predictive signals
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { type, data } = await req.json();
  if (type === 'anomaly') {
    // Simple Z-score anomaly detection (demo)
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
    const anomalies = data.map((v, i) => ({
      index: i,
      value: v,
      z: (v - mean) / std,
      isAnomaly: Math.abs((v - mean) / std) > 2
    }));
    return NextResponse.json({ anomalies });
  }
  if (type === 'predict') {
    // Simple moving average prediction (demo)
    const window = 3;
    const predictions = data.map((_, i, arr) => {
      if (i < window) return null;
      return arr.slice(i - window, i).reduce((a, b) => a + b, 0) / window;
    });
    return NextResponse.json({ predictions });
  }
  return NextResponse.json({ error: 'Unknown analytics type' }, { status: 400 });
}

