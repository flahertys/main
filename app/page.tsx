import { WalletButton } from "@/components/counter/WalletButton";
import { InContentAd, FooterBannerAd } from "@/components/monetization/AdSenseBlock";
import { ActionRail } from "@/components/monetization/ActionRail";
import { EmailCaptureModal } from "@/components/monetization/EmailCaptureModal";
import { RecommendedTools } from "@/components/monetization/AffiliateBanner";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { businessProfile } from "@/lib/business-profile";
import { bookingLinks } from "@/lib/booking";
import {
  ArrowRight,
  CalendarClock,
  CircuitBoard,
  CreditCard,
  Gamepad2,
  Gem,
  Guitar,
  HandCoins,
  MessageSquare,
  MonitorSmartphone,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "TradeHax AI | Web Development, Tech Repair, and Music Lessons in Greater Philadelphia",
  description:
    "Book trusted digital services including website and app development, device repair, guitar lessons, and practical Web3 support for Greater Philadelphia and remote clients.",
};

const intentLanes = [
  {
    title: "Need Service Now",
    detail:
      "Phone/computer repair, optimization, and urgent troubleshooting with rapid intake.",
    href: bookingLinks.techSupport,
    external: true,
    conversionId: "book_repair_quote",
    surface: "home:intent_lane",
    cta: "Start Tech Support Intake",
    icon: Wrench,
  },
  {
    title: "Need a Build Partner",
    detail:
      "Website creation, app development, blockchain/crypto systems, and AI automation delivery.",
    href: bookingLinks.webDevConsult,
    external: true,
    conversionId: "book_web3_consult",
    surface: "home:intent_lane",
    cta: "Book Build Consultation",
    icon: MonitorSmartphone,
  },
  {
    title: "Music Lessons and Artist Growth",
    detail:
      "Private guitar lessons, platform growth, and scholarship/reward infrastructure.",
    href: "/music",
    external: false,
    conversionId: "open_music",
    surface: "home:intent_lane",
    cta: "Explore Music Services",
    icon: Guitar,
  },
  {
    title: "Trading Research and Token Roadmap",
    detail:
      "Follow market discussions, project updates, and utility-token roadmap progress.",
    href: "/crypto-project",
    external: false,
    conversionId: "open_crypto_project",
    surface: "home:intent_lane",
    cta: "Review Crypto Project",
    icon: CircuitBoard,
  },
] as const;

const offerPillars = [
  {
    title: "Digital Services Studio",
    summary:
      "Ship production websites, apps, and automation systems with clear scope and execution checkpoints.",
    highlights: [
      "Website creation and redesign",
      "App/web platform development",
      "Blockchain and crypto integrations",
      "Business automation + AI workflows",
    ],
    cta: "Book a Build Call",
    href: bookingLinks.webDevConsult,
    external: true,
    conversionId: "book_web3_consult",
    surface: "home:offer_pillar",
    icon: MonitorSmartphone,
  },
  {
    title: "Device Repair + Optimization",
    summary:
      "Repair and tune phones/computers for performance, reliability, and secure day-to-day usage.",
    highlights: [
      "Cell phone + computer diagnostics",
      "Performance tuning and cleanup",
      "Hardware/software troubleshooting",
      "Customization and workflow setup",
    ],
    cta: "Get Repair Intake",
    href: bookingLinks.techSupport,
    external: true,
    conversionId: "book_repair_quote",
    surface: "home:offer_pillar",
    icon: Wrench,
  },
  {
    title: "Music Lessons and Artist Development",
    summary:
      "Build skill progression through guitar lessons while expanding a rewards-backed music platform.",
    highlights: [
      "Remote/private guitar instruction",
      "Student progression tracks",
      "Scholarship and rewards roadmap",
      "Structured learning and artist-growth ecosystem",
    ],
    cta: "Explore Music Services",
    href: "/music",
    external: false,
    conversionId: "open_music",
    surface: "home:offer_pillar",
    icon: Guitar,
  },
  {
    title: "Trading Research + Token Roadmap",
    summary:
      "Track strategy discussions and token utility planning as the project evolves.",
    highlights: [
      "Trading callouts and discussion tracks",
      "Tokenized utility architecture",
      "Liquidity/reward design direction",
      "Web3 integration across services and rewards",
    ],
    cta: "Review Crypto Roadmap",
    href: "/crypto-project",
    external: false,
    conversionId: "open_crypto_project",
    surface: "home:offer_pillar",
    icon: HandCoins,
  },
] as const;

