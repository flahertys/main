import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateTotalCredits, getEarnedAchievements } from '../lib/achievements';

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

// Remove redundant links/buttons, unify pillars, and surface user profile
export default function Dashboard() {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userStats')) || {};
    } catch {
      return {};
    }
  });
  const [avatarUrl] = useState(() => localStorage.getItem('avatarUrl') || 'https://api.dicebear.com/7.x/identicon/svg?seed=tradehax');
  const credits = calculateTotalCredits(userStats ? userStats.earnedAchievements || {} : {});
  const achievements = getEarnedAchievements(userStats ? userStats.earnedAchievements || {} : {});
  // Simulate referral leaderboard and recent achievements
  const referralLeaders = [
    { name: 'Alice', count: 12 },
    { name: 'Bob', count: 9 },
    { name: 'You', count: userStats.referralsCount || 0 },
  ];
  const recentAchievements = achievements.slice(-3).reverse();

  useEffect(() => {
    const handler = () => {
      try {
        setUserStats(JSON.parse(localStorage.getItem('userStats')) || {});
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

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

  // Responsive style helpers
  const isMobile = window.innerWidth <= 600;

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: isMobile ? '0' : undefined,
      }}
    >
      {/* Unified Header */}
      <header
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          padding: isMobile ? '14px 10px' : '20px 40px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 10 : 0,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '28px', fontWeight: 700 }}>TradeHax Platform</h1>
          <p style={{ margin: '5px 0 0 0', color: COLORS.textDim, fontSize: isMobile ? '12px' : '14px' }}>
            Unified AI platform for trading, music, and digital services
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', marginRight: isMobile ? 0 : 8 }}>
            <span style={{ fontSize: isMobile ? 11 : 13, color: COLORS.textDim }}>XP: {userStats.daysActive ? userStats.daysActive * 100 : 0}</span>
            <span style={{ fontSize: isMobile ? 13 : 15, color: COLORS.gold, fontWeight: 600 }}>💰 {credits} Credits</span>
          </div>
          <img src={avatarUrl} alt="avatar" style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: '50%', border: `2px solid ${COLORS.accent}` }} />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: isMobile ? '16px 6px' : '40px', maxWidth: isMobile ? '100%' : '1200px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <section style={{ marginBottom: isMobile ? '24px' : '40px' }}>
          <h2 style={{ fontSize: isMobile ? '18px' : '24px', marginBottom: '10px', fontWeight: 600 }}>All-in-One Command Center</h2>
          <p style={{ color: COLORS.textDim, marginBottom: '20px', maxWidth: isMobile ? '100%' : '600px', fontSize: isMobile ? '13px' : undefined }}>
            TradeHax now unifies your core business layers in one platform. Run trading intelligence, creator growth, and digital services from a single operating stack.
          </p>
        </section>

        {/* Core Platform Pillars - Unified, no redundant CTAs */}
        <section style={{ marginBottom: isMobile ? '24px' : '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  padding: isMobile ? '16px' : '24px',
                }}
              >
                <div style={{ fontSize: isMobile ? '26px' : '34px', marginBottom: '10px' }}>{pillar.icon}</div>
                <h3 style={{ margin: '0 0 8px 0', color: pillar.color, fontSize: isMobile ? '16px' : undefined }}>{pillar.title}</h3>
                <p style={{ margin: '0 0 16px 0', color: COLORS.textDim, lineHeight: 1.6, fontSize: isMobile ? '13px' : undefined }}>{pillar.description}</p>
                <button
                  onClick={pillar.onClick}
                  style={{
                    width: '100%',
                    background: pillar.color,
                    color: COLORS.bg,
                    border: 'none',
                    borderRadius: '8px',
                    padding: isMobile ? '8px 10px' : '10px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : undefined,
                  }}
                >
                  {pillar.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
