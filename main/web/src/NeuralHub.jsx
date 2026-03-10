
import React, { useMemo, useRef, useState, useEffect } from "react";
import { apiClient } from "./lib/api-client";

const COLORS = {
  bg: "#090B10",
  surface: "#0E1117",
  panel: "#12161E",
  border: "#1C2333",
  accent: "#00D9FF",
  gold: "#F5A623",
  text: "#C8D8E8",
  textDim: "#8EA2B8",
  green: "#00E5A0",
};

const STARTER_PROMPTS = [
  "Explain today's best BTC setup in plain English.",
  "Give me a conservative ETH trade plan with risk controls.",
  "Summarize what matters most before entering a signal.",
];

function buildResponse(input) {
  const q = input.toLowerCase();

  if (q.includes("btc") || q.includes("bitcoin")) {
    return {
      title: "BTC Market View",
      body:
        "Bias: cautiously bullish. Focus on confirmation, not prediction. Wait for strength above recent range resistance, keep risk small, and avoid chasing vertical candles.",
      bullets: [
        "Momentum: improving but not fully confirmed",
        "Risk: keep position size modest until breakout holds",
        "Plan: define invalidation before entry",
      ],
    };
  }

  if (q.includes("eth") || q.includes("ethereum")) {
    return {
      title: "ETH Trade Plan",
      body:
        "ETH looks cleaner when traded with structure. Let price reclaim a key level, then scale in only if follow-through is supported by volume and broader market strength.",
      bullets: [
        "Entry: only on confirmation, not anticipation",
        "Stop: place below structure, not emotion",
        "Sizing: reduce size in high-volatility sessions",
      ],
    };
  }

  if (q.includes("risk") || q.includes("stop") || q.includes("kelly")) {
    return {
      title: "Risk Controls",
      body:
        "Professional trading survives by controlling downside first. Use fractional sizing, define invalidation before entry, and treat every idea as probabilistic—not certain.",
      bullets: [
        "Risk 0.5% to 1.5% per idea for controlled growth",
        "Prefer confirmation over frequency",
        "Cut losers mechanically; let winners prove themselves",
      ],
    };
  }

  return {
    title: "TradeHax AI Brief",
    body:
      "The strongest setup today is disciplined execution: trade only when structure, confirmation, and risk controls align. Simplicity beats noise in volatile markets.",
    bullets: [
      "Wait for confirmation",
      "Keep size appropriate to volatility",
      "Use predefined invalidation and profit logic",
    ],
  };
}

