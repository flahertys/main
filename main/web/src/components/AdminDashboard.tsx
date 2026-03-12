/**
 * TradeHax Admin Dashboard
 * Central control point for all AI engine operations
 * Access: /admin/neural-hub
 */

import React, { useState, useEffect } from 'react';
import NeuralConsole from './NeuralConsole';

const ADMIN_COLORS = {
  bg: '#0A0E16',
  surface: '#111820',
  panel: '#12161E',
  border: '#1a2332',
  text: '#B0C4DE',
  textDim: '#8EA2B8',
  accent: '#00D9FF',
  gold: '#F5A623',
  success: '#00E5A0',
  warning: '#FFB547',
  error: '#FF4757',
};

interface AlertRule {
  id: string;
  name: string;
  metric: 'hallucination_rate' | 'quality_score' | 'validation_rate' | 'response_time';
  operator: '>' | '<' | '=';
  threshold: number;
  enabled: boolean;
  action: 'email' | 'slack' | 'auto-fix';
}

interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'alerts' | 'settings'>('overview');
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check authorization
  useEffect(() => {
    checkAuthorization();
  }, []);

  async function checkAuthorization() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setIsAuthorized(false);
        return;
      }
      // Validate token with backend
      setIsAuthorized(true);
    } catch {
      setIsAuthorized(false);
    }
  }

  if (!isAuthorized) {
    return <AdminAuthPanel onAuthorize={() => setIsAuthorized(true)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: ADMIN_COLORS.bg, color: ADMIN_COLORS.text }}>
      {/* Header */}
      <div
        style={{
          background: ADMIN_COLORS.surface,
          borderBottom: `1px solid ${ADMIN_COLORS.border}`,
          padding: '20px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>
              <span style={{ color: ADMIN_COLORS.gold }}>⚙️</span> TradeHax Neural Hub Admin
            </h1>
            <div style={{ fontSize: '12px', color: ADMIN_COLORS.textDim }}>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          background: ADMIN_COLORS.surface,
          borderBottom: `1px solid ${ADMIN_COLORS.border}`,
          padding: '15px 20px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          {(['overview', 'console', 'alerts', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? ADMIN_COLORS.accent : 'transparent',
                color: activeTab === tab ? ADMIN_COLORS.bg : ADMIN_COLORS.text,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {activeTab === 'overview' && <OverviewPanel metrics={metrics} alerts={systemAlerts} />}
        {activeTab === 'console' && <NeuralConsole />}
        {activeTab === 'alerts' && <AlertsPanel alerts={systemAlerts} rules={alertRules} />}
        {activeTab === 'settings' && <SettingsPanel rules={alertRules} />}
      </div>
    </div>
  );
}

function AdminAuthPanel({ onAuthorize }: { onAuthorize: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    // In production, this would validate against backend
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      localStorage.setItem('admin_token', 'valid');
      onAuthorize();
    } else {
      setError('Invalid password');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: ADMIN_COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: ADMIN_COLORS.panel,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: '8px',
          padding: '40px',
          width: '100%',
          maxWidth: '300px',
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0 0 30px 0', color: ADMIN_COLORS.gold }}>
          Neural Hub Admin
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Enter admin password"
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            background: ADMIN_COLORS.bg,
            color: ADMIN_COLORS.text,
            border: `1px solid ${ADMIN_COLORS.border}`,
            borderRadius: '4px',
            boxSizing: 'border-box',
            fontSize: '14px',
          }}
        />
        {error && <div style={{ color: ADMIN_COLORS.error, marginBottom: '15px', fontSize: '12px' }}>{error}</div>}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '10px',
            background: ADMIN_COLORS.accent,
            color: ADMIN_COLORS.bg,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

