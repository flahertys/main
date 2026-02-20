import { AdminBehaviorDashboard } from "@/components/ai/AdminBehaviorDashboard";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI Behavior Admin",
  description: "Inspect AI navigator behavior, ingestion summaries, and persistence state.",
  path: "/admin/ai-behavior",
  keywords: ["admin", "ai behavior", "analytics", "navigator"],
});

export default function AIBehaviorAdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-24 text-slate-100">
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <section className="rounded-xl border border-cyan-500/30 bg-black/40 p-6">
          <h1 className="text-2xl font-bold text-cyan-300">AI Behavior Admin</h1>
          <p className="mt-2 text-sm text-cyan-100/80">
            This endpoint gives you visibility into AI navigator traffic, user intent patterns, and persistence status.
          </p>
        </section>

        <section className="rounded-xl border border-emerald-500/30 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-emerald-300">How to query live behavior data</h2>
          <div className="mt-3 space-y-2 text-sm text-emerald-100/85">
            <p>
              Use <code className="rounded bg-black/60 px-1.5 py-0.5">GET /api/ai/admin/behavior</code> with admin headers:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <code className="rounded bg-black/60 px-1.5 py-0.5">x-tradehax-admin-key</code> or
                <code className="ml-1 rounded bg-black/60 px-1.5 py-0.5">x-tradehax-superuser-code</code>
              </li>
              <li>
                Optional params:
                <code className="ml-1 rounded bg-black/60 px-1.5 py-0.5">windowMinutes</code>,
                <code className="ml-1 rounded bg-black/60 px-1.5 py-0.5">profileLimit</code>,
                <code className="ml-1 rounded bg-black/60 px-1.5 py-0.5">recordLimit</code>,
                <code className="ml-1 rounded bg-black/60 px-1.5 py-0.5">includePersisted</code>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-indigo-500/30 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-indigo-300">Recommended environment settings</h2>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-indigo-100/85">
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">TRADEHAX_AI_BEHAVIOR_STORAGE=supabase</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">SUPABASE_URL=...</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY=...</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">TRADEHAX_SUPABASE_AI_BEHAVIOR_TABLE=ai_behavior_events</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">TRADEHAX_AI_TRAINING_STORAGE=supabase</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">TRADEHAX_SUPABASE_AI_BENCHMARKS_TABLE=ai_training_benchmarks</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">TRADEHAX_SUPABASE_AI_PERSONALIZATION_TABLE=ai_trading_personalization_profiles</code>
            </li>
            <li>
              <code className="rounded bg-black/60 px-1.5 py-0.5">TRADEHAX_SUPABASE_AI_TRADE_OUTCOMES_TABLE=ai_trading_trade_outcomes</code>
            </li>
          </ul>
        </section>

        <AdminBehaviorDashboard />
      </main>
    </div>
  );
}
