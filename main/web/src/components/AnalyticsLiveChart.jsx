import React, { useEffect, useState, useRef } from "react";

// Utility: Simple linear regression for trend line
function linearRegression(data) {
  const n = data.length;
  if (n < 2) return null;
  const xSum = n * (n - 1) / 2;
  const ySum = data.reduce((a, b) => a + b, 0);
  const x2Sum = n * (n - 1) * (2 * n - 1) / 6;
  const xySum = data.reduce((sum, y, x) => sum + x * y, 0);
  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;
  return { slope, intercept };
}

// Utility: Detect anomalies (outliers >2 std dev)
function detectAnomalies(data) {
  if (!data.length) return [];
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
  return data.map((v, i) => Math.abs(v - mean) > 2 * std ? i : -1).filter(i => i >= 0);
}

function LineChart({ data, color = 'var(--accent-color)', trendLine, anomalies }) {
  if (!data || data.length < 2) return null;
  const width = 320, height = 80, pad = 16;
  const minY = Math.min(...data), maxY = Math.max(...data);
  const points = data.map((v, i) => {
    const x = pad + (i * (width - 2 * pad)) / (data.length - 1);
    const y = height - pad - ((v - minY) / (maxY - minY || 1)) * (height - 2 * pad);
    return `${x},${y}`;
  }).join(' ');

  // Trend line
  let trendPoints = '';
  if (trendLine) {
    trendPoints = data.map((_, i) => {
      const x = pad + (i * (width - 2 * pad)) / (data.length - 1);
      const y = height - pad - ((trendLine.slope * i + trendLine.intercept - minY) / (maxY - minY || 1)) * (height - 2 * pad);
      return `${x},${y}`;
    }).join(' ');
  }

  return (
    <svg width={width} height={height} style={{ width: '100%', height: 80 }} aria-label="Live analytics chart">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      {trendLine && <polyline points={trendPoints} fill="none" stroke="var(--gold-color)" strokeWidth={2} strokeDasharray="4 2" />}
      <circle cx={pad} cy={height - pad - ((data[0] - minY) / (maxY - minY || 1)) * (height - 2 * pad)} r={3} fill={color} />
      <circle cx={width - pad} cy={height - pad - ((data[data.length-1] - minY) / (maxY - minY || 1)) * (height - 2 * pad)} r={3} fill={color} />
      {anomalies && anomalies.map(i => {
        const x = pad + (i * (width - 2 * pad)) / (data.length - 1);
        const y = height - pad - ((data[i] - minY) / (maxY - minY || 1)) * (height - 2 * pad);
        return <circle key={i} cx={x} cy={y} r={5} fill="var(--gold-color)" stroke="var(--accent-color)" strokeWidth={2} />;
      })}
    </svg>
  );
}

