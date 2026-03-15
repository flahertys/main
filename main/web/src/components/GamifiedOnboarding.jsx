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

export default function GamifiedOnboarding() {
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

  const completePhase = (phaseId) => {
    // Simulate phase completion
    const updates = {
      1: { paperTrades: userStats.paperTrades + 1 },
      2: { signalsGenerated: userStats.signalsGenerated + 1 },
      3: { creationsCount: userStats.creationsCount + 1 },
      4: { walletConnected: true },
    };

    const newStats = { ...userStats, ...updates[phaseId] };
    setUserStats(newStats);

    // Show achievement modal
    const phase = ONBOARDING_PHASES[phaseId - 1];
    if (phase) {
      setShowAchievementModal(phase.achievement);
    }

    if (phaseId < ONBOARDING_PHASES.length) {
      setCurrentPhase(phaseId + 1);
    }
  };

  const totalCredits = calculateTotalCredits(earnedAchievements);

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '40px 20px',
      }}
    >
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>
          🎮 Welcome to TradeHax
        </h1>
        <p style={{ margin: '12px 0 0 0', color: COLORS.textDim, fontSize: '16px' }}>
          Unlock features step-by-step and earn credits as you go
        </p>
        <div
          style={{
            margin: '20px 0 0 0',
            padding: '12px 24px',
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            display: 'inline-block',
            borderRadius: '8px',
            fontSize: '18px',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto 60px',
        }}
      >
        {ONBOARDING_PHASES.map((phase, idx) => {
          const isCompleted = idx + 1 < currentPhase;
          const isCurrent = idx + 1 === currentPhase;
          const isLocked = idx + 1 > currentPhase;

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
        />
      )}

      {/* Earned Achievements Display */}
      <section style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Your Achievements</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '16px',
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

function AchievementModal({ achievement, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.panel,
          border: `2px solid ${COLORS.gold}`,
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          textAlign: 'center',
          animation: 'scaleIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {achievement.icon}
        </div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700 }}>
          Achievement Unlocked!
        </h2>
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            color: COLORS.gold,
            fontWeight: 600,
          }}
        >
          {achievement.name}
        </h3>
        <p style={{ margin: '0 0 24px 0', color: COLORS.textDim, fontSize: '14px' }}>
          {achievement.description}
        </p>
        <div
          style={{
            background: COLORS.accent + '11',
            border: `1px solid ${COLORS.accent}33`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: 0, color: COLORS.textDim, fontSize: '12px' }}>Reward:</p>
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: '24px',
              fontWeight: 700,
              color: COLORS.gold,
            }}
          >
            +{achievement.reward.credits} Credits
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: COLORS.accent,
            color: COLORS.bg,
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

