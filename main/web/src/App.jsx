import React from "react";
import NeuralHub from "./NeuralHub.jsx";

const T = {
  bg: "#090B10",
  surface: "#0E1117",
  panel: "#12161E",
  border: "#1C2333",
  borderL: "#243044",
  gold: "#F5A623",
  text: "#C8D8E8",
  textDim: "#8EA2B8",
  green: "#00E5A0",
  blue: "#3B9EFF"
};

const PILLARS = [
  {
    title: "Reliable By Default",
    detail:
      "View-only mode starts first, then explicit live execution. This follows institutional risk-control patterns."
  },
  {
    title: "Signal Quality Over Noise",
    detail:
      "Fibonacci, Kelly, Bayesian, and multi-timeframe analysis are unified in one terminal instead of feature sprawl."
  },
  {
    title: "Future-Ready Stack",
    detail:
      "Modular AI adapter path, Polygon wallet validation, and domain flexibility for tradehax.net now and tradehaxai.tech later."
  }
];

const OPERATING_POINTS = [
  "Single primary interface: /tradehax",
  "Minimal launcher page for trust, onboarding, and conversion",
  "No duplicate product paths that fragment analytics and SEO"
];

function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: "DM Sans, Arial, sans-serif",
        padding: "20px"
      }}
    >
      <section style={{ width: "100%", maxWidth: 1040, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14
          }}
        >
          <div>
            <p style={{ margin: 0, color: T.gold, letterSpacing: "0.12em", fontSize: 12 }}>TRADEHAX.NET</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 5vw, 46px)", lineHeight: 1.05 }}>
              Professional Prediction Market Terminal
            </h1>
          </div>
          <a
            href="https://tradehaxai.tech"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              border: `1px solid ${T.borderL}`,
              color: T.text,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              whiteSpace: "nowrap"
            }}
          >
            tradehaxai.tech (future AI domain)
          </a>
        </header>

        <section
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            background: T.surface,
            padding: "24px"
          }}
        >
          <p style={{ margin: 0, color: T.textDim, maxWidth: 860, lineHeight: 1.65 }}>
            Built with a TradingView-style bias toward signal clarity and Bloomberg-style operational discipline:
            one primary interface, controlled execution modes, and modular expansion without clutter.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <Link
              to="/"
              style={{
                display: "inline-block",
                textDecoration: "none",
                background: T.gold,
                color: "#0E1117",
                borderRadius: 8,
                padding: "12px 18px",
                fontWeight: 700
              }}
            >
              Launch TradeHax Interface
            </Link>
            <Link
              to="/"
              style={{
                display: "inline-block",
                textDecoration: "none",
                border: `1px solid ${T.blue}66`,
                color: T.blue,
                borderRadius: 8,
                padding: "12px 18px",
                fontWeight: 600
              }}
            >
              Start in View-Only Mode
            </Link>
          </div>

          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10
            }}
          >
            {OPERATING_POINTS.map((point) => (
              <div
                key={point}
                style={{
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  background: T.panel,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: T.textDim
                }}
              >
                {point}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12
          }}
        >
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                background: T.surface,
                padding: "16px"
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>{pillar.title}</h2>
              <p style={{ margin: 0, color: T.textDim, lineHeight: 1.6, fontSize: 14 }}>{pillar.detail}</p>
            </article>
          ))}
        </section>

        <footer style={{ marginTop: 14, color: "#6F859C", fontSize: 12, lineHeight: 1.5 }}>
          Risk notice: TradeHax provides analytics tooling. Start in view-only mode before enabling live execution.
        </footer>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NeuralHub />} />
        <Route path="/tradehax" element={<TradeHaxFinal />} />
        <Route path="/about" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
