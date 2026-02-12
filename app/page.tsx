import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { GamingNFTSection } from "@/components/landing/GamingNFTSection";
import { EmailCaptureModal } from "@/components/monetization/EmailCaptureModal";
import { RecommendedTools } from "@/components/monetization/AffiliateBanner";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { AdSenseBlock, FooterBannerAd, InContentAd } from "@/components/monetization/AdSenseBlock";

export default function Home() {
  return (
    <>
      <ShamrockHeader />
      <main className="min-h-screen bg-[#050505]">
        <HeroSection />

        <FeaturesSection />

        {/* Subtle ad placement */}
        <section className="max-w-7xl mx-auto px-6 py-4">
          <InContentAd />
        </section>

        <HowItWorksSection />

        <StatsSection />

        <GamingNFTSection />

        {/* Recommended Tools */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <RecommendedTools />
        </section>

        {/* Newsletter Section */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0A0A0A] to-black pointer-events-none" />
          <div className="relative max-w-3xl mx-auto text-center">
            <p className="text-[#00F0FF] text-sm font-medium uppercase tracking-widest mb-3">
              Stay Updated
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Market insights,{" "}
              <span className="bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] text-transparent bg-clip-text">
                delivered
              </span>
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Subscribe for the latest trading strategies, AI updates, and
              platform features. Join 5,000+ smart traders.
            </p>
            <div className="max-w-md mx-auto">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-5 py-3.5 bg-[#111111] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/50 focus:border-[#00F0FF]/30 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#00F0FF] text-black rounded-xl font-semibold hover:bg-[#00d4e0] transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-gray-700 text-xs mt-4">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Ad */}
        <section className="max-w-7xl mx-auto px-6 py-4">
          <FooterBannerAd />
        </section>
      </main>

      <ShamrockFooter />

      {/* Exit-Intent Email Capture Modal */}
      <EmailCaptureModal />

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-black/90 backdrop-blur-xl p-4 border-t border-white/[0.06]">
        <a
          href="/dashboard"
          className="block w-full text-center py-3.5 bg-[#00F0FF] text-black rounded-xl font-bold hover:bg-[#00d4e0] transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
        >
          Start Trading
        </a>
      </div>
    </>
  );
}
