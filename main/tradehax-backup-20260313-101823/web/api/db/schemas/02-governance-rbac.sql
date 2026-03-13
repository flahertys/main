/**
 * Enterprise Governance & RBAC Schema
 * Implements role-based access control (RBAC) with hierarchical permissions
 * Supports trader, quant, risk manager, compliance, operations roles
 */

-- Enum for user roles
CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'COMPLIANCE_OFFICER',
  'RISK_MANAGER',
  'PORTFOLIO_MANAGER',
  'TRADER',
  'QUANT_RESEARCHER',
  'DATA_ENGINEER',
  'OPERATIONS',
  'AUDITOR',
  'VIEWER'
);

-- Enum for permission types
CREATE TYPE permission_type AS ENUM (
  'CREATE_SIGNAL',
  'APPROVE_SIGNAL',
  'EXECUTE_TRADE',
  'MODIFY_TRADE',
  'CANCEL_TRADE',
  'VIEW_PORTFOLIO',
  'MODIFY_RISK_LIMITS',
  'RUN_BACKTEST',
  'TRAIN_MODEL',
  'ACCESS_AUDIT_LOG',
  'APPROVE_DEPLOYMENT',
  'MANAGE_USERS',
  'CONFIGURE_VENUES',
  'VIEW_COMPLIANCE_REPORTS'
);

-- Enum for approval workflow status
CREATE TYPE approval_status AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'EXECUTED',
  'CANCELLED'
);

-- Users/teams table
CREATE TABLE IF NOT EXISTS enterprise_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'VIEWER',

  -- Team/desk assignment
  team_id VARCHAR(100),
  desk VARCHAR(100),
  manager_id UUID REFERENCES enterprise_users(id),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,

  -- Multi-factor authentication
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),

  -- API access
  api_key_hash VARCHAR(64),
  api_key_expires_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_enterprise_users_username ON enterprise_users(username);
CREATE INDEX IF NOT EXISTS idx_enterprise_users_role ON enterprise_users(role);
CREATE INDEX IF NOT EXISTS idx_enterprise_users_team ON enterprise_users(team_id);

-- Custom permissions per user (fine-grained control)
CREATE TABLE IF NOT EXISTS user_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
  permission permission_type NOT NULL,

  -- Resource limits
  max_trade_size DECIMAL(18,8),
  max_daily_loss DECIMAL(18,8),
  max_notional DECIMAL(18,8),

  -- Approval thresholds
  approval_required_above DECIMAL(18,8),
  approval_required_for_symbols TEXT[],

  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- Hierarchical teams/desks
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_team_id VARCHAR(100) REFERENCES teams(id),

  -- Risk limits
  max_portfolio_var DECIMAL(18,8),
  max_leverage DECIMAL(5,2),

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Approval workflow - multi-level approvals for large trades
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id VARCHAR(255),
  trade_id VARCHAR(255),

  -- Trade/signal details
  asset_class VARCHAR(50),
  notional_value DECIMAL(18,8),
  risk_level VARCHAR(20),

  -- Approval chain
  approval_status approval_status DEFAULT 'DRAFT',
  required_approvers user_role[],
  current_approvers_needed user_role[],

  -- Approval history (JSON for audit)
  approvals JSONB DEFAULT '[]',
  rejections JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(approval_status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_trade ON approval_workflows(trade_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_signal ON approval_workflows(signal_id);

-- Approve workflow function
CREATE OR REPLACE FUNCTION approve_workflow(
  workflow_id UUID,
  approver_id UUID,
  approval_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  approver_role user_role;
BEGIN
  SELECT role INTO approver_role FROM enterprise_users WHERE id = approver_id;

  UPDATE approval_workflows
  SET approvals = approvals || jsonb_build_array(jsonb_build_object(
    'approver_id', approver_id,
    'role', approver_role,
    'notes', approval_notes,
    'timestamp', CURRENT_TIMESTAMP
  ))
  WHERE id = workflow_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Access logging
CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES enterprise_users(id),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),

  status VARCHAR(20),
  denied_reason VARCHAR(255),

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_status ON access_logs(status);

-- Grant permissions
ALTER TABLE enterprise_users OWNER TO tradehax_governance;
ALTER TABLE user_permissions OWNER TO tradehax_governance;
ALTER TABLE teams OWNER TO tradehax_governance;
ALTER TABLE approval_workflows OWNER TO tradehax_governance;
ALTER TABLE access_logs OWNER TO tradehax_governance;

