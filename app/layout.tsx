import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

import { MarketTicker } from "@/components/ui/MarketTicker";
import { MobileMenu } from "@/components/ui/MobileMenu";
import { WalletProvider } from "@/lib/wallet-provider";
import { ConnectWalletBtn } from "@/components/ui/ConnectWalletBtn";
import { PageTransition } from "@/components/ui/PageTransition";
import { CyberCursor } from "@/components/ui/CyberCursor";
import { GlitchText } from "@/components/ui/GlitchText";
import { businessProfile } from "@/lib/business-profile";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06b6d4" },
    { media: "(prefers-color-scheme: light)", color: "#06b6d4" },
  ],
};

export const metadata: Metadata = {
  title: "TradeHax AI | Digital Services, Repair, Music Lessons, and Web3",
  description: "Professional services for websites, apps, device repair, music lessons, and Web3 consulting for local and remote clients.",
  keywords: [
    "web development philadelphia",
    "app development services",
    "computer repair philadelphia",
    "cell phone repair south jersey",
    "online guitar lessons",
    "solana development services",
    "blockchain consulting",
    "website design for small business",
    "device repair",
    "guitar lessons",
    "digital services",
    "Philadelphia",
    "Greater Philadelphia",
  ],
  authors: [{ name: "TradeHax AI" }],
  creator: "TradeHax AI",
  publisher: "TradeHax AI",
  metadataBase: new URL("https://tradehax.net"),
  alternates: {
    canonical: "https://tradehax.net",
  },
  openGraph: {
    title: "TradeHax AI | Digital Services, Repair, Music Lessons, and Web3",
    description: "Customer-first services for websites, apps, device repair, music lessons, and Web3 consulting for local and remote clients.",
    url: "https://tradehax.net",
    siteName: "TradeHax AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TradeHax AI services for web development, repair, music, and Web3",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeHax AI | Professional Digital and Local Service Support",
    description: "Book web development, repair, lessons, and Web3 services with a clear service path and fast response.",
    images: ["/og-image.jpg"],
    creator: "@tradehaxai",
    site: "@tradehaxai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const safeGaMeasurementId =
    gaMeasurementId && /^G-[A-Z0-9]+$/.test(gaMeasurementId) ? gaMeasurementId : null;

  return (
    <html lang="en" className="dark">
      <head>
        {safeGaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${safeGaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${safeGaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
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
                <a href="/music" className="hover:text-white transition-colors uppercase">Music</a>
                <a href="/tokenomics" className="hover:text-white transition-colors uppercase">Tokenomics</a>
                <a href="/game" className="hover:text-white transition-colors uppercase">Games</a>
                <a href="https://calendar.google.com/calendar/embed?src=40882fe82e5e28335d1c2cd7682e70419af64178afd29e3f81395fb43a7c253d%40group.calendar.google.com&ctz=America%2FNew_York" className="text-cyan-500 hover:text-white transition-colors uppercase">Lessons</a>
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
        <Toaster position="bottom-right" theme="dark" closeButton />
        <Analytics />
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
                <li><a href="/services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="/portfolio" className="hover:text-white transition-colors">Portfolio</a></li>
                <li><a href="https://calendar.google.com/calendar/embed?src=40882fe82e5e28335d1c2cd7682e70419af64178afd29e3f81395fb43a7c253d%40group.calendar.google.com&ctz=America%2FNew_York" className="hover:text-white transition-colors">Book Lessons</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Social</h4>
              <ul className="text-zinc-500 text-sm space-y-2">
                <li><a href={businessProfile.socialLinks.x} className="hover:text-white transition-colors">Twitter / X</a></li>
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
