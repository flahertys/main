import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { bookingLinks } from "@/lib/booking";
import { businessProfile } from "@/lib/business-profile";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import type { ServiceConversionId } from "@/lib/service-conversions";
import { CalendarCheck2, Clock3, Link2, MessageSquare, MonitorCog, Phone } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

type ScheduleOptionKey = "device-repair" | "guitar-lessons" | "web3-consulting";

type ScheduleSearchParams = {
  service?: string | string[];
};

export const metadata = createPageMetadata({
  title: "Book Tech Support, Guitar Lessons, and Web3 Consulting | Philadelphia + South Jersey",
  description:
    "Book tech support, online guitar lessons, and Web3 consulting with fast response across Greater Philadelphia, South Jersey, and remote nationwide.",
  path: "/schedule",
  imagePath: "/og-services.svg",
  imageAlt: "TradeHax AI scheduling for Philadelphia and South Jersey services",
  keywords: [
    "book tech support philadelphia",
    "book guitar lessons online",
    "web development consultation",
    "south jersey computer support",
    "tradehax ai scheduling",
    "philadelphia web3 consulting",
    "atlantic county tech support",
    "south jersey guitar lessons",
    "local computer help near me",
    "same day remote tech support",
  ],
});

const localSeoFaqs = [
  {
    question: "What areas do you serve locally?",
    answer:
      "We support Greater Philadelphia and South Jersey locally, including Atlantic County, and offer remote services nationwide.",
  },
  {
    question: "How fast can I get a response after booking?",
    answer:
      "Our target first-response window is under two hours during active hours, with urgent after-hours support available via emergency line unlock.",
  },
  {
    question: "Do you provide remote-only options?",
    answer:
      "Yes. Most services, including tech support, guitar lessons, and consulting, are optimized for remote delivery.",
  },
] as const;

const schedulePageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Services",
          item: absoluteUrl("/services"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Schedule",
          item: absoluteUrl("/schedule"),
        },
      ],
    },
    {
      "@type": "Service",
      "@id": `${absoluteUrl("/schedule")}#booking-service`,
      name: "TradeHax AI Service Booking",
      provider: {
        "@type": "LocalBusiness",
        name: "TradeHax AI",
        telephone: businessProfile.contactPhoneE164,
        email: businessProfile.contactEmail,
      },
      areaServed: [
        "Greater Philadelphia",
        "South Jersey",
        "Atlantic County",
        "United States",
      ],
      serviceType: [
        "Tech Support",
        "Online Guitar Lessons",
        "Web3 Consulting",
      ],
      availableChannel: [
        {
          "@type": "ServiceChannel",
          serviceUrl: absoluteUrl("/schedule"),
          availableLanguage: ["English"],
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/schedule")}#faq`,
      mainEntity: localSeoFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ],
};

const bookingOptions = [
  {
    key: "device-repair" as ScheduleOptionKey,
    title: "Device Repair",
    detail: "Remote-first diagnostics and hardware support scheduling.",
    href: bookingLinks.techSupport,
    conversionId: "book_repair_quote" as ServiceConversionId,
    aliases: ["tech-support"],
  },
  {
    key: "guitar-lessons" as ScheduleOptionKey,
    title: "Guitar Lessons",
    detail: "Weekly and monthly lesson scheduling with live remote sessions.",
    href: bookingLinks.guitarLessons,
    conversionId: "book_guitar_lesson" as ServiceConversionId,
    aliases: ["guitar-lessons"],
  },
  {
    key: "web3-consulting" as ScheduleOptionKey,
    title: "Web3 Consulting",
    detail: "Architecture planning, implementation guidance, and multi-chain integrations.",
    href: bookingLinks.webDevConsult,
    conversionId: "book_web3_consult" as ServiceConversionId,
    aliases: [
      "web3-consult",
      "trading-consult",
      "social-media-consult",
      "it-management",
      "app-development",
      "database-consult",
      "ecommerce-consult",
    ],
  },
] as const;

const serviceAliasLabel: Record<string, string> = {
  "tech-support": "Tech Support",
  "guitar-lessons": "Guitar Lessons",
  "web3-consult": "Web3 Consulting",
  "trading-consult": "Trading System Development",
  "social-media-consult": "Social Media Marketing",
  "it-management": "IT Management",
  "app-development": "Application Development",
  "database-consult": "Database Consulting",
  "ecommerce-consult": "E-Commerce Consulting",
};

const serviceAliasToOption: Record<string, ScheduleOptionKey> = bookingOptions.reduce(
  (acc, option) => {
    option.aliases.forEach((alias) => {
      acc[alias] = option.key;
    });
    return acc;
  },
  {} as Record<string, ScheduleOptionKey>
);

const serviceSwitcherOptions = [
  { key: "tech-support", label: "Tech Support" },
  { key: "guitar-lessons", label: "Guitar Lessons" },
  { key: "web3-consult", label: "Web3" },
  { key: "trading-consult", label: "Trading" },
  { key: "social-media-consult", label: "Marketing" },
  { key: "it-management", label: "IT Mgmt" },
  { key: "app-development", label: "App Dev" },
  { key: "database-consult", label: "Database" },
  { key: "ecommerce-consult", label: "E-Commerce" },
] as const;

export default async function SchedulePage({ searchParams }: { searchParams?: Promise<ScheduleSearchParams> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const serviceParamRaw = Array.isArray(resolvedSearchParams?.service)
    ? resolvedSearchParams?.service[0]
    : resolvedSearchParams?.service;
  const requestedService = serviceParamRaw?.trim().toLowerCase() ?? null;
  const highlightedKey = requestedService
    ? serviceAliasToOption[requestedService] ?? null
    : null;
  const requestedServiceLabel = requestedService
    ? serviceAliasLabel[requestedService] ?? requestedService
    : null;
  const hasKnownRequestedService = Boolean(requestedService && highlightedKey);
  const prioritizedBookingOptions = highlightedKey
    ? [...bookingOptions].sort(
      (a, b) => Number(b.key === highlightedKey) - Number(a.key === highlightedKey)
    )
    : bookingOptions;

  return (
    <div className="min-h-screen">
      <Script id="schedule-page-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(schedulePageJsonLd)}
      </Script>
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-20 sm:pb-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Service Booking</span>
          <h1 className="theme-title text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            Book a Service in Minutes
          </h1>
          <p className="theme-subtitle">
            Choose a booking option below. This page is optimized for both
            desktop and mobile scheduling.
          </p>
          <p className="mt-2 text-xs text-[#9ca9c5]">
            All lesson and service booking links across the site route through this
            scheduling hub for a cleaner, consistent experience.
          </p>
          <nav className="mt-4" aria-label="Choose service type">
            <ul className="flex flex-wrap gap-2">
              {serviceSwitcherOptions.map((option) => {
                const isSelected = option.key === requestedService;
                return (
                  <li key={option.key}>
                    <Link
                      href={`/schedule?service=${option.key}#booking-options`}
                      aria-current={isSelected ? "page" : undefined}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040a13] ${isSelected
                          ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100"
                          : "border-[#5f769f]/40 bg-[#0a1422] text-[#cdd8ee] hover:border-cyan-300/50 hover:text-white"
                        }`}
                    >
                      {option.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {requestedServiceLabel && highlightedKey && (
            <p className="mt-2 inline-flex items-center rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
              Request detected: <strong className="ml-1">{requestedServiceLabel}</strong>. Matching option is highlighted below.
            </p>
          )}
          {requestedServiceLabel && !hasKnownRequestedService && (
            <p className="mt-2 inline-flex items-center rounded-full border border-amber-300/35 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
              We couldn&apos;t map “{requestedServiceLabel}” directly. Pick a service above to continue.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <TrackedCtaLink
              href={businessProfile.contactLinks.text}
              conversionId="contact_text"
              surface="schedule:hero"
              external
              className="theme-cta theme-cta--loud w-full sm:w-auto px-5 py-3"
            >
              <MessageSquare className="w-4 h-4" />
              Text {businessProfile.contactPhoneDisplay}
            </TrackedCtaLink>
            <TrackedCtaLink
              href={businessProfile.contactLinks.call}
              conversionId="contact_call"
              surface="schedule:hero"
              external
              className="theme-cta theme-cta--muted w-full sm:w-auto px-5 py-3"
            >
              <Phone className="w-4 h-4" />
              Call Primary Line
            </TrackedCtaLink>
            <TrackedCtaLink
              href={businessProfile.contactLinks.cashApp}
              conversionId="donate_cashapp"
              surface="schedule:hero"
              external
              className="theme-cta theme-cta--secondary w-full sm:w-auto px-5 py-3"
            >
              Unlock Overnight Emergency Line
            </TrackedCtaLink>
          </div>
          <p className="mt-3 text-xs text-[#9ca9c5]">
            {businessProfile.textPreference}
          </p>
          <p className="mt-1 text-xs text-[#9ca9c5]">
            {businessProfile.supportMessage}
          </p>
        </section>

        <section id="booking-options" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8 scroll-mt-36">
          {prioritizedBookingOptions.map((item) => {
            const isHighlighted = highlightedKey === item.key;

            return (
              <article
                key={item.title}
                className={`theme-grid-card ${isHighlighted ? "border-cyan-300/65 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]" : ""}`}
              >
                {isHighlighted && (
                  <span className="inline-flex w-fit rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">
                    Recommended
                  </span>
                )}
                <CalendarCheck2 className="w-5 h-5 text-[#77f9a8]" />
                <h2 className="text-base sm:text-lg font-semibold">{item.title}</h2>
                <p>{item.detail}</p>
                <TrackedCtaLink
                  href={item.href}
                  conversionId={item.conversionId}
                  surface={`schedule:card:${item.title.toLowerCase().replace(/\s+/g, "_")}`}
                  external
                  className="theme-cta theme-cta--compact mt-1 self-start"
                >
                  {isHighlighted ? "Continue Booking" : "Open Booking"}
                  <Link2 className="w-4 h-4" />
                </TrackedCtaLink>
              </article>
            );
          })}
        </section>

        <section className="theme-panel p-5 sm:p-6 mb-8">
          <h2 className="theme-title text-2xl font-bold mb-4">
            Calendar View
          </h2>
          <div className="rounded-xl overflow-hidden border border-[#5f769f]/45 bg-[#040a13]">
            <iframe
              title="TradeHax AI Calendar"
              src={businessProfile.scheduling.calendarEmbed}
              className="w-full h-[560px]"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <TrackedCtaLink
              href={businessProfile.scheduling.calendarOpen}
              conversionId="open_google_calendar"
              surface="schedule:calendar"
              external
              className="theme-cta theme-cta--compact px-4 py-2"
            >
              Open Calendar in New Tab
            </TrackedCtaLink>
            <TrackedCtaLink
              href={businessProfile.scheduling.meetIntake}
              conversionId="open_google_meet"
              surface="schedule:calendar"
              external
              className="theme-cta theme-cta--secondary px-4 py-2"
            >
              Open Google Meet / Booking
            </TrackedCtaLink>
            <span className="text-xs text-[#9ca9c5]">
              If the embedded calendar is blocked by browser privacy settings, use
              <strong> Open Calendar in New Tab</strong>.
            </span>
          </div>
        </section>

        <section className="theme-panel p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="theme-grid-card">
              <Clock3 className="w-5 h-5 text-[#77f9a8]" />
              <h3 className="font-semibold text-lg">Response Commitment</h3>
              <p>Target first-response window is under two hours during active hours.</p>
            </article>
            <article className="theme-grid-card">
              <MonitorCog className="w-5 h-5 text-[#77f9a8]" />
              <h3 className="font-semibold text-lg">Remote-First</h3>
              <p>Most consultations and lessons are optimized for remote delivery.</p>
            </article>
          </div>
        </section>

        <section className="theme-panel p-6 sm:p-8 mt-8">
          <h2 className="theme-title text-2xl font-bold mb-4">Local Service Coverage</h2>
          <p className="text-[#cdd8ee] mb-3">
            TradeHax AI supports clients across <strong>Greater Philadelphia</strong> and
            <strong> South Jersey</strong>, including Atlantic County, with remote service options nationwide.
          </p>
          <p className="text-sm text-[#9ca9c5]">
            Looking for broader service details? Visit our
            <Link href="/services" className="ml-1 underline underline-offset-2 hover:text-white">
              services overview
            </Link>
            .
          </p>
        </section>

        <section className="theme-panel p-6 sm:p-8 mt-8" aria-labelledby="schedule-faq-heading">
          <h2 id="schedule-faq-heading" className="theme-title text-2xl font-bold mb-4">
            Scheduling FAQ
          </h2>
          <div className="space-y-3">
            {localSeoFaqs.map((faq) => (
              <details key={faq.question} className="rounded-lg border border-[#5f769f]/35 bg-[#0a1422] px-4 py-3">
                <summary className="cursor-pointer font-semibold text-[#e7ecfb]">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-[#b6c3de]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
