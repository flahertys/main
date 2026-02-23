/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import SnowRemovalForm from '@/components/SnowRemovalForm';
import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

const atlanticCountyMunicipalities = [
  'Absecon',
  'Atlantic City',
  'Brigantine',
  'Buena',
  'Buena Vista Township',
  'Corbin City',
  'Egg Harbor City',
  'Egg Harbor Township',
  'Estell Manor',
  'Folsom',
  'Galloway Township',
  'Hamilton Township (Mays Landing)',
  'Hammonton',
  'Linwood',
  'Longport',
  'Margate City',
  'Mullica Township',
  'Northfield',
  'Pleasantville',
  'Port Republic',
  'Somers Point',
  'Ventnor City',
  'Weymouth Township',
];

const snowRemovalKeywords = [
  'snow removal New Jersey',
  'snow removal South Jersey',
  'snow removal Atlantic County NJ',
  'snow plowing Atlantic County',
  'driveway snow removal Atlantic County',
  'residential snow removal South Jersey',
  'commercial snow removal South Jersey',
  'same day snow removal NJ',
  'ice management Atlantic County',
  'walkway clearing New Jersey',
  'snow shoveling service NJ',
  'emergency snow removal NJ',
  'parking lot snow plowing South Jersey',
  'snow removal Atlantic City',
  'snow removal Absecon',
  'snow removal Brigantine',
  'snow removal Buena NJ',
  'snow removal Buena Vista Township',
  'snow removal Corbin City',
  'snow removal Egg Harbor City',
  'snow removal Egg Harbor Township',
  'snow removal Estell Manor',
  'snow removal Folsom NJ',
  'snow removal Galloway Township',
  'snow removal Hamilton Township Atlantic County',
  'snow removal Hammonton',
  'snow removal Linwood NJ',
  'snow removal Longport NJ',
  'snow removal Margate City',
  'snow removal Mullica Township',
  'snow removal Northfield NJ',
  'snow removal Pleasantville NJ',
  'snow removal Port Republic NJ',
  'snow removal Somers Point',
  'snow removal Ventnor City',
  'snow removal Weymouth Township',
];

export const metadata: Metadata = {
  title: 'Snow Removal New Jersey | South Jersey & Atlantic County Snow Plowing',
  description: 'Fast, local snow removal in New Jersey and South Jersey, including Atlantic County: Atlantic City, Egg Harbor Township, Hammonton, Brigantine, Absecon, Pleasantville, Somers Point, Ventnor, Margate and more.',
  keywords: snowRemovalKeywords,
  metadataBase: new URL(siteConfig.primarySiteUrl),
  alternates: {
    canonical: `${siteConfig.primarySiteUrl}/snow-removal`,
  },
  openGraph: {
    title: 'Snow Removal in New Jersey, South Jersey & Atlantic County',
    description: 'Trusted local snow plowing and driveway clearing across Atlantic County NJ, including Atlantic City, Egg Harbor Township, Hammonton, Somers Point, Ventnor and surrounding towns.',
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
    title: 'Snow Removal New Jersey | South Jersey & Atlantic County',
    description: 'Local snow plowing and driveway clearing in Atlantic County and South Jersey.',
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
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteConfig.primarySiteUrl}/snow-removal#business`,
    name: 'South Jersey Snow Removal',
    description:
      'Residential and commercial snow removal, plowing, and driveway clearing across Atlantic County and South Jersey.',
    url: `${siteConfig.primarySiteUrl}/snow-removal`,
    telephone: '+1-856-320-8570',
    email: 'njsnowremoval26@gmail.com',
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Atlantic County, New Jersey',
      },
      ...atlanticCountyMunicipalities.map((city) => ({
        '@type': 'City',
        name: city,
      })),
    ],
    sameAs: [siteConfig.primarySiteUrl],
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

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
                Snow Removal New Jersey & South Jersey
              </h1>
              <p className="mt-3 max-w-2xl text-xs text-slate-200 sm:text-sm md:text-base">
                Fast, reliable snow plowing and driveway clearing in Atlantic County NJ and surrounding South Jersey communities. I&apos;ll handle jobs personally whenever possible, and if I&apos;m overbooked I can coordinate with trusted local landscaping contacts so your property still gets cleared quickly.
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

        <section className="rounded-2xl border border-white/15 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-8">
          <h2 className="text-lg font-black uppercase tracking-tight text-white sm:text-xl md:text-2xl">
            Service Areas: Atlantic County, NJ
          </h2>
          <p className="mt-2 text-xs text-slate-200 sm:text-sm md:text-base">
            We provide snow removal throughout South Jersey with strong coverage across Atlantic County.
            Looking for local snow removal in your town? We currently serve:
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-1.5 text-xs text-sky-100 sm:grid-cols-2 sm:gap-2 sm:text-sm md:grid-cols-3">
            {atlanticCountyMunicipalities.map((city) => (
              <li key={city} className="rounded-md border border-white/10 bg-slate-950/50 px-2.5 py-1.5">
                {city}, NJ
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-slate-300 sm:text-sm">
            Need same-day service during a storm? Submit the form below with your name and phone or email,
            and we&apos;ll respond quickly with availability.
          </p>
        </section>

        <SnowRemovalForm />
      </section>
    </main>
  );
}
