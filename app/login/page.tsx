"use client";

import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/ai-hub";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [socialProviders, setSocialProviders] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const providers = await getProviders();
      if (!active || !providers) return;

      const enabled = Object.values(providers)
        .filter((provider) => ["google", "facebook", "twitter"].includes(provider.id))
        .map((provider) => ({ id: provider.id, name: provider.name }));

      setSocialProviders(enabled);
    })();

    return () => {
      active = false;
    };
  }, []);

  const socialLabels = useMemo(
    () =>
      new Map<string, string>([
        ["google", "Continue with Google"],
        ["facebook", "Continue with Facebook"],
        ["twitter", "Continue with X"],
      ]),
    [],
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await signIn("tradehax-credentials", {
      username,
      password,
      callbackUrl,
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError("Login failed. Please verify username and password.");
      return;
    }

    window.location.href = result.url || callbackUrl;
  };

  const onSocialSignIn = async (providerId: string) => {
    setError("");
    setSubmitting(true);
    const result = await signIn(providerId, {
      callbackUrl,
      redirect: false,
    });
    setSubmitting(false);

    if (!result || result.error) {
      setError("Social login is currently unavailable. Please try again.");
      return;
    }

    window.location.href = result.url || callbackUrl;
  };

  return (
    <main className="min-h-screen bg-black px-4 py-28 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Private portal</p>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">Account access</h1>
        <p className="mt-1 text-sm text-zinc-400">Authorized operator login only.</p>

        {socialProviders.length > 0 && (
          <div className="mt-5 space-y-2">
            {socialProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                disabled={submitting}
                onClick={() => {
                  void onSocialSignIn(provider.id);
                }}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {socialLabels.get(provider.id) || `Continue with ${provider.name}`}
              </button>
            ))}
            <p className="pt-1 text-center text-xs text-zinc-500">
              Signed-in users can manage encrypted data preferences in <a href="/account" className="text-cyan-300 hover:text-cyan-200">Account Center</a>.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-label="Private account login form">
          <label className="block text-sm text-zinc-200">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-400/60"
              autoComplete="username"
              placeholder="username"
              required
            />
          </label>

          <p className="text-xs text-zinc-500">
            Owner credentials are for private operator controls and sensitive admin actions.
          </p>

          <label className="block text-sm text-zinc-200">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-400/60"
              autoComplete="current-password"
              placeholder="password"
              required
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-medium text-zinc-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <p className="pt-1 text-center text-xs text-zinc-500">
            If you don&apos;t have access credentials, return to the main site.
          </p>
        </form>
      </div>
    </main>
  );
}
