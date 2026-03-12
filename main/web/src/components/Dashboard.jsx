import React from 'react';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  bg: '#090B10',
  surface: '#0E1117',
  panel: '#12161E',
  border: '#1C2333',
  accent: '#00D9FF',
  gold: '#F5A623',
  text: '#C8D8E8',
  textDim: '#8EA2B8',
  green: '#00E5A0',
  red: '#FF4757',
};

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '20px 40px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
            TradeHax Neural Hub
          </h1>
          <p style={{ margin: '5px 0 0 0', color: COLORS.textDim, fontSize: '14px' }}>
            Unified AI platform for professional trading
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', fontWeight: 600 }}>
            Trading AI Interface
          </h2>
          <p style={{ color: COLORS.textDim, marginBottom: '20px', maxWidth: '600px' }}>
            Professional trading assistant with execution-focused guidance. Ask for setups, risk plans, or market analysis.
          </p>
        </section>

        {/* Direct Trading AI Entry */}
        <section style={{ marginBottom: '40px' }}>
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 600 }}>
              Get Trading Signals
            </h3>
            <p style={{ color: COLORS.textDim, marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
              Live BTC, ETH, and crypto analysis with explainable confidence scoring and execution playbooks.
            </p>
            <button
              onClick={() => navigate('/trading')}
              style={{
                background: COLORS.accent,
                color: COLORS.bg,
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              Launch Trading AI
            </button>
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600, color: COLORS.textDim }}>
            Platform Status
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <StatCard label="Interface" value="Production Ready" />
            <StatCard label="AI Mode" value="Live" />
            <StatCard label="Multi-turn" value="Enabled" />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ fontSize: '12px', color: COLORS.textDim, marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, color: COLORS.accent }}>
        {value}
      </div>
    </div>
  );
}

