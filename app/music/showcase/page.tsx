import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { ArtistShowcase } from '@/components/music/ArtistShowcase';
import { Upload, Wallet, Users, TrendingUp, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artist Showcase Platform | TradeHax AI Music',
  description: 'Musicians can showcase their talent, upload songs and videos, gain followers, and receive tips via Solana wallet integration.',
  openGraph: {
    title: 'Artist Showcase Platform | TradeHax AI Music',
    description: 'Showcase your music and grow your audience.',
    type: 'website',
  },
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/music"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Music Portal
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">Artist Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-6">
            Showcase Your Musical Talent
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Upload your songs, gain followers, and receive tips directly to your Solana wallet.
            Join our growing community of talented musicians.
          </p>
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="showcase-top" adFormat="horizontal" />
        </div>

        {/* Platform Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Platform Features
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Upload />}
              title="Upload Content"
              description="Share your songs, videos, and skill demonstrations"
            />
            <FeatureCard
              icon={<Users />}
              title="Build Following"
              description="Connect with fans and grow your audience"
            />
            <FeatureCard
              icon={<Wallet />}
              title="Tip Jar"
              description="Receive tips via Solana wallet integration"
            />
            <FeatureCard
              icon={<TrendingUp />}
              title="Analytics"
              description="Track views, plays, and engagement"
            />
          </div>
        </section>

        {/* Featured Artists */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Featured Artists
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <ArtistShowcase
              artistName="Luna Rivers"
              genre="Indie Folk"
              followers={1250}
              songs={12}
            />
            <ArtistShowcase
              artistName="The Midnight Collective"
              genre="Electronic"
              followers={2840}
              songs={24}
            />
            <ArtistShowcase
              artistName="Alex Stone"
              genre="Jazz Fusion"
              followers={890}
              songs={8}
            />
            <ArtistShowcase
              artistName="Neon Dreams"
              genre="Synthwave"
              followers={3200}
              songs={18}
            />
            <ArtistShowcase
              artistName="Sarah Melody"
              genre="Classical Piano"
              followers={1560}
              songs={15}
            />
            <ArtistShowcase
              artistName="Urban Roots"
              genre="Hip Hop"
              followers={4100}
              songs={32}
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How Artist Showcase Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <ProcessStep
              number="1"
              title="Sign Up"
              description="Create your artist profile and connect Solana wallet"
            />
            <ProcessStep
              number="2"
              title="Upload"
              description="Share your music, videos, and skill demonstrations"
            />
            <ProcessStep
              number="3"
              title="Grow"
              description="Build your following and engage with fans"
            />
            <ProcessStep
              number="4"
              title="Earn"
              description="Receive tips and support from your community"
            />
          </div>
        </section>

        {/* Become an Artist CTA */}
        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Share Your Music?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join our artist community and start building your audience today. Platform launching soon!
          </p>
          
          <div className="mb-8">
            <EmailCapture />
          </div>
          
          <p className="text-gray-400">
            Sign up to be notified when artist registration opens
          </p>
        </section>

        {/* Platform Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Artists Choose Us
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              title="No Platform Fees"
              description="Keep 90% of all tips and donations. We only take 10% to maintain the platform."
            />
            <BenefitCard
              title="Crypto Native"
              description="Built on Solana for instant, low-cost transactions. No traditional payment processing delays."
            />
            <BenefitCard
              title="Full Ownership"
              description="You own your content and your data. Export or delete your profile anytime."
            />
          </div>
        </section>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="showcase-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center hover:border-[#0366d6]/50 transition-all">
      <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-purple-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
