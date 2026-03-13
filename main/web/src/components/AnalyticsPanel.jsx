import React, { useEffect, useState } from "react";
import { useTheme } from '../ThemeProvider.jsx';
import { AnalyticsLiveChart } from './AnalyticsLiveChart.jsx';
import { SignalExplainer } from './SignalExplainer.jsx';

export function AnalyticsPanel() {
  const { mode, toggleMode } = useTheme();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for chart summary and alerts
  const [chartSummary, setChartSummary] = useState(null);
  const [chartAlerts, setChartAlerts] = useState([]);
  // Add state for selected signal (for demo, pick first metric row)
  const [selectedSignal, setSelectedSignal] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics?metric=signals");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  // Demo: select first metric row as signal
  useEffect(() => {
    if (metrics.length > 0) {
      setSelectedSignal(metrics[0]);
    }
  }, [metrics]);

  // Onboarding/help text
  const onboardingText = `View real-time analytics for trading signals. Metrics include confidence, quality, latency, and validation rates. Use this panel to assess performance and reliability of TradeHaxAI alerts. All features are mobile-friendly and easy to use.`;

  if (loading) return <div className="panel loading">Loading analytics...</div>;
  if (error) return <div className="panel error">Error: {error}</div>;

  // Summary stats
  const totalSignals = metrics.reduce((sum, row) => sum + (row.total_signals || 0), 0);
  const avgConfidence = metrics.length ? (metrics.reduce((sum, row) => sum + (row.avg_confidence || 0), 0) / metrics.length).toFixed(2) : 0;
  const avgQuality = metrics.length ? (metrics.reduce((sum, row) => sum + (row.avg_quality || 0), 0) / metrics.length).toFixed(2) : 0;
  const avgLatency = metrics.length ? (metrics.reduce((sum, row) => sum + (row.avg_latency_ms || 0), 0) / metrics.length).toFixed(0) : 0;

  return (
    <div className="panel" style={{ margin: 24, maxWidth: 600, background: 'var(--panel-color)', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title" style={{ fontSize: 22, marginBottom: 8 }}>Signal Performance Analytics</h2>
        <button onClick={toggleMode} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--accent-color)', color: 'var(--bg-color)', border: 'none', fontWeight: 700 }}>
          {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <p className="panel-help" style={{ fontSize: 14, color: 'var(--accent-color)', marginBottom: 16 }}>{onboardingText}</p>
      <div className="panel-summary" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#f5f7fa', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Total Signals</strong>
          <div style={{ fontSize: 18 }}>{totalSignals}</div>
        </div>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#e6ffe6', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Avg Confidence</strong>
          <div style={{ fontSize: 18 }}>{avgConfidence}</div>
        </div>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#fffbe6', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Avg Quality</strong>
          <div style={{ fontSize: 18 }}>{avgQuality}</div>
        </div>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#f0f4ff', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Avg Latency (ms)</strong>
          <div style={{ fontSize: 18 }}>{avgLatency}</div>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>Live Confidence Chart <span title="Real-time confidence metric">📈</span></h3>
        <AnalyticsLiveChart
          metric="confidence"
          onMetricChange={(metric, data) => {
            setChartSummary({ metric, data });
          }}
          onAlert={(alert) => {
            setChartAlerts((prev) => [...prev, alert]);
          }}
        />
        {/* Elite Trading Tool: AI Insights & Alerts */}
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--gold-color)', background: '#fffbe6', borderRadius: 8, padding: 12 }}>
          <strong>AI Insights:</strong>
          {chartSummary && chartSummary.data && chartSummary.data.length > 1 ? (
            <span>
              Latest: {chartSummary.data[chartSummary.data.length - 1]}.&nbsp;
              Avg: {(chartSummary.data.reduce((a, b) => a + b, 0) / chartSummary.data.length).toFixed(2)}.&nbsp;
              {chartAlerts.length > 0 ? (
                <span style={{ color: 'var(--gold-color)' }}>Anomalies detected ({chartAlerts[chartAlerts.length - 1].anomalies.length}).&nbsp;</span>
              ) : (
                <span style={{ color: 'var(--accent-color)' }}>No anomalies detected.&nbsp;</span>
              )}
              Trend: <span style={{ color: 'var(--accent-color)' }}>{chartAlerts.length > 0 ? chartAlerts[chartAlerts.length - 1].direction : 'stable'}</span>.&nbsp;
              Volatility: {chartAlerts.length > 0 ? chartAlerts[chartAlerts.length - 1].volatility.toFixed(2) : '0.00'}.
              <span> Monitor for further changes.</span>
            </span>
          ) : (
            <span>Awaiting more data for actionable insights.</span>
          )}
          {chartAlerts.length > 0 && (
            <div style={{ marginTop: 8, color: 'var(--gold-color)' }}>
              <strong>Alert:</strong> {chartAlerts[chartAlerts.length - 1].anomalies.length} anomaly(s) detected. Trend is {chartAlerts[chartAlerts.length - 1].direction}. Volatility: {chartAlerts[chartAlerts.length - 1].volatility.toFixed(2)}.
            </div>
          )}
        </div>
      </div>
      {/* Signal Explainer integration */}
      {selectedSignal && chartSummary && chartAlerts.length > 0 && (
        <SignalExplainer
          summary={{ ...chartSummary, ...chartSummary.data && chartSummary.data.length > 1 ? {
            latest: chartSummary.data[chartSummary.data.length - 1],
            avg: (chartSummary.data.reduce((a, b) => a + b, 0) / chartSummary.data.length).toFixed(2),
            min: Math.min(...chartSummary.data),
            max: Math.max(...chartSummary.data),
            anomalies: chartAlerts[chartAlerts.length - 1].anomalies,
            volatility: chartAlerts[chartAlerts.length - 1].volatility,
            momentum: chartAlerts[chartAlerts.length - 1].momentum,
            direction: chartAlerts[chartAlerts.length - 1].direction,
          } : {} }}
          alert={chartAlerts[chartAlerts.length - 1]}
          signal={selectedSignal}
        />
      </div>
      <table className="analytics-table" style={{ width: "100%", borderCollapse: "collapse", background: '#fff', borderRadius: 8 }}>
        <thead>
          <tr>
            <th>Signal Type <span title="Type of trading signal">ℹ️</span></th>
            <th>Total Signals <span title="Total number of signals">ℹ️</span></th>
            <th>Avg Confidence <span title="Average confidence score">ℹ️</span></th>
            <th>Avg Quality <span title="Average quality score">ℹ️</span></th>
            <th>Validation Pass Rate <span title="Percent of signals validated">ℹ️</span></th>
            <th>Avg Latency (ms) <span title="Average latency in milliseconds">ℹ️</span></th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((row, idx) => (
            <tr key={idx}>
              <td>{row.signal_type}</td>
              <td>{row.total_signals}</td>
              <td>{row.avg_confidence}</td>
              <td>{row.avg_quality}</td>
              <td>{row.validation_pass_rate}%</td>
              <td>{row.avg_latency_ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {metrics.length === 0 && <div className="empty-analytics" style={{ color: '#888', fontSize: 14, marginTop: 12 }}>No analytics data found.</div>}
    </div>
  );
}