function OverviewPanel({ metrics, alerts }: { metrics: any; alerts: SystemAlert[] }) {
  const criticalAlerts = alerts.filter((a) => a.level === 'critical' && !a.resolved);

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>System Status</h2>
        <div
          style={{
            background: criticalAlerts.length > 0 ? ADMIN_COLORS.error : ADMIN_COLORS.success,
            color: ADMIN_COLORS.bg,
            padding: '15px',
            borderRadius: '4px',
            fontWeight: 'bold',
          }}
        >
          {criticalAlerts.length > 0 ? `⚠️ ${criticalAlerts.length} Critical Alert(s)` : '✅ All Systems Operational'}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Recent Alerts</h2>
        {alerts.length === 0 ? (
          <div style={{ color: ADMIN_COLORS.textDim }}>No alerts</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {alerts.slice(-5).map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: ADMIN_COLORS.panel,
                  border: `1px solid ${ADMIN_COLORS.border}`,
                  padding: '12px',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${alert.level === 'critical' ? ADMIN_COLORS.error : alert.level === 'warning' ? ADMIN_COLORS.warning : ADMIN_COLORS.accent}`,
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{alert.message}</div>
                <div style={{ fontSize: '12px', color: ADMIN_COLORS.textDim }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertsPanel({ alerts, rules }: { alerts: SystemAlert[]; rules: AlertRule[] }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Alert Rules</h2>
      <div
        style={{
          background: ADMIN_COLORS.panel,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: '4px',
          padding: '20px',
        }}
      >
        {rules.length === 0 ? (
          <div style={{ color: ADMIN_COLORS.textDim }}>No alert rules configured</div>
        ) : (
          <div>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{rule.name}</div>
                  <div style={{ fontSize: '12px', color: ADMIN_COLORS.textDim }}>
                    {rule.metric} {rule.operator} {rule.threshold}
                  </div>
                </div>
                <div
                  style={{
                    padding: '6px 12px',
                    background: rule.enabled ? ADMIN_COLORS.success : ADMIN_COLORS.textDim,
                    color: ADMIN_COLORS.bg,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ rules }: { rules: AlertRule[] }) {
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    metric: 'hallucination_rate',
    operator: '>',
    threshold: 5,
    enabled: true,
    action: 'auto-fix',
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Configuration</h2>

      <div
        style={{
          background: ADMIN_COLORS.panel,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: '4px',
          padding: '20px',
          marginBottom: '30px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Create Alert Rule</h3>

        <div style={{ display: 'grid', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Rule Name</label>
            <input
              type="text"
              value={newRule.name || ''}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                background: ADMIN_COLORS.bg,
                color: ADMIN_COLORS.text,
                border: `1px solid ${ADMIN_COLORS.border}`,
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Metric</label>
              <select
                value={newRule.metric}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: ADMIN_COLORS.bg,
                  color: ADMIN_COLORS.text,
                  border: `1px solid ${ADMIN_COLORS.border}`,
                  borderRadius: '4px',
                }}
              >
                <option value="hallucination_rate">Hallucination Rate</option>
                <option value="quality_score">Quality Score</option>
                <option value="validation_rate">Validation Rate</option>
                <option value="response_time">Response Time</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Operator</label>
              <select
                value={newRule.operator}
                onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: ADMIN_COLORS.bg,
                  color: ADMIN_COLORS.text,
                  border: `1px solid ${ADMIN_COLORS.border}`,
                  borderRadius: '4px',
                }}
              >
                <option value=">">Greater Than</option>
                <option value="<">Less Than</option>
                <option value="=">=</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Threshold</label>
              <input
                type="number"
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: ADMIN_COLORS.bg,
                  color: ADMIN_COLORS.text,
                  border: `1px solid ${ADMIN_COLORS.border}`,
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <button
            style={{
              padding: '10px',
              background: ADMIN_COLORS.accent,
              color: ADMIN_COLORS.bg,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Create Rule
          </button>
        </div>
      </div>

      <div
        style={{
          background: ADMIN_COLORS.panel,
          border: `1px solid ${ADMIN_COLORS.border}`,
          borderRadius: '4px',
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>System Settings</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '12px' }}>Auto-update temperature based on hallucination rate</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '12px' }}>Enable automatic metric persistence to database</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '12px' }}>Send email alerts for critical issues</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

