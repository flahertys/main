export type SharePlatform = {
  id: string;
  label: string;
  trackingUrl: string;
  shareComposerUrl: string;
};

const SITE_ORIGIN = "https://tradehaxai.tech";
const SITE_PATH = "/";
const CAMPAIGN = "brand_preview";
const SHARE_MESSAGE =
  "TradeHax AI: web development, tech repair, music lessons, and Web3 services.";
const SHARE_TITLE = "TradeHax AI | Digital Services and Web3";

export const primaryPreviewUrl = `${SITE_ORIGIN}${SITE_PATH}?utm_source=preview_link&utm_medium=social&utm_campaign=${CAMPAIGN}`;

function buildTrackingUrl(source: string) {
  const url = new URL(SITE_PATH, SITE_ORIGIN);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", CAMPAIGN);
  return url.toString();
}

export function getSharePlatforms(): SharePlatform[] {
  const xUrl = buildTrackingUrl("x");
  const facebookUrl = buildTrackingUrl("facebook");
  const linkedInUrl = buildTrackingUrl("linkedin");
  const redditUrl = buildTrackingUrl("reddit");
  const whatsappUrl = buildTrackingUrl("whatsapp");
  const telegramUrl = buildTrackingUrl("telegram");
  const emailUrl = buildTrackingUrl("email");

  return [
    {
      id: "x",
      label: "X",
      trackingUrl: xUrl,
      shareComposerUrl: `https://x.com/intent/tweet?url=${encodeURIComponent(
        xUrl,
      )}&text=${encodeURIComponent(SHARE_MESSAGE)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      trackingUrl: facebookUrl,
      shareComposerUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        facebookUrl,
      )}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      trackingUrl: linkedInUrl,
      shareComposerUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        linkedInUrl,
      )}`,
    },
    {
      id: "reddit",
      label: "Reddit",
      trackingUrl: redditUrl,
      shareComposerUrl: `https://www.reddit.com/submit?url=${encodeURIComponent(
        redditUrl,
      )}&title=${encodeURIComponent(SHARE_TITLE)}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      trackingUrl: whatsappUrl,
      shareComposerUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${SHARE_MESSAGE} ${whatsappUrl}`,
      )}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      trackingUrl: telegramUrl,
      shareComposerUrl: `https://t.me/share/url?url=${encodeURIComponent(
        telegramUrl,
      )}&text=${encodeURIComponent(SHARE_MESSAGE)}`,
    },
    {
      id: "email",
      label: "Email",
      trackingUrl: emailUrl,
      shareComposerUrl: `mailto:?subject=${encodeURIComponent(
        SHARE_TITLE,
      )}&body=${encodeURIComponent(`${SHARE_MESSAGE}\n\n${emailUrl}`)}`,
    },
  ];
}

