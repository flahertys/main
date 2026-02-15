import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { bookingLinks } from "@/lib/booking";
import { businessProfile } from "@/lib/business-profile";
import { CalendarClock, CreditCard, Gem, MessageSquare } from "lucide-react";

interface ActionRailProps {
  surface: string;
  className?: string;
}

export function ActionRail({ surface, className = "" }: ActionRailProps) {
  return (
    <section className={`theme-panel p-4 sm:p-5 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <span className="theme-kicker">Quick Actions</span>
        <span className="theme-chip">Book | Explore | Pricing | Contact</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <TrackedCtaLink
          href="/schedule"
          conversionId="open_schedule"
          surface={`${surface}:action_rail`}
          className="theme-cta theme-cta--compact w-full"
        >
          <CalendarClock className="w-4 h-4" />
          Book Service
        </TrackedCtaLink>
        <TrackedCtaLink
          href="/crypto-project"
          conversionId="open_crypto_project"
          surface={`${surface}:action_rail`}
          className="theme-cta theme-cta--secondary theme-cta--compact w-full"
        >
          <Gem className="w-4 h-4" />
          Mint Access
        </TrackedCtaLink>
        <TrackedCtaLink
          href="/pricing"
          conversionId="open_pricing"
          surface={`${surface}:action_rail`}
          className="theme-cta theme-cta--loud theme-cta--compact w-full"
        >
          <CreditCard className="w-4 h-4" />
          View Tiers
        </TrackedCtaLink>
        <TrackedCtaLink
          href={businessProfile.contactLinks.text}
          conversionId="contact_text"
          surface={`${surface}:action_rail`}
          external
          className="theme-cta theme-cta--muted theme-cta--compact w-full"
        >
          <MessageSquare className="w-4 h-4" />
          Text Direct
        </TrackedCtaLink>
      </div>
      <p className="mt-3 text-xs text-[#b4c7d6]">
        Start with the action you need most: schedule a service, review options, or contact us directly.
      </p>
      <p className="mt-1 text-[11px] text-[#9cb3c1]">
        Prefer email?{" "}
        <TrackedCtaLink
          href={businessProfile.contactLinks.emailSales}
          conversionId="email_contact"
          surface={`${surface}:action_rail`}
          external
          className="text-[#9bffbf] font-semibold hover:text-[#00ff41] transition-colors"
        >
          Send project details
        </TrackedCtaLink>
        . Need immediate tech support?{" "}
        <TrackedCtaLink
          href={bookingLinks.techSupport}
          conversionId="book_repair_quote"
          surface={`${surface}:action_rail`}
          external
          className="text-[#9bffbf] font-semibold hover:text-[#00ff41] transition-colors"
        >
          Book a repair intake slot
        </TrackedCtaLink>
        .
      </p>
    </section>
  );
}
