/**
 * Calendly booking links for all service types
 * Used for scheduling consultations and lessons
 */
export const bookingLinks = {
  guitarLessons: 'https://calendly.com/tradehaxai/guitar-lesson',
  webDevConsult: 'https://calendly.com/tradehaxai/web-consultation',
  tradingConsult: 'https://calendly.com/tradehaxai/trading-strategy',
  techSupport: 'https://calendly.com/tradehaxai/tech-support',
  socialMediaConsult: 'https://calendly.com/tradehaxai/social-media-consult',
  itManagement: 'https://calendly.com/tradehaxai/it-management',
  appDevelopment: 'https://calendly.com/tradehaxai/app-dev-consult',
  databaseConsult: 'https://calendly.com/tradehaxai/database-consult',
  ecommerceConsult: 'https://calendly.com/tradehaxai/ecommerce-consult',
} as const;

export type BookingType = keyof typeof bookingLinks;