export default function NeuralHub() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to TradeHax. Ask for a setup, risk plan, or market summary and I'll respond with a clean, execution-focused brief.",
      meta: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const nextId = useRef(1);

  // Live AI mode state
  const [liveMode, setLiveMode] = useState(false);
  const [aiProvider, setAiProvider] = useState('demo');
  const [cryptoPrices, setCryptoPrices] = useState({});

  const stats = useMemo(
    () => [
      { label: "Approach", value: "Signal clarity over clutter" },
      { label: "Style", value: "Professional AI trading brief" },
      { label: "Mode", value: liveMode ? "Live AI Mode" : "Stable production interface" },
    ],
    [liveMode],
  );

  // Fetch live crypto prices on mount
  useEffect(() => {
    async function fetchPrices() {
      try {
        const data = await apiClient.getMultipleCrypto(['BTC', 'ETH', 'SOL']);
        setCryptoPrices(data);
      } catch (error) {
        console.log('Could not fetch crypto prices:', error);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  function submitMessage(raw) {
    const value = (raw ?? input).trim();
    if (!value || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${nextId.current++}`, role: "user", content: value, meta: null },
    ]);
    setInput("");
    setLoading(true);

    if (!liveMode) {
      // Demo mode - use existing buildResponse()
      const result = buildResponse(value);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${nextId.current++}`,
            role: "assistant",
            content: result.body,
            meta: result,
          },
        ]);
        setLoading(false);
      }, 250);
    } else {
      // Live AI mode
      apiClient.chat([{ role: 'user', content: value }])
        .then(response => {
          setAiProvider(response.provider);

          // Parse response into structured format
          const parsed = apiClient.parseAIResponse(response.response);
          const bullets = [
            ...(parsed.reasoning || []),
            ...(parsed.riskManagement || [])
          ].filter(b => b.length > 0);

          setMessages((prev) => [
            ...prev,
            {
              id: `a-${nextId.current++}`,
              role: "assistant",
              content: response.response,
              meta: {
                title: parsed.signal || 'AI Analysis',
                body: response.response,
                bullets: bullets.length > 0 ? bullets : null,
              },
            },
          ]);
          setLoading(false);
        })
        .catch(error => {
          console.error('Live AI failed, falling back to demo:', error);
          // Fallback to demo mode
          const result = buildResponse(value);
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${nextId.current++}`,
              role: "assistant",
              content: result.body + "\n\n⚠️ Live AI temporarily unavailable. Using demo mode.",
              meta: result,
            },
          ]);
          setLoading(false);
        });
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "Inter, Arial, sans-serif",
        padding: 20,
      }}
    >
      <section style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <div style={{ color: COLORS.gold, fontSize: 12, letterSpacing: "0.12em", marginBottom: 10 }}>
            TRADEHAX.NET
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.03 }}>
            TradeHax Neural Hub
          </h1>
          <p style={{ color: COLORS.textDim, maxWidth: 760, lineHeight: 1.65, marginTop: 14 }}>
            A cleaner professional trading assistant: concise AI guidance, execution-first thinking, and a stable production interface.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                background: COLORS.surface,
                padding: 14,
              }}
            >
              <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
          }}
        >
          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              background: COLORS.surface,
              padding: 16,
              minHeight: 520,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Trading Console</div>
            <div style={{ display: "grid", gap: 12 }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    border: `1px solid ${message.role === "user" ? `${COLORS.accent}55` : COLORS.border}`,
                    background: message.role === "user" ? "#0D2230" : COLORS.panel,
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>
                    {message.role === "user" ? "You" : "TradeHax AI"}
                  </div>
                  <div style={{ lineHeight: 1.65 }}>{message.content}</div>
                  {message.meta?.bullets?.length ? (
                    <ul style={{ marginTop: 12, marginBottom: 0, paddingLeft: 18, color: COLORS.textDim }}>
                      {message.meta.bullets.map((bullet) => (
                        <li key={bullet} style={{ marginBottom: 6 }}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              {loading ? (
                <div style={{ color: COLORS.textDim, fontSize: 14 }}>Preparing response…</div>
              ) : null}
            </div>

            <div style={{ marginTop: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => setLiveMode(!liveMode)}
                style={{
                  padding: "10px 16px",
                  background: liveMode ? COLORS.green : COLORS.border,
                  color: liveMode ? COLORS.bg : COLORS.text,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
              >
                {liveMode ? "🟢 Live AI" : "📊 Demo Mode"}
              </button>
              {liveMode && (
                <span style={{ fontSize: "12px", color: COLORS.textDim }}>
                  Provider: <span style={{ color: COLORS.accent }}>{aiProvider}</span>
                </span>
              )}
              {cryptoPrices.BTC && (
                <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: "12px" }}>
                  <span style={{ color: COLORS.textDim }}>
                    BTC: <span style={{ color: COLORS.text, fontWeight: "600" }}>
                      {apiClient.formatPrice(cryptoPrices.BTC.price)}
                    </span>
                    <span style={{ color: cryptoPrices.BTC.priceChangePercent24h >= 0 ? COLORS.green : "#FF4757", marginLeft: 4 }}>
                      {apiClient.formatPercentChange(cryptoPrices.BTC.priceChangePercent24h).text}
                    </span>
                  </span>
                  {cryptoPrices.ETH && (
                    <span style={{ color: COLORS.textDim }}>
                      ETH: <span style={{ color: COLORS.text, fontWeight: "600" }}>
                        {apiClient.formatPrice(cryptoPrices.ETH.price)}
                      </span>
                      <span style={{ color: cryptoPrices.ETH.priceChangePercent24h >= 0 ? COLORS.green : "#FF4757", marginLeft: 4 }}>
                        {apiClient.formatPercentChange(cryptoPrices.ETH.priceChangePercent24h).text}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for a BTC setup, ETH plan, or risk breakdown..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  resize: "vertical",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.panel,
                  color: COLORS.text,
                  padding: 14,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => submitMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    background: COLORS.gold,
                    color: "#111",
                    border: 0,
                    borderRadius: 10,
                    padding: "12px 18px",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Send
                </button>
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => submitMessage(prompt)}
                    style={{
                      background: "transparent",
                      color: COLORS.accent,
                      border: `1px solid ${COLORS.accent}55`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      cursor: "pointer",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              background: COLORS.surface,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Operator Notes</div>
            <div style={{ color: COLORS.textDim, lineHeight: 1.7, fontSize: 14 }}>
              This recovery build prioritizes stability, clarity, and fast production readiness. It removes fragile runtime pathways while preserving a professional AI-first trading experience.
            </div>
            <div style={{ marginTop: 16, color: COLORS.green, fontWeight: 700 }}>Current production mode</div>
            <ul style={{ marginTop: 10, paddingLeft: 18, color: COLORS.textDim, lineHeight: 1.7 }}>
              <li>Reliable single-page boot path</li>
              <li>No risky startup dependencies</li>
              <li>Faster recovery from deployment regressions</li>
              <li>Clean foundation for the next pass</li>
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}

