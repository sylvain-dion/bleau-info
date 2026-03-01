import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Root middleware: refreshes the Supabase auth session on every matched request.
 *
 * Skips static assets, PWA files, monitoring, and Sentry to avoid unnecessary
 * overhead. The matcher config below defines which routes are processed.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - icons/ (PWA icons)
     * - manifest.webmanifest (PWA manifest)
     * - sw.js, swe-worker-*.js (service worker)
     * - monitoring (Sentry tunnel)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|icons/|manifest\\.webmanifest|sw\\.js|swe-worker-.*\\.js|monitoring).*)',
  ],
}
