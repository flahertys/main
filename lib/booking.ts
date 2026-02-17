/**
 * Centralized Calendly booking links for all service types including lessons,
 * consultations, and support requests
 */
export const bookingLinks = {
  guitarLessons:
    process.env.NEXT_PUBLIC_BOOKING_GUITAR_LESSONS ||
    'https://calendly.com/tradehaxai/guitar-lesson',
  webDevConsult:
    process.env.NEXT_PUBLIC_BOOKING_WEB3_CONSULT ||
    'https://calendly.com/tradehaxai/web-consultation',
  tradingConsult:
    process.env.NEXT_PUBLIC_BOOKING_TRADING_CONSULT ||
    'https://calendly.com/tradehaxai/trading-strategy',
  techSupport:
    process.env.NEXT_PUBLIC_BOOKING_TECH_SUPPORT ||
    'https://calendly.com/tradehaxai/tech-support',
  socialMediaConsult:
    process.env.NEXT_PUBLIC_BOOKING_SOCIAL_MEDIA_CONSULT ||
    'https://calendly.com/tradehaxai/social-media-consult',
  itManagement:
    process.env.NEXT_PUBLIC_BOOKING_IT_MANAGEMENT ||
    'https://calendly.com/tradehaxai/it-management',
  appDevelopment:
    process.env.NEXT_PUBLIC_BOOKING_APP_DEVELOPMENT ||
    'https://calendly.com/tradehaxai/app-dev-consult',
  databaseConsult:
    process.env.NEXT_PUBLIC_BOOKING_DATABASE_CONSULT ||
    'https://calendly.com/tradehaxai/database-consult',
  ecommerceConsult:
    process.env.NEXT_PUBLIC_BOOKING_ECOMMERCE_CONSULT ||
    'https://calendly.com/tradehaxai/ecommerce-consult',
} as const;

export type BookingType = keyof typeof bookingLinks;
