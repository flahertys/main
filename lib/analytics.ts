// Google Analytics helpers
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Enhanced event tracking for monetization
 */
export const trackEvent = {
  // Revenue Events
  adClick: (adSlot: string) => {
    event({
      action: 'ad_click',
      category: 'monetization',
      label: adSlot,
      value: 1, // Estimated CPM value
    });
  },

  emailSignup: (source: string = 'unknown') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'USD',
        value: 5, // Estimated lead value
        event_category: 'conversion',
        event_label: source,
      });
    }
  },

  affiliateClick: (partner: string) => {
    event({
      action: 'affiliate_click',
      category: 'monetization',
      label: partner,
      value: 1,
    });
  },

  premiumPurchase: (amount: number, tier: string = 'premium') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        currency: 'USD',
        value: amount,
        event_category: 'conversion',
        event_label: tier,
      });
    }
  },

  // Engagement Events
  videoPlay: (videoId: string) => {
    event({
      action: 'video_start',
      category: 'engagement',
      label: videoId,
    });
  },

  gameStart: () => {
    event({
      action: 'game_start',
      category: 'engagement',
      label: 'hyperborea',
    });
  },

  walletConnect: (walletType: string = 'unknown') => {
    event({
      action: 'wallet_connect',
      category: 'web3',
      label: walletType,
    });
  },

  tradeExecuted: (amount: number, token: string = 'SOL') => {
    event({
      action: 'trade_executed',
      category: 'web3',
      label: token,
      value: amount,
    });
  },

  // Custom Revenue Tracking (for admin dashboard)
  dailyRevenue: (amount: number, source: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'revenue', {
        currency: 'USD',
        value: amount,
        event_category: 'monetization',
        event_label: source,
      });
    }
  },

  // User Engagement
  scrollDepth: (percentage: number) => {
    event({
      action: 'scroll_depth',
      category: 'engagement',
      label: `${percentage}%`,
      value: percentage,
    });
  },

  timeOnPage: (seconds: number, page: string) => {
    event({
      action: 'time_on_page',
      category: 'engagement',
      label: page,
      value: seconds,
    });
  },

  // Content Interactions
  blogPostRead: (slug: string, readTime: number) => {
    event({
      action: 'blog_post_read',
      category: 'content',
      label: slug,
      value: readTime,
    });
  },

  downloadResume: () => {
    event({
      action: 'download_resume',
      category: 'conversion',
      label: 'portfolio',
      value: 3, // Estimated lead value
    });
  },

  contactFormSubmit: (formType: string = 'general') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'USD',
        value: 10, // Higher value for direct contact
        event_category: 'conversion',
        event_label: formType,
      });
    }
  },
};
