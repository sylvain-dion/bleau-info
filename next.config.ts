import type { NextConfig } from 'next'
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

export default withSerwist(nextConfig)
