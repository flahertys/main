"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CardData {
  title: string;
  description: string;
  tag: string;
  href: string;
  accentLineClass: string;
  glowClass: string;
  tagClass: string;
  ctaClass: string;
}

const cards: CardData[] = [
  {
    title: "Hyperborea",
    description:
      "Explore a 3D blockchain-powered game world. Earn rewards, collect NFTs, and compete in a decentralized gaming ecosystem built for modern chains.",
    tag: "Game",
    href: "/game",
    accentLineClass: "bg-gradient-to-r from-transparent via-cyan-400 to-transparent",
    glowClass: "bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_70%)]",
    tagClass: "text-cyan-200 border-cyan-300/30 bg-cyan-400/10",
    ctaClass: "text-cyan-200",
  },
  {
    title: "NFT Collection",
    description:
      "Mint exclusive in-game assets and trading avatars. Each NFT unlocks unique abilities, premium features, and community governance rights.",
    tag: "NFT",
    href: "/game",
    accentLineClass: "bg-gradient-to-r from-transparent via-violet-400 to-transparent",
    glowClass: "bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.12),transparent_70%)]",
    tagClass: "text-violet-200 border-violet-300/30 bg-violet-400/10",
    ctaClass: "text-violet-200",
  },
  {
    title: "AI Predictions",
    description:
      "Access real-time AI-driven market predictions and sentiment analysis. Our models process millions of data points to surface actionable insights.",
    tag: "AI",
    href: "/dashboard",
    accentLineClass: "bg-gradient-to-r from-transparent via-blue-400 to-transparent",
    glowClass: "bg-[radial-gradient(ellipse_at_top,rgba(96,165,250,0.12),transparent_70%)]",
    tagClass: "text-blue-200 border-blue-300/30 bg-blue-400/10",
    ctaClass: "text-blue-200",
  },
];

function NFTCard({ card }: { card: CardData }) {
  return (
    <Link href={card.href} className="group block">
      <div className="relative h-full rounded-2xl border border-white/[0.06] bg-[#111111]/80 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_0_40px_rgba(0,0,0,0.3)]">
        {/* Top accent line */}
        <div className={`h-px w-full opacity-40 group-hover:opacity-80 transition-opacity duration-500 ${card.accentLineClass}`} />

        {/* Hover glow */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${card.glowClass}`} />

        <div className="relative p-6 sm:p-8">
          {/* Tag */}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-5 sm:mb-6 border ${card.tagClass}`}>
            {card.tag}
          </span>

          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-gray-100 transition-colors">
            {card.title}
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {card.description}
          </p>

          {/* CTA */}
          <div className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 group-hover:gap-3 ${card.ctaClass}`}>
            Explore
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function GamingNFTSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-[#050505] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[#8B5CF6] text-sm font-medium uppercase tracking-widest mb-3">
            Explore
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Gaming, NFTs &{" "}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00F0FF] text-transparent bg-clip-text">
              AI
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Discover the intersection of blockchain gaming, digital collectibles,
            and artificial intelligence across interoperable ecosystems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <NFTCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
