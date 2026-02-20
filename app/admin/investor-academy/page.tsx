import { InvestorAcademyAdminPanel } from "@/components/admin/InvestorAcademyAdminPanel";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "Investor Academy Admin | TradeHax AI",
  description:
    "Inspect investor academy storage mode, fallback state, and recent progress samples for operational verification.",
  path: "/admin/investor-academy",
  robots: {
    index: false,
    follow: false,
  },
});

export default function InvestorAcademyAdminPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Launch Ops</span>
          <h1 className="theme-title text-3xl sm:text-4xl mb-4">Investor Academy Diagnostics</h1>
          <p className="text-[#a6bdd0] max-w-3xl">
            Monitor live academy persistence health, detect Supabase fallback behavior, and inspect recent user progress
            snapshots before and after deployment changes.
          </p>
        </section>

        <InvestorAcademyAdminPanel />
      </main>
      <ShamrockFooter />
    </div>
  );
}
