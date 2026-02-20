import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { businessProfile } from "@/lib/business-profile";
import {
    Facebook,
    Github,
    Instagram,
    Mail,
    MessageCircle,
    MessageSquare,
    Phone,
    Send,
    Twitter,
    Youtube,
} from "lucide-react";
import Link from "next/link";

export function ShamrockFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[#4f678e]/35 bg-[#03070f]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#00ff41]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-semibold tracking-[0.2em] uppercase text-white">
                TradeHax
              </span>
              <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#8fffb6]">
                AI
              </span>
            </div>
            <p className="text-[#9cadcc] text-sm leading-relaxed mb-5">
              Professional digital services, device support, music lessons,
              and Web3 consulting for clients in Greater Philadelphia and remote.
            </p>
            <div className="flex gap-2.5">
              <TrackedCtaLink
                href={businessProfile.socialLinks.x}
                conversionId="open_social_x"
                surface="footer:social"
                external
                className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                ariaLabel="X"
              >
                <Twitter className="w-4 h-4" />
              </TrackedCtaLink>
              <TrackedCtaLink
                href={businessProfile.socialLinks.youtube}
                conversionId="open_social_youtube"
                surface="footer:social"
                external
                className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                ariaLabel="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </TrackedCtaLink>
              <TrackedCtaLink
                href={businessProfile.socialLinks.github}
                conversionId="open_social_github"
                surface="footer:social"
                external
                className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                ariaLabel="GitHub"
              >
                <Github className="w-4 h-4" />
              </TrackedCtaLink>
              {businessProfile.socialLinks.facebook && (
                <TrackedCtaLink
                  href={businessProfile.socialLinks.facebook}
                  conversionId="open_social_facebook"
                  surface="footer:social"
                  external
                  className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                  ariaLabel="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </TrackedCtaLink>
              )}
              {businessProfile.socialLinks.instagram && (
                <TrackedCtaLink
                  href={businessProfile.socialLinks.instagram}
                  conversionId="open_social_instagram"
                  surface="footer:social"
                  external
                  className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                  ariaLabel="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </TrackedCtaLink>
              )}
              {businessProfile.socialLinks.telegram && (
                <TrackedCtaLink
                  href={businessProfile.socialLinks.telegram}
                  conversionId="open_social_telegram"
                  surface="footer:social"
                  external
                  className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                  ariaLabel="Telegram"
                >
                  <Send className="w-4 h-4" />
                </TrackedCtaLink>
              )}
              {businessProfile.socialLinks.discord && (
                <TrackedCtaLink
                  href={businessProfile.socialLinks.discord}
                  conversionId="open_social_discord"
                  surface="footer:social"
                  external
                  className="p-2 rounded-lg border border-[#4f678e]/40 bg-[#071222] text-[#9fb2d4] hover:border-[#00ff41]/50 hover:text-[#8fffb6] transition-colors"
                  ariaLabel="Discord"
                >
                  <MessageCircle className="w-4 h-4" />
                </TrackedCtaLink>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/crypto-project" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Crypto Project
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Trading Dashboard
                </Link>
              </li>
              <li>
                <Link href="/intelligence" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Intelligence Hub
                </Link>
              </li>
              <li>
                <Link href="/investor-academy" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Investor Academy
                </Link>
              </li>
              <li>
                <Link href="/games" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Games Hub
                </Link>
              </li>
              <li>
                <Link href="/preview" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Share Preview Links
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Full Service Catalog
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Booking Schedule
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Pricing Tiers
                </Link>
              </li>
              <li>
                <Link href="/music" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Music Platform
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-[#9cadcc] hover:text-[#8fffb6] transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <TrackedCtaLink
                  href={businessProfile.contactLinks.emailSales}
                  conversionId="email_contact"
                  surface="footer:company"
                  external
                  className="inline-flex items-center gap-1 text-[#9cadcc] hover:text-[#8fffb6] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {businessProfile.contactEmail}
                </TrackedCtaLink>
              </li>
              <li>
                <TrackedCtaLink
                  href={businessProfile.contactLinks.text}
                  conversionId="contact_text"
                  surface="footer:company"
                  external
                  className="inline-flex items-center gap-1 text-[#9cadcc] hover:text-[#8fffb6] transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Text {businessProfile.contactPhoneDisplay}
                </TrackedCtaLink>
              </li>
              <li>
                <TrackedCtaLink
                  href={businessProfile.contactLinks.call}
                  conversionId="contact_call"
                  surface="footer:company"
                  external
                  className="inline-flex items-center gap-1 text-[#9cadcc] hover:text-[#8fffb6] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Primary Call Line
                </TrackedCtaLink>
              </li>
              <li>
                <TrackedCtaLink
                  href={businessProfile.contactLinks.emergencyCall}
                  conversionId="contact_call"
                  surface="footer:company"
                  external
                  className="inline-flex items-center gap-1 text-[#9cadcc] hover:text-[#8fffb6] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Emergency Overnight Line
                </TrackedCtaLink>
              </li>
              <li className="text-[#7f8fac]">Serving Greater Philadelphia and remote clients</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#4f678e]/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#7f8fac]">
              &copy; {currentYear} TradeHax AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <TrackedCtaLink
                href={businessProfile.contactLinks.cashApp}
                conversionId="donate_cashapp"
                surface="footer:bottom"
                external
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Donate: {businessProfile.cashAppTag}
              </TrackedCtaLink>
            </div>
          </div>
          <p className="text-xs text-[#7f8fac]">
            Built for fast booking, clear service selection, and measurable outcomes.
          </p>
        </div>
      </div>
    </footer>
  );
}
