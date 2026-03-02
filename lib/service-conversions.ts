import { event } from "@/lib/analytics";
import { trackExperimentGoal } from "@/lib/experiments";
import type { ExperimentName } from "@/lib/experiments";

export type ServiceConversionId =
  | "open_services"
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
  | "open_social_telegram"
  | "open_social_discord"
  | "open_affiliate_tools"
  | "donate_cashapp"
  | "open_ai_advanced"
  | "open_ai_simple"
  | "open_ai_chat"
  | "open_service_catalog"
  | "open_lesson_packages"
  | "open_lesson_studio";

type FunnelStage = "awareness" | "consideration" | "intent";

interface ConversionMeta {
  action: string;
  label: string;
  value: number;
  stage: FunnelStage;
}

export interface ConversionContext {
  placement?: string;
  variant?: string;
  audience?: "new" | "returning" | "all";
  experiment?: ExperimentName;
}

interface ParsedExperimentAttribution {
  experimentVariant: "control" | "accelerated";
  route?: string;
}

function parseExperimentAttribution(variant?: string): ParsedExperimentAttribution | null {
  if (!variant) {
    return null;
  }

  const segments = variant
    .split(":")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const expSegment = segments.find((segment) => segment.startsWith("exp_"));
  if (!expSegment) {
    return null;
  }

  const experimentVariant = expSegment.replace("exp_", "") === "accelerated" ? "accelerated" : "control";
  const routeSegment = segments.find((segment) => segment !== expSegment);

  return {
    experimentVariant,
    route: routeSegment,
  };
}

export const SERVICE_CONVERSION_EVENTS: Record<ServiceConversionId, ConversionMeta> = {
  open_services: {
    action: "open_services",
    label: "services_route",
    value: 2,
    stage: "consideration",
  },
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
  open_social_telegram: {
    action: "open_social_telegram",
    label: "social_telegram",
    value: 1,
    stage: "awareness",
  },
  open_social_discord: {
    action: "open_social_discord",
    label: "social_discord",
    value: 1,
    stage: "awareness",
  },
  open_affiliate_tools: {
    action: "open_affiliate_tools",
    label: "affiliate_tools",
    value: 3,
    stage: "consideration",
  },
  donate_cashapp: {
    action: "donate_cashapp",
    label: "cashapp_donation",
    value: 5,
    stage: "intent",
  },
  open_ai_advanced: {
    action: "open_ai_advanced",
    label: "ai_advanced_mode",
    value: 3,
    stage: "consideration",
  },
  open_ai_simple: {
    action: "open_ai_simple",
    label: "ai_simple_mode",
    value: 2,
    stage: "consideration",
  },
  open_ai_chat: {
    action: "open_ai_chat",
    label: "ai_chat_focus",
    value: 3,
    stage: "consideration",
  },
  open_service_catalog: {
    action: "open_service_catalog",
    label: "services_catalog",
    value: 2,
    stage: "consideration",
  },
  open_lesson_packages: {
    action: "open_lesson_packages",
    label: "lesson_packages",
    value: 3,
    stage: "consideration",
  },
  open_lesson_studio: {
    action: "open_lesson_studio",
    label: "lesson_studio",
    value: 4,
    stage: "intent",
  },
};

export function trackServiceConversion(id: ServiceConversionId, surface: string, context?: ConversionContext) {
  const conversion = SERVICE_CONVERSION_EVENTS[id];
  const contextSegments = [context?.placement, context?.variant, context?.audience].filter(Boolean).join(":");
  const label = `${conversion.label}:${surface}:${conversion.stage}${contextSegments ? `:${contextSegments}` : ""}`;
  const parsedAttribution = parseExperimentAttribution(context?.variant);

  event({
    action: conversion.action,
    category: "service_conversion",
    label,
    value: conversion.value,
  });

  if (context?.experiment && parsedAttribution) {
    const goalActionSegments = [conversion.action];
    if (context?.placement) {
      goalActionSegments.push(`placement_${context.placement}`);
    }
    if (context?.placement === "route_matrix" && parsedAttribution.route) {
      goalActionSegments.push(`route_${parsedAttribution.route}`);
    }

    trackExperimentGoal(
      context.experiment,
      parsedAttribution.experimentVariant,
      goalActionSegments.join(":"),
      surface,
      conversion.value,
    );
  }

  if (typeof window !== "undefined" && window.gtag && conversion.stage === "intent") {
    window.gtag("event", "generate_lead", {
      currency: "USD",
      value: conversion.value,
      event_category: "service_conversion",
      event_label: `${conversion.label}:${surface}`,
    });
  }
}
