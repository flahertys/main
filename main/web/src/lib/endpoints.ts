export const API_ENDPOINTS = {
  AI_CHAT: '/api/ai/chat',
  AI_CHAT_LEGACY: '/api/chat',
  AI_HEALTH: '/api/ai/health',
  AI_TELEMETRY: '/api/ai/telemetry',
  STRIPE_WEBHOOK: '/api/webhooks/stripe',
  STRIPE_WEBHOOK_DISCORD: '/api/webhooks/stripe?channel=discord',
  STRIPE_WEBHOOK_TELEGRAM: '/api/webhooks/stripe?channel=telegram',
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

