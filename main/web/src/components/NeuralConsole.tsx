/**
 * TradeHax Neural Console UI
 * Real-time monitoring and command interface
 * Accessible via: /neural-console or via API commands
 */

import React, { useState, useEffect } from 'react';

const CONSOLE_COLORS = {
  bg: '#0A0E16',
  panel: '#111820',
  border: '#1a2332',
  text: '#B0C4DE',
  accent: '#00D9FF',
  gold: '#F5A623',
  success: '#00E5A0',
  warning: '#FFB547',
  error: '#FF4757',
};

interface ConsoleCommand {
  command: string;
  args?: Record<string, any>;
  timestamp: number;
  source: string;
}

interface ConsoleMetrics {
  totalRequests: number;
  validResponses: number;
  invalidResponses: number;
  hallucinationDetections: number;
  averageQualityScore: number;
  lastErrors: string[];
  providerStats: Record<string, { count: number; avgScore: number }>;
}

export function NeuralConsole() {
  const [metrics, setMetrics] = useState<ConsoleMetrics | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<string[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [forceDemo, setForceDemo] = useState(false);

  // Fetch metrics on mount and periodically
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConsoleCommand: true,
          command: 'metrics',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }

  async function executeCommand() {
    if (!commandInput.trim()) return;

    const parts = commandInput.trim().split(' ');
    const command = parts[0];
    const args: Record<string, any> = {};

    // Parse arguments
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i].replace('--', '');
      const value = parts[i + 1] || true;
      args[key] = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
    }

    addOutput(`> ${commandInput}`);
    setCommandHistory((prev) => [...prev, commandInput]);
    setCommandInput('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConsoleCommand: true,
          command,
          args,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addOutput(`✓ ${command} executed`);
        addOutput(JSON.stringify(data, null, 2));
      } else {
        addOutput(`✗ Error: ${data.error}`);
      }

      // Refresh metrics after command
      fetchMetrics();
    } catch (error) {
      addOutput(`✗ Failed to execute command: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function addOutput(text: string) {
    setOutput((prev) => [...prev, text].slice(-50)); // Keep last 50 lines
  }

  function handleStrictToggle() {
    const newValue = !strictMode;
    setStrictMode(newValue);
    executeCommandWithArgs('enable-strict', { enabled: newValue });
  }

  function handleForceDemoToggle() {
    const newValue = !forceDemo;
    setForceDemo(newValue);
    executeCommandWithArgs('force-demo', { enabled: newValue });
  }

  function handleTemperatureChange(value: number) {
    setTemperature(value);
    executeCommandWithArgs('set-temperature', { temperature: value });
  }

  async function executeCommandWithArgs(command: string, args: Record<string, any>) {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConsoleCommand: true,
          command,
          args,
        }),
      });

      if (response.ok) {
        addOutput(`✓ ${command} updated`);
        fetchMetrics();
      }
    } catch (error) {
      addOutput(`✗ Failed to update ${command}`);
    }
  }

  const validationRate =
    metrics && metrics.totalRequests > 0
      ? ((metrics.validResponses / metrics.totalRequests) * 100).toFixed(1)
      : 'N/A';

  const hallucinationRate =
    metrics && metrics.totalRequests > 0
      ? ((metrics.hallucinationDetections / metrics.totalRequests) * 100).toFixed(1)
      : 'N/A';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: CONSOLE_COLORS.bg,
        color: CONSOLE_COLORS.text,
        fontFamily: "'Fira Code', monospace",
        padding: '20px',
        overflow: 'auto',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', borderBottom: `1px solid ${CONSOLE_COLORS.border}`, paddingBottom: '20px' }}>
          <div style={{ color: CONSOLE_COLORS.gold, fontSize: '11px', letterSpacing: '0.12em', marginBottom: '8px' }}>
            NEURAL CONSOLE
          </div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>TradeHax AI Engine Monitor</h1>
          <p style={{ color: CONSOLE_COLORS.text, marginTop: '5px', fontSize: '12px' }}>
            Real-time metrics, hallucination detection, and quality control
          </p>
        </div>

        {/* Metrics Dashboard */}
        {metrics && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '30px',
            }}
          >
            <MetricCard label="Total Requests" value={metrics.totalRequests} color={CONSOLE_COLORS.accent} />
            <MetricCard label="Valid Responses" value={metrics.validResponses} color={CONSOLE_COLORS.success} />
            <MetricCard label="Invalid Responses" value={metrics.invalidResponses} color={CONSOLE_COLORS.warning} />
            <MetricCard label="Hallucination Rate" value={`${hallucinationRate}%`} color={CONSOLE_COLORS.error} />
            <MetricCard label="Avg Quality Score" value={metrics.averageQualityScore.toFixed(1)} color={CONSOLE_COLORS.gold} />
            <MetricCard label="Validation Rate" value={`${validationRate}%`} color={CONSOLE_COLORS.success} />
          </div>
        )}

        {/* Configuration Panel */}
        <div
          style={{
            background: CONSOLE_COLORS.panel,
            border: `1px solid ${CONSOLE_COLORS.border}`,
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '30px',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Configuration</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {/* Temperature Control */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                Temperature: {temperature.toFixed(2)} (0.1=Deterministic, 1.0=Creative)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: CONSOLE_COLORS.accent,
                }}
              />
              <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: CONSOLE_COLORS.text }}>
                {temperature < 0.4
                  ? '⚡ Deterministic - Reliable, low hallucinations'
                  : temperature < 0.7
                    ? '⚖️ Balanced - Good tradeoff'
                    : '🎨 Creative - More variation, higher risk'}
              </p>
            </div>

            {/* Strict Mode Toggle */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={handleStrictToggle}
                  style={{ accentColor: CONSOLE_COLORS.accent, width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px' }}>Strict Mode (Reject any hallucinations)</span>
              </label>
              <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: CONSOLE_COLORS.text }}>
                {strictMode ? '🔒 Enabled - Zero hallucination tolerance' : '🔓 Disabled - Partial tolerance'}
              </p>
            </div>

            {/* Force Demo Toggle */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={forceDemo}
                  onChange={handleForceDemoToggle}
                  style={{ accentColor: CONSOLE_COLORS.accent, width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px' }}>Force Demo Mode</span>
              </label>
              <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: CONSOLE_COLORS.text }}>
                {forceDemo ? '🎬 Enabled - Testing/maintenance mode' : '🤖 Disabled - Live AI'}
              </p>
            </div>
          </div>
        </div>

        {/* Command Interface */}
        <div
          style={{
            background: CONSOLE_COLORS.panel,
            border: `1px solid ${CONSOLE_COLORS.border}`,
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '30px',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Command Interface</h3>

          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executeCommand();
                if (e.key === 'ArrowUp' && commandHistory.length > 0) {
                  setCommandInput(commandHistory[commandHistory.length - 1]);
                }
              }}
              placeholder="Enter command (e.g., 'ai-status', 'metrics', 'validate-response --response ...')"
              style={{
                width: '100%',
                padding: '10px',
                background: CONSOLE_COLORS.bg,
                color: CONSOLE_COLORS.text,
                border: `1px solid ${CONSOLE_COLORS.border}`,
                borderRadius: '4px',
                fontFamily: "'Fira Code', monospace",
                fontSize: '12px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '15px' }}>
            {[
              { label: 'Status', cmd: 'ai-status' },
              { label: 'Metrics', cmd: 'metrics' },
              { label: 'Health Check', cmd: 'health-check' },
              { label: 'Audit Cache', cmd: 'audit-cache' },
            ].map((btn) => (
              <button
                key={btn.cmd}
                onClick={() => {
                  setCommandInput(btn.cmd);
                  setTimeout(executeCommand, 0);
                }}
                style={{
                  padding: '8px 12px',
                  background: CONSOLE_COLORS.accent,
                  color: CONSOLE_COLORS.bg,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output Console */}
        <div
          style={{
            background: CONSOLE_COLORS.bg,
            border: `1px solid ${CONSOLE_COLORS.border}`,
            borderRadius: '4px',
            padding: '15px',
            fontFamily: "'Fira Code', monospace",
            fontSize: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: CONSOLE_COLORS.accent }}>Output</h3>
          {output.map((line, idx) => (
            <div key={idx} style={{ lineHeight: '1.6', color: line.startsWith('✗') ? CONSOLE_COLORS.error : line.startsWith('✓') ? CONSOLE_COLORS.success : CONSOLE_COLORS.text }}>
              {line}
            </div>
          ))}
        </div>

        {/* Provider Stats */}
        {metrics && Object.keys(metrics.providerStats).length > 0 && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: `1px solid ${CONSOLE_COLORS.border}` }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Provider Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {Object.entries(metrics.providerStats).map(([provider, stats]) => (
                <div
                  key={provider}
                  style={{
                    background: CONSOLE_COLORS.panel,
                    border: `1px solid ${CONSOLE_COLORS.border}`,
                    borderRadius: '4px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'capitalize' }}>
                    {provider}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <div>Requests: {stats.count}</div>
                    <div>Avg Score: {stats.avgScore.toFixed(1)}/100</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div
      style={{
        background: CONSOLE_COLORS.panel,
        border: `1px solid ${CONSOLE_COLORS.border}`,
        borderRadius: '4px',
        padding: '15px',
      }}
    >
      <div style={{ fontSize: '11px', color: CONSOLE_COLORS.text, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

export default NeuralConsole;

