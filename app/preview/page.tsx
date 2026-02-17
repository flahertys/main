import { SharePreviewPanel } from "@/components/preview/SharePreviewPanel";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { getSharePlatforms, primaryPreviewUrl } from "@/lib/social-preview";
import { Share2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview Link Hub | TradeHax AI",
  description:
    "Official TradeHax AI preview and share links for X, Facebook, LinkedIn, Reddit, WhatsApp, Telegram, and email.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PreviewPage() {
  const platforms = getSharePlatforms();

  return (
    <div className="min-h-screen">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <div className="inline-flex items-center gap-2 theme-chip mb-3">
            <Share2 className="h-4 w-4" />
            Social Distribution
          </div>
          <h1 className="theme-title text-3xl sm:text-4xl font-bold mb-3">
            Top-Tier Preview Link Pack
          </h1>
          <p className="theme-subtitle max-w-3xl">
            This page gives you one primary preview URL plus platform-specific share links
            with source tracking, so campaign traffic is attributed correctly.
          </p>
        </section>

        <SharePreviewPanel primaryPreviewUrl={primaryPreviewUrl} platforms={platforms} />
      </main>

      <ShamrockFooter />
    </div>
  );
}

