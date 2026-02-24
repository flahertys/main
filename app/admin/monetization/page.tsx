import { MonetizationAdminPanel } from "@/components/monetization/MonetizationAdminPanel";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createPageMetadata({
  title: "Monetization Admin | TradeHax AI",
  description:
    "Monitor launch KPIs including MRR, ARR, ARPU, subscriber count, and tier mix for TradeHax AI.",
  path: "/admin/monetization",
  robots: {
    index: false,
    follow: false,
  },
});

export default function MonetizationAdminPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Launch Ops</span>
          <h1 className="theme-title text-3xl sm:text-4xl mb-4">Monetization Metrics</h1>
          <p className="text-[#a6bdd0] max-w-3xl">
            Validate hard-launch health with recurring revenue and subscriber behavior signals.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/monetization/ai-credits"
              className="inline-flex items-center rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20"
            >
              Open AI Credits Ledger Audit
            </Link>
          </div>
        </section>
        <MonetizationAdminPanel />
      </main>
      <ShamrockFooter />
    </div>
  );
}
