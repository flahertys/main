import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { businessProfile } from "@/lib/business-profile";
import { bookingLinks } from "@/lib/booking";
import type { ServiceConversionId } from "@/lib/service-conversions";
import { CalendarCheck2, Clock3, Link2, MessageSquare, MonitorCog, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Service | TradeHax AI | Philadelphia and Remote Support",
  description:
    "Book repair, development, and lesson services with clear scheduling options for Greater Philadelphia, South Jersey, and remote support.",
  keywords: [
    "book tech support philadelphia",
    "book guitar lessons online",
    "web development consultation",
    "south jersey computer support",
    "tradehax ai scheduling",
  ],
};

const bookingOptions = [
  {
    title: "Device Repair",
    detail: "Remote-first diagnostics and hardware support scheduling.",
    href: bookingLinks.techSupport,
    conversionId: "book_repair_quote" as ServiceConversionId,
  },
  {
    title: "Guitar Lessons",
    detail: "Weekly and monthly lesson scheduling with live remote sessions.",
    href: bookingLinks.guitarLessons,
    conversionId: "book_guitar_lesson" as ServiceConversionId,
  },
  {
    title: "Web3 Consulting",
    detail: "Architecture planning, implementation guidance, and Solana integrations.",
    href: bookingLinks.webDevConsult,
    conversionId: "book_web3_consult" as ServiceConversionId,
  },
] as const;

export default function SchedulePage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Service Booking</span>
          <h1 className="theme-title text-3xl sm:text-4xl font-bold mb-4">
            Book a Service in Minutes
          </h1>
          <p className="theme-subtitle">
            Choose a booking option below. This page is optimized for both
            desktop and mobile scheduling.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <TrackedCtaLink
              href={businessProfile.contactLinks.text}
              conversionId="contact_text"
              surface="schedule:hero"
              external
              className="theme-cta theme-cta--loud px-5 py-3"
            >
              <MessageSquare className="w-4 h-4" />
              Text {businessProfile.contactPhoneDisplay}
            </TrackedCtaLink>
            <TrackedCtaLink
              href={businessProfile.contactLinks.call}
              conversionId="contact_call"
              surface="schedule:hero"
              external
              className="theme-cta theme-cta--muted px-5 py-3"
            >
              <Phone className="w-4 h-4" />
              Call for Urgent Support
            </TrackedCtaLink>
          </div>
          <p className="mt-3 text-xs text-[#9ca9c5]">
            {businessProfile.textPreference}
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3 mb-8">
          {bookingOptions.map((item) => (
            <article key={item.title} className="theme-grid-card">
              <CalendarCheck2 className="w-5 h-5 text-[#77f9a8]" />
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p>{item.detail}</p>
              <TrackedCtaLink
                href={item.href}
                conversionId={item.conversionId}
                surface={`schedule:card:${item.title.toLowerCase().replace(/\s+/g, "_")}`}
                external
                className="theme-cta theme-cta--compact mt-1 self-start"
              >
                Open Booking
                <Link2 className="w-4 h-4" />
              </TrackedCtaLink>
            </article>
          ))}
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
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <TrackedCtaLink
              href={businessProfile.scheduling.calendarEmbed}
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
              Calendar and Meet links are configurable for your Google Workspace setup.
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
      </main>
      <ShamrockFooter />
    </div>
  );
}
