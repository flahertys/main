"use client";

import dynamic from "next/dynamic";

// Load the Polymarket terminal as a client-side only component to avoid SSR issues
// with browser-only APIs (JsonRpcProvider, fetch from Polymarket CLOB API, localStorage, etc.)
const PolymarketTerminal = dynamic(
  () => import("@/components/trading/PolymarketTerminal"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          background: "#090B10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#C8D8E8",
          fontFamily: "'DM Sans', Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#F5A623", letterSpacing: "0.12em", fontSize: 12, marginBottom: 8 }}>
            TRADEHAX GPT
          </div>
          <div style={{ fontSize: 14, color: "#8EA2B8" }}>Loading Polymarket Terminal…</div>
        </div>
      </div>
    ),
  }
);

export default function PolymarketClientPage() {
  return <PolymarketTerminal />;
}
