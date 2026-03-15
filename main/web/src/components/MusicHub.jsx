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

export default function MusicHub() {
  const navigate = useNavigate();

  const modules = [
    {
      title: 'AI Guitar Coach',
      detail: 'Personalized practice plans, progression tracking, and focused drills.',
    },
    {
      title: 'Release & Promotion Engine',
      detail: 'Create campaigns, optimize messaging, and track conversion performance.',
    },
    {
      title: 'Collaboration Marketplace',
      detail: 'Connect with artists, producers, and session talent in one workflow.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>TradeHax Music Hub</h1>
          <p style={{ margin: '6px 0 0', color: COLORS.textDim }}>Creator growth stack for musicians and labels</p>
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
          {modules.map((module) => (
            <section key={module.title} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 10px', color: COLORS.gold }}>{module.title}</h3>
              <p style={{ margin: 0, color: COLORS.textDim, lineHeight: 1.6 }}>{module.detail}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