const journeySteps = [
  {
    title: "Choose Your Lane",
    detail:
      "Visitors self-select: service now, build project, music services, or crypto roadmap.",
  },
  {
    title: "Qualification",
    detail:
      "Fast intake forms, text contact, and scheduled consult calls route qualified leads.",
  },
  {
    title: "Service Delivery",
    detail:
      "Deliver repair, development, and lesson work with transparent checkpoints and scope.",
  },
  {
    title: "Retention and Upsell",
    detail:
      "Offer ongoing support plans, education, and advanced service packages.",
  },
] as const;

const exploreLinks = [
  {
    href: "/services",
    label: "Service Catalog",
    detail: "See full list of digital, repair, and optimization services.",
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    detail: "Review projects, outcomes, and delivery quality.",
  },
  {
    href: "/game",
    label: "Hyperborea Experience",
    detail: "Explore the game layer tied to rewards, identity, and engagement.",
  },
  {
    href: "/about",
    label: "About + Trust",
    detail: "Understand background, operations, and long-term mission.",
  },
] as const;

const galleryItems = [
  { src: "/reference-hyperborea-thumb.jpg", caption: "Hyperborea Original Visual" },
  { src: "/og-home.svg", caption: "Main Platform Home" },
  { src: "/og-game.svg", caption: "Escher Maze Game Interface" },
  { src: "/og-dashboard.svg", caption: "Trading Dashboard Surface" },
  { src: "/og-services.svg", caption: "Service Booking Presentation" },
  { src: "/og-music.svg", caption: "Music and Lessons Hub" },
] as const;

