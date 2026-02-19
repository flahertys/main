import { sanitizePlainText } from "@/lib/security";

export type AIConsentRecord = {
  userId: string;
  analytics: boolean;
  training: boolean;
  updatedAt: string;
};

export const DEFAULT_AI_CONSENT: AIConsentRecord = {
  userId: "anonymous",
  analytics: true,
  training: false,
  updatedAt: new Date(0).toISOString(),
};

export function normalizeConsentInput(input: Partial<AIConsentRecord> & { userId?: string }) {
  const userId = sanitizePlainText(String(input.userId || "anonymous"), 128).toLowerCase() || "anonymous";
  return {
    userId,
    analytics: input.analytics !== false,
    training: input.training === true,
    updatedAt: new Date().toISOString(),
  } satisfies AIConsentRecord;
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_AI_CONSENT_STORE__?: Map<string, AIConsentRecord>;
  };
  if (!globalRef.__TRADEHAX_AI_CONSENT_STORE__) {
    globalRef.__TRADEHAX_AI_CONSENT_STORE__ = new Map<string, AIConsentRecord>();
  }
  return globalRef.__TRADEHAX_AI_CONSENT_STORE__;
}

export function getInMemoryConsent(userId: string) {
  const key = sanitizePlainText(userId, 128).toLowerCase() || "anonymous";
  return getStore().get(key) || { ...DEFAULT_AI_CONSENT, userId: key };
}

export function setInMemoryConsent(input: Partial<AIConsentRecord> & { userId?: string }) {
  const normalized = normalizeConsentInput(input);
  getStore().set(normalized.userId, normalized);
  return normalized;
}
