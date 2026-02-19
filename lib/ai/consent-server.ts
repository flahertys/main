import { getPersistedUserConsent } from "@/lib/ai/behavior-persistence";
import { getInMemoryConsent } from "@/lib/ai/consent";
import { sanitizePlainText } from "@/lib/security";

type ConsentInput = {
  analytics?: boolean;
  training?: boolean;
};

export async function resolveServerConsent(userId: string | undefined, input?: ConsentInput) {
  const normalized = sanitizePlainText(String(userId || "anonymous"), 128).toLowerCase() || "anonymous";

  if (typeof input?.analytics === "boolean" || typeof input?.training === "boolean") {
    return {
      userId: normalized,
      analytics: input.analytics !== false,
      training: input.training === true,
    };
  }

  const inMemory = getInMemoryConsent(normalized);
  try {
    const persisted = await getPersistedUserConsent(inMemory.userId);
    if (persisted) {
      return {
        userId: persisted.user_key,
        analytics: persisted.analytics_consent,
        training: persisted.training_consent,
      };
    }
  } catch {
    // fall back to in-memory defaults
  }

  return {
    userId: inMemory.userId,
    analytics: inMemory.analytics,
    training: inMemory.training,
  };
}
