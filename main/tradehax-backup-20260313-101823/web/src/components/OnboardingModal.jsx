import React, { useState } from 'react';

export function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Welcome to TradeHaxAI',
      content: 'Get started with your professional trading assistant. We will guide you through key features and panels.'
    },
    {
      title: 'Watchlist & Alerts',
      content: 'Add symbols to your watchlist and receive real-time alerts. Use filters and batch actions for efficient management.'
    },
    {
      title: 'Signal Cards',
      content: 'View actionable trading signals with confidence, trend, and odds. Signals update in real-time for fast execution.'
    },
    {
      title: 'Analytics Panel',
      content: 'Monitor performance metrics, signal quality, and latency. Use analytics to validate and optimize your trading.'
    },
    {
      title: 'Theme & Accessibility',
      content: 'Switch between light/dark mode and enjoy a responsive, accessible interface.'
    }
  ];
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--panel-color)', color: 'var(--text-color)', borderRadius: 16, boxShadow: '0 4px 24px #0003', padding: 32, maxWidth: 420, width: '90vw' }}>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>{steps[step].title}</h2>
        <p style={{ fontSize: 16, marginBottom: 24 }}>{steps[step].content}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--border-color)', color: 'var(--text-color)', border: 'none' }}>Back</button>}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--accent-color)', color: 'var(--bg-color)', border: 'none', fontWeight: 700 }}>Next</button>
          ) : (
            <button onClick={onComplete} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--green-color)', color: 'var(--bg-color)', border: 'none', fontWeight: 700 }}>Finish</button>
          )}
        </div>
      </div>
    </div>
  );
}

