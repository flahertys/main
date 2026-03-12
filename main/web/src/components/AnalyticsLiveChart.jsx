import React, { useEffect, useState } from "react";

function LineChart({ data, color = 'var(--accent-color)' }) {
  if (!data || data.length < 2) return null;
  const width = 320, height = 80, pad = 16;
  const minY = Math.min(...data), maxY = Math.max(...data);
  const points = data.map((v, i) => {
    const x = pad + (i * (width - 2 * pad)) / (data.length - 1);
    const y = height - pad - ((v - minY) / (maxY - minY || 1)) * (height - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ width: '100%', height: 80 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={pad} cy={height - pad - ((data[0] - minY) / (maxY - minY || 1)) * (height - 2 * pad)} r={3} fill={color} />
      <circle cx={width - pad} cy={height - pad - ((data[data.length-1] - minY) / (maxY - minY || 1)) * (height - 2 * pad)} r={3} fill={color} />
    </svg>
  );
}

export function AnalyticsLiveChart({ metric = 'confidence' }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    let ws;
    let isMounted = true;
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics?metric=${metric}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const d = await res.json();
        if (isMounted) setData(d.map(row => row[`avg_${metric}`] || 0));
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    }
    fetchData();
    ws = new WebSocket(`wss://${window.location.host}/ws/analytics?metric=${metric}`);
    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        if (d && Array.isArray(d) && isMounted) setData(d.map(row => row[`avg_${metric}`] || 0));
      } catch (err) {}
    };
    ws.onerror = () => { if (isMounted) setError('Live analytics feed error'); };
    ws.onclose = () => {};
    return () => { isMounted = false; if (ws) ws.close(); };
  }, [metric]);
  if (error) return <div style={{ color: 'var(--gold-color)', fontSize: 13 }}>Error: {error}</div>;
  if (!data.length) return <div style={{ color: 'var(--text-dim-color)', fontSize: 13 }}>Loading chart...</div>;
  return <LineChart data={data} />;
}

