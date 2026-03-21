/**
 * Responsive Design Utilities
 * Mobile-first responsive breakpoints and utilities
 */

// Breakpoints
export const breakpoints = {
  xs: 320,      // Extra small phones
  sm: 640,      // Small phones and tablets
  md: 768,      // Medium tablets
  lg: 1024,     // Large tablets and small desktops
  xl: 1280,     // Desktops
  '2xl': 1536   // Large desktops
};

// Media queries
export const media = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,

  // Maximum width (mobile-first reverse)
  smDown: `(max-width: ${breakpoints.sm - 1}px)`,
  mdDown: `(max-width: ${breakpoints.md - 1}px)`,
  lgDown: `(max-width: ${breakpoints.lg - 1}px)`,
  xlDown: `(max-width: ${breakpoints.xl - 1}px)`,

  // Touch devices
  touch: '(hover: none) and (pointer: coarse)',
  noTouch: '(hover: hover) and (pointer: fine)',

  // Landscape/Portrait
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',

  // High DPI devices
  highDpi: '(min-resolution: 2dppx)',
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',

  // Reduced motion
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersNoReducedMotion: '(prefers-reduced-motion: no-preference)',

  // Dark mode
  prefersDarkMode: '(prefers-color-scheme: dark)',
  prefersLightMode: '(prefers-color-scheme: light)'
};

// Touch-friendly dimensions
export const touchDimensions = {
  minTargetSize: 44,      // iOS/Android minimum touch target
  minTargetSizeLarge: 48, // WCAG AA recommended
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px'
  }
};

// Responsive utilities
export const responsive = {
  // Font sizes that scale with viewport
  scalingFontSize: (baseSize: number, minSize: number, maxSize: number) => {
    return `clamp(${minSize}px, ${baseSize}vw, ${maxSize}px)`;
  },

  // Spacing that adapts to screen size
  scalingSpacing: (minValue: number, baseValue: number, maxValue: number) => {
    return `clamp(${minValue}px, ${baseValue}vw, ${maxValue}px)`;
  },

  // Flexible layout
  flexContainer: (direction = 'row', gap = 16, isMobile = false) => ({
    display: 'flex',
    flexDirection: direction as any,
    gap: `${gap}px`,
    flexWrap: isMobile ? 'wrap' : 'nowrap'
  }),

  // Grid that switches between 1 column on mobile and multiple on desktop
  responsiveGrid: (
    mobileColumns: number = 1,
    tabletColumns: number = 2,
    desktopColumns: number = 3,
    gap: number = 16
  ) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${mobileColumns}, 1fr)`,
    gap: `${gap}px`,
    [`@media ${media.md}`]: {
      gridTemplateColumns: `repeat(${tabletColumns}, 1fr)`
    },
    [`@media ${media.lg}`]: {
      gridTemplateColumns: `repeat(${desktopColumns}, 1fr)`
    }
  })
};

/**
 * CSS-in-JS media query helpers
 */
export const createMediaQuery = (breakpoint: keyof typeof media) => {
  return `@media ${media[breakpoint]}`;
};

/**
 * Safe area insets for notched devices
 */
export const safeAreaInsets = {
  top: 'max(env(safe-area-inset-top), 0px)',
  right: 'max(env(safe-area-inset-right), 0px)',
  bottom: 'max(env(safe-area-inset-bottom), 0px)',
  left: 'max(env(safe-area-inset-left), 0px)',

  // Shortcuts
  vertical: 'max(env(safe-area-inset-top), 0px) + max(env(safe-area-inset-bottom), 0px)',
  horizontal: 'max(env(safe-area-inset-left), 0px) + max(env(safe-area-inset-right), 0px)'
};

/**
 * Mobile-friendly button styles
 */
export const mobileButtonStyles = {
  touchButton: {
    minHeight: '44px',
    minWidth: '44px',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    WebkitUserSelect: 'none' as const,

    // Remove 300ms tap delay on mobile
    WebkitTapHighlightColor: 'transparent' as any,

    // Ensure readable text on mobile
    '@media (prefers-reduced-motion: no-preference)': {
      transition: 'all 150ms ease-out'
    }
  },

  // For iOS form elements
  iosInput: {
    fontSize: '16px', // Prevents zoom on iOS input
    borderRadius: '8px',
    appearance: 'none' as any,
    WebkitAppearance: 'none' as any
  }
};

export default {
  breakpoints,
  media,
  touchDimensions,
  responsive,
  createMediaQuery,
  safeAreaInsets,
  mobileButtonStyles
};

