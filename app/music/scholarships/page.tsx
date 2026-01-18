import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { Coins, Users, Vote, Award, Trophy, Target, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music Education Scholarships | TradeHax AI',
  description: 'Blockchain-powered music education scholarships. Apply for funding, vote on recipients, and support the next generation of musicians.',
  openGraph: {
    title: 'Music Education Scholarships | TradeHax AI',
    description: 'Blockchain-powered music education scholarships coming soon.',
    type: 'website',
  },
};

export default function ScholarshipsPage() {
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

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-6 mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <Clock className="w-6 h-6 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">Coming Soon</span>
          </div>
          <p className="text-gray-300 text-lg">
            Our scholarship program will launch once the liquidity pool is established.
            Join the waitlist to be notified!
          </p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-6">
            Music Education Scholarships
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Democratizing music education through blockchain technology. Apply for funding,
            participate in governance, and help talented musicians achieve their dreams.
          </p>
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="scholarships-top" adFormat="horizontal" />
        </div>

        {/* Token Utility */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            L2 Token Use Cases
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <TokenUseCase
              icon={<Award />}
              title="Apply for Scholarships"
              description="Use tokens to apply for music education funding and grants"
            />
            <TokenUseCase
              icon={<Vote />}
              title="Vote on Recipients"
              description="Token holders vote on which applicants receive scholarships"
            />
            <TokenUseCase
              icon={<Coins />}
              title="Reward Contributors"
              description="Earn tokens by teaching, mentoring, and supporting the community"
            />
            <TokenUseCase
              icon={<Target />}
              title="Access Premium Lessons"
              description="Use tokens to unlock exclusive masterclasses and content"
            />
            <TokenUseCase
              icon={<Trophy />}
              title="NFT Music Releases"
              description="Purchase and collect limited edition music NFTs"
            />
            <TokenUseCase
              icon={<Users />}
              title="Community Governance"
              description="Participate in platform decisions and future development"
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How Scholarships Work
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <ProcessStep
              number="1"
              title="Application"
              description="Musicians submit scholarship applications with portfolio and goals"
            />
            <ProcessStep
              number="2"
              title="Community Review"
              description="Token holders review applications and provide feedback"
            />
            <ProcessStep
              number="3"
              title="Voting"
              description="Community votes on which applicants should receive funding"
            />
            <ProcessStep
              number="4"
              title="Distribution"
              description="Winning applicants receive tokens redeemable for lessons"
            />
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Development Roadmap
          </h2>
          
          <div className="space-y-6">
            <RoadmapItem
              phase="Phase 1"
              title="Token Launch & Liquidity Pool"
              status="In Progress"
              description="Launch L2 utility token and establish initial liquidity pool on Solana DEX"
              statusColor="yellow"
            />
            <RoadmapItem
              phase="Phase 2"
              title="Scholarship Platform Beta"
              status="Planned"
              description="Launch scholarship application and voting system with pilot program"
              statusColor="gray"
            />
            <RoadmapItem
              phase="Phase 3"
              title="DAO Governance"
              status="Future"
              description="Implement decentralized autonomous organization for community governance"
              statusColor="gray"
            />
            <RoadmapItem
              phase="Phase 4"
              title="NFT Integration"
              status="Future"
              description="Launch music NFT marketplace for artists and collectors"
              statusColor="gray"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Why Blockchain-Based Scholarships?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Benefit
              title="Transparent & Fair"
              description="All votes and decisions recorded on-chain for complete transparency"
            />
            <Benefit
              title="Community Driven"
              description="Musicians and music lovers decide who receives funding, not corporations"
            />
            <Benefit
              title="Global Access"
              description="Anyone, anywhere can apply regardless of location or background"
            />
            <Benefit
              title="Zero Middlemen"
              description="Smart contracts ensure funds go directly to recipients without intermediaries"
            />
          </div>
        </section>

        {/* Email Signup */}
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the Waitlist
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Be the first to know when scholarship applications open and receive early access
            to the token presale.
          </p>
          <EmailCapture />
        </section>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="scholarships-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function TokenUseCase({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#0366d6]/50 transition-all">
      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
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

function RoadmapItem({
  phase,
  title,
  status,
  description,
  statusColor,
}: {
  phase: string;
  title: string;
  status: string;
  description: string;
  statusColor: 'yellow' | 'gray';
}) {
  const statusColors = {
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    gray: 'bg-gray-700/20 text-gray-400 border-gray-600/30',
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[#0366d6] font-semibold text-sm">{phase}</span>
          <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[statusColor]}`}
        >
          {status}
        </span>
      </div>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function Benefit({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