export default function Home() {
  return (
    <>
      <ShamrockHeader />

      <main className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8 md:p-10">
            <div className="max-w-4xl">
              <span className="theme-kicker mb-4">TradeHax Service Studio</span>
              <div className="theme-hero-sign p-5 sm:p-7 md:p-8">
                <p className="theme-rune text-xs sm:text-sm mb-3">
                  WEB DEVELOPMENT | REPAIR | MUSIC | WEB3
                </p>
                <h1 className="theme-title text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
                  Digital Services, Repair, Music Services, and{" "}
                  <span className="theme-title-accent">Web3 Development</span>
                </h1>
                <p className="theme-subtitle text-sm sm:text-base mb-6">
                  We help customers launch websites and apps, fix device issues,
                  improve music skills, and explore practical Web3 projects.
                  Choose a lane below to book quickly or learn more.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <span className="theme-badge">2h Response Goal</span>
                  <span className="theme-badge">25+ Years Experience</span>
                  <span className="theme-badge">Local + Remote Support</span>
                  <span className="theme-badge">Clear Scope and Pricing</span>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <TrackedCtaLink
                  href="/schedule"
                  conversionId="open_schedule"
                  surface="home:hero"
                  className="theme-cta theme-cta--loud px-5 py-3"
                >
                  Book Service
                  <ArrowRight className="w-4 h-4" />
                </TrackedCtaLink>
                <TrackedCtaLink
                  href="/crypto-project"
                  conversionId="open_crypto_project"
                  surface="home:hero"
                  className="theme-cta theme-cta--secondary px-5 py-3"
                >
                  Open Crypto Project
                  <CircuitBoard className="w-4 h-4" />
                </TrackedCtaLink>
                <TrackedCtaLink
                  href={businessProfile.contactLinks.text}
                  conversionId="contact_text"
                  surface="home:hero"
                  external
                  className="theme-cta theme-cta--muted px-5 py-3"
                >
                  Text {businessProfile.contactPhoneDisplay}
                  <MessageSquare className="w-4 h-4" />
                </TrackedCtaLink>
                <div className="min-h-10">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <span className="theme-kicker mb-3">Start Here</span>
            <h2 className="theme-title text-2xl sm:text-3xl font-bold mb-3">
              What Are You Here For Today?
            </h2>
            <p className="theme-subtitle text-sm sm:text-base mb-6">
              Pick the path that matches your intent. Each route is optimized
              for clear next steps and fast booking.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {intentLanes.map(
                ({
                  title,
                  detail,
                  href,
                  external,
                  conversionId,
                  surface,
                  cta,
                  icon: Icon,
                }) => (
                  <article key={title} className="theme-grid-card">
                    <div className="inline-flex w-10 h-10 items-center justify-center rounded-lg border border-[#00ff41]/40 bg-[#06130c] text-[#7cf5ad]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p>{detail}</p>
                    <TrackedCtaLink
                      href={href}
                      external={external}
                      conversionId={conversionId}
                      surface={surface}
                      className="theme-cta theme-cta--compact theme-cta--loud mt-1 self-start"
                    >
                      {cta}
                      <ArrowRight className="w-4 h-4" />
                    </TrackedCtaLink>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <ActionRail surface="home" />
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <span className="theme-kicker mb-3">Browse Mode</span>
            <h2 className="theme-title text-2xl sm:text-3xl font-bold mb-3">
              New Here? Explore First
            </h2>
            <p className="theme-subtitle text-sm sm:text-base mb-6">
              Review our services, past work, and platform features before you decide.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {exploreLinks.map(({ href, label, detail }) => (
                <Link key={href} href={href} className="theme-grid-card">
                  <h3 className="text-lg font-semibold">{label}</h3>
                  <p>{detail}</p>
                  <span className="theme-chip self-start">Open {label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <span className="theme-kicker mb-3">Customer Journey</span>
            <h2 className="theme-title text-2xl sm:text-3xl font-bold mb-6">
              Built for Clarity, Trust, and Results
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {journeySteps.map((step, index) => (
                <article key={step.title} className="theme-grid-card">
                  <span className="text-[#73fba8] text-xs tracking-widest font-semibold">
                    STEP 0{index + 1}
                  </span>
                  <h3 className="text-white text-lg font-semibold">{step.title}</h3>
                  <p>{step.detail}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedCtaLink
                href="/schedule"
                conversionId="open_schedule"
                surface="home:journey"
                className="theme-cta theme-cta--loud px-5 py-3"
              >
                Start with a Booking
              </TrackedCtaLink>
              <TrackedCtaLink
                href={businessProfile.contactLinks.text}
                conversionId="contact_text"
                surface="home:journey"
                external
                className="theme-cta theme-cta--secondary px-5 py-3"
              >
                Text Questions First
              </TrackedCtaLink>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <span className="theme-kicker mb-3">Core Services</span>
            <h2 className="theme-title text-2xl sm:text-3xl font-bold mb-6">
              What You Can Buy From TradeHax AI Right Now
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {offerPillars.map(
                ({ title, summary, highlights, cta, href, external, conversionId, surface, icon: Icon }) => (
                  <article key={title} className="theme-grid-card">
                    <div className="inline-flex w-10 h-10 items-center justify-center rounded-lg border border-[#00ff41]/40 bg-[#06130c] text-[#7cf5ad]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p>{summary}</p>
                    <ul className="space-y-1 text-sm text-[#c8d8e1]">
                      {highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-[#8fffb6] mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <TrackedCtaLink
                      href={href}
                      external={external}
                      conversionId={conversionId}
                      surface={surface}
                      className="theme-cta theme-cta--compact theme-cta--loud mt-1 self-start"
                    >
                      {cta}
                    </TrackedCtaLink>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <span className="theme-kicker mb-3">Trading and Token Direction</span>
            <h2 className="theme-title text-2xl sm:text-3xl font-bold mb-3">
              Trading Research and Token Utility Direction
            </h2>
            <p className="theme-subtitle text-sm sm:text-base mb-5">
              We are building a utility-focused token model tied to education,
              platform access, and service features. Follow roadmap updates and
              request project discussions as milestones are released.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="theme-grid-card">
                <h3 className="text-lg font-semibold">Roadmap + Discussion Access</h3>
                <p>
                  Track architecture updates, product releases, and project milestones.
                </p>
                <TrackedCtaLink
                  href="/crypto-project"
                  conversionId="open_crypto_project"
                  surface="home:trading_direction"
                  className="theme-cta theme-cta--compact theme-cta--secondary mt-1 self-start"
                >
                  Open Crypto Project
                </TrackedCtaLink>
              </article>
              <article className="theme-grid-card">
                <h3 className="text-lg font-semibold">Strategy Call Intake</h3>
                <p>
                  Schedule a call to discuss your use case, legal-safe scope,
                  and where your needs fit in the roadmap.
                </p>
                <TrackedCtaLink
                  href={bookingLinks.tradingConsult}
                  conversionId="book_trading_consult"
                  surface="home:trading_direction"
                  external
                  className="theme-cta theme-cta--compact theme-cta--loud mt-1 self-start"
                >
                  Book Trading Discussion
                </TrackedCtaLink>
              </article>
            </div>
            <p className="mt-5 text-xs text-[#9fb6c5]">
              Educational and informational only. TradeHax AI does not provide
              individualized investment advice.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <span className="theme-kicker mb-2">Visual Archive</span>
                <h2 className="theme-title text-2xl font-bold">Project and Brand Highlights</h2>
              </div>
              <span className="theme-chip">Scroll Horizontally</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {galleryItems.map((item) => (
                <figure key={item.caption} className="theme-gallery-card">
                  <Image
                    src={item.src}
                    alt={item.caption}
                    width={220}
                    height={124}
                    unoptimized={item.src.endsWith(".svg")}
                  />
                  <figcaption className="caption">{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <InContentAd />
        </section>

        <section className="max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="theme-panel p-6 sm:p-8">
            <span className="theme-kicker mb-3">Ways to Work With Us</span>
            <h2 className="theme-title text-2xl sm:text-3xl font-bold mb-6">
              Services, Products, and Membership Options
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="theme-grid-card">
                <HandCoins className="w-5 h-5 text-[#77f9a7]" />
                <h3 className="font-semibold">Bookings</h3>
                <p>Book paid repair, lessons, and consulting appointments.</p>
                <TrackedCtaLink
                  href="/schedule"
                  conversionId="open_schedule"
                  surface="home:monetization_lane"
                  className="theme-cta theme-cta--compact theme-cta--loud mt-1 self-start"
                >
                  Open Schedule
                </TrackedCtaLink>
              </article>
              <article className="theme-grid-card">
                <Gem className="w-5 h-5 text-[#77f9a7]" />
                <h3 className="font-semibold">NFT Mints</h3>
                <p>Access project-linked mints with optional premium upgrades.</p>
                <TrackedCtaLink
                  href="/crypto-project"
                  conversionId="open_crypto_project"
                  surface="home:monetization_lane"
                  className="theme-cta theme-cta--compact theme-cta--secondary mt-1 self-start"
                >
                  Mint Access
                </TrackedCtaLink>
              </article>
              <article className="theme-grid-card">
                <CreditCard className="w-5 h-5 text-[#77f9a7]" />
                <h3 className="font-semibold">Subscriptions</h3>
                <p>Monthly tiers for insights, support, and premium sessions.</p>
                <TrackedCtaLink
                  href="/pricing"
                  conversionId="open_pricing"
                  surface="home:monetization_lane"
                  className="theme-cta theme-cta--compact mt-1 self-start"
                >
                  View Tiers
                </TrackedCtaLink>
              </article>
              <article className="theme-grid-card">
                <Gamepad2 className="w-5 h-5 text-[#77f9a7]" />
                <h3 className="font-semibold">Platform Experience</h3>
                <p>Explore the game and dashboard as part of the full customer experience.</p>
                <TrackedCtaLink
                  href="/dashboard"
                  conversionId="open_dashboard"
                  surface="home:monetization_lane"
                  className="theme-cta theme-cta--compact theme-cta--muted mt-1 self-start"
                >
                  Launch Dashboard
                </TrackedCtaLink>
              </article>
              <article className="theme-grid-card">
                <CircuitBoard className="w-5 h-5 text-[#77f9a7]" />
                <h3 className="font-semibold">Affiliate Tools</h3>
                <p>Use trusted partner tools with tracked referral links.</p>
                <TrackedCtaLink
                  href="/#recommended-tools"
                  conversionId="open_affiliate_tools"
                  surface="home:monetization_lane"
                  className="theme-cta theme-cta--compact theme-cta--secondary mt-1 self-start"
                >
                  Open Tool Offers
                </TrackedCtaLink>
              </article>
            </div>
          </div>
        </section>

        <section id="recommended-tools" className="max-w-7xl mx-auto mb-12">
          <RecommendedTools />
        </section>

        <section className="max-w-7xl mx-auto mb-8">
          <FooterBannerAd />
        </section>
      </main>

      <ShamrockFooter />
      <EmailCaptureModal />
    </>
  );
}
