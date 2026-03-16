import React, { useRef, useState, useEffect } from "react";
import GamifiedOnboarding from "./components/GamifiedOnboarding";
import { apiClient } from "./lib/api-client";
import { runBacktest } from "./engine/backtest";
import { calculateTotalCredits } from "./lib/achievements";

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
  const [userStats, setUserStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userStats')) || {};
    } catch {
      return {};
    }
  });
  const [avatarUrl] = useState(() => localStorage.getItem('avatarUrl') || 'https://api.dicebear.com/7.x/identicon/svg?seed=tradehax');
  const credits = calculateTotalCredits(userStats ? userStats.earnedAchievements || {} : {});
  useEffect(() => {
    // Check onboarding completion in localStorage
    const completed = localStorage.getItem('onboardingComplete');
    if (!completed) setShowOnboarding(true);
    // Listen for userStats changes
    const handler = () => {
      try {
        setUserStats(JSON.parse(localStorage.getItem('userStats')) || {});
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
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
              bullets,
              ...(parsed.executionPlaybook && parsed.executionPlaybook.length > 0 ? { executionPlaybook: parsed.executionPlaybook } : {}),
              marketContext: parsed.marketContext || null,
            },
          },
        ]);
      })
      .catch((error) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${nextId.current++}`,
            role: "assistant",
            content: "Error: " + error.message,
            meta: null,
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  if (showOnboarding) {
    return <GamifiedOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  // Responsive style helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  // Header with avatar, XP, credits
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', padding: isMobile ? '12px 8px' : '18px 32px', borderBottom: `1px solid ${COLORS.border}`, gap: isMobile ? 10 : 0 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 18 : 24 }}>TradeHax NeuralHub</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', marginRight: isMobile ? 0 : 8 }}>
            <span style={{ fontSize: isMobile ? 11 : 13, color: COLORS.textDim }}>XP: {userStats.daysActive ? userStats.daysActive * 100 : 0}</span>
            <span style={{ fontSize: isMobile ? 13 : 15, color: COLORS.gold, fontWeight: 600 }}>💰 {credits} Credits</span>
          </div>
          <img src={avatarUrl} alt="avatar" style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: '50%', border: `2px solid ${COLORS.accent}` }} />
        </div>
      </header>
      {/* Floating Quick Access Panel */}
      <div style={{ position: 'fixed', bottom: isMobile ? 12 : 32, right: isMobile ? 12 : 32, zIndex: 100, display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 16 }}>
        <button onClick={() => window.location.href = '/trading'} style={{ background: COLORS.accent, color: COLORS.bg, border: 'none', borderRadius: '50%', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56, fontSize: isMobile ? 20 : 28, boxShadow: '0 4px 16px #00d9ff44', cursor: 'pointer', transition: 'transform 0.1s' }} title="Trading Hub">📈</button>
        <button onClick={() => window.location.href = '/music'} style={{ background: COLORS.gold, color: COLORS.bg, border: 'none', borderRadius: '50%', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56, fontSize: isMobile ? 20 : 28, boxShadow: '0 4px 16px #f5a62344', cursor: 'pointer', transition: 'transform 0.1s' }} title="Music Hub">🎵</button>
        <button onClick={() => window.location.href = '/services'} style={{ background: COLORS.green, color: COLORS.bg, border: 'none', borderRadius: '50%', width: isMobile ? 40 : 56, height: isMobile ? 40 : 56, fontSize: isMobile ? 20 : 28, boxShadow: '0 4px 16px #00e5a044', cursor: 'pointer', transition: 'transform 0.1s' }} title="Services Hub">⚡</button>
      </div>
      <main
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.text,
          fontFamily: "Inter, Arial, sans-serif",
          padding: isMobile ? 8 : 20,
        }}
      >
        {/* ...existing code for main interface... */}
        <section style={{ maxWidth: isMobile ? '100%' : 1120, margin: "0 auto" }}>
          {/* ...existing code for header, controls, chat, etc... */}
          {/* ...existing code for AI Trading Console, Input Area, etc... */}
        </section>
      </main>
    </div>
  );
}
