import React from "react";

// SignalExplainer: Shows advanced signal breakdown, technical stats, trend, and anomaly context
export function SignalExplainer({ summary, alert, signal }) {
  // summary: { metric, latest, min, max, avg, volatility, momentum, direction, anomalies, trendLine, data }
  // alert: { metric, anomalies, volatility, momentum, direction }
  // signal: { symbol, ...other signal details }

  return (
    <div className="signal-explainer" style={{ background: '#f8faff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 16, margin: 16 }}>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>Signal Explainer <span title="AI breakdown">🧠</span></h3>
      <div style={{ marginBottom: 12 }}>
        <strong>Symbol:</strong> {signal?.symbol || 'N/A'}<br />
        <strong>Metric:</strong> {summary?.metric || 'N/A'}<br />
        <strong>Latest Value:</strong> {summary?.latest}<br />
        <strong>Avg:</strong> {summary?.avg}<br />
        <strong>Min:</strong> {summary?.min} <strong>Max:</strong> {summary?.max}<br />
        <strong>Volatility:</strong> {summary?.volatility && summary.volatility.toFixed ? summary.volatility.toFixed(2) : summary.volatility}<br />
        <strong>Momentum:</strong> {summary?.momentum && summary.momentum.toFixed ? summary.momentum.toFixed(3) : summary.momentum}<br />
        <strong>Trend:</strong> <span style={{ color: '#1976d2' }}>{summary?.direction}</span><br />
        <strong>Anomalies:</strong> {summary?.anomalies?.length || 0}
      </div>
      {alert && alert.anomalies && alert.anomalies.length > 0 && (
        <div style={{ color: '#d32f2f', marginBottom: 8 }}>
          <strong>Alert:</strong> {alert.anomalies.length} anomaly(s) detected. Trend is {alert.direction}. Volatility: {alert.volatility.toFixed(2)}.
        </div>
      )}
      <div style={{ fontSize: 13, color: '#1976d2', marginBottom: 8 }}>
        {summary?.direction === 'upward' && <span>Upward trend. Consider scaling positions.</span>}
        {summary?.direction === 'downward' && <span>Downward trend. Tighten risk controls.</span>}
        {summary?.volatility > 0.15 && <span>High volatility detected. Monitor for rapid changes.</span>}
        {alert && alert.anomalies.length > 0 && <span>Review signal quality and adjust strategy.</span>}
      </div>
      <div style={{ fontSize: 12, color: '#888' }}>
        <strong>Backtesting & LLM Presets:</strong> <br />
        {/* Placeholder for LLM-driven preset/backtest integration */}
        <span>Preset: {signal?.preset || 'Default'} | Backtest: {signal?.backtestResult || 'N/A'}</span>
      </div>
    </div>
  );
}

