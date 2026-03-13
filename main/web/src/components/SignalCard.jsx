import React from "react";
import { useEffect, useState } from "react";
import { SignalTimeline } from "../../../components/trading/SignalTimeline";

export function SignalCard({ signal }) {
  // signal: { symbol, action, confidence, trend, play, odds, timeframe }
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Real-time updates
  useEffect(() => {
    let ws;
    let isMounted = true;
    setLoading(true);
    setError(null);
    async function fetchTimeline() {
      try {
        const res = await fetch(`/api/signal-timeline.js?symbol=${encodeURIComponent(signal.symbol)}`);
        if (!res.ok) throw new Error('Failed to fetch timeline');
        const data = await res.json();
        if (isMounted) setTimeline(data.timeline || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTimeline();
    // WebSocket for real-time updates
    ws = new WebSocket(`wss://${window.location.host}/ws/signals?symbol=${encodeURIComponent(signal.symbol)}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.timeline && isMounted) setTimeline(data.timeline);
      } catch (err) {}
    };
    ws.onerror = () => { if (isMounted) setError('Live signal feed error'); };
    ws.onclose = () => {};
    return () => { isMounted = false; if (ws) ws.close(); };
  }, [signal.symbol]);

  return (
    <div style={{
      border: "1px solid #1C2333",
      borderRadius: 12,
      background: "#12161E",
      padding: 16,
      marginBottom: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minWidth: 320,
      maxWidth: 480,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "#C8D8E8", fontSize: 18 }}>{signal.symbol}</strong>
        <span style={{ color: signal.action === "BUY" ? "#00E5A0" : "#F5A623", fontWeight: 700 }}>{signal.action}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 120, height: 8, background: "#1C2333", borderRadius: 4 }}>
          <div style={{ width: `${signal.confidence}%`, height: 8, background: signal.confidence > 70 ? "#00E5A0" : "#F5A623", borderRadius: 4 }} />
        </div>
        <span style={{ color: "#8EA2B8", fontSize: 12 }}>{signal.confidence}% confidence</span>
        {signal.trend && <span style={{ fontSize: 16 }}>{signal.trend === "up" ? "↑" : "↓"}</span>}
      </div>
      {signal.play && (
        <div style={{ color: "#00D9FF", fontSize: 14 }}>
          Play: {signal.play} | Odds: {signal.odds}
        </div>
      )}
      <div style={{ color: "#8EA2B8", fontSize: 12 }}>Timeframe: {signal.timeframe}</div>
      <button style={{
        marginTop: 8,
        padding: "10px 16px",
        borderRadius: 8,
        background: "#00D9FF",
        color: "#090B10",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        fontSize: 16,
      }}>Action</button>
      {/* Signal Timeline Visualization */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ color: '#8EA2B8', fontSize: 12 }}>Loading signal history...</div>
        ) : error ? (
          <div style={{ color: '#F5A623', fontSize: 12 }}>Error: {error}</div>
        ) : (
          <SignalTimeline signals={timeline} />
        )}
      </div>
    </div>
  );
}
