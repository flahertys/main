import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SolanaProvider } from "@/components/counter/provider/Solana";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
  ],
};

export const metadata: Metadata = {
  title: "TradeHax AI - Automated Web3 Trading Platform",
  description: "Advanced automated trading platform powered by Solana blockchain. Trade smarter with AI-driven insights and decentralized technology.",
  keywords: ["Web3 trading", "Solana", "automated trading", "DeFi", "blockchain", "crypto trading", "AI trading", "decentralized finance"],
  authors: [{ name: "TradeHax AI" }],
  creator: "TradeHax AI",
  publisher: "TradeHax AI",
  metadataBase: new URL("https://tradehaxai.tech"),
  alternates: {
    canonical: "https://tradehaxai.tech",
  },
  openGraph: {
    title: "TradeHax AI - Automated Web3 Trading Platform",
    description: "Advanced automated trading platform powered by Solana blockchain. Trade smarter with AI-driven insights and decentralized technology.",
    url: "https://tradehaxai.tech",
    siteName: "TradeHax AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TradeHax AI - Automated Web3 Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeHax AI - Automated Web3 Trading Platform",
    description: "Advanced automated trading platform powered by Solana blockchain. Trade smarter with AI-driven insights and decentralized technology.",
    images: ["/twitter-image.png"],
    creator: "@tradehaxai",
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
    description: "Advanced automated trading platform powered by Solana blockchain",
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
        className="antialiased bg-gray-950 text-white font-sans"
      >
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
        <SolanaProvider>
          {children}
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
        <Analytics />
      </body>
    </html>
  );
}
