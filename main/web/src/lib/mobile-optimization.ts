/**
 * Mobile & Browser Optimization Utilities
 * Provides responsive detection, device capabilities, and performance optimizations
 */

/**
 * Detects if the device is mobile/tablet
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detects specific device types
 */
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipod/.test(ua)) return 'iphone';
  if (/ipad/.test(ua)) return 'ipad';
  if (/android/.test(ua)) return 'android';
  if (/windows phone/.test(ua)) return 'windows-phone';
  if (/blackberry/.test(ua)) return 'blackberry';

  return 'desktop';
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
  if (typeof window === 'undefined') return { name: 'unknown', version: 'unknown' };

  const ua = navigator.userAgent;
  let browserName = 'unknown';
  let version = 'unknown';

  if (ua.indexOf('Firefox') > -1) {
    browserName = 'firefox';
    version = ua.split('Firefox/')[1]?.split(' ')[0] || 'unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) {
    browserName = 'chrome';
    version = ua.split('Chrome/')[1]?.split(' ')[0] || 'unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'safari';
    version = ua.split('Version/')[1]?.split(' ')[0] || 'unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'edge';
    version = ua.split('Edge/')[1]?.split(' ')[0] || 'unknown';
  } else if (ua.indexOf('Trident') > -1) {
    browserName = 'ie';
    version = ua.split('rv:')[1]?.split(')')[0] || 'unknown';
  }

  return { name: browserName, version };
};

/**
 * Check if browser supports modern features
 */
export const checkBrowserCapabilities = () => {
  if (typeof window === 'undefined') return {};

  return {
    // API support checks
    hasIndexedDB: !!window.indexedDB,
    hasServiceWorker: !!navigator.serviceWorker,
    hasWebWorker: typeof Worker !== 'undefined',
    hasLocalStorage: () => {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },

    // Performance API
    hasPerformanceAPI: !!window.performance,
    hasNavigationTiming: !!window.performance?.timing,

    // Visibility API
    hasVisibilityAPI: typeof document !== 'undefined' && typeof document.hidden !== 'undefined',

    // Intersection Observer
    hasIntersectionObserver: !!window.IntersectionObserver,

    // Resize Observer
    hasResizeObserver: !!window.ResizeObserver,

    // WebGL
    hasWebGL: () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      } catch (e) {
        return false;
      }
    },

    // CSS Grid
    hasCSSGrid: !!CSS?.supports?.('display', 'grid'),

    // CSS Flexbox
    hasFlexbox: !!CSS?.supports?.('display', 'flex'),

    // CSS Custom Properties
    hasCSSVariables: !!CSS?.supports?.('--custom', '0'),

    // Passive events
    supportsPassiveEvents: () => {
      let passiveSupported = false;
      try {
        const options = {
          get passive() {
            passiveSupported = true;
            return false;
          }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
      } catch (err) {
        passiveSupported = false;
      }
      return passiveSupported;
    }
  };
};

/**
 * Detect network speed and connection type
 */
export const getConnectionInfo = () => {
  if (typeof navigator === 'undefined') return { type: 'unknown', speed: 'unknown' };

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    return { type: 'unknown', speed: 'unknown' };
  }

  return {
    type: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 'unknown',
    rtt: connection.rtt || 'unknown',
    saveData: connection.saveData || false
  };
};

/**
 * Optimize for slow networks
 */
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check dark mode preference
 */
export const prefersDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Detect screen size and device class
 */
export const getScreenClass = () => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  if (width < 640) return 'mobile';      // Small mobile
  if (width < 768) return 'mobile-lg';   // Large mobile
  if (width < 1024) return 'tablet';     // Tablet
  if (width < 1280) return 'desktop';    // Small desktop
  return 'desktop-lg';                   // Large desktop
};

/**
 * Check if device has touch support
 */
export const hasTouchSupport = () => {
  if (typeof window === 'undefined') return false;

  return (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0)
  );
};

/**
 * Check if user prefers reduced data
 */
export const prefersReducedData = () => {
  if (typeof navigator === 'undefined') return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection?.saveData || false;
};

/**
 * Get optimal image format for browser
 */
export const getOptimalImageFormat = () => {
  if (typeof document === 'undefined') return 'jpeg';

  // Check WebP support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  if (canvas.toDataURL('image/webp').indexOf('image/webp') === 0) {
    return 'webp';
  }

  // Check AVIF support (modern browsers)
  if (CSS?.supports?.('image-set(url(test.avif) type("image/avif"))')) {
    return 'avif';
  }

  return 'jpeg';
};

/**
 * Lazy load images efficiently
 */
export const observeImages = (selector = 'img[data-src]') => {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    // Fallback for older browsers
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px'
  });

  document.querySelectorAll(selector).forEach(img => {
    imageObserver.observe(img);
  });
};

/**
 * Handle viewport changes efficiently
 */
export const onViewportChange = (callback) => {
  if (typeof window === 'undefined') return;

  const mediaQueries = {
    mobile: window.matchMedia('(max-width: 640px)'),
    mobileLg: window.matchMedia('(max-width: 768px)'),
    tablet: window.matchMedia('(max-width: 1024px)'),
    desktop: window.matchMedia('(min-width: 1024px)')
  };

  const handleChange = () => {
    const screenClass = getScreenClass();
    callback(screenClass);
  };

  Object.values(mediaQueries).forEach(mq => {
    mq.addListener(handleChange);
  });

  // Initial call
  handleChange();
};

/**
 * Performance monitoring
 */
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const timing = window.performance.timing;
  const navigation = window.performance.navigation;

  if (!timing) return null;

  return {
    // Navigation timing
    domInteractive: timing.domInteractive - timing.navigationStart,
    domComplete: timing.domComplete - timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart,

    // Resource timing
    resourcesTime: timing.responseEnd - timing.fetchStart,
    renderTime: timing.domComplete - timing.domLoading,

    // Navigation type
    navigationType: navigation.type === 0 ? 'navigate' :
                    navigation.type === 1 ? 'reload' :
                    navigation.type === 2 ? 'back_forward' : 'unknown'
  };
};

/**
 * Disable transitions on low-end devices
 */
export const disableTransitionsOnLowEndDevices = () => {
  if (typeof window === 'undefined') return;

  const memoryInfo = (navigator as any).deviceMemory;
  const cores = (navigator as any).hardwareConcurrency;

  // Disable animations on very low-end devices
  if ((memoryInfo && memoryInfo < 4) || (cores && cores < 2)) {
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
};

export default {
  isMobileDevice,
  getDeviceType,
  getBrowserInfo,
  checkBrowserCapabilities,
  getConnectionInfo,
  shouldReduceMotion,
  prefersDarkMode,
  getScreenClass,
  hasTouchSupport,
  prefersReducedData,
  getOptimalImageFormat,
  observeImages,
  onViewportChange,
  getPerformanceMetrics,
  disableTransitionsOnLowEndDevices
};

