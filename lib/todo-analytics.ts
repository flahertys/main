// Enhanced analytics tracking for todos
import { event as gaEvent } from './analytics';

export const trackEvent = {
  pageView: (path: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
        page_path: path,
      });
    }
  },

  todoCreated: () => {
    gaEvent({
      action: 'todo_created',
      category: 'engagement',
      label: 'task_management',
    });
  },

  todoCompleted: () => {
    gaEvent({
      action: 'todo_completed',
      category: 'engagement',
      label: 'task_management',
      value: 1,
    });
  },

  todoDeleted: () => {
    gaEvent({
      action: 'todo_deleted',
      category: 'engagement',
      label: 'task_management',
    });
  },

  hitPaywall: (reason: string) => {
    gaEvent({
      action: 'paywall_hit',
      category: 'conversion',
      label: reason,
      value: 5,
    });
  },

  premiumUpgradeClick: (source: string) => {
    gaEvent({
      action: 'premium_upgrade_click',
      category: 'conversion',
      label: source,
      value: 4.99,
    });
  },

  premiumPurchaseComplete: (transactionId: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: 4.99,
        currency: 'USD',
        items: [{
          item_id: 'premium-todo',
          item_name: 'Premium To-Do Subscription',
          price: 4.99,
          quantity: 1
        }]
      });
    }
  },
};
