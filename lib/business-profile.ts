import { bookingLinks } from "@/lib/booking";

const defaultPhoneE164 = "+18563208570";
const defaultPhoneDisplay = "(856) 320-8570";
const defaultEmergencyPhoneE164 = "+16094128878";
const defaultEmergencyPhoneDisplay = "(609) 412-8878";
const defaultEmail = "darkmodder33@proton.me";
const defaultCashAppTag = "$irishLivesMatter";
const defaultSupportMessage = "You can support our Work CashApp $irishLivesMatter or https://buymeacoffee.com/hackavelli";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || defaultEmail;
const contactPhoneE164 = process.env.NEXT_PUBLIC_CONTACT_PHONE_E164 || defaultPhoneE164;
const contactPhoneDisplay =
  process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || defaultPhoneDisplay;
const emergencyPhoneE164 =
  process.env.NEXT_PUBLIC_EMERGENCY_PHONE_E164 || defaultEmergencyPhoneE164;
const emergencyPhoneDisplay =
  process.env.NEXT_PUBLIC_EMERGENCY_PHONE_DISPLAY || defaultEmergencyPhoneDisplay;
const cashAppTag = process.env.NEXT_PUBLIC_CASHAPP_TAG || defaultCashAppTag;
const supportMessage = process.env.NEXT_PUBLIC_SUPPORT_MESSAGE || defaultSupportMessage;
const buyMeACoffeeUrl = process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL || "https://buymeacoffee.com/hackavelli";
const emergencyUnlockDonationRaw = Number.parseFloat(
  process.env.NEXT_PUBLIC_EMERGENCY_UNLOCK_DONATION_USD || "5",
);
const emergencyUnlockDonationUsd = Number.isFinite(emergencyUnlockDonationRaw)
  ? emergencyUnlockDonationRaw
  : 5;

const textTemplate =
  process.env.NEXT_PUBLIC_TEXT_PREFILL ||
  "Hi TradeHax AI, I would like to ask about services and scheduling.";

const encodedTextTemplate = encodeURIComponent(textTemplate);

const defaultCalendarEmbedUrl =
  "https://calendar.google.com/calendar/embed?src=darkmodder33%40proton.me&ctz=America%2FNew_York";

function normalizeCalendarEmbedUrl(raw?: string) {
  const value = (raw || "").trim();
  if (!value) return defaultCalendarEmbedUrl;

  // Only allow explicit Google Calendar embed endpoints for iframe src.
  if (
    value.startsWith("https://calendar.google.com/calendar/embed") ||
    value.startsWith("http://calendar.google.com/calendar/embed")
  ) {
    return value;
  }

  // calendar.app.google links are booking pages and generally not iframe-embeddable.
  if (value.includes("calendar.app.google")) {
    return defaultCalendarEmbedUrl;
  }

  return defaultCalendarEmbedUrl;
}

function resolveCalendarOpenUrl(embedUrl: string, meetIntakeUrl: string, explicitOpenUrl?: string) {
  const explicit = (explicitOpenUrl || "").trim();
  if (explicit) return explicit;

  const meet = (meetIntakeUrl || "").trim();
  if (meet) return meet;

  // Best-effort fallback: if embed URL has a calendar id (`src=`), construct a Google Calendar view URL.
  try {
    const parsed = new URL(embedUrl);
    const calendarId = parsed.searchParams.get("src");
    if (calendarId) {
      return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;
    }
  } catch {
    // Ignore and fallback below.
  }

  return defaultCalendarEmbedUrl;
}

export const businessProfile = {
  contactEmail,
  contactPhoneE164,
  contactPhoneDisplay,
  textPreference:
    `Call/text primary line ${contactPhoneDisplay}. Overnight emergency line unlock: $${emergencyUnlockDonationUsd} donation. ${supportMessage}`,
  emergencyPhoneE164,
  emergencyPhoneDisplay,
  cashAppTag,
  supportMessage,
  buyMeACoffeeUrl,
  contactPolicy: {
    emergencyUnlockDonationUsd,
    emergencyPolicy:
      "Overnight emergency calls are accepted after donation confirmation to unlock the emergency line.",
  },
  contactLinks: {
    email: `mailto:${contactEmail}`,
    emailSales: `mailto:${contactEmail}?subject=${encodeURIComponent(
      "TradeHax Services Inquiry",
    )}`,
    text: `sms:${contactPhoneE164}?body=${encodedTextTemplate}`,
    call: `tel:${contactPhoneE164}`,
    emergencyCall: `tel:${emergencyPhoneE164}`,
    cashApp: `https://cash.app/${cashAppTag.replace(/^\$/, "")}`,
    buyMeACoffee: buyMeACoffeeUrl,
  },
  socialLinks: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || "https://x.com/tradehaxai",
    youtube:
      process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL ||
      "https://www.youtube.com/@tradehaxnet",
    youtubeSecondary:
      process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_ALT_URL ||
      "https://www.youtube.com/@tradehax",
    github:
      process.env.NEXT_PUBLIC_SOCIAL_GITHUB_URL ||
      "https://github.com/DarkModder33",
    githubAlt:
      process.env.NEXT_PUBLIC_SOCIAL_GITHUB_ALT_URL ||
      "https://github.com/shamrocksstocks",
    facebook:
      process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL ||
      "https://www.facebook.com/hackavelli",
    instagram:
      process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL ||
      "https://www.instagram.com/celticcodes/",
    instagramAlt:
      process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_ALT_URL ||
      "https://www.instagram.com/aceltclan88/",
    linkedin:
      process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL ||
      "https://www.linkedin.com/in/mcflaherty/",
    telegram:
      process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM_URL ||
      "https://t.me/tradehaxai",
    discord:
      process.env.NEXT_PUBLIC_SOCIAL_DISCORD_URL ||
      "https://discord.com/users/1450053974018494515",
  },
  scheduling: {
    primary: process.env.NEXT_PUBLIC_BOOKING_PRIMARY_URL || bookingLinks.webDevConsult,
    calendarEmbed: normalizeCalendarEmbedUrl(process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL),
    meetIntake:
      process.env.NEXT_PUBLIC_GOOGLE_MEET_BOOKING_URL ||
      "https://calendar.app.google/hhBXuJjfaApoXVzc6",
    calendarOpen: resolveCalendarOpenUrl(
      normalizeCalendarEmbedUrl(process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL),
      process.env.NEXT_PUBLIC_GOOGLE_MEET_BOOKING_URL || "https://calendar.app.google/hhBXuJjfaApoXVzc6",
      process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_OPEN_URL,
    ),
  },
} as const;
