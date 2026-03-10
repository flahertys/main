import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

import { SiteNavigatorWidget } from "@/components/ai/SiteNavigatorWidget";
import { ChainSessionProvider } from "@/components/counter/provider/ChainSession";
import { GamifiedOnboarding } from "@/components/onboarding/GamifiedOnboarding";
import { HyperboreaIntroOverlay } from "@/components/intro/HyperboreaIntroOverlay";
import { WebVitalsReporter } from "@/components/performance/WebVitalsReporter";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CinematicFxLayer } from "@/components/ui/CinematicFxLayer";
import { ConnectWalletBtn } from "@/components/ui/ConnectWalletBtn";
import { CyberCursor } from "@/components/ui/CyberCursor";
import { GlitchText } from "@/components/ui/GlitchText";
import { MarketTicker } from "@/components/ui/MarketTicker";
import { MobileMenu } from "@/components/ui/MobileMenu";
import { PageTransition } from "@/components/ui/PageTransition";
import { PrefetchController } from "@/components/ui/PrefetchController";
import { ServiceWorkerCleanup } from "@/components/ui/ServiceWorkerCleanup";
import { scheduleLinks } from "@/lib/booking";
import { businessProfile } from "@/lib/business-profile";
import { getLocalBusinessJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { WalletProvider } from "@/lib/wallet-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
    "multi-chain development services",
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
  metadataBase: new URL(siteConfig.primarySiteUrl),
  alternates: {
    canonical: siteConfig.primarySiteUrl,
  },
  openGraph: {
    title: "TradeHax AI | Digital Services, Repair, Music Lessons, and Web3",
    description: "Customer-first services for websites, apps, device repair, music lessons, and Web3 consulting for local and remote clients.",
    url: siteConfig.primarySiteUrl,
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = getLocalBusinessJsonLd();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const safeGaMeasurementId =
    gaMeasurementId && /^G-[A-Z0-9]+$/.test(gaMeasurementId) ? gaMeasurementId : null;
  const cashAppLink = businessProfile.contactLinks.cashApp;
  const supportMessage = businessProfile.supportMessage;
  const buyMeACoffeeLink = businessProfile.contactLinks.buyMeACoffee;

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to Google Fonts and CDN origins to reduce latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS-prefetch for analytics and other third-party origins */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <Script id="tradehax-localbusiness-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(localBusinessJsonLd)}
        </Script>
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
        <WebVitalsReporter />
        <a
          href="#global-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:border focus:border-cyan-300/70 focus:bg-black focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-wider focus:text-cyan-100"
        >
          Skip to content
        </a>
        <AuthProvider>
          <ServiceWorkerCleanup />
          <PrefetchController />
          <CinematicFxLayer />
          <CyberCursor />
          <HyperboreaIntroOverlay />
          <ChainSessionProvider>
            <WalletProvider>
              <nav
                id="global-top-nav"
                aria-label="Primary"
                className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5"
              >
                <MarketTicker />
                <div className="layout-shell container mx-auto h-16 flex items-center justify-between gap-3 sm:gap-4">
                  <div className="text-xl font-black tracking-tighter cursor-none">
                    <GlitchText text="TRADEHAX" />
                  </div>
                  <div className="hidden md:flex gap-8 text-xs font-bold tracking-widest text-zinc-400">
                    <Link
                      href="/ai-hub"
                      className="rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-1 text-cyan-200 hover:bg-cyan-500/25 hover:text-white transition-colors uppercase"
                    >
                      AI Hub
                    </Link>
                    <Link href="/about" className="hover:text-white transition-colors uppercase">About</Link>
                    <Link href="/music" className="hover:text-white transition-colors uppercase">Music</Link>
                    <Link href="/intelligence" className="hover:text-white transition-colors uppercase">Intelligence</Link>
                    <Link href="/billing" className="hover:text-white transition-colors uppercase">Billing</Link>
                    <Link href="/tokenomics" className="hover:text-white transition-colors uppercase">Tokenomics</Link>
                    <Link href="/games" className="hover:text-white transition-colors uppercase">Games</Link>
                    <a href={scheduleLinks.guitarLessons} className="text-cyan-500 hover:text-white transition-colors uppercase">Lessons</a>
                    <Link href="/tokenomics" className="hover:text-white transition-colors uppercase">Staking</Link>
                  </div>
                  <div className="hidden md:block">
                    <ConnectWalletBtn />
                  </div>
                  <MobileMenu />
                </div>
              </nav>
              <main id="global-main-content" role="main" className="bg-cyber-grid pt-24 sm:pt-28">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              <a
                href="/ai-hub"
                aria-label="Open AI Hub quick launch"
                className="fixed bottom-4 left-3 z-40 hidden sm:inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-cyan-100 shadow-[0_0_24px_rgba(6,182,212,0.35)] transition-all hover:bg-cyan-500/30 hover:text-white md:bottom-8 md:left-8"
              >
                <span aria-hidden>⚡</span>
                <span>AI Quick Launch</span>
              </a>
              <SiteNavigatorWidget />
              <GamifiedOnboarding />
            </WalletProvider>
          </ChainSessionProvider>
          <Toaster position="bottom-right" theme="dark" closeButton />
          <Analytics />
          <footer className="py-14 sm:py-20 border-t border-white/5 bg-black">
            <div className="layout-shell container mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12">
              <div className="col-span-1 md:col-span-2">
                <div className="text-2xl font-black tracking-tighter mb-4">TRADEHAX</div>
                <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                  The future of automated trading and decentralized gaming across modern chains.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={businessProfile.contactLinks.email}
                    className="inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-bold tracking-wide text-cyan-300 transition-colors hover:bg-cyan-500/20 hover:text-cyan-200"
                  >
                    Email: {businessProfile.contactEmail}
                  </a>
                  <a
                    href={cashAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold tracking-wide text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-200"
                  >
                    Support via CashApp
                  </a>
                  <a
                    href={buyMeACoffeeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    {supportMessage}
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Platform</h4>
                <ul className="text-zinc-500 text-sm space-y-2">
                  <li><a href="/services" className="hover:text-white transition-colors">Services</a></li>
                  <li><a href="/billing" className="hover:text-white transition-colors">Billing</a></li>
                  <li><a href="/account#consent-controls" className="hover:text-white transition-colors">Privacy &amp; Consent</a></li>
                  <li><a href="/portfolio" className="hover:text-white transition-colors">Portfolio</a></li>
                  <li><a href={scheduleLinks.guitarLessons} className="hover:text-white transition-colors">Book Lessons</a></li>
                  <li><a href={businessProfile.contactLinks.email} className="hover:text-white transition-colors">{businessProfile.contactEmail}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Social</h4>
                <ul className="text-zinc-500 text-sm space-y-2">
                  <li><a href={businessProfile.socialLinks.x} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter / X</a></li>
                  <li><a href={businessProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
                  <li><a href={businessProfile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube</a></li>
                  <li><a href={businessProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a></li>
                  <li><a href={businessProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                  <li><a href={businessProfile.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a></li>
                  <li><a href={businessProfile.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Discord</a></li>
                </ul>
              </div>
            </div>
            <div className="layout-shell container mx-auto mt-10 sm:mt-20 pt-6 sm:pt-8 border-t border-white/5 text-[10px] font-mono text-zinc-600 flex flex-col gap-2 sm:flex-row sm:justify-between text-center sm:text-left">
              <span>© 2024 TRADEHAX_SYSTEMS_INC.</span>
              <span>SYSTEM_STATUS: ALL_SYSTEMS_NOMINAL</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