export function AnalyticsLiveChart({ metric = 'confidence', metrics = ['confidence', 'quality', 'latency', 'win_rate'] }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const chartRef = useRef();
  // Advanced stats for AI/LLM integration
  const [summary, setSummary] = useState({});

  useEffect(() => {
    let ws;
    let isMounted = true;
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics?metric=${selectedMetric}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const d = await res.json();
        const values = d.map(row => row[`avg_${selectedMetric}`] || 0);
        if (isMounted) setData(values);
        if (onMetricChange) onMetricChange(selectedMetric, values);
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    }
    fetchData();
    ws = new WebSocket(`wss://${window.location.host}/ws/analytics?metric=${selectedMetric}`);
    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        if (d && Array.isArray(d) && isMounted) {
          const values = d.map(row => row[`avg_${selectedMetric}`] || 0);
          setData(values);
          if (onMetricChange) onMetricChange(selectedMetric, values);
        }
      } catch (err) {}
    };
    ws.onerror = () => { if (isMounted) setError('Live analytics feed error'); };
    ws.onclose = () => {};
    return () => { isMounted = false; if (ws) ws.close(); };
  }, [selectedMetric, onMetricChange]);

  // Accessibility: ARIA labels, keyboard navigation
  const chartLabel = `Live ${selectedMetric.replace('_', ' ')} chart`;

  // Predictive analytics & anomaly detection
  const trendLine = data.length > 1 ? linearRegression(data) : null;
  const anomalies = detectAnomalies(data);
  // Volatility, momentum, and alerting
  const volatility = data.length > 1 ? Math.sqrt(data.reduce((a, b) => a + Math.pow(b - (data.reduce((a, b) => a + b, 0) / data.length), 2), 0) / data.length) : 0;
  const momentum = trendLine ? trendLine.slope : 0;
  const direction = momentum > 0.01 ? 'upward' : momentum < -0.01 ? 'downward' : 'stable';
  // Alert logic: notify parent if critical anomaly or threshold
  useEffect(() => {
    if (onAlert && anomalies.length > 0) {
      onAlert({ metric: selectedMetric, anomalies, volatility, momentum, direction });
    }
  }, [anomalies, volatility, momentum, direction, selectedMetric, onAlert]);
  // Advanced summary for LLMs, presets, backtesting
  useEffect(() => {
    setSummary({
      metric: selectedMetric,
      latest: data.length ? data[data.length - 1] : null,
      min: data.length ? Math.min(...data) : null,
      max: data.length ? Math.max(...data) : null,
      avg: data.length ? (data.reduce((a, b) => a + b, 0) / data.length).toFixed(2) : null,
      volatility,
      momentum,
      direction,
      anomalies,
      trendLine,
      data,
    });
  }, [data, selectedMetric, volatility, momentum, direction, anomalies, trendLine]);

  // Export CSV
  function exportCSV() {
    if (!data.length) return;
    const csv = data.map((v, i) => `${i + 1},${v}`).join("\n");
    const blob = new Blob(["Index,Value\n" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedMetric}_analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PNG
  function exportPNG() {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;
    const img = new Image();
    img.src = image64;
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = svg.width.baseVal.value;
      canvas.height = svg.height.baseVal.value;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `${selectedMetric}_analytics.png`;
      a.click();
    };
  }

  // Share (copy summary)
  function shareSummary() {
    const summary = `TradeHax Analytics (${selectedMetric}): Latest=${latest}, Min=${min}, Max=${max}, Avg=${avg}, Anomalies=${anomalies.length}`;
    navigator.clipboard.writeText(summary);
    alert("Analytics summary copied to clipboard!");
  }

  // Responsive summary stats
  const latest = summary.latest;
  const min = summary.min;
  const max = summary.max;
  const avg = summary.avg;

  return (
    <div ref={chartRef} style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {metrics.map(m => (
          <button
            key={m}
            aria-label={`Show ${m} chart`}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: selectedMetric === m ? 'var(--accent-color)' : 'var(--border-color)',
              color: selectedMetric === m ? 'var(--bg-color)' : 'var(--text-color)',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => setSelectedMetric(m)}
            tabIndex={0}
          >
            {m.replace('_', ' ').toUpperCase()}
          </button>
        ))}
        <button onClick={exportCSV} aria-label="Export CSV" style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--border-color)', color: 'var(--accent-color)', border: 'none', fontWeight: 700 }}>Export CSV</button>
        <button onClick={exportPNG} aria-label="Export PNG" style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--border-color)', color: 'var(--accent-color)', border: 'none', fontWeight: 700 }}>Export PNG</button>
        <button onClick={shareSummary} aria-label="Share Analytics" style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--border-color)', color: 'var(--accent-color)', border: 'none', fontWeight: 700 }}>Share</button>
      </div>
      {error && <div style={{ color: 'var(--gold-color)', fontSize: 13 }}>Error: {error}</div>}
      {!data.length && !error && <div style={{ color: 'var(--text-dim-color)', fontSize: 13 }}>Loading chart...</div>}
      {data.length > 1 && (
        <LineChart data={data} color='var(--accent-color)' trendLine={trendLine} anomalies={anomalies} aria-label={chartLabel} />
      )}
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim-color)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <span>Latest: <strong style={{ color: 'var(--accent-color)' }}>{latest}</strong></span>
        <span>Min: {min}</span>
        <span>Max: {max}</span>
        <span>Avg: {avg}</span>
        <span>Volatility: {summary.volatility && summary.volatility.toFixed ? summary.volatility.toFixed(2) : summary.volatility}</span>
        <span>Momentum: {summary.momentum && summary.momentum.toFixed ? summary.momentum.toFixed(3) : summary.momentum}</span>
        <span>Trend: <strong style={{ color: 'var(--accent-color)' }}>{summary.direction}</strong></span>
        <span style={{ color: 'var(--gold-color)' }}>Anomalies: {anomalies.length}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-dim-color)' }}>
        {selectedMetric === 'confidence' && 'Confidence reflects the AI’s certainty in signal accuracy.'}
        {selectedMetric === 'quality' && 'Quality measures the robustness and reliability of signals.'}
        {selectedMetric === 'latency' && 'Latency tracks the speed of signal delivery.'}
        {selectedMetric === 'win_rate' && 'Win rate shows the percentage of successful signals.'}
        {summary.volatility > 0.15 && <span style={{ color: 'var(--gold-color)' }}>High volatility detected.</span>}
        {summary.direction === 'upward' && <span style={{ color: 'var(--accent-color)' }}>Upward trend.</span>}
        {summary.direction === 'downward' && <span style={{ color: 'var(--accent-color)' }}>Downward trend.</span>}
        {anomalies.length > 0 && <span style={{ color: 'var(--gold-color)' }}>Anomalies present. Review signal quality.</span>}
            // PropTypes and default props for integration
            AnalyticsLiveChart.defaultProps = {
              onMetricChange: undefined,
              onAlert: undefined,
            };
      </div>
    </div>
  );
}
