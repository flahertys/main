import React from "react";

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown runtime error",
    };
  }

  componentDidCatch(error, info) {
    console.error("RootErrorBoundary caught runtime error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: "100vh",
            background: "#090B10",
            color: "#C8D8E8",
            fontFamily: "Inter, Arial, sans-serif",
            padding: 24,
          }}
        >
          <section style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ color: "#F5A623", fontSize: 12, letterSpacing: "0.12em", marginBottom: 12 }}>
              TRADEHAX.NET
            </div>
            <h1 style={{ marginTop: 0 }}>TradeHax recovery mode</h1>
            <p style={{ color: "#8EA2B8", lineHeight: 1.7 }}>
              The application hit a runtime error, but the recovery guard is active so the page does not fail silently.
            </p>
            <div
              style={{
                marginTop: 18,
                border: "1px solid #1C2333",
                borderRadius: 12,
                padding: 16,
                background: "#12161E",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Runtime message</div>
              <code style={{ whiteSpace: "pre-wrap", color: "#00D9FF" }}>{this.state.message}</code>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

