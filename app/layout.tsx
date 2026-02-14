import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

import { SolanaProvider } from "@/components/counter/provider/Solana";
import ErrorBoundary from "@/components/ErrorBoundary";
import { IntroVideoWrapper } from "@/components/IntroVideoWrapper";
import { HeaderBannerAd } from "@/components/monetization/AdSenseBlock";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Cinzel, Montserrat, Orbitron } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body-google",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display-google",
  display: "swap",
  weight: ["500", "700", "800"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-mystic-google",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#00FF41" },
    { media: "(prefers-color-scheme: light)", color: "#00FF41" },
  ],
};

export const metadata: Metadata = {
  title: "TradeHax AI - Web3 Trading, Repairs, Lessons, and Digital Services",
  description:
    "TradeHax AI blends Solana-powered Web3 trading with real-world services: device repair, guitar lessons, and digital build services in one professional platform.",
  keywords: [
    "Web3 trading",
    "Solana",
    "automated trading",
    "DeFi",
    "blockchain",
    "crypto trading",
    "AI trading platform",
    "device repair",
    "guitar lessons",
    "digital services",
    "NFT mint",
    "Philadelphia",
  ],
  authors: [{ name: "TradeHax AI" }],
  creator: "TradeHax AI",
  publisher: "TradeHax AI",
  metadataBase: new URL("https://tradehaxai.tech"),
  alternates: {
    canonical: "https://tradehaxai.tech",
  },
  openGraph: {
    title: "TradeHax AI - Matrix Web3 and Service Platform",
    description:
      "A professional Web3 platform connecting automated trading, NFT experiences, and remote-first service offerings.",
    url: "https://tradehaxai.tech",
    siteName: "TradeHax AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-home.svg",
        width: 1200,
        height: 630,
        alt: "TradeHax AI - Automated Web3 Trading Platform",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeHax AI - Matrix Web3 and Service Platform",
    description:
      "Automated Web3 trading, NFT experiences, and premium digital services on Solana.",
    images: ["/og-home.svg"],
    creator: "@tradehaxai",
    site: "@tradehaxai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TradeHax AI",
    description:
      "Web3 trading platform and service ecosystem powered by Solana",
    url: "https://tradehaxai.tech",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "TradeHax AI",
      url: "https://tradehaxai.tech",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${montserrat.variable} ${orbitron.variable} ${cinzel.variable} antialiased text-gray-100 font-sans theme-shell`}
      >
        {/* Header ad for quick monetization; only renders when NEXT_PUBLIC_ADSENSE_ID set */}
        <HeaderBannerAd />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <IntroVideoWrapper>
          <AuthProvider>
            <SolanaProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
              <Toaster
                position="bottom-right"
                theme="dark"
                closeButton
                richColors={false}
                toastOptions={{
                  style: {
                    background: "#171717",
                    color: "white",
                    border: "1px solid rgba(75, 85, 99, 0.3)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem 1rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                  },
                  className: "toast-container",
                }}
              />
            </SolanaProvider>
          </AuthProvider>
        </IntroVideoWrapper>
        <Analytics />
      </body>
    </html>
  );
}
