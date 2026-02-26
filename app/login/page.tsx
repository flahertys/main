"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/ai-hub";

  const [username, setUsername] = useState("tradehax-admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-28 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-cyan-500/25 bg-black/55 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
        <h1 className="text-2xl font-bold text-cyan-200">TradeHax Login</h1>
        <p className="mt-2 text-sm text-zinc-300">Sign in to unlock account-bound features and personalized AI behavior profiling.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-zinc-200">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-cyan-500/30 bg-black/60 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-300/60"
              autoComplete="username"
              required
            />
          </label>

          <label className="block text-sm text-zinc-200">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-lg border border-cyan-500/30 bg-black/60 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-300/60"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
