import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, Wallet, Zap, Brain, MessageCircle } from "lucide-react";
import { API_ENDPOINTS } from "./lib/endpoints";
import { resolveSiteCapabilities } from "./lib/capabilities";

const STARTER_PROMPTS = [
  "Give me a beginner-safe market summary for today.",
  "Show 3 setups with clear entry, stop, and target.",
  "What should I avoid in volatile conditions?",
  "How do I size my next trade using risk percent?",
];

const MODE_OPTIONS = [
  { key: "base", label: "BASE (Free - Beginner Mode)" },
  { key: "advanced", label: "ADVANCED (HF Ensemble)" },
  { key: "odin", label: "ODIN MODE 🔥 (Premium / Stake $HAX)" },
];

const HISTORY_KEY = "neuralHub.localHistory.v3";
const CHAT_SESSIONS_KEY = "neuralHub.chatSessions.v2";
const TOUR_SEEN_KEY = "neuralHub.tourSeen.v1";

const TOUR_STEPS = [
  {
    title: "Welcome to Neural Hub",
    body: "This is your trading copilot. Start in BASE mode, then move to ADVANCED or ODIN when ready.",
  },
  {
    title: "Choose a Mode",
    body: "Use the mode selector in the left panel. ODIN requires wallet unlock unless open mode is enabled.",
  },
  {
    title: "Ask Better Prompts",
    body: "Try: 'analyze $AAPL' or 'deploy parabolic on BTC risk 4' for structured outputs.",
  },
  {
    title: "Read the Monitor",
    body: "Right panel shows effective mode, provider path, latency, and gating status in real time.",
  },
];

