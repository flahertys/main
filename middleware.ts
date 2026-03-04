import { NextRequest, NextResponse } from "next/server";

/**
 * Edge Middleware – runs on every request at the CDN edge before rendering.
 *
 * Responsibilities:
 * 1. Inject cache-control headers for SSR HTML pages and API routes.
 *    (Static assets under /_next/static/ are excluded from this middleware
 *    and their cache headers are set directly in next.config.ts.)
 * 2. Add Surrogate-Control so Vercel's edge cache (and CDNs that honour it)
 *    can cache HTML responses while still allowing instant purge.
 * 3. Lay the groundwork for edge-side personalisation: read a lightweight
 *    cookie/geo hint and pass it down as a request header so server
 *    components can personalise without a client round-trip.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. API routes – no public caching ────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  // ── 2. SSR / HTML pages – short CDN TTL with stale-while-revalidate ──────
  // Surrogate-Control is honoured by Vercel's edge and Fastly/Varnish.
  // Cache-Control with s-maxage targets shared caches (CDNs/proxies).
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=600",
  );
  response.headers.set("Surrogate-Control", "max-age=60");

  // ── 3. Edge personalisation hint ─────────────────────────────────────────
  // Read a lightweight preference cookie and forward it as a request header
  // so server components can personalise content without a client round-trip.
  const prefCookie = request.cookies.get("th_pref")?.value;
  if (prefCookie) {
    // Sanitise: allow only alphanumeric + hyphens to prevent header injection
    const safe = prefCookie.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 64);
    response.headers.set("x-th-pref", safe);
  }

  // Geo hint from Vercel's built-in header (available on Vercel deployments)
  const country = request.headers.get("x-vercel-ip-country");
  if (country) {
    response.headers.set("x-th-country", country);
  }

  return response;
}

export const config = {
  /*
   * Only run on navigable HTML routes.
   * Exclude: Next.js internal routes (_next/*), static files, and favicon.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:woff2?|ttf|otf|eot|ico|svg|png|jpg|jpeg|webp|avif|mp3|mp4|webm)).*)",
  ],
};

