import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { EmailCaptureModal } from "@/components/monetization/EmailCaptureModal";
import { RecommendedTools } from "@/components/monetization/AffiliateBanner";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import {
  AdSenseBlock,
  FooterBannerAd,
  InContentAd,
} from "@/components/monetization/AdSenseBlock";

export default function Home() {
  return (
    <>
      <ShamrockHeader />
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
        <HeroSection />

        {/* Top Ad Placement */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <AdSenseBlock adSlot="home-top" adFormat="horizontal" />
        </section>

        <FeaturesSection />

        {/* In-Content Ad */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <InContentAd />
        </section>

        <HowItWorksSection />
        <StatsSection />

        {/* Recommended Tools Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <RecommendedTools />
        </section>

        {/* Newsletter Section */}
        <section className="py-12 md:py-16 px-4 md:px-6 bg-gradient-to-br from-[#003B00]/30 to-black/50">
          <div className="max-w-4xl mx-auto text-center px-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-3 md:mb-4">
              Stay Updated with Market Insights
            </h2>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
              Subscribe to our newsletter for the latest updates on trading
              strategies, market insights, and platform features. Join 5,000+
              smart traders!
            </p>
            <div className="max-w-md mx-auto px-2 md:px-0">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 md:p-8">
                <form className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00FF41] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-[#00D100] to-[#00FF41] text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all shadow-lg hover:shadow-[#00FF41]/50"
                  >
                    Subscribe
                  </button>
                </form>
                <p className="text-gray-500 text-xs mt-3 md:mt-4">
                  🔒 We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Ad */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <FooterBannerAd />
        </section>
      </main>

      <ShamrockFooter />

      {/* Exit-Intent Email Capture Modal */}
      <EmailCaptureModal />

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-r from-[#00D100] to-[#00FF41] p-4 shadow-lg border-t border-[#00FF41]/50">
        <a
          href="/dashboard"
          className="block w-full text-center py-3 bg-white text-[#003B00] rounded-lg font-bold hover:bg-gray-100 transition-all"
        >
          Start Trading Today →
        </a>
      </div>
    </>
  );
}
