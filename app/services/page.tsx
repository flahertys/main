import { EmailCapture } from "@/components/EmailCapture";
import { AdSenseBlock } from "@/components/monetization/AdSenseBlock";
import { ActionRail } from "@/components/monetization/ActionRail";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { businessProfile } from "@/lib/business-profile";
import { bookingLinks } from "@/lib/booking";
import type { ServiceConversionId } from "@/lib/service-conversions";
import {
    ArrowRight,
    CheckCircle2,
    Code,
    Database,
    LineChart,
    Megaphone,
    Server,
    ShoppingCart,
    Smartphone,
    Users,
    Wrench,
    Zap,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Services | Web Development, Tech Repair, and Digital Support | TradeHax AI",
  description:
    "Professional services including website development, app builds, device support, social media marketing, and Web3 consulting for Greater Philadelphia and remote clients.",
  keywords: [
    "web development philadelphia",
    "app development philadelphia",
    "computer repair near philadelphia",
    "tech support south jersey",
    "website design south jersey",
    "social media marketing services",
    "web3 development",
    "blockchain consulting",
    "trading systems",
    "smart contracts",
    "DApp development",
  ],
  openGraph: {
    title: "TradeHax AI Services | Web, Repair, Marketing, and Web3",
    description:
      "Explore web development, repair, marketing, and Web3 services with clear booking paths.",
    url: "https://tradehaxai.tech/services",
    type: "website",
    images: [
      {
        url: "/og-services.svg",
        width: 1200,
        height: 630,
        alt: "Professional Services",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeHax AI Services",
    description:
      "Website development, repair support, marketing, and Web3 services.",
    images: ["/og-services.svg"],
  },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-6">
            Professional Services
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete technology solutions from Web3 development to hardware
            repair, social media marketing, and automated trading systems built
            for businesses and individuals in Greater Philadelphia and remote.
          </p>
        </div>

        <div className="mb-12">
          <ActionRail surface="services" />
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="services-top" adFormat="horizontal" />
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ServiceCard
            icon={<Code className="w-10 h-10" />}
            title="Web3 Development"
            description="Custom blockchain applications, smart contracts, and decentralized platforms built with modern technologies."
            features={[
              "Solana & Ethereum development",
              "Smart contract auditing",
              "DApp architecture & design",
              "Wallet integration",
              "NFT marketplace development",
            ]}
            pricing="Starting at $5,000"
            ctaLabel="Book Web3 Discovery Call"
            ctaHref={bookingLinks.webDevConsult}
            ctaConversionId="book_web3_consult"
          />

          <ServiceCard
            icon={<LineChart className="w-10 h-10" />}
            title="Trading System Development"
            description="Automated trading bots, algorithmic strategies, real-time market analysis, and exclusive livestream trading sessions."
            features={[
              "Custom trading algorithms",
              "Portfolio management systems",
              "Market data integration",
              "Risk management tools",
              "Backtesting frameworks",
              "Live trading sessions & community (coming soon)",
            ]}
            pricing="Starting at $3,000"
            ctaLabel="Book Trading Strategy Session"
            ctaHref={bookingLinks.tradingConsult}
            ctaConversionId="book_trading_consult"
          />

          <ServiceCard
            icon={<Users className="w-10 h-10" />}
            title="Consulting & Strategy"
            description="Expert guidance on blockchain adoption, DeFi strategies, and Web3 business models."
            features={[
              "Technical architecture review",
              "Blockchain strategy planning",
              "DeFi protocol optimization",
              "Team training & workshops",
              "Code review & audits",
            ]}
            pricing="$200/hour"
            ctaLabel="Book Web3 Strategy Consult"
            ctaHref={bookingLinks.webDevConsult}
            ctaConversionId="book_web3_consult"
          />

          <ServiceCard
            icon={<Zap className="w-10 h-10" />}
            title="Full-Stack Development"
            description="Complete web applications with modern frameworks, APIs, and database architecture."
            features={[
              "Next.js & React applications",
              "Backend API development",
              "Database design & optimization",
              "Cloud deployment & DevOps",
              "Performance optimization",
            ]}
            pricing="Starting at $4,000"
            ctaLabel="Start Build Consultation"
            ctaHref={bookingLinks.webDevConsult}
            ctaConversionId="book_web3_consult"
          />

          <ServiceCard
            icon={<Wrench className="w-10 h-10" />}
            title="Software & Hardware Support"
            description="Remote-first technical support for all your computer needs. Fast diagnostics, troubleshooting, and optimization."
            features={[
              "Remote software troubleshooting & fixes",
              "Hardware diagnostic support",
              "Virus & malware removal",
              "System optimization & cleanup",
              "Data recovery assistance",
              "OS installation & updates",
            ]}
            pricing="$50-100/hour"
            ctaLabel="Book Repair / Support Intake"
            ctaHref={bookingLinks.techSupport}
            ctaConversionId="book_repair_quote"
          />

          <ServiceCard
            icon={<Megaphone className="w-10 h-10" />}
            title="Social Media Marketing"
            description="Complete social media management and digital marketing services to grow your online presence and engage your audience."
            features={[
              "Social media strategy development",
              "Content creation & scheduling",
              "Community management & engagement",
              "Paid advertising campaigns (FB, IG, TikTok)",
              "SEO optimization & analytics",
              "Influencer outreach & partnerships",
            ]}
            pricing="Starting at $1,000/month"
            ctaLabel="Book Marketing Strategy Call"
            ctaHref={bookingLinks.socialMediaConsult}
            ctaConversionId="book_social_media_consult"
          />

          <ServiceCard
            icon={<Server className="w-10 h-10" />}
            title="Complete IT Solutions"
            description="End-to-end IT management for businesses. From domain setup to ongoing technical support."
            features={[
              "Domain registration & DNS management",
              "Email hosting & configuration",
              "SSL certificate installation",
              "Website backups & security monitoring",
              "Cloud infrastructure setup",
              "24/7 technical support retainers",
            ]}
            pricing="Starting at $500/month"
            ctaLabel="Book IT Management Consult"
            ctaHref={bookingLinks.itManagement}
            ctaConversionId="book_it_management_consult"
          />

          <ServiceCard
            icon={<Smartphone className="w-10 h-10" />}
            title="Custom Application Development"
            description="Native mobile apps, web applications, and cross-platform solutions built with modern frameworks."
            features={[
              "iOS & Android app development",
              "Progressive Web Apps (PWA)",
              "React Native cross-platform apps",
              "API development & integration",
              "App Store & Play Store deployment",
              "Ongoing maintenance & updates",
            ]}
            pricing="Starting at $8,000"
            ctaLabel="Book App Development Consult"
            ctaHref={bookingLinks.appDevelopment}
            ctaConversionId="book_app_development_consult"
          />

          <ServiceCard
            icon={<Database className="w-10 h-10" />}
            title="Database & Cloud Architecture"
            description="Scalable database design, cloud migration, and infrastructure optimization for growing businesses."
            features={[
              "PostgreSQL, MongoDB, MySQL setup",
              "AWS, Google Cloud, Azure deployment",
              "Database optimization & indexing",
              "Cloud cost optimization",
              "Backup & disaster recovery",
              "DevOps & CI/CD pipelines",
            ]}
            pricing="Starting at $3,500"
            ctaLabel="Book Database Architecture Call"
            ctaHref={bookingLinks.databaseConsult}
            ctaConversionId="book_database_consult"
          />

          <ServiceCard
            icon={<ShoppingCart className="w-10 h-10" />}
            title="E-Commerce Development"
            description="Complete online store setup with payment processing, inventory management, and marketing tools."
            features={[
              "Shopify, WooCommerce, custom builds",
              "Payment gateway integration (Stripe, PayPal)",
              "Inventory & order management",
              "Email marketing automation",
              "Product photography & descriptions",
              "Conversion rate optimization",
            ]}
            pricing="Starting at $6,000"
            ctaLabel="Book E-Commerce Build Session"
            ctaHref={bookingLinks.ecommerceConsult}
            ctaConversionId="book_ecommerce_consult"
          />
        </div>

        {/* Process Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How We Work
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <ProcessStep
              number="1"
              title="Discovery"
              description="We discuss your requirements, goals, and technical needs."
            />
            <ProcessStep
              number="2"
              title="Proposal"
              description="Receive a detailed project plan with timeline and pricing."
            />
            <ProcessStep
              number="3"
              title="Development"
              description="Agile development with regular updates and milestones."
            />
            <ProcessStep
              number="4"
              title="Delivery"
              description="Launch, support, and ongoing maintenance as needed."
            />
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Why Choose TradeHax AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Benefit
              title="Cross-Domain Expertise"
              description="Digital services, repair support, education, and Web3 consulting in one team"
            />
            <Benefit
              title="Fast Delivery"
              description="Agile methodology ensures quick turnaround times"
            />
            <Benefit
              title="Ongoing Support"
              description="Comprehensive post-launch support and maintenance"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Let&apos;s discuss how we can bring your vision to life with
            cutting-edge technology and proven development practices.
          </p>

          <EmailCapture />

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <TrackedCtaLink
              href="/portfolio"
              conversionId="open_portfolio"
              surface="services:cta_section"
              className="theme-cta theme-cta--secondary px-6 py-3"
            >
              View Portfolio
              <ArrowRight className="w-5 h-5" />
            </TrackedCtaLink>
            <TrackedCtaLink
              href={businessProfile.contactLinks.emailSales}
              conversionId="email_contact"
              surface="services:cta_section"
              external
              className="theme-cta theme-cta--loud px-6 py-3"
            >
              Email Us
              <ArrowRight className="w-5 h-5" />
            </TrackedCtaLink>
            <TrackedCtaLink
              href={businessProfile.contactLinks.text}
              conversionId="contact_text"
              surface="services:cta_section"
              external
              className="theme-cta theme-cta--muted px-6 py-3"
            >
              Text {businessProfile.contactPhoneDisplay}
              <ArrowRight className="w-5 h-5" />
            </TrackedCtaLink>
          </div>
        </section>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="services-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  features,
  pricing,
  ctaLabel,
  ctaHref,
  ctaConversionId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  pricing: string;
  ctaLabel: string;
  ctaHref: string;
  ctaConversionId: ServiceConversionId;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-[#0366d6]/50 transition-all">
      <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 text-purple-400">
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>

      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-gray-300">
            <CheckCircle2 className="w-5 h-5 text-[#0366d6] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="pt-6 border-t border-gray-800">
        <p className="text-2xl font-bold text-white">{pricing}</p>
        <TrackedCtaLink
          href={ctaHref}
          conversionId={ctaConversionId}
          surface={`services:card:${title.toLowerCase().replace(/\s+/g, "_")}`}
          external
          className="theme-cta theme-cta--compact mt-4"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </TrackedCtaLink>
      </div>
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
      <div className="w-12 h-12 bg-gradient-to-r from-[#00D100] to-[#00FF41] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
