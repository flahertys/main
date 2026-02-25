/**
 * Centralized Calendly booking links for all service types including lessons,
 * consultations, and support requests
 */
export const bookingLinks = {
  guitarLessons:
    process.env.NEXT_PUBLIC_BOOKING_GUITAR_LESSONS ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  webDevConsult:
    process.env.NEXT_PUBLIC_BOOKING_WEB3_CONSULT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  tradingConsult:
    process.env.NEXT_PUBLIC_BOOKING_TRADING_CONSULT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  techSupport:
    process.env.NEXT_PUBLIC_BOOKING_TECH_SUPPORT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  socialMediaConsult:
    process.env.NEXT_PUBLIC_BOOKING_SOCIAL_MEDIA_CONSULT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  itManagement:
    process.env.NEXT_PUBLIC_BOOKING_IT_MANAGEMENT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  appDevelopment:
    process.env.NEXT_PUBLIC_BOOKING_APP_DEVELOPMENT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  databaseConsult:
    process.env.NEXT_PUBLIC_BOOKING_DATABASE_CONSULT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
  ecommerceConsult:
    process.env.NEXT_PUBLIC_BOOKING_ECOMMERCE_CONSULT ||
    'https://calendar.app.google/hhBXuJjfaApoXVzc6',
} as const;

/**
 * Canonical in-app scheduling routes used across the site so booking stays
 * under the /schedule umbrella with service-specific context.
 */
export const scheduleLinks = {
  root: '/schedule',
  guitarLessons: '/schedule?service=guitar-lessons',
  webDevConsult: '/schedule?service=web3-consult',
  tradingConsult: '/schedule?service=trading-consult',
  techSupport: '/schedule?service=tech-support',
  socialMediaConsult: '/schedule?service=social-media-consult',
  itManagement: '/schedule?service=it-management',
  appDevelopment: '/schedule?service=app-development',
  databaseConsult: '/schedule?service=database-consult',
  ecommerceConsult: '/schedule?service=ecommerce-consult',
} as const;

export type BookingType = keyof typeof bookingLinks;
