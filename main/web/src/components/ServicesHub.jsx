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

  // Responsive style helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '14px 10px' : '20px 40px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? 10 : 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '28px' }}>TradeHax Digital Services</h1>
          <p style={{ margin: '6px 0 0', color: COLORS.textDim, fontSize: isMobile ? '12px' : undefined }}>Build, package, and monetize AI-powered services</p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'transparent', color: COLORS.accent, border: `1px solid ${COLORS.accent}`, borderRadius: 8, padding: isMobile ? '8px 10px' : '10px 14px', cursor: 'pointer', fontSize: isMobile ? '13px' : undefined }}
        >
          Back to Platform
        </button>
      </header>

      <main style={{ maxWidth: isMobile ? '100%' : 1200, margin: '0 auto', padding: isMobile ? 16 : 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 10 : 16 }}>
          {offerings.map((item) => (
            <section key={item.title} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: isMobile ? 12 : 20 }}>
              <h3 style={{ margin: '0 0 10px', color: COLORS.accent, fontSize: isMobile ? '15px' : undefined }}>{item.title}</h3>
              <p style={{ margin: 0, color: COLORS.textDim, lineHeight: 1.6, fontSize: isMobile ? '12px' : undefined }}>{item.detail}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
