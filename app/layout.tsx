import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { MarketTicker } from "@/components/ui/MarketTicker";
import { MobileMenu } from "@/components/ui/MobileMenu";
import { WalletProvider } from "@/lib/wallet-provider";
import { ConnectWalletBtn } from "@/components/ui/ConnectWalletBtn";
import { PageTransition } from "@/components/ui/PageTransition";
import { CyberCursor } from "@/components/ui/CyberCursor";
import { GlitchText } from "@/components/ui/GlitchText";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Michael S. Flaherty | TradeHax Music & Guitar Instruction",
  description: "25+ years of experience. Rock, Blues, Jazz, Metal. High-performance 1-on-1 guitar lessons in South Jersey/Philadelphia or online via TradeHax Neural Studio.",
  openGraph: {
    title: "Michael S. Flaherty | Guitar Instructor & Musician",
    description: "25+ years of experience. Rock, Blues, Jazz, Metal. Professional lessons online or in-person.",
    url: "https://tradehax.com/about",
    siteName: "TradeHax Music",
    images: [
      {
        url: "/og-image.jpg", // Placeholder for actual social share image
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" class="dark">
      <body className={`${inter.className} bg-black antialiased`}>
        <CyberCursor />
        <WalletProvider>
          <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
            <MarketTicker />
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <div className="text-xl font-black tracking-tighter cursor-none">
                <GlitchText text="TRADEHAX" />
              </div>
              <div className="hidden md:flex gap-8 text-xs font-bold tracking-widest text-zinc-400">
                <a href="/about" className="hover:text-white transition-colors uppercase">About</a>
                <a href="/tokenomics" className="hover:text-white transition-colors uppercase">Tokenomics</a>
                <a href="/game" className="hover:text-white transition-colors uppercase">Games</a>
                <a href="#" className="hover:text-white transition-colors uppercase">Staking</a>
              </div>
              <div className="hidden md:block">
                <ConnectWalletBtn />
              </div>
              <MobileMenu />
            </div>
          </nav>
          <div className="bg-cyber-grid pt-28">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </WalletProvider>
        <footer className="py-20 border-t border-white/5 bg-black">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-black tracking-tighter mb-4">TRADEHAX</div>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                The future of automated trading and decentralized gaming on Solana.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Platform</h4>
              <ul className="text-zinc-500 text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Social</h4>
              <ul className="text-zinc-500 text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-6 mt-20 pt-8 border-t border-white/5 text-[10px] font-mono text-zinc-600 flex justify-between">
            <span>© 2024 TRADEHAX_SYSTEMS_INC.</span>
            <span>SYSTEM_STATUS: ALL_SYSTEMS_NOMINAL</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
