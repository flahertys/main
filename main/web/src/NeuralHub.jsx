import React, { useRef, useState, useEffect } from "react";
import GamifiedOnboarding from "./components/GamifiedOnboarding";
import { apiClient } from "./lib/api-client";
import { runBacktest } from "./engine/backtest";

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
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    // Check onboarding completion in localStorage
    const completed = localStorage.getItem('onboardingComplete');
    if (!completed) setShowOnboarding(true);
  }, []);

  function handleOnboardingComplete() {
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  }

  // Main chat state
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
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [paperMode, setPaperMode] = useState(true);
  const [backtestResult, setBacktestResult] = useState(null);
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
                          if (showOnboarding) {
                            return <GamifiedOnboarding onComplete={handleOnboardingComplete} />;
                          }

                          // ...existing code for main interface...
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
                              {/* ...existing code for main interface... */}
                              <section style={{ maxWidth: 1120, margin: "0 auto" }}>
                                {/* ...existing code for header, controls, chat, etc... */}
                                {/* ...existing code for AI Trading Console, Input Area, etc... */}
                              </section>
                            </main>
                          );
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
