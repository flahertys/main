import React, { useMemo, useRef, useState, useEffect } from "react";
import { apiClient, userProfileStorage } from "./lib/api-client";
import OpportunityScannerCard from "./features/scanner/OpportunityScannerCard.jsx";
import { SignalCard } from "./components/SignalCard.jsx";
import { PlayPicker, useLivePlayPicker } from "./components/PlayPicker.jsx";

const COLORS = {
  bg: "var(--bg-color)",
  surface: "var(--surface-color)",
  panel: "var(--panel-color)",
  border: "var(--border-color)",
  accent: "var(--accent-color)",
  gold: "var(--gold-color)",
  text: "var(--text-color)",
  textDim: "var(--text-dim-color)",
  green: "var(--green-color)",
};

const STARTER_PROMPTS = [
  "Explain today's best BTC setup in plain English.",
  "Give me a conservative ETH trade plan with risk controls.",
  "Summarize what matters most before entering a signal.",
  "Build a swing-trade watchlist using BTC, ETH, and SOL.",
];

const DEFAULT_PROFILE = {
  riskTolerance: "moderate",
  tradingStyle: "swing",
  portfolioValue: 25000,
  preferredAssets: ["BTC", "ETH", "SOL"],
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
  const sessionIdRef = useRef(`tradehax-session-${Date.now()}`);

  // Live AI mode state
  const [liveMode, setLiveMode] = useState(true);
  const [aiProvider, setAiProvider] = useState('demo');
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    const storedProfile = userProfileStorage.load();
    if (storedProfile) {
      setUserProfile((prev) => ({
        ...prev,
        ...storedProfile,
        tradingStyle: storedProfile.tradingStyle || prev.tradingStyle,
        preferredAssets: storedProfile.preferredAssets?.length ? storedProfile.preferredAssets : prev.preferredAssets,
      }));
    }
  }, []);

  useEffect(() => {
    userProfileStorage.save(userProfile);
  }, [userProfile]);

  const stats = useMemo(
    () => [
      { label: "Approach", value: "Signal clarity over clutter" },
      { label: "Style", value: `${userProfile.tradingStyle} / ${userProfile.riskTolerance}` },
      { label: "Mode", value: liveMode ? "Live AI Mode" : "Stable production interface" },
      { label: "Focus", value: userProfile.preferredAssets.join(", ") },
    ],
    [liveMode, userProfile],
  );

  const marketSnapshot = useMemo(
    () => Object.values(cryptoPrices)
      .filter(Boolean)
      .map((asset) => ({
        symbol: asset.symbol,
        price: asset.price,
        change24h: asset.priceChangePercent24h,
        source: asset.source,
      })),
    [cryptoPrices],
  );

  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
  const activeWebsite = currentHost.includes("tradehaxai.tech") ? "tradehaxai" : "tradehax";
  const crossSiteCta =
    activeWebsite === "tradehaxai"
      ? { label: "Back to TradeHax Home", href: "https://tradehax.net" }
      : { label: "Open Trading AI Assistant", href: "https://tradehaxai.tech" };

  function updatePreferredAssets(value) {
    setUserProfile((prev) => ({
      ...prev,
      preferredAssets: value
        .split(",")
        .map((asset) => asset.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 5),
    }));
  }

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

    const priorMessages = messages
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.content }));

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
      apiClient.chat(
        [...priorMessages, { role: 'user', content: value }],
        {
          sessionId: sessionIdRef.current,
          userProfile,
          recentMessages: priorMessages,
          marketSnapshot,
        },
      )
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
          console.error('Live AI failed, falling back to demo:', error);
          // Fallback to demo mode
          const result = buildResponse(value);
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${nextId.current++}`,
              role: "assistant",
              content: result.body + "\n\n⚠️ Live AI temporarily unavailable. Using demo mode.",
              meta: { ...result, confidence: "Fallback mode" },
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
        padding: "clamp(12px, 2.8vw, 20px)",
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

          <a
            href={crossSiteCta.href}
            aria-label={crossSiteCta.label}
            style={{
              marginTop: 14,
              display: "inline-flex",
              WebkitBoxAlign: "center",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              borderRadius: 10,
              WebkitBorderRadius: 10,
              border: `1px solid ${COLORS.accent}66`,
              background: "#0D2230",
              color: COLORS.accent,
              padding: "14px 18px",
              minHeight: 48,
              minWidth: 48,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {crossSiteCta.label}
          </a>
        </header>

        <section
            style={{
              display: "grid",
              WebkitBoxOrient: "horizontal",
              WebkitBoxDirection: "normal",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
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
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            alignItems: "start",
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
                        <li key={`${message.id}-${bullet}`} style={{ marginBottom: 6 }}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {message.meta?.executionPlaybook?.length ? (
                    <ul style={{ marginTop: 12, marginBottom: 0, paddingLeft: 18, color: COLORS.accent }}>
                      {message.meta.executionPlaybook.map((item) => (
                        <li key={`${message.id}-playbook-${item}`} style={{ marginBottom: 6 }}>
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

            <div style={{ marginTop: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => setLiveMode(!liveMode)}
                style={{
                  padding: "10px 16px",
                  minHeight: 44,
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
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    submitMessage();
                  }
                }}
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
                    minHeight: 44,
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
                      minHeight: 44,
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
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Neural Controls</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13, color: COLORS.textDim }}>
                Risk tolerance
                <select
                  value={userProfile.riskTolerance}
                  onChange={(e) => setUserProfile((prev) => ({ ...prev, riskTolerance: e.target.value }))}
                  style={{ background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10 }}
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, color: COLORS.textDim }}>
                Trading style
                <select
                  value={userProfile.tradingStyle}
                  onChange={(e) => setUserProfile((prev) => ({ ...prev, tradingStyle: e.target.value }))}
                  style={{ background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10 }}
                >
                  <option value="scalp">Scalp</option>
                  <option value="swing">Swing</option>
                  <option value="position">Position</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, color: COLORS.textDim }}>
                Portfolio value
                <input
                  type="number"
                  min="0"
                  value={userProfile.portfolioValue}
                  onChange={(e) => setUserProfile((prev) => ({ ...prev, portfolioValue: Number(e.target.value || 0) }))}
                  style={{ background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10 }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, color: COLORS.textDim }}>
                Focus assets
                <input
                  type="text"
                  value={userProfile.preferredAssets.join(", ")}
                  onChange={(e) => updatePreferredAssets(e.target.value)}
                  placeholder="BTC, ETH, SOL"
                  style={{ background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10 }}
                />
              </label>
            </div>
            <div style={{ color: COLORS.textDim, lineHeight: 1.7, fontSize: 14 }}>
              The hub now conditions responses on your risk profile, trading style, preferred assets, recent turns, and live market snapshot when available.
            </div>
            <div style={{ marginTop: 16, color: COLORS.green, fontWeight: 700 }}>Current production mode</div>
            <ul style={{ marginTop: 10, paddingLeft: 18, color: COLORS.textDim, lineHeight: 1.7 }}>
              <li>Persistent local trading profile</li>
              <li>Multi-turn AI context window</li>
              <li>Live market snapshot in prompt assembly</li>
              <li>Structured execution playbooks and risk outputs</li>
            </ul>

            <OpportunityScannerCard />
            {/* Example signals for demo purposes */}
            <div style={{ marginTop: 24 }}>
              <SignalCard signal={{ symbol: "BTC/USDC", action: "BUY", confidence: 82, trend: "up", play: "Kalshi: BTC > $50k", odds: "1.8", timeframe: "1d" }} />
              <SignalCard signal={{ symbol: "ETH/USDC", action: "SELL", confidence: 68, trend: "down", play: "Polymarket: ETH < $3k", odds: "2.1", timeframe: "4h" }} />
            </div>
            {/* Example play picker for demo purposes */}
            <div style={{ marginTop: 24 }}>
              {/* Use live play picker hook */}
              {(() => {
                const livePlays = useLivePlayPicker();
                return <PlayPicker plays={livePlays} />;
              })()}
            </div>
          </aside>
        </section>

        <button
          onClick={async () => {
            const priceId = prompt('Enter Stripe Price ID (from your Stripe dashboard):');
            if (!priceId) return alert('Price ID required!');
            const email = prompt('Enter your email for receipt:');
            const res = await fetch('/api/stripe-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ priceId, customerEmail: email })
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
            } else {
              alert('Stripe checkout failed: ' + (data.error || 'Unknown error'));
            }
          }}
          style={{ background:COLORS.gold, color:COLORS.bg, padding:'12px 24px', borderRadius:8, fontWeight:600, fontSize:16, margin:'24px 0', cursor:'pointer' }}
        >
          Checkout with Stripe
        </button>
      </section>
    </main>
  );
}

