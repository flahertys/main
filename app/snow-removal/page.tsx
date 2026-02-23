/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import type { Metadata } from 'next';
import SnowRemovalForm from '@/components/SnowRemovalForm';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Professional Snow Removal Services | Reliable & Affordable',
  description: 'Fast, reliable snow removal for driveways and walkways. Get a quote today. Serving the area with same-day service options.',
  keywords: ['snow removal', 'driveway clearing', 'snow services', 'winter maintenance', 'landscaping'],
  metadataBase: new URL(siteConfig.primarySiteUrl),
  openGraph: {
    title: 'Professional Snow Removal Services | Fast & Reliable',
    description: 'Get your driveway and walkways cleared quickly. Professional snow removal with trusted local service.',
    url: `${siteConfig.primarySiteUrl}/snow-removal`,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/api/og/snow-removal',
        width: 1200,
        height: 630,
        alt: 'Professional snow removal services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Snow Removal Services',
    description: 'Fast, reliable snow removal for driveways and walkways.',
    images: ['/api/og/snow-removal'],
  },
};

const flakeVariants = [
  'snowflake-v1',
  'snowflake-v2',
  'snowflake-v3',
  'snowflake-v4',
  'snowflake-v5',
  'snowflake-v6',
  'snowflake-v7',
  'snowflake-v8',
  'snowflake-v9',
  'snowflake-v10',
  'snowflake-v11',
  'snowflake-v12',
  'snowflake-v13',
  'snowflake-v14',
];

export default function SnowRemovalPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(96,165,250,0.12),transparent_35%),radial-gradient(circle_at_50%_120%,rgba(15,23,42,0.95),rgba(2,6,23,1)_70%)]" />

      <div className="snowstorm-bg" aria-hidden="true">
        <div className="snowstorm-wind" />
        {Array.from({ length: 56 }, (_, index) => (
          <span
            key={`flake-${index}`}
            className={`snowflake ${flakeVariants[index % flakeVariants.length]}`}
          />
        ))}
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:py-10 md:px-6 md:py-14">
        <header className="rounded-2xl border border-white/15 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <p className="mb-3 inline-flex rounded-full border border-sky-300/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                Local Winter Services
              </p>
              <h1 className="text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl md:text-5xl">
                Snow Removal Services
              </h1>
              <p className="mt-3 max-w-2xl text-xs text-slate-200 sm:text-sm md:text-base">
                Fast, reliable snow removal for driveways and walkways. I&apos;ll handle jobs personally whenever possible, and if I&apos;m overbooked I can coordinate with trusted local landscaping contacts so your property still gets cleared quickly.
              </p>
            </div>

            <div className="flex gap-3 text-3xl sm:flex-col sm:gap-2 sm:text-4xl md:text-5xl">
              <span role="img" aria-label="snowman">⛄</span>
              <span role="img" aria-label="shovel">🔱</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold text-sky-100 sm:text-sm md:text-base">
              📞 <a className="underline decoration-sky-300/60 underline-offset-4 hover:text-sky-50 transition" href="tel:+18563208570">(856) 320-8570</a>
            </p>
            <p className="text-xs font-semibold text-sky-100 sm:text-sm md:text-base">
              ✉️ <a className="underline decoration-sky-300/60 underline-offset-4 hover:text-sky-50 transition" href="mailto:njsnowremoval26@gmail.com">njsnowremoval26@gmail.com</a>
            </p>
          </div>
        </header>

        <SnowRemovalForm />
      </section>
    </main>
  );
}
