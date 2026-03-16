import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ONBOARDING_PHASES,
  ACHIEVEMENTS,
  checkAchievements,
  calculateTotalCredits,
  getEarnedAchievements,
} from '../lib/achievements';

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
};

// Add support for onComplete prop to allow parent to detect onboarding completion
export default function GamifiedOnboarding({ onComplete }) {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    paperTrades: 0,
    signalsGenerated: 0,
    creationsCount: 0,
    walletConnected: false,
    streakDays: 0,
    winningSignals: 0,
    totalProfits: 0,
    referralsCount: 0,
    isPremium: false,
    daysActive: 0,
  });

  const [earnedAchievements, setEarnedAchievements] = useState({});
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(1);

  // Load user stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userStats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserStats(parsed);
        setEarnedAchievements(checkAchievements(parsed));
        // Determine current phase based on completions
        let phase = 1;
        if (parsed.paperTrades > 0) phase = 2;
        if (parsed.signalsGenerated > 0) phase = 3;
        if (parsed.creationsCount > 0) phase = 4;
        if (parsed.walletConnected) phase = 5;
        setCurrentPhase(phase);
      } catch (e) {
        console.error('Failed to load user stats:', e);
      }
    }
  }, []);

  // Save user stats to localStorage
  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(userStats));
    const earned = checkAchievements(userStats);
    setEarnedAchievements(earned);
  }, [userStats]);

  // Add new onboarding phases for goal setting and persona selection
  const GOAL_PHASE = {
    id: 0,
    name: 'Set Your Goal',
    description: 'What do you want to achieve with TradeHax?',
    duration: '1 min',
    achievement: {
      id: 'set-goal',
      name: 'Goal Setter',
      description: 'Defined your primary goal',
      icon: '🎯',
      phase: 0,
      reward: { credits: 50, badge: true },
      condition: (userStats) => !!userStats.goal,
    },
    actionUrl: null,
    actionLabel: 'Set Goal',
  };
  const PERSONA_PHASE = {
    id: 0.5,
    name: 'Choose AI Persona',
    description: 'Pick your AI assistant style',
    duration: '1 min',
    achievement: {
      id: 'choose-persona',
      name: 'Persona Picker',
      description: 'Selected your AI persona',
      icon: '🤖',
      phase: 0.5,
      reward: { credits: 50, badge: true },
      condition: (userStats) => !!userStats.persona,
    },
    actionUrl: null,
    actionLabel: 'Choose Persona',
  };
  const REFERRAL_PHASE = {
    id: 5,
    name: 'Refer & Earn',
    description: 'Invite friends and earn bonus credits',
    duration: '1 min',
    achievement: {
      id: 'referral',
      name: 'Connector',
      description: 'Referred a friend',
      icon: '👥',
      phase: 5,
      reward: { credits: 100, badge: true },
      condition: (userStats) => userStats.referralsCount > 0,
    },
    actionUrl: null,
    actionLabel: 'Invite Friends',
  };

  // Insert new phases at the start and end
  const ENHANCED_PHASES = [GOAL_PHASE, PERSONA_PHASE, ...ONBOARDING_PHASES, REFERRAL_PHASE];

  const [goal, setGoal] = useState(userStats.goal || '');
  const [persona, setPersona] = useState(userStats.persona || '');
  const [referralLink] = useState(() => `${window.location.origin}/signup?ref=${localStorage.getItem('userId') || 'anon'}`);

  const completePhase = (phaseId) => {
    let updates = {};
    if (phaseId === 0) updates = { goal };
    else if (phaseId === 0.5) updates = { persona };
    else if (phaseId === 5) updates = { referralsCount: userStats.referralsCount + 1 };
    else updates = {
      1: { paperTrades: userStats.paperTrades + 1 },
      2: { signalsGenerated: userStats.signalsGenerated + 1 },
      3: { creationsCount: userStats.creationsCount + 1 },
      4: { walletConnected: true },
    }[phaseId] || {};
    const newStats = { ...userStats, ...updates };
    setUserStats(newStats);
    // Show achievement modal
    const phase = ENHANCED_PHASES.find(p => p.id === phaseId);
    if (phase) setShowAchievementModal(phase.achievement);
    if (phaseId < ENHANCED_PHASES[ENHANCED_PHASES.length - 1].id) setCurrentPhase(ENHANCED_PHASES.findIndex(p => p.id === phaseId) + 1);
  };

  // Detect onboarding completion (all phases done)
  useEffect(() => {
    if (
      userStats.paperTrades > 0 &&
      userStats.signalsGenerated > 0 &&
      userStats.creationsCount > 0 &&
      userStats.walletConnected
    ) {
      // Mark onboarding as complete
      localStorage.setItem('onboardingComplete', 'true');
      if (typeof onComplete === 'function') onComplete();
    }
  }, [userStats, onComplete]);

  const totalCredits = calculateTotalCredits(earnedAchievements);

  // Responsive style helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: isMobile ? '10px 2px' : '40px 20px',
      }}
    >
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: isMobile ? '30px' : '60px' }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '32px', fontWeight: 700 }}>
          🎮 Welcome to TradeHax
        </h1>
        <p style={{ margin: '12px 0 0 0', color: COLORS.textDim, fontSize: isMobile ? '13px' : '16px' }}>
          Unlock features step-by-step and earn credits as you go
        </p>
        <div
          style={{
            margin: '20px 0 0 0',
            padding: isMobile ? '8px 12px' : '12px 24px',
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            display: 'inline-block',
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '18px',
            fontWeight: 600,
          }}
        >
          💰 {totalCredits} Credits Earned
        </div>
      </header>

      {/* Phases Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isMobile ? '10px' : '20px',
          maxWidth: isMobile ? '100%' : '1200px',
          margin: isMobile ? '0 auto 30px' : '0 auto 60px',
        }}
      >
        {ENHANCED_PHASES.map((phase, idx) => {
          const isCompleted = idx < currentPhase;
          const isCurrent = idx === currentPhase;
          const isLocked = idx > currentPhase;

          return (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isLocked={isLocked}
              onComplete={() => completePhase(phase.id)}
            />
          );
        })}
      </div>

      {/* Achievement Modal */}
      {showAchievementModal && (
        <AchievementModal
          achievement={showAchievementModal}
          onClose={() => setShowAchievementModal(null)}
          isMobile={isMobile}
        />
      )}

      {/* Earned Achievements Display */}
      <section style={{ maxWidth: isMobile ? '100%' : '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: isMobile ? '15px' : '20px', marginBottom: isMobile ? '10px' : '20px' }}>Your Achievements</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(80px, 1fr))' : 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: isMobile ? '8px' : '16px',
          }}
        >
          {getEarnedAchievements(earnedAchievements).map((achievement) => (
            <div
              key={achievement.id}
              style={{
                background: COLORS.panel,
                border: `2px solid ${COLORS.gold}`,
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.gold}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={achievement.description}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {achievement.icon}
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>
                {achievement.name}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: COLORS.gold }}>
                +{achievement.reward.credits}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* After onboarding summary */}
      {currentPhase >= ENHANCED_PHASES.length && (
        <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: isMobile ? 20 : 32, marginBottom: isMobile ? 8 : 16 }}>🎉 Onboarding Complete!</h1>
          <p style={{ fontSize: isMobile ? 13 : 18, color: COLORS.textDim, marginBottom: isMobile ? 12 : 24 }}>You’ve unlocked all core features and earned {totalCredits} credits.</p>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 24, marginBottom: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
            {getEarnedAchievements(earnedAchievements).map((ach) => (
              <div key={ach.id} style={{ background: COLORS.panel, border: `2px solid ${COLORS.gold}`, borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 32 }}>{ach.icon}</div>
                <div style={{ fontWeight: 600 }}>{ach.name}</div>
              </div>
            ))}
          </div>
          <button onClick={() => window.location.href = '/dashboard'} style={{ ...ctaStyle, background: COLORS.gold, color: COLORS.bg, fontSize: isMobile ? 13 : 16 }}>Go to Dashboard</button>
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase, isCompleted, isCurrent, isLocked, onComplete }) {
  const backgroundColor = isCompleted
    ? COLORS.panel
    : isCurrent
      ? COLORS.panel
      : '#1a1f2a';
  const borderColor = isCompleted ? COLORS.green : isCurrent ? COLORS.accent : COLORS.border;
  const opacity = isLocked ? 0.5 : 1;

  const cardStyle = {
    background: backgroundColor,
    border: `2px solid ${borderColor}`,
    borderRadius: '12px',
    padding: '24px',
    opacity,
    transition: 'all 0.2s',
    cursor: isCurrent ? 'pointer' : 'default',
    position: 'relative',
  };

  const ctaStyle = {
    width: '100%',
    background: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  if (phase.id === 0 && isCurrent) {
    return (
      <div style={{ ...cardStyle, border: `2px solid ${COLORS.accent}` }}>
        <h3>{phase.name}</h3>
        <p>{phase.description}</p>
        <input
          type="text"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="e.g. Consistent profits, learn trading, etc."
          style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}` }}
        />
        <button onClick={onComplete} disabled={!goal.trim()} style={ctaStyle}>Set Goal</button>
      </div>
    );
  }
  if (phase.id === 0.5 && isCurrent) {
    return (
      <div style={{ ...cardStyle, border: `2px solid ${COLORS.accent}` }}>
        <h3>{phase.name}</h3>
        <p>{phase.description}</p>
        <select value={persona} onChange={e => setPersona(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
          <option value="">Select persona</option>
          <option value="pro">Pro Trader</option>
          <option value="coach">Coach</option>
          <option value="uncensored">Uncensored AI</option>
          <option value="mentor">Mentor</option>
        </select>
        <button onClick={onComplete} disabled={!persona} style={ctaStyle}>Choose Persona</button>
      </div>
    );
  }
  if (phase.id === 5 && isCurrent) {
    return (
      <div style={{ ...cardStyle, border: `2px solid ${COLORS.gold}` }}>
        <h3>{phase.name}</h3>
        <p>{phase.description}</p>
        <input type="text" value={referralLink} readOnly style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}` }} />
        <button onClick={() => {navigator.clipboard.writeText(referralLink); onComplete();}} style={ctaStyle}>Copy & Share</button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '24px',
        opacity,
        transition: 'all 0.2s',
        cursor: isCurrent ? 'pointer' : 'default',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (isCurrent) {
          e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.accent}44`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Status Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          fontSize: '20px',
        }}
      >
        {isCompleted ? '✅' : isCurrent ? '🎯' : '🔒'}
      </div>

      {/* Phase Number and Name */}
      <div
        style={{
          fontSize: '12px',
          color: COLORS.textDim,
          marginBottom: '8px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        Phase {phase.id}
      </div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700 }}>
        {phase.name}
      </h3>

      {/* Achievement Reward */}
      <div
        style={{
          background: COLORS.accent + '11',
          border: `1px solid ${COLORS.accent}33`,
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}
      >
        <p style={{ margin: 0, color: COLORS.textDim }}>Achievement Unlock:</p>
        <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
          {phase.achievement.icon} {phase.achievement.name}
        </p>
        <p style={{ margin: '4px 0 0 0', color: COLORS.gold }}>
          +{phase.achievement.reward.credits} Credits
        </p>
      </div>

      {/* Description and Duration */}
      <p style={{ margin: '0 0 16px 0', color: COLORS.textDim, fontSize: '14px' }}>
        {phase.description}
      </p>
      <div style={{ fontSize: '12px', color: COLORS.textDim, marginBottom: '16px' }}>
        ⏱️ Takes about {phase.duration}
      </div>

      {/* CTA Button */}
      {isCompleted ? (
        <button
          disabled
          style={{
            width: '100%',
            background: COLORS.green,
            color: COLORS.bg,
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'default',
          }}
        >
          ✓ Complete
        </button>
      ) : isCurrent ? (
        <button
          onClick={onComplete}
          style={{
            width: '100%',
            background: COLORS.accent,
            color: COLORS.bg,
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.target.style.opacity = '1')}
        >
          {phase.actionLabel}
        </button>
      ) : (
        <button
          disabled
          style={{
            width: '100%',
            background: COLORS.border,
            color: COLORS.textDim,
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          Locked
        </button>
      )}
    </div>
  );
}

function AchievementModal({ achievement, onClose, isMobile }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.5s' }}>
      <div style={{ background: COLORS.panel, border: `3px solid ${COLORS.gold}`, borderRadius: 16, padding: isMobile ? 18 : 40, textAlign: 'center', minWidth: isMobile ? 180 : 320, boxShadow: '0 8px 32px #0008' }}>
        <div style={{ fontSize: isMobile ? 32 : 48, marginBottom: isMobile ? 8 : 16 }}>{achievement.icon}</div>
        <h2 style={{ fontSize: isMobile ? 18 : 28, margin: 0 }}>{achievement.name}</h2>
        <p style={{ color: COLORS.textDim, margin: isMobile ? '8px 0 0 0' : '12px 0 0 0', fontSize: isMobile ? 12 : 16 }}>{achievement.description}</p>
        <div style={{ margin: isMobile ? '10px 0' : '18px 0', fontWeight: 600, color: COLORS.gold, fontSize: isMobile ? 15 : 20 }}>+{achievement.reward.credits} Credits</div>
        <button onClick={onClose} style={{ ...ctaStyle, background: COLORS.accent, color: COLORS.bg, marginTop: 12, fontSize: isMobile ? 13 : 16 }}>Close</button>
      </div>
    </div>
  );
}

const ctaStyle = {
  width: '100%',
  background: COLORS.accent,
  color: COLORS.bg,
  border: 'none',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};
