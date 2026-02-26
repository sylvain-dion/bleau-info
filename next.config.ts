import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  // Disable Service Worker in development to avoid caching issues
  disable: process.env.NODE_ENV === 'development',

  // Service Worker source file
  swSrc: 'app/sw.ts',

  // Service Worker destination in public folder
  swDest: 'public/sw.js',

  // Automatically reload on Service Worker changes
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Silence workspace root warning
  outputFileTracingRoot: __dirname,
}

// Composition: Serwist wraps base config, then Sentry wraps the result
// so it can process all source maps (including SW-compiled ones)
export default withSentryConfig(withSerwist(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress logs outside CI
  silent: !process.env.CI,

  // Upload client source maps for better stack traces
  widenClientFileUpload: true,

  // Delete source maps after upload (security)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel Sentry events through Next.js to avoid ad-blockers
  tunnelRoute: '/monitoring',
})
