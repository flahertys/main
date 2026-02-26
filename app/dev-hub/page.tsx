import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import { Code2, KeyRound, Route, ShieldCheck, TerminalSquare, Webhook } from "lucide-react";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: "TradeHax Dev Hub - API, Integrations, and Automation",
  description:
    "Developer workspace for TradeHax integrations: API setup, endpoint references, webhook workflows, and deployment preflight.",
  path: "/dev-hub",
  keywords: ["tradehax api", "developer hub", "webhooks", "automation", "ai integration"],
});

export default function DevHubPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950">
      <ShamrockHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-600/10 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-black/25 px-3 py-1 text-xs font-semibold text-indigo-100">
            <Code2 className="h-3.5 w-3.5" />
            Developer Workspace
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">TradeHax Dev Hub</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            This area is designed for builders connecting TradeHax to custom products, bots, and internal systems.
            If you just want AI guidance, use the beginner-first <Link href="/ai-hub" className="underline underline-offset-2">AI Hub</Link>.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/ai-hub"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Back to AI Hub
            </Link>
            <Link
              href="/api"
              className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30"
            >
              Open API Routes
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DevCard
            icon={<KeyRound className="h-4 w-4" />}
            title="Auth + API Keys"
            description="Set up credentials, validate secrets, and keep least-privilege defaults for production safety."
            href="/settings"
            cta="Open settings"
          />
          <DevCard
            icon={<Route className="h-4 w-4" />}
            title="Endpoint Surface"
            description="Inspect chat, generation, image, and market endpoints before wiring SDKs or custom clients."
            href="/api"
            cta="Review endpoints"
          />
          <DevCard
            icon={<Webhook className="h-4 w-4" />}
            title="Webhook Flows"
            description="Design event-driven workflows for notifications, strategy triggers, and post-processing jobs."
            href="/docs"
            cta="View docs"
          />
          <DevCard
            icon={<TerminalSquare className="h-4 w-4" />}
            title="Preflight Checks"
            description="Run lint, type-check, and deployment checks before shipping changes to preview or production."
            href="/docs"
            cta="Deployment guide"
          />
          <DevCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Runtime Safety"
            description="Use standard lane defaults for user-facing flows and gate high-risk options with explicit confirmation."
            href="/ai-hub"
            cta="Safety controls"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-500/25 bg-emerald-600/10 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-emerald-100">API key helper (soft-gated)</h2>
          <p className="mt-1 text-xs text-emerald-100/80">
            You can explore routes without all credentials. Production deploy should only proceed after required keys are set.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <details className="rounded-lg border border-white/15 bg-black/25 p-3" open>
              <summary className="cursor-pointer text-sm font-semibold text-white">Core AI runtime keys</summary>
              <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                <li>• OPENROUTER_API_KEY</li>
                <li>• NEXT_PUBLIC_APP_URL</li>
                <li>• NEXTAUTH_SECRET</li>
              </ul>
            </details>

            <details className="rounded-lg border border-white/15 bg-black/25 p-3" open>
              <summary className="cursor-pointer text-sm font-semibold text-white">Optional social connectors</summary>
              <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                <li>• FACEBOOK_APP_ID / FACEBOOK_APP_SECRET</li>
                <li>• LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET</li>
                <li>• REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET</li>
                <li>• DISCORD_BOT_TOKEN</li>
              </ul>
            </details>
          </div>

          <div className="mt-4 rounded-lg border border-indigo-400/25 bg-indigo-500/10 p-3 text-xs text-indigo-100/90">
            <p className="font-semibold">Setup source of truth</p>
            <p className="mt-1">
              Use <span className="font-mono">AI_ENVIRONMENT_TEMPLATE.env</span> as your baseline template and then map values
              to <span className="font-mono">.env.local</span> and your hosting environment variables.
            </p>
          </div>
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function DevCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-md border border-indigo-300/35 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/20"
      >
        {cta}
      </Link>
    </div>
  );
}
