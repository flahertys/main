-- TradeHax.net Supabase SQL Schema Migration
-- Created: 2026-03-16

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  achievements jsonb DEFAULT '[]',
  streak_days integer DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  preferences jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 2. AI Agent State Table
CREATE TABLE IF NOT EXISTS ai_agent_state (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  agent_config jsonb DEFAULT '{}',
  last_interaction timestamp with time zone,
  custom_datasets jsonb DEFAULT '[]',
  fine_tune_status text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_state_user_id ON ai_agent_state(user_id);

-- 3. Onboarding Events Table
CREATE TABLE IF NOT EXISTS onboarding_events (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);

-- 4. Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  feedback_text text,
  rating integer,
  context jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- 6. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_ai_agent_state_updated_at
BEFORE UPDATE ON ai_agent_state
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- 7. Guitar Lessons
CREATE TABLE IF NOT EXISTS guitar_lessons (
  lesson_id serial PRIMARY KEY,
  title text NOT NULL,
  content text,
  difficulty text,
  tags text[],
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS user_guitar_progress (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id integer REFERENCES guitar_lessons(lesson_id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  score integer,
  last_accessed timestamp with time zone DEFAULT timezone('utc', now()),
  notes text
);
CREATE INDEX IF NOT EXISTS idx_user_guitar_progress_user_id ON user_guitar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_guitar_progress_lesson_id ON user_guitar_progress(lesson_id);

-- 8. Trading Activity & Portfolios
CREATE TABLE IF NOT EXISTS user_trading_activity (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- 'crypto' or 'stock'
  symbol text NOT NULL,
  action text NOT NULL, -- 'buy', 'sell', 'hold'
  amount numeric,
  timestamp timestamp with time zone DEFAULT timezone('utc', now()),
  context jsonb
);
CREATE INDEX IF NOT EXISTS idx_user_trading_activity_user_id ON user_trading_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trading_activity_symbol ON user_trading_activity(symbol);

CREATE TABLE IF NOT EXISTS user_portfolios (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_json jsonb,
  last_updated timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);

-- 9. Neural Hub/AI/LLM Interactions
CREATE TABLE IF NOT EXISTS ai_interactions (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text,
  input text,
  output text,
  model text,
  confidence numeric,
  timestamp timestamp with time zone DEFAULT timezone('utc', now()),
  context jsonb
);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session_id ON ai_interactions(session_id);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text,
  feedback_text text,
  rating integer,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);

-- 10. Site Analytics/Events
CREATE TABLE IF NOT EXISTS site_events (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_site_events_user_id ON site_events(user_id);
CREATE INDEX IF NOT EXISTS idx_site_events_event_type ON site_events(event_type);
