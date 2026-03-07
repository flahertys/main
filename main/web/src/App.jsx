import React from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import TradeHaxFinal from "./TradeHaxFinal.jsx";

function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#090B10",
        color: "#C8D8E8",
        fontFamily: "DM Sans, Arial, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: "24px"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 860,
          border: "1px solid #1C2333",
          borderRadius: 12,
          background: "#0E1117",
          padding: "28px"
        }}
      >
        <p style={{ margin: 0, color: "#F5A623", letterSpacing: "0.12em", fontSize: 12 }}>
          TRADEHAX.NET
        </p>
        <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(28px, 5vw, 44px)" }}>
          TradeHax GPT Interface
        </h1>
        <p style={{ margin: 0, color: "#8EA2B8", lineHeight: 1.6 }}>
          Live prediction market scanner with Fibonacci, Kelly sizing, Bayesian updates, and paper/live
          trading controls.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
          <Link
            to="/tradehax"
            style={{
              display: "inline-block",
              textDecoration: "none",
              background: "#F5A623",
              color: "#0E1117",
              borderRadius: 8,
              padding: "12px 18px",
              fontWeight: 700
            }}
          >
            Open TradeHax Page
          </Link>
          <a
            href="https://tradehaxai.tech"
            style={{
              display: "inline-block",
              textDecoration: "none",
              border: "1px solid #243044",
              color: "#C8D8E8",
              borderRadius: 8,
              padding: "12px 18px"
            }}
          >
            tradehaxai.tech (future option)
          </a>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tradehax" element={<TradeHaxFinal />} />
        <Route path="*" element={<Navigate to="/tradehax" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

