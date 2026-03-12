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
};

export default function ServicesHub() {
  const navigate = useNavigate();

  const offerings = [
    {
      title: 'AI Agent Buildouts',
      detail: 'Ship custom vertical AI assistants for sales, operations, and support.',
    },
    {
      title: 'Automation Systems',
      detail: 'Connect CRM, content, and analytics workflows into one execution pipeline.',
    },
    {
      title: 'Growth Operations',
      detail: 'From lead-gen to retention dashboards, deploy measurable service stacks.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>TradeHax Digital Services</h1>
          <p style={{ margin: '6px 0 0', color: COLORS.textDim }}>Build, package, and monetize AI-powered services</p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'transparent', color: COLORS.accent, border: `1px solid ${COLORS.accent}`, borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
        >
          Back to Platform
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {offerings.map((item) => (
            <section key={item.title} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 10px', color: COLORS.accent }}>{item.title}</h3>
              <p style={{ margin: 0, color: COLORS.textDim, lineHeight: 1.6 }}>{item.detail}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

