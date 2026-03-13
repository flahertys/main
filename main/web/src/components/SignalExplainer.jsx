import React, { useState } from "react";

// SignalExplainer: Shows advanced signal breakdown, technical stats, trend, and anomaly context
export function SignalExplainer({ summary, alert, signal }) {
  // summary: { metric, latest, min, max, avg, volatility, momentum, direction, anomalies, trendLine, data }
  // alert: { metric, anomalies, volatility, momentum, direction }
  // signal: { symbol, ...other signal details }

  // State for LLM preset and backtest result
  const [llmPreset, setLlmPreset] = useState(signal?.preset || 'Default');
  const [backtestResult, setBacktestResult] = useState(signal?.backtestResult || 'N/A');
  const [llmRecommendation, setLlmRecommendation] = useState('');
  const [loadingLLM, setLoadingLLM] = useState(false);
  const [loadingBacktest, setLoadingBacktest] = useState(false);

  // Handler for LLM preset change
  async function handleLlmPresetChange(e) {
    const preset = e.target.value;
    setLlmPreset(preset);
    setLoadingLLM(true);
    // Simulate LLM API call
    try {
      // Replace with real LLM API call
      const res = await fetch(`/api/llm/recommendation?symbol=${signal?.symbol}&preset=${preset}`);
      const data = await res.json();
      setLlmRecommendation(data.recommendation || 'No recommendation available.');
    } catch {
      setLlmRecommendation('LLM API error.');
    } finally {
      setLoadingLLM(false);
    }
  }

  // Handler for backtest trigger
  async function handleBacktest() {
    setLoadingBacktest(true);
    // Simulate backtest API call
    try {
      // Replace with real backtest API call
      const res = await fetch(`/api/backtest?symbol=${signal?.symbol}&preset=${llmPreset}`);
      const data = await res.json();
      setBacktestResult(data.result || 'No backtest result.');
    } catch {
      setBacktestResult('Backtest API error.');
    } finally {
      setLoadingBacktest(false);
    }
  }

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
      {/* LLM preset selection and recommendation */}
      <div style={{ marginBottom: 12 }}>
        <strong>LLM Preset:</strong>
        <select value={llmPreset} onChange={handleLlmPresetChange} style={{ marginLeft: 8, padding: 4, borderRadius: 6 }}>
          <option value="Default">Default</option>
          <option value="Operator">Operator</option>
          <option value="Analyst">Analyst</option>
          <option value="Growth">Growth</option>
          <option value="Research">Research</option>
        </select>
        {loadingLLM ? <span style={{ marginLeft: 8 }}>Loading LLM...</span> : <span style={{ marginLeft: 8, color: '#1976d2' }}>{llmRecommendation}</span>}
      </div>
      {/* Backtest trigger and result */}
      <div style={{ marginBottom: 12 }}>
        <strong>Backtesting:</strong>
        <button onClick={handleBacktest} style={{ marginLeft: 8, padding: '4px 10px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }}>Run Backtest</button>
        {loadingBacktest ? <span style={{ marginLeft: 8 }}>Running backtest...</span> : <span style={{ marginLeft: 8, color: '#388e3c' }}>{backtestResult}</span>}
      </div>
      <div style={{ fontSize: 12, color: '#888' }}>
        <strong>Backtesting & LLM Presets:</strong> <br />
        <span>Preset: {llmPreset} | Backtest: {backtestResult}</span>
      </div>
    </div>
  );
}
