'use client';

import { Check, Zap, Star, Crown } from 'lucide-react';

/**
 * Premium subscription upgrade CTA
 * Promotes paid tier with clear value proposition
 */
export function PremiumUpgrade() {
  const handleUpgradeClick = () => {
    // Track premium upgrade click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'premium_upgrade_click', {
        event_category: 'conversion',
        event_label: 'premium_cta',
        value: 10,
      });
    }
    // TODO: Redirect to Stripe checkout
    window.location.href = '/api/stripe/checkout';
  };

  return (
    <div className="theme-panel relative p-8">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.08]" />
      
      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd86d]/60 bg-[#261d08]/90 px-4 py-2 text-sm font-bold text-[#ffe7a9] mb-6">
          <Crown className="w-4 h-4" />
          LIMITED OFFER
        </div>

        {/* Title */}
        <h2 className="theme-title text-3xl md:text-4xl font-bold mb-4">
          Upgrade to Premium
        </h2>
        
        <p className="theme-subtitle text-lg mb-6">
          Unlock advanced trading signals, ad-free experience, and exclusive strategies used by professional traders.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Feature icon={<Zap className="w-5 h-5" />} text="Real-time AI Trading Signals" />
          <Feature icon={<Star className="w-5 h-5" />} text="Ad-Free Experience" />
          <Feature icon={<Check className="w-5 h-5" />} text="Priority Support 24/7" />
          <Feature icon={<Check className="w-5 h-5" />} text="Advanced Analytics Dashboard" />
          <Feature icon={<Check className="w-5 h-5" />} text="Exclusive Trading Strategies" />
          <Feature icon={<Check className="w-5 h-5" />} text="Portfolio Risk Analysis" />
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-bold text-white">$9.99</span>
          <span className="text-[#afc4d1]">/month</span>
          <span className="ml-4 rounded-full border border-[#73f5ab]/45 bg-[#0d2118]/85 px-3 py-1 text-sm text-[#92ffc0]">
            Save $20 vs. competitors
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleUpgradeClick}
          className="theme-cta theme-cta--loud w-full md:w-auto px-8 py-4 text-lg"
        >
          Upgrade Now →
        </button>

        <p className="text-[#8ca4b2] text-sm mt-4">
          🔒 Cancel anytime. No commitments.
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-[#e2f2ff]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full border border-[#84efbc]/40 bg-[#0d2319]/80 flex items-center justify-center text-[#93ffbf]">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}

/**
 * Compact premium banner for sidebar placement
 */
export function PremiumBanner() {
  const handleClick = () => {
    // Track banner click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'premium_banner_click', {
        event_category: 'conversion',
        event_label: 'sidebar_banner',
        value: 10,
      });
    }
    window.location.href = '/api/stripe/checkout';
  };

  return (
    <div className="theme-panel p-6">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-5 h-5 text-[#ffe08f]" />
        <span className="text-[#ffe08f] font-bold text-sm">PREMIUM</span>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2">
        Go Ad-Free + Get Signals
      </h3>
      
      <p className="text-[#a3bac8] text-sm mb-4">
        Unlock advanced features for $9.99/mo
      </p>
      
      <button
        onClick={handleClick}
        className="theme-cta theme-cta--secondary w-full px-4 py-2"
      >
        Upgrade Now
      </button>
    </div>
  );
}
