import { AICreditsLedgerAdminPanel } from "@/components/admin/AICreditsLedgerAdminPanel";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "AI Credits Ledger Admin | TradeHax AI",
  description:
    "Inspect per-user AI credit purchases and spend events in real time for billing support and auditing.",
  path: "/admin/monetization/ai-credits",
  robots: {
    index: false,
    follow: false,
  },
});

export default function AICreditsLedgerAdminPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Launch Ops</span>
          <h1 className="theme-title text-3xl sm:text-4xl mb-4">AI Credits Ledger</h1>
          <p className="text-[#a6bdd0] max-w-3xl">
            Real-time ledger view for per-user AI credit purchase/spend history. Useful for billing support,
            dispute checks, and audit trails.
          </p>
        </section>

        <AICreditsLedgerAdminPanel />
      </main>
      <ShamrockFooter />
    </div>
  );
}
