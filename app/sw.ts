/**
 * Service Worker — Bleau-info PWA.
 *
 * NFR-04 COMPLIANCE: This Service Worker handles ONLY caching and
 * navigation preload. It MUST NOT use the Geolocation API or any
 * background location tracking. GPS access is restricted to
 * client-side hooks that respect Page Visibility (see
 * hooks/use-geolocation.ts and hooks/use-auto-locate.ts).
 */

import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
