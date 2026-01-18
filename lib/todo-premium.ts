// Premium feature gating utilities
// SECURITY NOTE: This is a client-side check for UX purposes only.
// In production, all premium features MUST be validated server-side.
// Client-side checks can be bypassed, so never rely on them for security.

export function checkPremiumAccess(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for premium status (client-side only for UX)
  const isPremium = localStorage.getItem('isPremium') === 'true';
  
  // TODO: In production, validate with backend API on every request
  // Example:
  // const response = await fetch('/api/premium/verify', {
  //   headers: { 'Authorization': `Bearer ${userToken}` }
  // })
  // return response.ok && (await response.json()).isPremium
  
  return isPremium;
}

export function setPremiumStatus(status: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('isPremium', String(status));
}

export const PREMIUM_FEATURES = {
  UNLIMITED_TASKS: 'unlimited_tasks',
  CLOUD_SYNC: 'cloud_sync',
  DUE_DATES: 'due_dates',
  PRIORITY_LEVELS: 'priority_levels',
  EXPORT: 'export',
  AD_FREE: 'ad_free',
  BLOCKCHAIN_VERIFY: 'blockchain_verify'
} as const;

export function hasFeature(feature: string): boolean {
  const isPremium = checkPremiumAccess();
  
  // All features require premium except basic task management
  return isPremium || feature === 'basic';
}
