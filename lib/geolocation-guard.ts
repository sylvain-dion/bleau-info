/**
 * Geolocation guard utilities — NFR-04 compliance.
 *
 * These pure functions ensure GPS is only requested when the page
 * is visible and the Geolocation API is available. They prevent
 * any background geolocation requests that would drain battery.
 *
 * IMPORTANT: The Service Worker (app/sw.ts) must NEVER use the
 * Geolocation API. GPS access is restricted to client-side hooks
 * that respect page visibility.
 */

/** Check if the Geolocation API is available in the current environment. */
export function isGeolocationAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'geolocation' in navigator
  )
}

/** Check if the page is currently visible to the user. */
export function isPageVisible(): boolean {
  if (typeof document === 'undefined') return false
  return !document.hidden
}

/**
 * Check if it's safe to request a GPS position.
 * Returns true only if geolocation is available AND the page is visible.
 */
export function shouldRequestPosition(): boolean {
  return isGeolocationAvailable() && isPageVisible()
}
