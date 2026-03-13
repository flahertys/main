import React, { useEffect, useState } from "react";
import { AnalyticsLiveChart } from './AnalyticsLiveChart.jsx';

export function WatchlistPanel() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState("");

  // Filtering controls
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterDelivered, setFilterDelivered] = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");

  // State for chart analytics and alerts per symbol
  const [symbolAnalytics, setSymbolAnalytics] = useState({});
  const [symbolAlerts, setSymbolAlerts] = useState({});

  useEffect(() => {
    async function fetchWatchlist() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/watchlist");
        if (!res.ok) throw new Error("Failed to fetch watchlist");
        const data = await res.json();
        setItems(data.items || []);
        setAlerts(data.alerts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWatchlist();
  }, []);

  async function handleAddSymbol() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) throw new Error("Failed to add symbol");
      await res.json();
      setSymbol("");
      // Refresh watchlist
      const updated = await fetch("/api/watchlist");
      const data = await updated.json();
      setItems(data.items || []);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveSymbol(sym) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove symbol");
      await res.json();
      // Refresh watchlist
      const updated = await fetch("/api/watchlist");
      const data = await updated.json();
      setItems(data.items || []);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilter() {
    setLoading(true);
    setError(null);
    try {
      const params = [];
      if (filterSeverity) params.push(`severity=${encodeURIComponent(filterSeverity)}`);
      if (filterDelivered) params.push(`delivered=${encodeURIComponent(filterDelivered)}`);
      if (filterSymbol) params.push(`symbol=${encodeURIComponent(filterSymbol)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      const res = await fetch(`/api/watchlist${query}`);
      if (!res.ok) throw new Error("Failed to filter alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDelivered(summary) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, delivered: true }),
      });
      if (!res.ok) throw new Error("Failed to mark delivered");
      await res.json();
      // Refresh alerts
      await handleFilter();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSnooze(summary) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, snoozed: true }),
      });
      if (!res.ok) throw new Error("Failed to snooze alert");
      await res.json();
      // Refresh alerts
      await handleFilter();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Summary stats
  const totalAlerts = alerts.length;
  const deliveredAlerts = alerts.filter(a => a.delivered).length;
  const pendingAlerts = alerts.filter(a => !a.delivered && !a.snoozed).length;
  const snoozedAlerts = alerts.filter(a => a.snoozed).length;

  // Onboarding/help text
  const onboardingText = `Welcome to TradeHaxAI! Add symbols to your watchlist to receive actionable alerts. Use filters to find relevant signals. Mark alerts as delivered or snooze them for later. All features are mobile-friendly and easy to use.`;

  if (loading) return <div className="panel loading">Loading watchlist...</div>;
  if (error) return <div className="panel error">Error: {error}</div>;

  return (
    <div className="panel" style={{ margin: 24, maxWidth: 600, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 16 }}>
      <h2 className="panel-title" style={{ fontSize: 22, marginBottom: 8 }}>Watchlist & Alerts</h2>
      <p className="panel-help" style={{ fontSize: 14, color: '#1976d2', marginBottom: 16 }}>{onboardingText}</p>
      <div className="panel-summary" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#f5f7fa', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Total Alerts</strong>
          <div style={{ fontSize: 18 }}>{totalAlerts}</div>
        </div>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#e6ffe6', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Delivered</strong>
          <div style={{ fontSize: 18 }}>{deliveredAlerts}</div>
        </div>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#fffbe6', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Pending</strong>
          <div style={{ fontSize: 18 }}>{pendingAlerts}</div>
        </div>
        <div className="summary-card" style={{ flex: 1, minWidth: 120, background: '#f0f4ff', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <strong>Snoozed</strong>
          <div style={{ fontSize: 18 }}>{snoozedAlerts}</div>
        </div>
      </div>
      <div className="panel-section" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>Watchlist <span title="Add symbols to receive alerts">ℹ️</span></h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="Add symbol (e.g. AAPL, BTC)"
            className="input"
            style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            title="Enter a symbol and click Add"
          />
          <button className="btn" style={{ padding: '8px 16px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }} onClick={handleAddSymbol} title="Add to watchlist">Add</button>
        </div>
        <ul className="watchlist-list" style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item, idx) => (
            <li key={idx} className="watchlist-item" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{item.symbol}</span>
                <button className="btn btn-remove" style={{ padding: '4px 10px', borderRadius: 6, background: '#d32f2f', color: '#fff', border: 'none' }} onClick={() => handleRemoveSymbol(item.symbol)} title="Remove from watchlist">Remove</button>
              </div>
              {/* Live analytics for each symbol */}
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <AnalyticsLiveChart
                  metric="confidence"
                  metrics={["confidence", "quality", "latency", "win_rate"]}
                  onMetricChange={(metric, data) => {
                    setSymbolAnalytics(prev => ({ ...prev, [item.symbol]: { metric, data } }));
                  }}
                  onAlert={(alert) => {
                    setSymbolAlerts(prev => ({ ...prev, [item.symbol]: alert }));
                  }}
                />
                {/* AI Insights & Alerts for symbol */}
                <div style={{ fontSize: 13, color: '#1976d2', background: '#f0f4ff', borderRadius: 8, padding: 8, marginTop: 8 }}>
                  <strong>AI Insights:</strong>
                  {symbolAnalytics[item.symbol] && symbolAnalytics[item.symbol].data && symbolAnalytics[item.symbol].data.length > 1 ? (
                    <span>
                      Latest: {symbolAnalytics[item.symbol].data[symbolAnalytics[item.symbol].data.length - 1]}.&nbsp;
                      Avg: {(symbolAnalytics[item.symbol].data.reduce((a, b) => a + b, 0) / symbolAnalytics[item.symbol].data.length).toFixed(2)}.&nbsp;
                      {symbolAlerts[item.symbol] && symbolAlerts[item.symbol].anomalies.length > 0 ? (
                        <span style={{ color: '#d32f2f' }}>Anomalies detected ({symbolAlerts[item.symbol].anomalies.length}).&nbsp;</span>
                      ) : (
                        <span style={{ color: '#388e3c' }}>No anomalies detected.&nbsp;</span>
                      )}
                      Trend: <span style={{ color: '#1976d2' }}>{symbolAlerts[item.symbol] ? symbolAlerts[item.symbol].direction : 'stable'}</span>.&nbsp;
                      Volatility: {symbolAlerts[item.symbol] ? symbolAlerts[item.symbol].volatility.toFixed(2) : '0.00'}.
                      <span> Monitor for further changes.</span>
                    </span>
                  ) : (
                    <span>Awaiting more data for actionable insights.</span>
                  )}
                  {symbolAlerts[item.symbol] && symbolAlerts[item.symbol].anomalies.length > 0 && (
                    <div style={{ marginTop: 6, color: '#d32f2f' }}>
                      <strong>Alert:</strong> {symbolAlerts[item.symbol].anomalies.length} anomaly(s) detected. Trend is {symbolAlerts[item.symbol].direction}. Volatility: {symbolAlerts[item.symbol].volatility.toFixed(2)}.
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel-section">
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>Alerts <span title="Filter and manage alerts">ℹ️</span></h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            value={filterSymbol}
            onChange={e => setFilterSymbol(e.target.value)}
            placeholder="Filter by symbol"
            className="input"
            style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            title="Type to filter alerts by symbol"
          />
          <select className="input" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} title="Filter by severity">
            <option value="">All Severities</option>
            <option value="watch">Watch</option>
            <option value="urgent">Urgent</option>
          </select>
          <select className="input" value={filterDelivered} onChange={e => setFilterDelivered(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} title="Filter by delivery status">
            <option value="">All Status</option>
            <option value="true">Delivered</option>
            <option value="false">Pending</option>
          </select>
          <button className="btn" style={{ padding: '8px 16px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }} onClick={handleFilter} title="Apply filter to alerts">Apply Filter</button>
        </div>
        <ul className="alerts-list" style={{ listStyle: 'none', padding: 0 }}>
          {alerts.map((alert, idx) => (
            <li key={idx} className={`alert-item ${alert.delivered ? 'delivered' : alert.snoozed ? 'snoozed' : 'pending'}`}
                style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: alert.delivered ? '#e6ffe6' : alert.snoozed ? '#fffbe6' : '#f0f4ff', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="alert-summary" title={alert.summary} style={{ fontWeight: 600 }}>{alert.summary}</span>
              <span className="alert-severity" style={{ fontWeight: 600, color: alert.severity === 'urgent' ? '#d32f2f' : '#1976d2' }}>{alert.severity}</span>
              <span className="alert-status" style={{ fontSize: 12, color: '#888' }}>
                {alert.delivered ? "Delivered" : alert.snoozed ? "Snoozed" : "Pending"}
              </span>
              <span className="alert-timestamp" style={{ fontSize: 10, color: '#888' }}> {alert.timestamp}</span>
              {!alert.delivered && (
                <button className="btn btn-action" style={{ padding: '4px 10px', borderRadius: 6, background: '#388e3c', color: '#fff', border: 'none' }} onClick={() => handleMarkDelivered(alert.summary)} title="Mark as delivered">Mark Delivered</button>
              )}
              {!alert.snoozed && (
                <button className="btn btn-action" style={{ padding: '4px 10px', borderRadius: 6, background: '#ffa000', color: '#fff', border: 'none' }} onClick={() => handleSnooze(alert.summary)} title="Snooze alert">Snooze</button>
              )}
            </li>
          ))}
        </ul>
        {alerts.length === 0 && <div className="empty-alerts" style={{ color: '#888', fontSize: 14, marginTop: 12 }}>No alerts found. Adjust filters or add watchlist symbols.</div>}
      </div>
    </div>
  );
}
