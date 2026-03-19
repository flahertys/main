import React, { useState } from "react";

const COLORS = {
  panel: "#101D31",
  border: "#1A2B44",
  accent: "#21C8FF",
  text: "#E6F1FF",
  textDim: "#93A8C3",
  positive: "#00D68F",
  negative: "#FF5C7A",
};

export default function FeedbackPrompt({ action, onSubmit, onDismiss }) {
  const [feedback, setFeedback] = useState(null); // 'up' | 'down'
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleFeedback(type) {
    setFeedback(type);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (onSubmit) onSubmit({ action, feedback, comment });
  }

  if (submitted) {
    return (
      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, color: COLORS.text, margin: "18px 0", maxWidth: 420, width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontWeight: 600, color: COLORS.accent, marginBottom: 6 }}>Thank you for your feedback!</div>
        <div style={{ color: COLORS.textDim, fontSize: 13 }}>We use your input to improve the platform experience.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, color: COLORS.text, margin: "18px 0", maxWidth: 420, width: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: 600, color: COLORS.accent, marginBottom: 8, fontSize: 16, lineHeight: 1.3 }}>
        How was your experience with <span style={{ color: COLORS.text }}>{action}</span>?
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, justifyContent: "center" }}>
        <button type="button" onClick={() => handleFeedback("up")}
          style={{ fontSize: 22, background: feedback === "up" ? COLORS.positive : COLORS.panel, color: feedback === "up" ? "#04111F" : COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 20px", cursor: "pointer", flex: 1, minWidth: 0 }}>
          👍
        </button>
        <button type="button" onClick={() => handleFeedback("down")}
          style={{ fontSize: 22, background: feedback === "down" ? COLORS.negative : COLORS.panel, color: feedback === "down" ? "#fff" : COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 20px", cursor: "pointer", flex: 1, minWidth: 0 }}>
          👎
        </button>
      </div>
      <textarea
        placeholder="Optional: Tell us more (what worked, what didn't, suggestions)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ width: "100%", minHeight: 38, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text, marginBottom: 10, padding: 8, fontSize: 15, resize: "vertical", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="submit" disabled={!feedback} style={{ background: COLORS.accent, color: "#04111F", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: feedback ? "pointer" : "not-allowed", opacity: feedback ? 1 : 0.5, flex: 1, minWidth: 120 }}>
          Submit
        </button>
        <button type="button" onClick={onDismiss} style={{ background: "transparent", color: COLORS.textDim, border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer", flex: 1, minWidth: 120 }}>
          Dismiss
        </button>
      </div>
    </form>
  );
}
