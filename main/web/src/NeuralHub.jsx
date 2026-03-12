
import React, { useRef, useState } from "react";
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

  function submitMessage(raw) {
    const value = (raw ?? input).trim();
    if (!value || loading) return;

    const priorMessages = messages
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.content }));

    setMessages((prev) => [
      ...prev,
      { id: `u-${nextId.current++}`, role: "user", content: value, meta: null },
    ]);
    setInput("");
    setLoading(true);

    apiClient.chat(
      [...priorMessages, { role: 'user', content: value }],
    )
      .then(response => {
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
              priceTarget: parsed.priceTarget,
              confidence: parsed.confidence,
              marketContext: parsed.marketContext,
              bullets: bullets.length > 0 ? bullets : null,
              executionPlaybook: parsed.executionPlaybook || null,
            },
          },
        ]);
        setLoading(false);
      })
      .catch(error => {
        console.error('AI request failed:', error);
        const result = buildResponse(value);
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
      });
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
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            background: COLORS.surface,
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Trading Console</div>

          {/* Message Thread */}
          <div style={{ display: "grid", gap: 12, marginBottom: 16, maxHeight: "60vh", overflowY: "auto" }}>
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
                {message.meta?.title ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ color: COLORS.accent, fontWeight: 700 }}>{message.meta.title}</span>
                    {message.meta?.confidence ? (
                      <span style={{ color: COLORS.green, fontSize: 12 }}>Confidence: {message.meta.confidence}</span>
                    ) : null}
                    {message.meta?.priceTarget ? (
                      <span style={{ color: COLORS.gold, fontSize: 12 }}>Target: {message.meta.priceTarget}</span>
                    ) : null}
                  </div>
                ) : null}
                <div style={{ lineHeight: 1.65 }}>{message.content}</div>
                {message.meta?.marketContext ? (
                  <div style={{ marginTop: 10, color: COLORS.textDim, fontSize: 13 }}>
                    Market Context: {message.meta.marketContext}
                  </div>
                ) : null}
                {message.meta?.bullets?.length ? (
                  <ul style={{ marginTop: 12, marginBottom: 0, paddingLeft: 18, color: COLORS.textDim }}>
                    {message.meta.bullets.map((bullet) => (
                      <li key={bullet} style={{ marginBottom: 6 }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.meta?.executionPlaybook?.length ? (
                  <ul style={{ marginTop: 12, marginBottom: 0, paddingLeft: 18, color: COLORS.accent }}>
                    {message.meta.executionPlaybook.map((item) => (
                      <li key={item} style={{ marginBottom: 6 }}>
                        {item}
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

          {/* Input Area */}
          <div style={{ display: "grid", gap: 10 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  submitMessage();
                }
              }}
              placeholder="Ask for a BTC setup, ETH plan, or risk breakdown... (Ctrl+Enter to send)"
              style={{
                width: "100%",
                minHeight: 100,
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
                opacity: loading || !input.trim() ? 0.6 : 1,
              }}
            >
              {loading ? "Processing..." : "Send"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

