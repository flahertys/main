import React, { useState, useRef, useEffect } from "react";
import Plot from 'react-plotly.js';

const COLORS = {
  accentSoft: "#e6f7ff",
  accent: "#21C8FF",
  border: "#1A2B44",
  panelSoft: "#18243A",
  panel: "#101D31",
  text: "#E6F1FF",
  textDim: "#93A8C3",
};

const STARTER_PROMPTS = [
  "Show me today's market summary",
  "Explain the latest news",
  "Suggest a trading strategy",
  "What are the top gainers?",
];

const MODEL_OPTIONS = [
  { key: 'llama', label: 'Llama 3.3', desc: 'Unfiltered, fast, open-source' },
  { key: 'mistral', label: 'Mistral 8x7B', desc: 'Balanced, creative' },
  { key: 'qwen', label: 'Qwen 2', desc: 'Multilingual, robust' },
  { key: 'claude', label: 'Claude 3', desc: 'Safe, verbose, Anthropic' },
  { key: 'openai', label: 'OpenAI GPT-4', desc: 'Most accurate, commercial' },
];


export default function NeuralHub() {
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('selectedModel') || 'llama'
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId] = useState(() => Math.random().toString(36).slice(2));
  const [history, setHistory] = useState([]);
  const [showTrading, setShowTrading] = useState(false);
  const [backtestResult, setBacktestResult] = useState(null);
  const [strategyParams, setStrategyParams] = useState({ fast: 3, slow: 7 });
  // Paper trading state
  const [paperSymbol, setPaperSymbol] = useState('AAPL');
  const [paperQty, setPaperQty] = useState(1);
  const [paperPrice, setPaperPrice] = useState(100);
  const [paperSide, setPaperSide] = useState('buy');
  const [paperPosition, setPaperPosition] = useState(null);
  const [paperTrades, setPaperTrades] = useState([]);
  const [paperPnl, setPaperPnl] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const ws = new window.WebSocket('ws://localhost:8081');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'market' || data.type === 'signal') {
          setMessages((prev) => [...prev, { role: 'stream', content: data }]);
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, []);

  async function submitMessage(prompt) {
    setLoading(true);
    setError("");
    const newHistory = [...history, { role: "user", content: prompt }];
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setHistory(newHistory);
    try {
      // Simulate streaming by chunked updates (replace with real SSE/WebSocket in prod)
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: prompt, model: selectedModel, history: newHistory, format: "structured" })
      });
      if (!res.ok) throw new Error("AI backend error");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.content }]);
      setHistory((h) => [...h, { role: "ai", content: data.content }]);
    } catch (e) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  function renderStructured(content) {
    if (!content) return null;
    if (typeof content === "string") return <span>{content}</span>;
    if (content.type === 'market') return <div><strong>Market:</strong> {content.symbol} ${content.price?.toFixed(2)} <span style={{ color: COLORS.textDim }}>({new Date(content.timestamp).toLocaleTimeString()})</span></div>;
    if (content.type === 'signal') return <div><strong>Signal:</strong> {content.symbol} score={content.score?.toFixed(2)} {content.alert && <span style={{ color: '#ff4d4f' }}>ALERT!</span>} <span style={{ color: COLORS.textDim }}>({new Date(content.timestamp).toLocaleTimeString()})</span></div>;
    return (
      <div>
        {content.summary && <div style={{ fontWeight: 600, marginBottom: 8 }}>{content.summary}</div>}
        {content.table && Array.isArray(content.table) && (
          <table style={{ width: "100%", marginBottom: 8, background: COLORS.panelSoft, color: COLORS.text }}>
            <thead>
              <tr>
                {Object.keys(content.table[0]).map((k) => <th key={k} style={{ textAlign: "left", padding: 4 }}>{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {content.table.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => <td key={j} style={{ padding: 4 }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {content.chart && content.chart.type && content.chart.data && (
          <div style={{ marginBottom: 8 }}>
            <Plot
              data={Array.isArray(content.chart.data) ? [{ y: content.chart.data, type: content.chart.type }] : content.chart.data}
              layout={{ autosize: true, height: 240, paper_bgcolor: COLORS.panelSoft, font: { color: COLORS.text } }}
              config={{ displayModeBar: false }}
            />
          </div>
        )}
        {content.chart && (!content.chart.type || !content.chart.data) && (
          <div style={{ marginBottom: 8 }}>
            <strong>Chart:</strong> {JSON.stringify(content.chart)}
          </div>
        )}
        {content.explanation && <div style={{ color: COLORS.textDim }}>{content.explanation}</div>}
      </div>
    );
  }

  async function runBacktest() {
    setBacktestResult(null);
    const res = await fetch('/api/ai-trading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'backtest', params: strategyParams })
    });
    const data = await res.json();
    setBacktestResult(data);
  }

  async function fetchPaperPosition() {
    const res = await fetch('/api/ai-trading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getPaperPosition', params: { symbol: paperSymbol } })
    });
    if (res.ok) {
      const data = await res.json();
      setPaperPosition(data);
      setPaperPnl(data.realizedPnl);
    } else {
      setPaperPosition(null);
      setPaperPnl(null);
    }
  }
  async function fetchPaperTrades() {
    const res = await fetch('/api/ai-trading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getPaperTrades', params: { symbol: paperSymbol } })
    });
    if (res.ok) {
      const data = await res.json();
      setPaperTrades(data.trades || []);
    } else {
      setPaperTrades([]);
    }
  }
  async function submitPaperTrade(e) {
    e.preventDefault();
    const res = await fetch('/api/ai-trading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'paperTrade', order: { symbol: paperSymbol, side: paperSide, qty: Number(paperQty), price: Number(paperPrice) } })
    });
    await fetchPaperPosition();
    await fetchPaperTrades();
  }
  useEffect(() => {
    if (showTrading) {
      fetchPaperPosition();
      fetchPaperTrades();
    }
    // eslint-disable-next-line
  }, [showTrading, paperSymbol]);

  return (
    <div style={{ background: COLORS.panel, minHeight: "100vh", color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
        <h2 style={{ color: COLORS.accent, fontWeight: 700, fontSize: 28, marginBottom: 18 }}>TradeHax Neural Hub</h2>
        <div style={{ marginBottom: 18, color: COLORS.textDim, fontSize: 16 }}>
          Uncensored AI - Direct LLM access - No filters
        </div>
        <div style={{ marginTop: 18 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
          {STARTER_PROMPTS.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => submitMessage(prompt)}
              style={{
                background: COLORS.accentSoft,
                color: COLORS.accent,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 999,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
        {/* Chat messages */}
        <div style={{ marginTop: 32, background: COLORS.panelSoft, borderRadius: 12, padding: 18, minHeight: 120, maxHeight: 400, overflowY: "auto" }}>
          {messages.length === 0 && <div style={{ color: COLORS.textDim }}>No messages yet. Try a starter prompt or enter your own.</div>}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: 12, textAlign: msg.role === "user" ? "right" : "left" }}>
              <span style={{ fontWeight: 600, color: msg.role === "user" ? COLORS.accent : COLORS.text }}>{msg.role === "user" ? "You" : "AI"}:</span>
              <div style={{
                background: msg.role === "user" ? COLORS.panel : COLORS.accentSoft,
                color: msg.role === "user" ? COLORS.text : COLORS.accent,
                borderRadius: 8,
                display: "inline-block",
                padding: "8px 12px",
                marginLeft: msg.role === "user" ? 0 : 8,
                marginRight: msg.role === "user" ? 8 : 0,
                maxWidth: 500,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>{msg.role === "ai" ? renderStructured(msg.content) : msg.content}</div>
            </div>
          ))}
          {loading && <div style={{ color: COLORS.textDim, marginTop: 8 }}>AI is thinking...</div>}
          {error && <div style={{ color: "#ff4d4f", marginTop: 8 }}>{error}</div>}
          <div ref={chatEndRef} />
        </div>
        {/* Chat input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (input.trim()) {
              submitMessage(input.trim());
              setInput("");
            }
          }}
          style={{ display: "flex", gap: 12, marginTop: 18 }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.panelSoft, color: COLORS.text, fontWeight: 600 }}
            disabled={loading}
          />
          <button
            type="submit"
            style={{ background: COLORS.accent, color: COLORS.panel, border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
        {/* Model selector UI */}
        <div style={{ marginTop: 18 }}>
          <label htmlFor="model-select" style={{ fontWeight: 600, color: COLORS.textDim, marginRight: 8 }}>AI Model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={e => {
              setSelectedModel(e.target.value);
              localStorage.setItem('selectedModel', e.target.value);
            }}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.panelSoft, color: COLORS.text, fontWeight: 600 }}
          >
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label} — {opt.desc}
              </option>
            ))}
          </select>
        </div>
        {/* Trading strategy panel */}
        <button onClick={() => setShowTrading((v) => !v)} style={{ margin: '18px 0', background: COLORS.accent, color: COLORS.panel, border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>AI Trading</button>
        {showTrading && (
          <div style={{ background: COLORS.panelSoft, borderRadius: 12, padding: 18, marginBottom: 18 }}>
            <h3 style={{ color: COLORS.accent, marginBottom: 8 }}>Paper Trading</h3>
            <form onSubmit={submitPaperTrade} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <input value={paperSymbol} onChange={e => setPaperSymbol(e.target.value.toUpperCase())} style={{ width: 60 }} />
              <select value={paperSide} onChange={e => setPaperSide(e.target.value)}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <input type="number" value={paperQty} min={1} onChange={e => setPaperQty(e.target.value)} style={{ width: 60 }} />
              <input type="number" value={paperPrice} min={1} step={0.01} onChange={e => setPaperPrice(e.target.value)} style={{ width: 80 }} />
              <button type="submit" style={{ background: COLORS.accent, color: COLORS.panel, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
            </form>
            <div style={{ marginBottom: 8 }}>
              <strong>Position:</strong> {paperPosition ? `${paperPosition.position} @ $${paperPosition.avgPrice?.toFixed(2)}` : 'None'}<br />
              <strong>Realized P&L:</strong> {paperPnl !== null ? `$${paperPnl.toFixed(2)}` : 'N/A'}
            </div>
            <div>
              <strong>Trade History:</strong>
              <ul style={{ fontSize: 14, maxHeight: 100, overflowY: 'auto' }}>
                {paperTrades.map((t, i) => (
                  <li key={i}>{t.side.toUpperCase()} {t.qty} @ {t.price} ({new Date(t.timestamp).toLocaleTimeString()})</li>
                ))}
                {paperTrades.length === 0 && <li>No trades yet.</li>}
              </ul>
            </div>
            <hr style={{ margin: '18px 0', borderColor: COLORS.border }} />
            <h3 style={{ color: COLORS.accent, marginBottom: 8 }}>Strategy Backtest (SMA Crossover)</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <label>Fast MA: <input type="number" value={strategyParams.fast} min={1} max={20} onChange={e => setStrategyParams(s => ({ ...s, fast: +e.target.value }))} style={{ width: 50 }} /></label>
              <label>Slow MA: <input type="number" value={strategyParams.slow} min={2} max={50} onChange={e => setStrategyParams(s => ({ ...s, slow: +e.target.value }))} style={{ width: 50 }} /></label>
              <button onClick={runBacktest} style={{ background: COLORS.accent, color: COLORS.panel, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}>Run Backtest</button>
            </div>
            {backtestResult && (
              <div>
                <div style={{ marginBottom: 8 }}>P&L: <strong>${backtestResult.pnl?.toFixed(2)}</strong></div>
                <Plot
                  data={[
                    { y: backtestResult.prices, type: 'scatter', name: 'Price' },
                    { y: backtestResult.fastMA, type: 'scatter', name: 'Fast MA' },
                    { y: backtestResult.slowMA, type: 'scatter', name: 'Slow MA' }
                  ]}
                  layout={{ autosize: true, height: 220, paper_bgcolor: COLORS.panelSoft, font: { color: COLORS.text } }}
                  config={{ displayModeBar: false }}
                />
                <div style={{ marginTop: 8 }}>
                  <strong>Trades:</strong>
                  <ul style={{ fontSize: 14 }}>
                    {backtestResult.trades?.map((t, i) => (
                      <li key={i}>{t.type.toUpperCase()} @ {t.price.toFixed(2)} (idx {t.index})</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
