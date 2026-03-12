import React, { useState, useEffect } from 'react';
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
  const [userProfile, setUserProfile] = useState({
    name: 'Trader',
    creditsEarned: 250,
    achievements: ['First Signal', 'Week Streak'],
    referralLink: 'https://tradehax.net?ref=user123',
  });

  // Load user profile from localStorage or API
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }
  }, []);

  const services = [
    {
      id: 'trading',
      icon: '📊',
      title: 'Trading AI',
      description: 'Live BTC, ETH, and crypto signals with explainable confidence scoring.',
      cta: 'Get Trading Signals',
      color: '#00D9FF',
      stats: { signals: 48, winRate: '62%' },
    },
    {
      id: 'music',
      icon: '🎸',
      title: 'Music Tools',
      description: 'AI guitar coach, promotion engine, and collaboration marketplace.',
      cta: 'Explore Music',
      color: '#F5A623',
      stats: { projects: 12, listens: 3420 },
    },
    {
      id: 'services',
      icon: '⚡',
      title: 'Services Marketplace',
      description: 'Launch AI agents and services in days. Get clients. Build recurring revenue.',
      cta: 'Explore Services',
      color: '#00E5A0',
      stats: { projects: 5, earnings: '$2,340' },
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
      {/* Header with User Profile */}
      <header
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
            TradeHax Neural Hub
          </h1>
          <p style={{ margin: '5px 0 0 0', color: COLORS.textDim, fontSize: '14px' }}>
            Unified AI platform for trading, music, and services
          </p>
        </div>
        <UserProfileCard profile={userProfile} />
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px' }}>
        {/* Welcome Section */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
            Welcome back, {userProfile.name}! 👋
          </h2>
          <p style={{ color: COLORS.textDim, marginBottom: '20px', maxWidth: '600px' }}>
            You've earned <span style={{ color: COLORS.gold, fontWeight: 600 }}>{userProfile.creditsEarned} credits</span> so far.
            Keep trading, creating, and referring friends to unlock premium features.
          </p>
        </section>

        {/* Service Cards Grid */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600 }}>
            Your Services
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onCTA={() => navigate(`/${service.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Smart Recommendations */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600 }}>
            Recommended For You
          </h2>
          <SmartRecommendations />
        </section>

        {/* Achievement Badges */}
        <section>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600 }}>
            Your Achievements
          </h2>
          <AchievementBadges achievements={userProfile.achievements} />
        </section>
      </main>
    </div>
  );
}

function UserProfileCard({ profile }) {
  const [copied, setCopied] = useState(false);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(profile.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
      }}
    >
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '12px', color: COLORS.textDim }}>Credits Earned</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 700, color: COLORS.gold }}>
          {profile.creditsEarned}
        </p>
      </div>
      <button
        onClick={copyReferralLink}
        style={{
          background: COLORS.accent,
          color: COLORS.bg,
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.target.style.opacity = '1')}
      >
        {copied ? '✓ Copied!' : 'Share Referral'}
      </button>
    </div>
  );
}

function ServiceCard({ service, onCTA }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        padding: '24px',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = service.color;
        e.currentTarget.style.boxShadow = `0 0 20px ${service.color}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{service.icon}</div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
        {service.title}
      </h3>
      <p
        style={{
          margin: '0 0 16px 0',
          color: COLORS.textDim,
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {service.description}
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {Object.entries(service.stats).map(([key, value]) => (
          <div key={key} style={{ fontSize: '12px' }}>
            <p style={{ margin: 0, color: COLORS.textDim }}>{key}</p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: service.color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={onCTA}
        style={{
          width: '100%',
          background: service.color,
          color: COLORS.bg,
          border: 'none',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.target.style.opacity = '1')}
      >
        {service.cta}
      </button>
    </div>
  );
}

function SmartRecommendations() {
  const recommendations = [
    {
      title: 'Your signal accuracy improved 12% this week',
      icon: '📈',
      action: 'Review wins',
    },
    {
      title: 'SOL showing strong technical setup',
      icon: '🎯',
      action: 'Get signal',
    },
    {
      title: '5 new services available in your niche',
      icon: '✨',
      action: 'Explore',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}
    >
      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>{rec.icon}</span>
            <p style={{ margin: 0, fontSize: '14px', color: COLORS.text }}>{rec.title}</p>
          </div>
          <button
            style={{
              background: COLORS.accent,
              color: COLORS.bg,
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {rec.action}
          </button>
        </div>
      ))}
    </div>
  );
}

function AchievementBadges({ achievements }) {
  const allBadges = [
    { id: 'first-signal', name: 'First Signal', icon: '🚀', earned: true },
    { id: 'week-streak', name: 'Week Streak', icon: '🔥', earned: true },
    { id: 'win-10', name: 'Win 10 Signals', icon: '🏆', earned: false },
    { id: 'profit-1k', name: '$1K Profit', icon: '💰', earned: false },
    { id: 'share-3', name: 'Share 3 Friends', icon: '👥', earned: false },
    { id: 'power-user', name: 'Power User', icon: '⚡', earned: false },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '16px',
      }}
    >
      {allBadges.map((badge) => (
        <div
          key={badge.id}
          style={{
            background: COLORS.panel,
            border: `2px solid ${badge.earned ? COLORS.gold : COLORS.border}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            opacity: badge.earned ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (badge.earned) {
              e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.gold}66`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{badge.icon}</div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>{badge.name}</p>
          <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: COLORS.textDim }}>
            {badge.earned ? '✓ Earned' : 'Locked'}
          </p>
        </div>
      ))}
    </div>
  );
}

