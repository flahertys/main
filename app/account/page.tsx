"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type AccountProfile = {
  userId: string;
  displayName: string;
  profileNotes: string;
  favoriteSymbols: string[];
  preferredTimeframes: string[];
  macroInterests: string[];
  llmContext: string;
  consent: {
    allowLlmTraining: boolean;
    allowPersonalization: boolean;
    updatedAt: string;
  };
  updatedAt: string;
};

const EMPTY_PROFILE: AccountProfile = {
  userId: "",
  displayName: "",
  profileNotes: "",
  favoriteSymbols: [],
  preferredTimeframes: [],
  macroInterests: [],
  llmContext: "",
  consent: {
    allowLlmTraining: false,
    allowPersonalization: true,
    updatedAt: new Date(0).toISOString(),
  },
  updatedAt: new Date(0).toISOString(),
};

function splitCsv(value: string, upper = false) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const normalized = upper ? items.map((item) => item.toUpperCase()) : items;
  return Array.from(new Set(normalized));
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<AccountProfile>(EMPTY_PROFILE);

  const [displayName, setDisplayName] = useState("");
  const [profileNotes, setProfileNotes] = useState("");
  const [favoriteSymbols, setFavoriteSymbols] = useState("");
  const [preferredTimeframes, setPreferredTimeframes] = useState("");
  const [macroInterests, setMacroInterests] = useState("");
  const [llmContext, setLlmContext] = useState("");
  const [allowLlmTraining, setAllowLlmTraining] = useState(false);
  const [allowPersonalization, setAllowPersonalization] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const response = await fetch("/api/account/profile", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok?: boolean;
          error?: string;
          profile?: AccountProfile;
        };

        if (!response.ok || !payload?.ok || !payload.profile) {
          throw new Error(payload?.error || "Unable to load account profile.");
        }

        if (!active) return;

        setProfile(payload.profile);
        setDisplayName(payload.profile.displayName || "");
        setProfileNotes(payload.profile.profileNotes || "");
        setFavoriteSymbols(payload.profile.favoriteSymbols.join(", "));
        setPreferredTimeframes(payload.profile.preferredTimeframes.join(", "));
        setMacroInterests(payload.profile.macroInterests.join(", "));
        setLlmContext(payload.profile.llmContext || "");
        setAllowLlmTraining(Boolean(payload.profile.consent.allowLlmTraining));
        setAllowPersonalization(Boolean(payload.profile.consent.allowPersonalization));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load account profile.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [status]);

  const consentSummary = useMemo(() => {
    if (!allowPersonalization && !allowLlmTraining) return "Storage only";
    if (allowPersonalization && !allowLlmTraining) return "Personalization only";
    if (!allowPersonalization && allowLlmTraining) return "Training only";
    return "Personalization + training";
  }, [allowLlmTraining, allowPersonalization]);

  const saveProfile = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          profileNotes,
          favoriteSymbols: splitCsv(favoriteSymbols, true),
          preferredTimeframes: splitCsv(preferredTimeframes),
          macroInterests: splitCsv(macroInterests, true),
          llmContext,
          consent: {
            allowLlmTraining,
            allowPersonalization,
          },
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        profile?: AccountProfile;
      };

      if (!response.ok || !payload?.ok || !payload.profile) {
        throw new Error(payload?.error || "Unable to save account profile.");
      }

      setProfile(payload.profile);
      setSuccess("Profile and consent settings saved securely.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save account profile.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-black px-4 py-28 sm:px-6">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-950/90 p-6 text-sm text-zinc-300">
          Loading account center...
        </div>
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="min-h-screen bg-black px-4 py-28 sm:px-6">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Account center</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Privacy & data controls</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to manage encrypted account data, consent settings, and personalization controls.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void signIn(undefined, { callbackUrl: "/account" });
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/15"
            >
              Sign in
            </button>
            <a
              href="/portal"
              className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/15"
            >
              Operator portal
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-28 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <section className="rounded-2xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Account center</p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Privacy-first profile controls</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Sleek defaults for beginners, advanced depth for power users — all encrypted at rest.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void signOut({ callbackUrl: "/" });
              }}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wide text-cyan-200">Encryption</p>
              <p className="mt-1 text-sm text-cyan-100">AES-256-GCM at rest</p>
            </div>
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wide text-emerald-200">Consent mode</p>
              <p className="mt-1 text-sm text-emerald-100">{consentSummary}</p>
            </div>
            <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wide text-fuchsia-200">Account</p>
              <p className="mt-1 text-sm text-fuchsia-100 break-all">{profile.userId || session?.user?.email || "Signed in user"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/90 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-zinc-300">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value.slice(0, 80))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400/60"
                placeholder="How the assistant should address you"
              />
            </label>

            <label className="text-sm text-zinc-300">
              Favorite symbols (comma separated)
              <input
                value={favoriteSymbols}
                onChange={(event) => setFavoriteSymbols(event.target.value.slice(0, 500))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400/60"
                placeholder="BTC, ETH, SOL"
              />
            </label>

            <label className="text-sm text-zinc-300">
              Preferred timeframes
              <input
                value={preferredTimeframes}
                onChange={(event) => setPreferredTimeframes(event.target.value.slice(0, 500))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400/60"
                placeholder="15m, 1h, 4h"
              />
            </label>

            <label className="text-sm text-zinc-300">
              Macro interests
              <input
                value={macroInterests}
                onChange={(event) => setMacroInterests(event.target.value.slice(0, 500))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400/60"
                placeholder="CPI, DXY, US10Y"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm text-zinc-300">
            Profile notes
            <textarea
              value={profileNotes}
              onChange={(event) => setProfileNotes(event.target.value.slice(0, 1600))}
              rows={4}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400/60"
              placeholder="How you trade, what to avoid, your goals, your style..."
            />
          </label>

          <label className="mt-4 block text-sm text-zinc-300">
            LLM context (private)
            <textarea
              value={llmContext}
              onChange={(event) => setLlmContext(event.target.value.slice(0, 4000))}
              rows={5}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400/60"
              placeholder="Persistent context for personalized responses and workflow quality."
            />
          </label>

          <div id="consent-controls" className="mt-5 grid gap-3 md:grid-cols-2 scroll-mt-32">
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={allowPersonalization}
                onChange={(event) => setAllowPersonalization(event.target.checked)}
                className="mt-1"
              />
              <span>
                <strong className="text-zinc-100">Allow personalization</strong>
                <span className="mt-0.5 block text-xs text-zinc-400">Use my profile data to tailor responses and workflow defaults.</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={allowLlmTraining}
                onChange={(event) => setAllowLlmTraining(event.target.checked)}
                className="mt-1"
              />
              <span>
                <strong className="text-zinc-100">Allow training usage</strong>
                <span className="mt-0.5 block text-xs text-zinc-400">Allow your data to improve your account-linked model behavior.</span>
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
          )}
          {success && (
            <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void saveProfile();
              }}
              disabled={saving || loading}
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save securely"}
            </button>
            <span className="text-xs text-zinc-500">
              Last updated: {profile.updatedAt && profile.updatedAt !== new Date(0).toISOString() ? new Date(profile.updatedAt).toLocaleString() : "Not yet"}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
