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

  const pillars = [
    {
      id: 'trading',
      icon: '📊',
      title: 'Trading AI',
      description: 'Live signal analysis, execution playbooks, and risk-first decision support.',
      cta: 'Open Trading Hub',
      color: COLORS.accent,
      onClick: () => navigate('/trading'),
    },
    {
      id: 'music',
      icon: '🎸',
      title: 'Music Hub',
      description: 'AI creator tools, growth strategy, and collaboration workflows for artists.',
      cta: 'Open Music Hub',
      color: COLORS.gold,
      onClick: () => navigate('/music'),
    },
    {
      id: 'services',
      icon: '⚡',
      title: 'Digital Services',
      description: 'Launch and scale AI-powered service offerings with operational automation.',
      cta: 'Open Services Hub',
      color: COLORS.green,
      onClick: () => navigate('/services'),
    },
  ];

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
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>TradeHax Platform</h1>
          <p style={{ margin: '5px 0 0 0', color: COLORS.textDim, fontSize: '14px' }}>
            Multi-vertical AI platform for trading, music, and digital services
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', fontWeight: 600 }}>All-in-One Command Center</h2>
          <p style={{ color: COLORS.textDim, marginBottom: '20px', maxWidth: '600px' }}>
            TradeHax now unifies your core business layers in one platform. Run trading intelligence, creator growth, and digital services from a single operating stack.
          </p>
        </section>

        {/* Core Platform Pillars */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <div style={{ fontSize: '34px', marginBottom: '10px' }}>{pillar.icon}</div>
                <h3 style={{ margin: '0 0 8px 0', color: pillar.color }}>{pillar.title}</h3>
                <p style={{ margin: '0 0 16px 0', color: COLORS.textDim, lineHeight: 1.6 }}>{pillar.description}</p>
                <button
                  onClick={pillar.onClick}
                  style={{
                    width: '100%',
                    background: pillar.color,
                    color: COLORS.bg,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pillar.cta}
                </button>
              </div>
            ))}
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
            <StatCard label="Trading Signals" value="Live" />
            <StatCard label="Music Layer" value="Active" />
            <StatCard label="Services Layer" value="Active" />
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

