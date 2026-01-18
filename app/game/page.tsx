import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { PremiumUpgrade } from '@/components/monetization/PremiumUpgrade';
import { Gamepad2, Trophy, Star, Zap } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hyperborea Game - Play & Earn Crypto | TradeHax AI',
  description: 'Play Hyperborea, an exciting browser-based game with NFT integration and crypto rewards. Compete on leaderboards and unlock exclusive achievements.',
  openGraph: {
    title: 'Hyperborea Game - Play & Earn',
    description: 'Play and earn crypto rewards with Hyperborea game.',
    type: 'website',
  },
};

export default function GamePage() {
  const handlePlayClick = () => {
    trackEvent.gameStart();
    // In production, this would load the actual game
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4" />
            BETA VERSION - PLAY NOW!
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text mb-6">
            Hyperborea
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the ultimate browser-based adventure game with blockchain integration.
            Play, compete, and earn exclusive NFT rewards!
          </p>
          
          <button
            onClick={handlePlayClick}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105 inline-flex items-center gap-3"
          >
            <Gamepad2 className="w-6 h-6" />
            Play Now (Free)
          </button>
        </div>

        {/* Ad Placement */}
        <div className="mb-12">
          <AdSenseBlock adSlot="game-top" adFormat="horizontal" />
        </div>

        {/* Game Container Placeholder */}
        <div className="bg-gray-900/50 border-2 border-purple-500/30 rounded-xl p-8 mb-12 min-h-[600px] flex items-center justify-center">
          <div className="text-center">
            <Gamepad2 className="w-24 h-24 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Game Loading...
            </h2>
            <p className="text-gray-400 mb-6">
              The Hyperborea game will be integrated here. In production, this area would contain the actual game canvas.
            </p>
            <div className="inline-flex items-center gap-2 text-purple-400">
              <Zap className="w-5 h-5 animate-pulse" />
              <span>Preparing game assets...</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Compete & Win"
            description="Climb the leaderboards and compete with players worldwide for exclusive rewards."
          />
          <FeatureCard
            icon={<Star className="w-8 h-8" />}
            title="NFT Achievements"
            description="Earn unique NFT achievements that can be traded or showcased in your collection."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Power-Ups"
            description="Unlock powerful abilities and premium features to enhance your gameplay."
          />
        </div>

        {/* Premium Upgrade Section */}
        <div className="mb-12">
          <PremiumUpgrade />
        </div>

        {/* Game Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">About Hyperborea</h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Free Tier</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>3 lives per session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Access to basic levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Standard achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-1">✗</span>
                  <span className="text-gray-500">Ad-supported gameplay</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Premium ($4.99)</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Unlimited lives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>All levels + bonus content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Exclusive NFT achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Ad-free experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="game-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center hover:border-purple-500/30 transition-all">
      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
