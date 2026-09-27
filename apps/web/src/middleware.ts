import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers applied to every response.
 * CSP is intentionally permissive for tRPC (needs 'unsafe-eval' and 'unsafe-inline').
 * Stricter CSP can be applied once tRPC's worker bundle is separated.
 */
const HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' ws:",
    [
      "frame-src 'self'",
      "https://unofficial-bmw.vercel.app",
      "https://unofficial-omniscient-readers-viewpoint.vercel.app",
      "https://co-map.vercel.app",
      "https://yuenansichu-restaurant.vercel.app",
      "https://unofficial-kapetbalay.vercel.app",
      "https://arko-islas.vercel.app",
      "https://arko-locus-assembly.vercel.app",
      "https://dmarc-construction.vercel.app",
      "https://freshphonesph.vercel.app",
    ].join(" "),
    "frame-ancestors 'none'",
    // Hardening: block plugin embeds, <base> hijacking, and cross-origin form posts.
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (process.env.ARKO_SURFACE === 'site') {
    if (path.startsWith('/documents/share/')) {
      return NextResponse.redirect(new URL(path, 'https://app.arkodevph.com'))
    }
    if (path === '/dashboard/finance' || path.startsWith('/dashboard/finance/')) {
      return NextResponse.redirect(new URL('/', 'https://finance.arkodevph.com'))
    }
    if (path.startsWith('/dashboard') || path.startsWith('/auth') || path === '/login') {
      return NextResponse.redirect(new URL(path === '/login' ? '/auth/login' : path, 'https://app.arkodevph.com'))
    }
    if ((path === '/api' || path.startsWith('/api/')) &&
        path !== '/api/landing/view' && path !== '/api/assistant/public-chat') {
      if (path.startsWith('/api/email-marketing/unsubscribe/')) {
        return NextResponse.redirect(new URL(path, 'https://app.arkodevph.com'))
      }
      return new NextResponse(null, { status: 404 })
    }
  }
  if (process.env.ARKO_SURFACE === 'internal') {
    if (path === '/') return NextResponse.redirect(new URL('/dashboard', request.url))
    if (path === '/dashboard/finance' || path.startsWith('/dashboard/finance/')) {
      return NextResponse.redirect(new URL('/', 'https://finance.arkodevph.com'))
    }
    if (path.startsWith('/api/identity')) return new NextResponse(null, { status: 404 })
  }
  const response =
    request.nextUrl.hostname === "www.arkodevph.com"
      ? NextResponse.redirect(
          new URL(
            request.nextUrl.pathname + request.nextUrl.search,
            "https://arkodevph.com",
          ),
          308,
        )
      : NextResponse.next();

  for (const [key, value] of Object.entries(HEADERS)) {
    response.headers.set(key, value);
  }

  // Prevent the browser from caching authenticated pages (HTTP cache + bfcache).
  // Without this, hitting Back after signing out restores the cached dashboard
  // instead of forcing a fresh request (which redirects to login).
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0, must-revalidate",
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
