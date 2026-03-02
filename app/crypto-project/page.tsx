import { WalletButton } from "@/components/counter/WalletButton";
import { ActionRail } from "@/components/monetization/ActionRail";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import {
    BadgeDollarSign,
    Blocks,
    Gem,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

export const metadata = createPageMetadata({
  title: "Crypto and Web3 Project | TradeHax AI",
  description:
    "Explore TradeHax AI Web3 progress, including wallet onboarding, NFT utility planning, and product roadmap updates.",
  path: "/crypto-project",
  keywords: ["web3 project", "multi-chain onboarding", "nft utility roadmap", "crypto product updates"],
});

const features = [
  {
    title: "Connect Wallet",
    text: "Securely link your crypto wallet when you want on-chain features. Optional for regular browsing.",
    icon: ShieldCheck,
  },
  {
    title: "Entry Mint",
    text: "Create your token access pass (mint) for gated tools, game rewards, and roadmap drops.",
    icon: Gem,
  },
  {
    title: "Premium Access",
    text: "Unlock premium tiers tied to subscriptions, perks, and upcoming feature releases.",
    icon: BadgeDollarSign,
  },
  {
    title: "Game + Rewards Integration",
    text: "Hyperborea rewards connect to scoring, with bonuses based on rarity and user skill progression.",
    icon: Sparkles,
  },
] as const;

export default function CryptoProjectPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Chain Project Hub</span>
          <h1 className="theme-title text-3xl sm:text-4xl font-bold mb-4">
            Crypto Project Roadmap
          </h1>
          <p className="theme-subtitle mb-6">
            Clear updates on wallet onboarding, token access, and premium utility planning tied to the broader platform.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-h-10">
              <WalletButton />
            </div>
            <TrackedCtaLink
              href="/game"
              conversionId="open_game"
              surface="crypto_project:hero"
              className="theme-cta theme-cta--secondary px-5 py-3"
            >
              Open Hyperborea
              <Blocks className="w-4 h-4" />
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/pricing"
              conversionId="open_pricing"
              surface="crypto_project:hero"
              className="theme-cta theme-cta--loud px-5 py-3"
            >
              Mint Upgrade Plans
            </TrackedCtaLink>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-600/10 px-4 py-3 text-xs text-cyan-100/90">
            <p className="font-semibold">Quick glossary</p>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="font-semibold">Mint:</span> Create your token access pass.
              </li>
              <li>
                <span className="font-semibold">Connect Wallet:</span> Securely link your crypto account.
              </li>
              <li>
                <span className="font-semibold">Utility:</span> The practical benefits tied to your token/pass.
              </li>
            </ul>
          </div>
        </section>

        <ActionRail surface="crypto_project" className="mb-8" />

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {features.map(({ title, text, icon: Icon }) => (
            <article key={title} className="theme-grid-card">
              <Icon className="w-5 h-5 text-[#79f9a9]" />
              <h2 className="text-lg font-semibold">{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="theme-panel p-6 sm:p-8">
          <h2 className="theme-title text-2xl font-bold mb-4">
            Project Notes
          </h2>
          <ul className="space-y-3 text-sm sm:text-base text-[#c4d2e9] mb-5">
            <li>Wallet features remain optional and are introduced only when relevant.</li>
            <li>Token access is designed to support service value, not add friction.</li>
            <li>We track conversion from game activity, mint actions, and bookings.</li>
          </ul>

          <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">Advanced implementation notes</summary>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#c4d2e9]">
              <li>Keep mint APIs behind secure environment variables and server-side validation.</li>
              <li>Route wallet-connected users into relevant service and subscription offers when features are live.</li>
              <li>Apply analytics across game sessions, mint actions, and booking submissions for optimization.</li>
            </ul>
          </details>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
