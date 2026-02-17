import { event } from "@/lib/analytics";

export type ServiceConversionId =
  | "open_schedule"
  | "open_pricing"
  | "open_crypto_project"
  | "open_dashboard"
  | "open_game"
  | "open_music"
  | "open_portfolio"
  | "book_repair_quote"
  | "book_guitar_lesson"
  | "book_web3_consult"
  | "book_trading_consult"
  | "book_social_media_consult"
  | "book_it_management_consult"
  | "book_app_development_consult"
  | "book_database_consult"
  | "book_ecommerce_consult"
  | "email_contact"
  | "contact_text"
  | "contact_call"
  | "open_google_calendar"
  | "open_google_meet"
  | "open_social_x"
  | "open_social_youtube"
  | "open_social_github"
  | "open_social_facebook"
  | "open_social_instagram"
  | "open_affiliate_tools";

type FunnelStage = "awareness" | "consideration" | "intent";

interface ConversionMeta {
  action: string;
  label: string;
  value: number;
  stage: FunnelStage;
}

export const SERVICE_CONVERSION_EVENTS: Record<ServiceConversionId, ConversionMeta> = {
  open_schedule: {
    action: "open_schedule",
    label: "schedule_route",
    value: 2,
    stage: "consideration",
  },
  open_pricing: {
    action: "open_pricing",
    label: "pricing_route",
    value: 2,
    stage: "consideration",
  },
  open_crypto_project: {
    action: "open_crypto_project",
    label: "crypto_route",
    value: 2,
    stage: "consideration",
  },
  open_dashboard: {
    action: "open_dashboard",
    label: "dashboard_route",
    value: 1,
    stage: "awareness",
  },
  open_game: {
    action: "open_game",
    label: "game_route",
    value: 1,
    stage: "awareness",
  },
  open_music: {
    action: "open_music",
    label: "music_route",
    value: 2,
    stage: "consideration",
  },
  open_portfolio: {
    action: "open_portfolio",
    label: "portfolio_route",
    value: 2,
    stage: "consideration",
  },
  book_repair_quote: {
    action: "book_repair_quote",
    label: "repair_quote",
    value: 8,
    stage: "intent",
  },
  book_guitar_lesson: {
    action: "book_guitar_lesson",
    label: "guitar_booking",
    value: 8,
    stage: "intent",
  },
  book_web3_consult: {
    action: "book_web3_consult",
    label: "web3_consult",
    value: 10,
    stage: "intent",
  },
  book_trading_consult: {
    action: "book_trading_consult",
    label: "trading_consult",
    value: 9,
    stage: "intent",
  },
  book_social_media_consult: {
    action: "book_social_media_consult",
    label: "social_media_consult",
    value: 7,
    stage: "intent",
  },
  book_it_management_consult: {
    action: "book_it_management_consult",
    label: "it_management_consult",
    value: 8,
    stage: "intent",
  },
  book_app_development_consult: {
    action: "book_app_development_consult",
    label: "app_development_consult",
    value: 9,
    stage: "intent",
  },
  book_database_consult: {
    action: "book_database_consult",
    label: "database_consult",
    value: 8,
    stage: "intent",
  },
  book_ecommerce_consult: {
    action: "book_ecommerce_consult",
    label: "ecommerce_consult",
    value: 8,
    stage: "intent",
  },
  email_contact: {
    action: "email_contact",
    label: "support_email",
    value: 7,
    stage: "intent",
  },
  contact_text: {
    action: "contact_text",
    label: "sms_contact",
    value: 8,
    stage: "intent",
  },
  contact_call: {
    action: "contact_call",
    label: "phone_call",
    value: 7,
    stage: "intent",
  },
  open_google_calendar: {
    action: "open_google_calendar",
    label: "calendar_embed",
    value: 3,
    stage: "consideration",
  },
  open_google_meet: {
    action: "open_google_meet",
    label: "google_meet_booking",
    value: 6,
    stage: "intent",
  },
  open_social_x: {
    action: "open_social_x",
    label: "social_x",
    value: 1,
    stage: "awareness",
  },
  open_social_youtube: {
    action: "open_social_youtube",
    label: "social_youtube",
    value: 2,
    stage: "awareness",
  },
  open_social_github: {
    action: "open_social_github",
    label: "social_github",
    value: 1,
    stage: "awareness",
  },
  open_social_facebook: {
    action: "open_social_facebook",
    label: "social_facebook",
    value: 1,
    stage: "awareness",
  },
  open_social_instagram: {
    action: "open_social_instagram",
    label: "social_instagram",
    value: 1,
    stage: "awareness",
  },
  open_affiliate_tools: {
    action: "open_affiliate_tools",
    label: "affiliate_tools",
    value: 3,
    stage: "consideration",
  },
};

export function trackServiceConversion(id: ServiceConversionId, surface: string) {
  const conversion = SERVICE_CONVERSION_EVENTS[id];

  event({
    action: conversion.action,
    category: "service_conversion",
    label: `${conversion.label}:${surface}:${conversion.stage}`,
    value: conversion.value,
  });

  if (typeof window !== "undefined" && window.gtag && conversion.stage === "intent") {
    window.gtag("event", "generate_lead", {
      currency: "USD",
      value: conversion.value,
      event_category: "service_conversion",
      event_label: `${conversion.label}:${surface}`,
    });
  }
}
