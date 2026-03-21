import { createClient } from "@supabase/supabase-js";

const env = typeof import.meta !== "undefined" ? (import.meta as any).env || {} : {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabaseConfigured = !!supabaseUrl && !!supabasePublishableKey;

if (!supabaseConfigured) {
  // Fail-open for client boot: keep app rendering even when Supabase env is absent.
  console.warn(
    "[supabaseClient] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Running with telemetry disabled."
  );
}

export const supabaseClient = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

async function unavailable() {
  return { data: null, error: new Error("Supabase client is not configured") };
}

// --- Supabase Utility Functions for All Domains ---

// Guitar Lessons
export async function getGuitarLessons() {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('guitar_lessons').select('*').order('lesson_id');
}
export async function getUserGuitarProgress(userId: string) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('user_guitar_progress').select('*').eq('user_id', userId);
}
export async function upsertUserGuitarProgress(progress: any) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('user_guitar_progress').upsert(progress);
}

// Trading Activity & Portfolios
export async function logUserTradingActivity(activity: any) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('user_trading_activity').insert(activity);
}
export async function getUserTradingActivity(userId: string) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('user_trading_activity').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
}
export async function getUserPortfolio(userId: string) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('user_portfolios').select('*').eq('user_id', userId).single();
}
export async function upsertUserPortfolio(portfolio: any) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('user_portfolios').upsert(portfolio);
}

// Neural Hub / AI / LLM
export async function logAIInteraction(interaction: any) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('ai_interactions').insert(interaction);
}
export async function getAIInteractions(userId: string, sessionId?: string) {
  if (!supabaseClient) return unavailable();
  let query = supabaseClient.from('ai_interactions').select('*').eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  return query.order('timestamp', { ascending: false });
}
export async function logAIFeedback(feedback: any) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('ai_feedback').insert(feedback);
}
export async function getAIFeedback(userId: string, sessionId?: string) {
  if (!supabaseClient) return unavailable();
  let query = supabaseClient.from('ai_feedback').select('*').eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  return query.order('created_at', { ascending: false });
}

// Analytics & Events
export async function logSiteEvent(event: any) {
  if (!supabaseClient) return unavailable();
  return supabaseClient.from('site_events').insert(event);
}
export async function getSiteEvents(userId: string, eventType?: string) {
  if (!supabaseClient) return unavailable();
  let query = supabaseClient.from('site_events').select('*').eq('user_id', userId);
  if (eventType) query = query.eq('event_type', eventType);
  return query.order('timestamp', { ascending: false });
}

export default supabaseClient;
