'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Web Vitals Reporter: Tracks Core Web Vitals (LCP, FID, CLS) and sends to Sentry.
 * Enables performance monitoring and competitive benchmarking vs Coinbase/Kraken.
 *
 * Metrics:
 * - LCP (Largest Contentful Paint): When largest visible element renders (<2.5s = good)
 * - FID (First Input Delay): Responsiveness to user interaction (<100ms = good)
 * - CLS (Cumulative Layout Shift): Visual stability (<0.1 = good)
 * - TTFB (Time to First Byte): Server response time (<600ms = good)
 */
export function WebVitalsReporter() {
    useEffect(() => {
        // Dynamically import web-vitals to keep it from blocking page load
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            // Track Largest Contentful Paint (LCP)
            getLCP((metric) => {
                Sentry.captureMessage('[PERF] LCP', {
                    level: 'info',
                    tags: {
                        metric_type: 'Core Web Vital',
                        metric_name: 'LCP',
                        rating: metric.rating || 'unknown',
                    },
                    extra: {
                        value: metric.value,
                        id: metric.id,
                        navigation_type: metric.navigationTiming?.entryType,
                    },
                });

                // Log to console in development
                if (process.env.NODE_ENV === 'development') {
                    console.log('[LCP]', metric.value, 'ms', metric.rating);
                }
            });

            // Track First Input Delay (FID)
            getFID((metric) => {
                Sentry.captureMessage('[PERF] FID', {
                    level: metric.rating === 'poor' ? 'warning' : 'info',
                    tags: {
                        metric_type: 'Core Web Vital',
                        metric_name: 'FID',
                        rating: metric.rating || 'unknown',
                    },
                    extra: {
                        value: metric.value,
                        id: metric.id,
                        event_type: (metric as any).eventType,
                    },
                });

                if (process.env.NODE_ENV === 'development') {
                    console.log('[FID]', metric.value, 'ms', metric.rating);
                }
            });

            // Track Cumulative Layout Shift (CLS)
            getCLS((metric) => {
                Sentry.captureMessage('[PERF] CLS', {
                    level: metric.rating === 'poor' ? 'warning' : 'info',
                    tags: {
                        metric_type: 'Core Web Vital',
                        metric_name: 'CLS',
                        rating: metric.rating || 'unknown',
                    },
                    extra: {
                        value: metric.value,
                        id: metric.id,
                        entries: (metric as any).entries?.length || 0,
                    },
                });

                if (process.env.NODE_ENV === 'development') {
                    console.log('[CLS]', metric.value, metric.rating);
                }
            });

            // Track First Contentful Paint (FCP) - earlier paint metric
            getFCP((metric) => {
                Sentry.captureMessage('[PERF] FCP', {
                    level: 'info',
                    tags: {
                        metric_type: 'Paint Timing',
                        metric_name: 'FCP',
                        rating: metric.rating || 'unknown',
                    },
                    extra: {
                        value: metric.value,
                        id: metric.id,
                    },
                });
            });

            // Track Time to First Byte (TTFB) - server response time
            getTTFB((metric) => {
                Sentry.captureMessage('[PERF] TTFB', {
                    level: metric.rating === 'poor' ? 'warning' : 'info',
                    tags: {
                        metric_type: 'Server Timing',
                        metric_name: 'TTFB',
                        rating: metric.rating || 'unknown',
                    },
                    extra: {
                        value: metric.value,
                        id: metric.id,
                    },
                });
            });
        });
    }, []);

    // This component doesn't render anything
    return null;
}
