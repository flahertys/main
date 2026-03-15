import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { WatchlistPanel } from "./WatchlistPanel";

export function PlayPicker({ plays }) {
  // plays: [{ market, odds, action, description }]
  return (
    <div style={{
      border: "1px solid #1C2333",
      borderRadius: 12,
      background: "#0E1117",
      padding: 16,
      marginBottom: 12,
      minWidth: 320,
      maxWidth: 480,
    }}>
      <h3 style={{ color: "#F5A623", fontSize: 16, marginBottom: 8 }}>Prediction Markets</h3>
      {plays.map((play, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <div style={{ color: "#C8D8E8", fontWeight: 700 }}>{play.market}</div>
          <div style={{ color: "#8EA2B8", fontSize: 12 }}>{play.description}</div>
          <div style={{ color: "#00D9FF", fontSize: 14 }}>Odds: {play.odds}</div>
          <button style={{
            marginTop: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "#00E5A0",
            color: "#090B10",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
          }}>{play.action}</button>
          {/* Advanced Charting Panel */}
          {play.history && play.history.length > 2 && (
            <div style={{ marginTop: 16 }}>
              <Plot
                data={[{
                  x: play.history.map(h => h.timestamp),
                  y: play.history.map(h => h.price),
                  type: 'scatter',
                  mode: 'lines+markers',
                  marker: { color: 'blue' },
                }]}
                layout={{
                  width: 400,
                  height: 200,
                  title: `${play.market} Price History`,
                  xaxis: { title: 'Time' },
                  yaxis: { title: 'Price' },
                  paper_bgcolor: '#0E1117',
                  plot_bgcolor: '#0E1117',
                  font: { color: '#C8D8E8' },
                }}
              />
            </div>
          )}
        </div>
      ))}
      <AnalyticsPanel />
      <WatchlistPanel />
    </div>
  );
}

// Hook to fetch live markets
export function useLivePlayPicker() {
  const [plays, setPlays] = useState([]);
  useEffect(() => {
    async function fetchMarkets() {
      const res = await fetch("/src/api/play-picker-markets.js");
      const data = await res.json();
      setPlays(data.markets || []);
    }
    fetchMarkets();
  }, []);
  return plays;
}