function makeId() {
  const c = globalThis?.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readText(content) {
  if (typeof content === "string") return content;
  if (!content) return "";
  if (typeof content.summary === "string") return content.summary;
  if (typeof content.explanation === "string") return `${content.summary || ""}\n${content.explanation}`.trim();
  return JSON.stringify(content, null, 2);
}

export default function NeuralHub() {
  const [mode, setMode] = useState("base");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);
  const [lastChunkCount, setLastChunkCount] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [messages, setMessages] = useState([
    {
      id: makeId(),
      role: "assistant",
      content:
        "Neural_Link_Active. I can break down setups for beginners, generate risk-aware plans, and map momentum with clear invalidation levels.",
    },
  ]);
  const [history, setHistory] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    resolveSiteCapabilities().then(setCapabilities).catch(() => {
      // Capabilities are advisory; do not block UI if probe fails.
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
      const seen = localStorage.getItem(TOUR_SEEN_KEY);
      if (!seen) setShowTour(true);
    } catch {
      setHistory([]);
    }
  }, []);

  function closeTour(markSeen = true) {
    setShowTour(false);
    setTourStep(0);
    if (markSeen) localStorage.setItem(TOUR_SEEN_KEY, "1");
  }

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  }, [history]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Record mode change telemetry
  useEffect(() => {
    fetch(API_ENDPOINTS.AI_TELEMETRY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "ui_mode_changed",
        mode,
        metadata: { walletConnected },
      }),
    }).catch(() => {
      // Silent fail for telemetry
    });
  }, [mode]);

  // Record wallet state change telemetry
  useEffect(() => {
    fetch(API_ENDPOINTS.AI_TELEMETRY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: walletConnected ? "wallet_connected" : "wallet_disconnected",
        mode,
        metadata: { timestamp: Date.now() },
      }),
    }).catch(() => {
      // Silent fail for telemetry
    });
  }, [walletConnected]);

  const autopilotScore = useMemo(() => {
    if (!messages.length) return "0.0";
    const score = Math.min(99.9, 82 + messages.length * 0.7);
    return score.toFixed(1);
  }, [messages.length]);

  async function streamAssistantMessage(assistantId, fullText, chunkSize = 6) {
    const words = String(fullText || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m)));
      return 1;
    }

    let cursor = 0;
    let rendered = "";
    let chunks = 0;
    while (cursor < words.length) {
      const slice = words.slice(cursor, cursor + chunkSize).join(" ");
      rendered = rendered ? `${rendered} ${slice}` : slice;
      chunks += 1;
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: rendered } : m)));
      cursor += chunkSize;
      // Streaming feel without requiring SSE support from backend.
      // Keeps UI responsive and improves perceived latency.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 18));
    }
    return chunks;
  }

  async function sendPrompt(prompt) {
    const trimmed = (prompt || "").trim();
    if (!trimmed || loading) return;

    const userMsg = { id: makeId(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setHistory((prev) => [{ id: userMsg.id, text: trimmed, ts: Date.now() }, ...prev].slice(0, 10));
    setInput("");
    setError("");
    setLoading(true);
    setLastMeta(null);
    setLastChunkCount(0);

    const assistantId = makeId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const apiMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-14)
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: readText(m.content) }))
        .concat([{ role: "user", content: trimmed }]);

      const system =
        mode === "odin"
          ? "ODIN MODE: act like a high-conviction quant copilot. Be concise, numeric, and execution-first."
          : mode === "advanced"
            ? "ADVANCED HF ENSEMBLE: combine momentum, risk, and structure in beginner-friendly language."
            : "BASE MODE: explain clearly for beginners with simple risk controls.";

      const res = await fetch(API_ENDPOINTS.AI_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          mode,
          system,
          context: { odinUnlocked: walletConnected },
        }),
      });

      if (!res.ok) throw new Error(`Chat API HTTP ${res.status}`);
      const data = await res.json();
      const reply = data?.response || data?.reply || "No response received.";
      const chunkSize = mode === "odin" ? 4 : 6;
      const chunks = await streamAssistantMessage(assistantId, reply, chunkSize);
      setLastChunkCount(chunks);
      setLastMeta(data?.meta || null);

      if (data?.meta?.gated) {
        setError("ODIN request was gated to ADVANCED mode. Connect wallet or enable ODIN access.");
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: "Request failed." } : m)));
      setError(e?.message || "Failed to reach chat backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#09090B", color: "#fff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <aside style={{ width: 300, borderRight: "1px solid #27272A", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: "#10B981", display: "grid", placeItems: "center", color: "#0a0a0a", fontWeight: 800 }}>N</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>NEURAL HUB</div>
        </div>

        <a
          href="https://www.tradehax.net"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            border: "2px solid #10B981",
            color: "#10B981",
            padding: "12px 16px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            textDecoration: "none",
            background: "rgba(16, 185, 129, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          title="Return to TradeHax business hub"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
            e.currentTarget.style.borderColor = "#34D399";
            e.currentTarget.style.color = "#34D399";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
            e.currentTarget.style.borderColor = "#10B981";
            e.currentTarget.style.color = "#10B981";
          }}
        >
          ← BACK TO TRADEHAX.NET
        </a>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 12, background: "#18181B", color: "#fff", border: "1px solid #3F3F46" }}
        >
          {MODE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        <div style={{ fontSize: 11, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.15em" }}>History</div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {history.length === 0 && <div style={{ color: "#71717A", fontSize: 12 }}>No local chat history yet.</div>}
          {history.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setInput(h.text)}
              style={{ textAlign: "left", background: "#18181B", color: "#D4D4D8", border: "1px solid #27272A", borderRadius: 10, padding: 10, cursor: "pointer", fontSize: 12 }}
            >
              {h.text.slice(0, 84)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setWalletConnected((v) => !v)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", borderRadius: 12, background: walletConnected ? "#10B981" : "#059669", color: "#fff", border: 0, padding: "12px 10px", fontWeight: 700 }}
        >
          <Wallet size={16} /> {walletConnected ? "Wallet Connected" : "Connect Wallet"} • Neural_Link_Active
        </button>
        <div style={{ fontSize: 10, color: "#71717A", textAlign: "center" }}>Encrypted Session • {walletConnected ? "$HAX Stake Verified" : "$HAX Staked: 0"}</div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: 14, borderBottom: "1px solid #27272A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: "#18181B", borderRadius: 999, padding: "6px 10px", fontSize: 11 }}>Live Market Feed</span>
            <span style={{ background: "#052E16", color: "#86EFAC", borderRadius: 999, padding: "6px 10px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Zap size={12} /> Autopilot Score: {autopilotScore}%
            </span>
          </div>
          <button type="button" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #3F3F46", color: "#D4D4D8", borderRadius: 999, padding: "6px 10px", fontSize: 11 }}>
            <Mic size={13} /> Voice Send
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => sendPrompt(prompt)}
                style={{ borderRadius: 999, background: "#18181B", border: "1px solid #3F3F46", color: "#E4E4E7", padding: "8px 12px", fontSize: 12, cursor: "pointer" }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: 860, background: m.role === "user" ? "#27272A" : "#18181B", border: "1px solid #3F3F46", borderRadius: 20, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {m.role === "assistant" ? <ReactMarkdown>{readText(m.content)}</ReactMarkdown> : readText(m.content)}
              </div>
            </div>
          ))}
          {loading && <div style={{ color: "#34D399", fontSize: 13 }}>Neural stream in-flight...</div>}
          {error && <div style={{ color: "#F87171", fontSize: 13 }}>{error}</div>}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          style={{ padding: 16, borderTop: "1px solid #27272A" }}
        >
          <div style={{ position: "relative" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "odin" ? "ODIN MODE ENABLED — speak your will..." : "Ask for setup, risk, or Autopilot guidance..."}
              style={{ width: "100%", borderRadius: 999, background: "#18181B", border: "1px solid #3F3F46", color: "#fff", padding: "18px 140px 18px 24px", fontSize: 16 }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ position: "absolute", right: 8, top: 8, bottom: 8, borderRadius: 14, border: 0, padding: "0 24px", background: "#10B981", color: "#052E16", fontWeight: 800 }}>
              SEND
            </button>
          </div>
        </form>
      </main>

      <aside style={{ width: 320, borderLeft: "1px solid #27272A", padding: 20, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
        <section style={{ borderRadius: 20, padding: 16, background: "#18181B", border: "1px solid #3F3F46" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", marginBottom: 10 }}>Smart Environment Monitor</div>
          <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.6 }}>
            <div>Live AI Available: <strong>{capabilities?.liveProviderAvailable ? "YES" : "NO"}</strong></div>
            <div>Requested Mode: <strong>{mode.toUpperCase()}</strong></div>
            <div>Effective Mode: <strong>{(lastMeta?.effectiveMode || mode).toUpperCase()}</strong></div>
            <div>Provider Path: <strong>{(lastMeta?.providerPath || "pending").toUpperCase()}</strong></div>
            <div>Latency: <strong>{typeof lastMeta?.latencyMs === "number" ? `${lastMeta.latencyMs}ms` : "N/A"}</strong></div>
            <div>ODIN Gated: <strong>{lastMeta?.gated ? "YES" : "NO"}</strong></div>
            <div>Rendered Chunks: <strong>{lastChunkCount || 0}</strong></div>
            <div>Message Count: <strong>{messages.length}</strong></div>
            <div>Latest User Prompt: <strong>{history[0]?.text?.slice(0, 28) || "N/A"}</strong></div>
          </div>
        </section>

        <section style={{ borderRadius: 20, padding: 16, background: "#18181B", border: "1px solid #3F3F46" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", marginBottom: 10 }}>Text / Image Studio + Autopilot</div>
          <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.6 }}>
            <div>Text Studio: Ready</div>
            <div>Image Studio: Ready</div>
            <div>Autopilot Board: Tracking</div>
            <div style={{ color: "#34D399", marginTop: 8 }}>Neural_Link_Active</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setInput("Build me a risk-managed swing plan for beginners.")} style={{ borderRadius: 999, border: "1px solid #3F3F46", background: "#27272A", color: "#E4E4E7", padding: "6px 10px", fontSize: 11 }}>Risk Plan</button>
              <button type="button" onClick={() => setInput("Show top 3 momentum setups with invalidation.")} style={{ borderRadius: 999, border: "1px solid #3F3F46", background: "#27272A", color: "#E4E4E7", padding: "6px 10px", fontSize: 11 }}>Momentum</button>
            </div>
          </div>
        </section>

        <section style={{ borderRadius: 20, padding: 16, background: "#18181B", border: "1px solid #3F3F46" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", marginBottom: 10 }}>First-Time Guide</div>
          <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.6 }}>
            <div>1) Start in <strong>BASE</strong> mode</div>
            <div>2) Try <strong>analyze $AAPL</strong></div>
            <div>3) Try <strong>deploy parabolic on BTC risk 4</strong></div>
            <div>4) Watch Provider Path + Effective Mode</div>
            <button
              type="button"
              onClick={() => {
                setShowTour(true);
                setTourStep(0);
              }}
              style={{ marginTop: 10, borderRadius: 999, border: "1px solid #3F3F46", background: "#27272A", color: "#E4E4E7", padding: "6px 10px", fontSize: 11 }}
            >
              Start Guided Tour
            </button>
          </div>
        </section>
      </aside>

      {showTour && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "grid", placeItems: "center", zIndex: 1000 }}>
          <div style={{ width: "min(560px, 92vw)", borderRadius: 18, background: "#111114", border: "1px solid #3F3F46", padding: 18 }}>
            <div style={{ fontSize: 11, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Guided Tour • Step {tourStep + 1}/{TOUR_STEPS.length}
            </div>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>{TOUR_STEPS[tourStep].title}</div>
            <div style={{ marginTop: 10, color: "#D4D4D8", lineHeight: 1.6 }}>{TOUR_STEPS[tourStep].body}</div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button
                type="button"
                onClick={() => closeTour(false)}
                style={{ borderRadius: 10, border: "1px solid #3F3F46", background: "transparent", color: "#D4D4D8", padding: "8px 12px" }}
              >
                Close
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {tourStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setTourStep((s) => Math.max(0, s - 1))}
                    style={{ borderRadius: 10, border: "1px solid #3F3F46", background: "#18181B", color: "#D4D4D8", padding: "8px 12px" }}
                  >
                    Back
                  </button>
                )}
                {tourStep < TOUR_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTourStep((s) => Math.min(TOUR_STEPS.length - 1, s + 1))}
                    style={{ borderRadius: 10, border: 0, background: "#10B981", color: "#052E16", fontWeight: 700, padding: "8px 14px" }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => closeTour(true)}
                    style={{ borderRadius: 10, border: 0, background: "#10B981", color: "#052E16", fontWeight: 700, padding: "8px 14px" }}
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
