import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { EmailCapture } from "@/components/EmailCapture";
import { AdSense } from "@/components/AdSense";
import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      
      {/* Newsletter Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-400 mb-8">
            Subscribe to our newsletter for the latest updates on trading strategies, market insights, and platform features.
          </p>
          <EmailCapture />
        </div>
      </section>

      {/* Ad Section (above footer) */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AdSense adSlot="1234567890" adFormat="auto" className="min-h-[100px]" />
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-4">
                TradeHax AI
              </div>
              <p className="text-gray-400 text-sm">
                Advanced automated trading platform powered by Solana blockchain and AI.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Documentation
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/DarkModder33/main" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@tradehaxai.tech"
                  className="flex items-center text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  support@tradehaxai.tech
                </a>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="https://github.com/DarkModder33/main" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} TradeHax AI. All rights reserved.</p>
            <p className="mt-2">Built with Next.js, Solana, and ❤️</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
