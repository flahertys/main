'use client';

import Script from 'next/script';

interface AdSenseBlockProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Strategic AdSense placement component
 * Optimized for maximum revenue with balanced UX
 */
export function AdSenseBlock({ 
  adSlot, 
  adFormat = 'auto', 
  className = '',
  style = {}
}: AdSenseBlockProps) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  
  if (!adsenseId) {
    // Don't show ads in development without AdSense ID
    return null;
  }

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <div className={`adsense-container ${className}`} style={style}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', ...style }}
          data-ad-client={adsenseId}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
        <Script id={`adsense-init-${adSlot}`} strategy="afterInteractive">
          {`
            try {
              if (window.adsbygoogle) {
                (window.adsbygoogle).push({});
              }
            } catch (e) {
              console.error('AdSense error:', e);
            }
          `}
        </Script>
      </div>
    </>
  );
}

// Pre-configured ad components for common placements

export function HeaderBannerAd() {
  return (
    <AdSenseBlock
      adSlot="header-banner"
      adFormat="horizontal"
      className="w-full max-w-7xl mx-auto my-4"
      style={{ minHeight: '90px' }}
    />
  );
}

export function SidebarAd() {
  return (
    <AdSenseBlock
      adSlot="sidebar-ad"
      adFormat="vertical"
      className="sticky top-4"
      style={{ minHeight: '600px', maxWidth: '300px' }}
    />
  );
}

export function InContentAd() {
  return (
    <AdSenseBlock
      adSlot="in-content-ad"
      adFormat="auto"
      className="my-8"
      style={{ minHeight: '250px' }}
    />
  );
}

export function FooterBannerAd() {
  return (
    <AdSenseBlock
      adSlot="footer-banner"
      adFormat="horizontal"
      className="w-full max-w-7xl mx-auto my-4"
      style={{ minHeight: '90px' }}
    />
  );
}

export function MobileInterstitialAd() {
  return (
    <AdSenseBlock
      adSlot="mobile-interstitial"
      adFormat="fluid"
      className="md:hidden my-4"
      style={{ minHeight: '100px' }}
    />
  );
}
