import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)."
  );
}

export const supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// --- Supabase Utility Functions for All Domains ---

// Guitar Lessons
export async function getGuitarLessons() {
  return supabaseClient.from('guitar_lessons').select('*').order('lesson_id');
}
export async function getUserGuitarProgress(userId) {
  return supabaseClient.from('user_guitar_progress').select('*').eq('user_id', userId);
}
export async function upsertUserGuitarProgress(progress) {
  return supabaseClient.from('user_guitar_progress').upsert(progress);
}

// Trading Activity & Portfolios
export async function logUserTradingActivity(activity) {
  return supabaseClient.from('user_trading_activity').insert(activity);
}
export async function getUserTradingActivity(userId) {
  return supabaseClient.from('user_trading_activity').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
}
export async function getUserPortfolio(userId) {
  return supabaseClient.from('user_portfolios').select('*').eq('user_id', userId).single();
}
export async function upsertUserPortfolio(portfolio) {
  return supabaseClient.from('user_portfolios').upsert(portfolio);
}

// Neural Hub / AI / LLM
export async function logAIInteraction(interaction) {
  return supabaseClient.from('ai_interactions').insert(interaction);
}
export async function getAIInteractions(userId, sessionId) {
  let query = supabaseClient.from('ai_interactions').select('*').eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  return query.order('timestamp', { ascending: false });
}
export async function logAIFeedback(feedback) {
  return supabaseClient.from('ai_feedback').insert(feedback);
}
export async function getAIFeedback(userId, sessionId) {
  let query = supabaseClient.from('ai_feedback').select('*').eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  return query.order('created_at', { ascending: false });
}

// Analytics & Events
export async function logSiteEvent(event) {
  return supabaseClient.from('site_events').insert(event);
}
export async function getSiteEvents(userId, eventType) {
  let query = supabaseClient.from('site_events').select('*').eq('user_id', userId);
  if (eventType) query = query.eq('event_type', eventType);
  return query.order('timestamp', { ascending: false });
}

export default supabaseClient;

