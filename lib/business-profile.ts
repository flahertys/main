import { bookingLinks } from "@/lib/booking";

const defaultPhoneE164 = "+16094128878";
const defaultPhoneDisplay = "(609) 412-8878";
const defaultEmail = "irishmikeflaherty@gmail.com";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || defaultEmail;
const contactPhoneE164 = process.env.NEXT_PUBLIC_CONTACT_PHONE_E164 || defaultPhoneE164;
const contactPhoneDisplay =
  process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || defaultPhoneDisplay;

const textTemplate =
  process.env.NEXT_PUBLIC_TEXT_PREFILL ||
  "Hi TradeHax AI, I would like to ask about services and scheduling.";

const encodedTextTemplate = encodeURIComponent(textTemplate);

export const businessProfile = {
  contactEmail,
  contactPhoneE164,
  contactPhoneDisplay,
  textPreference:
    "Prefer texts unless scheduled for a call. 24/7 on-call urgent calls are welcome.",
  contactLinks: {
    email: `mailto:${contactEmail}`,
    emailSales: `mailto:${contactEmail}?subject=${encodeURIComponent(
      "TradeHax Services Inquiry",
    )}`,
    text: `sms:${contactPhoneE164}?body=${encodedTextTemplate}`,
    call: `tel:${contactPhoneE164}`,
  },
  socialLinks: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || "https://x.com/tradehaxai",
    youtube:
      process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL ||
      "https://www.youtube.com/@tradehaxnet",
    github:
      process.env.NEXT_PUBLIC_SOCIAL_GITHUB_URL ||
      "https://github.com/DarkModder33/main",
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL || "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || "",
  },
  scheduling: {
    primary: process.env.NEXT_PUBLIC_BOOKING_PRIMARY_URL || bookingLinks.webDevConsult,
    calendarEmbed:
      process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL ||
      "https://calendar.google.com/calendar/embed?src=en.usa%23holiday%40group.v.calendar.google.com&ctz=America%2FNew_York",
    meetIntake: process.env.NEXT_PUBLIC_GOOGLE_MEET_BOOKING_URL || bookingLinks.webDevConsult,
  },
} as const;
