import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

import { SolanaProvider } from "@/components/counter/provider/Solana";
import ErrorBoundary from "@/components/ErrorBoundary";
import { IntroVideoWrapper } from "@/components/IntroVideoWrapper";
import { HeaderBannerAd } from "@/components/monetization/AdSenseBlock";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { businessProfile } from "@/lib/business-profile";
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
  title: "TradeHax AI | Web Development, Tech Repair, Music Lessons, and Web3 Services",
  description:
    "TradeHax AI helps clients in Greater Philadelphia and beyond with website development, app builds, device repair, online guitar lessons, and practical Web3 solutions.",
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
  metadataBase: new URL("https://tradehaxai.tech"),
  alternates: {
    canonical: "https://tradehaxai.tech",
  },
  openGraph: {
    title: "TradeHax AI | Digital Services, Repair, Music Lessons, and Web3",
    description:
      "Customer-first services for websites, apps, device repair, music lessons, and Web3 consulting for local and remote clients.",
    url: "https://tradehaxai.tech",
    siteName: "TradeHax AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-home.svg",
        width: 1200,
        height: 630,
        alt: "TradeHax AI services for web development, repair, music, and Web3",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeHax AI | Professional Digital and Local Service Support",
    description:
      "Book web development, repair, lessons, and Web3 services with a clear service path and fast response.",
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
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const safeGaMeasurementId =
    gaMeasurementId && /^G-[A-Z0-9]+$/.test(gaMeasurementId) ? gaMeasurementId : null;

  const sameAs = [
    businessProfile.socialLinks.x,
    businessProfile.socialLinks.youtube,
    businessProfile.socialLinks.github,
    businessProfile.socialLinks.facebook,
    businessProfile.socialLinks.instagram,
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": "https://tradehaxai.tech/#business",
        name: "TradeHax AI",
        url: "https://tradehaxai.tech",
        telephone: businessProfile.contactPhoneE164,
        email: businessProfile.contactEmail,
        description:
          "Website development, app development, tech repair, guitar lessons, and Web3 consulting for local and remote clients.",
        areaServed: [
          { "@type": "AdministrativeArea", name: "Greater Philadelphia" },
          { "@type": "AdministrativeArea", name: "South Jersey" },
          { "@type": "Place", name: "Remote Services" },
        ],
        serviceType: [
          "Website Development",
          "Application Development",
          "Computer and Device Repair",
          "Online Guitar Lessons",
          "Blockchain and Web3 Consulting",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: businessProfile.contactPhoneE164,
            contactType: "customer support",
            areaServed: "US",
            availableLanguage: "en",
          },
        ],
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": "https://tradehaxai.tech/#website",
        name: "TradeHax AI",
        url: "https://tradehaxai.tech",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://tradehaxai.tech/services?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
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
