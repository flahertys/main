'use client';

import { ExternalLink, TrendingUp } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { getAffiliateLink, isAffiliateConfigured } from '@/lib/affiliates';

interface AffiliateBannerProps {
  partner: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  badge?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Affiliate promotion banner with tracking
 */
export function AffiliateBanner({
  partner,
  title,
  description,
  ctaText,
  href,
  badge,
  className = '',
  disabled = false,
}: AffiliateBannerProps) {
  const handleClick = () => {
    if (disabled) return;
    trackEvent.affiliateClick(partner);
  };

  return (
    <div className={`theme-panel relative p-6 ${className}`}>
      {badge && (
        <div className="absolute top-4 right-4 rounded-full border border-[#ffd76e]/55 bg-[#2e2209]/92 px-3 py-1 text-xs font-bold text-[#ffe59d]">
          {badge}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg border border-[#79efb6]/48 bg-[#0d261c]/86 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="theme-title text-xl font-bold mb-2">
            {title}
          </h3>
          <p className="theme-subtitle text-sm mb-4">
            {description}
          </p>
          
          {disabled ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#617683]/45 bg-[#18222a]/82 px-6 py-2 font-semibold text-[#a6bcc9] cursor-not-allowed">
              Configure Referral URL
            </span>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleClick}
              className="theme-cta theme-cta--loud px-6 py-2"
            >
              {ctaText}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact affiliate link with tracking
 */
export function AffiliateLink({
  partner,
  children,
  href,
  className = '',
}: {
  partner: string;
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  const handleClick = () => {
    trackEvent.affiliateClick(partner);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={`text-green-400 hover:text-green-300 underline decoration-dotted transition-colors ${className}`}
    >
      {children}
    </a>
  );
}

/**
 * Recommended tools section with affiliate links
 */
export function RecommendedTools() {
  const coinbase = getAffiliateLink('coinbase');
  const binance = getAffiliateLink('binance');
  const phantom = getAffiliateLink('phantom');
  const coinbaseConfigured = isAffiliateConfigured('coinbase');
  const binanceConfigured = isAffiliateConfigured('binance');
  const phantomConfigured = isAffiliateConfigured('phantom');

  return (
    <div className="space-y-4">
      <h2 className="theme-title text-2xl font-bold mb-6">
        🛠️ Recommended Trading Tools
      </h2>
      
      <AffiliateBanner
        partner="coinbase"
        title="Coinbase - Best for Beginners"
        description="Get $10 in Bitcoin when you buy $100 or more. Trusted by millions worldwide."
        ctaText="Get $10 Bonus"
        href={coinbase?.url || '#'}
        disabled={!coinbaseConfigured}
        badge="$10 BONUS"
      />
      
      <AffiliateBanner
        partner="binance"
        title="Binance - Advanced Trading"
        description="Trade 350+ cryptocurrencies with the world's largest crypto exchange. Low fees and high liquidity."
        ctaText="Start Trading"
        href={binance?.url || '#'}
        disabled={!binanceConfigured}
      />
      
      <AffiliateBanner
        partner="phantom"
        title="Phantom Wallet - Solana Wallet"
        description="The easiest way to store and swap tokens on Solana. Required for trading on our platform."
        ctaText="Download Phantom"
        href={phantom?.url || '#'}
        disabled={!phantomConfigured}
      />
    </div>
  );
}
