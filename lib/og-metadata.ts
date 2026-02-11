/**
 * Open Graph Metadata Generator
 * Creates optimized metadata for all social media platforms
 */

interface OGMetadata {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  url: string;
  type: 'website' | 'article';
  width?: number;
  height?: number;
}

interface SocialMediaMeta extends OGMetadata {
  twitter?: {
    card: 'summary' | 'summary_large_image';
    creator?: string;
  };
  linkedin?: {
    creator?: string;
  };
  pinterest?: {
    media?: string;
  };
}

const BASE_URL = 'https://tradehaxai.tech';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;
const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;

// Platform-specific image dimensions
const PLATFORM_DIMENSIONS = {
  facebook: { width: 1200, height: 630 },
  twitter: { width: 1024, height: 512 },
  twitter_large: { width: 506, height: 506 },
  linkedin: { width: 1200, height: 627 },
  pinterest: { width: 1000, height: 1500 },
  instagram: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
};

export function generateOGMetadata(
  title: string,
  description: string,
  path: string = '/',
  imagePath: string = DEFAULT_IMAGE,
  type: 'website' | 'article' = 'website',
): SocialMediaMeta {
  const fullUrl = `${BASE_URL}${path}`;
  
  return {
    title: `${title} | TradeHax AI`,
    description: description.slice(0, 160),
    image: imagePath.startsWith('http') ? imagePath : `${BASE_URL}${imagePath}`,
    imageAlt: `${title} - TradeHax AI Trading Platform`,
    url: fullUrl,
    type,
    width: SOCIAL_IMAGE_WIDTH,
    height: SOCIAL_IMAGE_HEIGHT,
    twitter: {
      card: 'summary_large_image',
      creator: '@tradehaxai',
    },
    linkedin: {
      creator: 'tradehax-ai',
    },
    pinterest: {
      media: imagePath.startsWith('http') ? imagePath : `${BASE_URL}${imagePath}`,
    },
  };
}

/**
 * Page-specific metadata configurations
 */
export const PAGE_METADATA = {
  home: generateOGMetadata(
    'Automated Web3 Trading Platform',
    'Advanced automated trading platform powered by Solana blockchain. Trade smarter with AI-driven insights and decentralized technology.',
    '/',
    '/og-home.png'
  ),
  
  game: generateOGMetadata(
    'Hyperborea - Browser Game',
    'Play Hyperborea, an Escher-inspired 3D browser game with NFT rewards and blockchain integration.',
    '/game',
    '/og-game.png'
  ),
  
  dashboard: generateOGMetadata(
    'Trading Dashboard',
    'Monitor your trading performance with comprehensive analytics and real-time portfolio insights.',
    '/dashboard',
    '/og-dashboard.png'
  ),
  
  music: generateOGMetadata(
    'Music & Arts Platform',
    'Learn guitar remotely from professional instructors. Showcase your music and earn SOL tips from fans.',
    '/music',
    '/og-music.png'
  ),
  
  portfolio: generateOGMetadata(
    'Portfolio - Michael S. Flaherty',
    'Full-stack developer & Web3 architect. View projects, skills, and get in touch.',
    '/portfolio',
    '/og-portfolio.png'
  ),
  
  services: generateOGMetadata(
    'Professional Services',
    'Web3 development, trading systems, consulting, and full-stack development services.',
    '/services',
    '/og-services.png'
  ),
  
  blog: generateOGMetadata(
    'Blog - Trading Insights & Web3 Guides',
    'Expert articles on cryptocurrency trading, blockchain technology, and automated trading strategies.',
    '/blog',
    '/og-blog.png'
  ),
};

/**
 * Generate meta tags HTML string for use in head
 */
export function generateMetaTagsHTML(metadata: SocialMediaMeta): string {
  const tags = [
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:image" content="${metadata.image}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(metadata.imageAlt)}" />`,
    `<meta property="og:image:width" content="${metadata.width || 1200}" />`,
    `<meta property="og:image:height" content="${metadata.height || 630}" />`,
    `<meta property="og:url" content="${metadata.url}" />`,
    `<meta property="og:type" content="${metadata.type}" />`,
    `<meta name="twitter:card" content="${metadata.twitter?.card || 'summary_large_image'}" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="twitter:image" content="${metadata.image}" />`,
    `<meta name="twitter:creator" content="${metadata.twitter?.creator || '@tradehaxai'}" />`,
  ];
  
  return tags.join('\n');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Mobile-friendly viewport and browser settings
 */
export const MOBILE_VIEWPORT = 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5';
export const MOBILE_APP_CONFIG = {
  appleStatusBarStyle: 'black-translucent',
  appleMobileWebAppCapable: true,
  appleMobileWebAppStatusBarStyle: 'black-translucent',
  appleMobileWebAppTitle: 'TradeHax AI',
};

/**
 * Browser compatibility features
 */
export const BROWSER_COMPATIBILITY = {
  chrome: '100+',
  firefox: '95+',
  safari: '14+',
  edge: '100+',
};

/**
 * RTTL (Real-Time Trading Live) specific meta tags
 */
export function generateRTTLMetaTags(title: string, type: string = 'trading') {
  return {
    'rttl:title': title,
    'rttl:type': type,
    'rttl:updated': new Date().toISOString(),
    'rttl:platform': 'tradehaxai.tech',
  };
}
