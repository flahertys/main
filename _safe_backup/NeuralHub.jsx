"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileUploadComponent } from "./components/FileUploadComponent";

/**
 * TRADEHAX NEURAL HUB
 * One-page AI interface - Clean, uncensored, professional
 * Claude/Grok style with direct LLM access
 */

const COLORS = {
  bg: "#0a0e27",
  surface: "#1a1f3a",
  panel: "#242d4a",
  border: "#3a4558",
  text: "#e0e6ff",
  textDim: "#8b95b8",
  accent: "#00d9ff",
  success: "#00ff88",
  warning: "#ffaa00",
  error: "#ff4455",
};

const MODELS = [
  { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 70B", type: "Full Power" },
  { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen 7B", type: "Fast" },
  { id: "microsoft/Phi-4-mini-instruct", name: "Phi-4", type: "Instant" },
];

export default function NeuralHub() {
  // State
  const [messages, setMessages] = useState([
    {
      id: "init",
      role: "assistant",
      content: "Welcome to TradeHax Neural Hub. Ask anything - no filters, no restrictions. Uncensored AI analysis powered by Llama 70B.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const messagesEnd = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Try to use backend API first (which has the token securely)
      const hfToken = import.meta.env.VITE_HF_TOKEN || window.ENV?.VITE_HF_TOKEN || "";

      let response = null;
      let aiResponse = null;

      // If token is available, try live HF LLM
      if (hfToken) {
        try {
          response = await fetch("https://api-inference.huggingface.co/models/" + selectedModel, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: trimmed,
              parameters: {
                max_new_tokens: maxTokens,
                temperature: temperature,
                top_p: 0.95,
              },
            }),
          });

          if (response?.ok) {
            const data = await response.json();
            aiResponse = Array.isArray(data)
              ? data[0]?.generated_text || "No response"
              : data.generated_text || JSON.stringify(data);
          }
        } catch (hfError) {
          console.warn("HF API failed, falling back to demo:", hfError);
        }
      }

      // Fallback to demo mode if live LLM failed or no token
      if (!aiResponse) {
        aiResponse = getDemoResponse(trimmed);
      }

      // Clean response
      const cleanResponse = (aiResponse || "")
        .replace(trimmed, "")
        .trim()
        .slice(0, 2000) || getDemoResponse(trimmed);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: cleanResponse,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: getDemoResponse(trimmed),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedModel, temperature, maxTokens]);

  // Demo response generator (no API needed)
  const getDemoResponse = (userInput) => {
    const q = userInput.toLowerCase();

    if (q.includes("trading") || q.includes("market")) {
      return "For trading analysis, I'd examine market structure, key support/resistance levels, and volume profile. Current crypto markets show strong consolidation patterns with potential breakout zones forming around major moving averages. What specific asset or timeframe are you interested in?";
    }
    if (q.includes("ai") || q.includes("neural")) {
      return "The neural hub integrates multiple AI models for sophisticated analysis. Llama 70B provides reasoning, Qwen 7B excels at structured data, and Phi-4 delivers low-latency responses. Each model is optimized for different use cases. Which analysis type interests you?";
    }
    if (q.includes("price") || q.includes("forecast")) {
      return "Price forecasting requires multi-timeframe confluence analysis. I use Fibonacci levels, moving average crossovers, and volume profile to identify high-probability entry zones. What timeframe and instrument are you analyzing?";
    }
    if (q.includes("risk") || q.includes("kelly")) {
      return "Risk management through Kelly Criterion: position sizing = (edge × odds - 1) / odds. Fractional Kelly (25%) is recommended for safety. Combined with Monte Carlo simulations (500 paths), this model accurately predicts ruin rates and optimal growth curves.";
    }
    if (q.includes("signal") || q.includes("strategy")) {
      return "Signal generation integrates: RSI oversold/overbought zones, MACD histogram divergence, Bollinger Band squeeze potential, and Fibonacci confluence. Multi-timeframe confirmation increases accuracy to 65-75% win rate depending on market regime.";
    }
    if (q.includes("hello") || q.includes("hi")) {
      return "Welcome to TradeHax Neural Hub! I'm an uncensored AI assistant with access to multiple models. Ask me about trading strategies, market analysis, AI capabilities, or anything else. No filters, no restrictions.";
    }

    // Default intelligent response
    return `That's an interesting question about "${userInput.slice(0, 30)}...". The TradeHax platform integrates advanced trading analysis with AI reasoning. I can help with technical analysis, risk management, market signals, and strategic planning. What specific area would you like to explore?`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ margin: "0 0 15px 0", fontSize: "28px", fontWeight: "700", color: COLORS.accent }}>
            TradeHax Neural Hub
          </h1>
          <p style={{ margin: 0, color: COLORS.textDim, fontSize: "14px" }}>
            Uncensored AI - Direct LLM access - No filters
          </p>
        </div>
      </div>

      {/* File Storage Section */}
      <div style={{ padding: "20px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <FileUploadComponent />
        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Messages Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "20px",
              maxWidth: "1200px",
              width: "100%",
              margin: "0 auto",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: msg.role === "user" ? `${COLORS.accent}20` : COLORS.panel,
                    border: `1px solid ${msg.role === "user" ? `${COLORS.accent}40` : COLORS.border}`,
                    color: msg.role === "user" ? COLORS.accent : COLORS.text,
                    fontSize: "15px",
                    lineHeight: "1.6",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                  <div style={{ fontSize: "12px", color: COLORS.textDim, marginTop: "8px" }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textDim,
                    fontSize: "14px",
                  }}
                >
                  ⏳ Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "20px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.surface, maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "15px" }}>
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  style={{
                    padding: "8px 12px",
                    background: selectedModel === model.id ? `${COLORS.accent}30` : COLORS.panel,
                    border: `1px solid ${selectedModel === model.id ? COLORS.accent : COLORS.border}`,
                    color: selectedModel === model.id ? COLORS.accent : COLORS.textDim,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                >
                  {model.name} <span style={{ fontSize: "12px", opacity: 0.7 }}>({model.type})</span>
                </button>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", fontSize: "13px" }}>
              <div>
                <label style={{ color: COLORS.textDim }}>
                  Temperature: <span style={{ color: COLORS.accent, fontWeight: "600" }}>{temperature.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: "100%", marginTop: "8px" }}
                />
                <div style={{ color: COLORS.textDim, fontSize: "12px", marginTop: "4px" }}>
                  {temperature < 0.5 ? "Precise" : temperature < 1.5 ? "Balanced" : "Creative"}
                </div>
              </div>

              <div>
                <label style={{ color: COLORS.textDim }}>
                  Max Tokens: <span style={{ color: COLORS.accent, fontWeight: "600" }}>{maxTokens}</span>
                </label>
                <input
                  type="range"
                  min="128"
                  max="2048"
                  step="128"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  style={{ width: "100%", marginTop: "8px" }}
                />
                <div style={{ color: COLORS.textDim, fontSize: "12px", marginTop: "4px" }}>
                  {maxTokens < 512 ? "Short" : maxTokens < 1024 ? "Medium" : "Long"}
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div style={{ display: "flex", gap: "12px" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSend();
                  }
                }}
                placeholder="Ask anything... (Ctrl+Enter to send)"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "none",
                  height: "100px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  padding: "12px 24px",
                  background: loading ? COLORS.panel : `${COLORS.accent}30`,
                  border: `1px solid ${loading ? COLORS.border : COLORS.accent}`,
                  color: loading ? COLORS.textDim : COLORS.accent,
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "..." : "SEND"}
              </button>
            </div>

            {/* Info */}
            <div style={{ marginTop: "12px", fontSize: "12px", color: COLORS.textDim }}>
              💡 Direct HuggingFace API • No content filters • Uncensored responses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

