"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-zinc-400">
            We&apos;ve logged the error and are working on a fix.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-4 py-2 font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/30"
          >
            Reload page
          </button>
        </main>
      </body>
    </html>
  );
}
