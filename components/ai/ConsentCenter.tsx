"use client";

import { ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const CONSENT_STORAGE_KEY = "tradehax_ai_consent_v1";
const CONSENT_EVENT_NAME = "tradehax-ai-consent-updated";

type ConsentState = {
  userId: string;
  analytics: boolean;
  training: boolean;
  updatedAt?: string;
};

function createUserId() {
  return `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadLocalConsent(): ConsentState {
  if (typeof window === "undefined") {
    return {
      userId: "anonymous",
      analytics: true,
      training: false,
    };
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      return {
        userId: typeof parsed.userId === "string" && parsed.userId ? parsed.userId : createUserId(),
        analytics: parsed.analytics !== false,
        training: parsed.training === true,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined,
      };
    }
  } catch {
    // noop
  }

  return {
    userId: createUserId(),
    analytics: true,
    training: false,
  };
}

function persistLocalConsent(consent: ConsentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: consent }));
}

export function ConsentCenter() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [consent, setConsent] = useState<ConsentState>(() => loadLocalConsent());

  const summary = useMemo(() => {
    if (consent.analytics && consent.training) return "Analytics + Training enabled";
    if (consent.analytics) return "Analytics enabled, training disabled";
    return "Analytics disabled";
  }, [consent.analytics, consent.training]);

  useEffect(() => {
    const current = loadLocalConsent();
    setConsent(current);
    void (async () => {
      try {
        const res = await fetch(`/api/ai/consent?userId=${encodeURIComponent(current.userId)}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (res.ok && payload?.ok && payload?.consent) {
          const merged: ConsentState = {
            userId: String(payload.consent.userId || current.userId),
            analytics: payload.consent.analytics !== false,
            training: payload.consent.training === true,
            updatedAt: payload.consent.updatedAt,
          };
          setConsent(merged);
          persistLocalConsent(merged);
        }
      } catch {
        // Keep local defaults if request fails
      }
    })();
  }, []);

  const saveConsent = async (next: ConsentState) => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/ai/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to save consent");
      }

      const merged: ConsentState = {
        userId: String(payload.consent.userId || next.userId),
        analytics: payload.consent.analytics !== false,
        training: payload.consent.training === true,
        updatedAt: payload.consent.updatedAt,
      };
      setConsent(merged);
      persistLocalConsent(merged);
      setStatus("Saved.");
    } catch {
      setStatus("Could not save right now. Your local preference is kept.");
      persistLocalConsent(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[80]">
      {open && (
        <div className="mb-3 w-[min(92vw,360px)] rounded-xl border border-emerald-500/30 bg-black/95 p-3 shadow-[0_0_22px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">Consent Center</div>
              <div className="text-[10px] text-emerald-100/70">Control data usage preferences</div>
            </div>
            <button
              type="button"
              className="rounded p-1 text-emerald-200/80 hover:bg-emerald-500/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close consent center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs text-emerald-100/85">
            <label className="flex items-start gap-2 rounded border border-emerald-500/25 bg-emerald-500/5 p-2">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(event) => {
                  const next = { ...consent, analytics: event.target.checked, updatedAt: new Date().toISOString() };
                  if (!event.target.checked) {
                    next.training = false;
                  }
                  setConsent(next);
                  void saveConsent(next);
                }}
              />
              <span>Allow anonymized analytics for site improvement.</span>
            </label>

            <label className="flex items-start gap-2 rounded border border-cyan-500/25 bg-cyan-500/5 p-2">
              <input
                type="checkbox"
                checked={consent.training}
                disabled={!consent.analytics}
                onChange={(event) => {
                  const next = {
                    ...consent,
                    training: consent.analytics && event.target.checked,
                    updatedAt: new Date().toISOString(),
                  };
                  setConsent(next);
                  void saveConsent(next);
                }}
              />
              <span>Allow anonymized data for model training datasets.</span>
            </label>
          </div>

          <div className="mt-2 text-[10px] text-emerald-100/70">{saving ? "Saving…" : status || summary}</div>
        </div>
      )}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.22)] hover:bg-emerald-500/30"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ShieldCheck className="h-4 w-4" />
        Consent
      </button>
    </div>
  );
}

export const clientConsentKeys = {
  storage: CONSENT_STORAGE_KEY,
  event: CONSENT_EVENT_NAME,
};
