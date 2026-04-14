/**
 * Route sharing utilities (Story 9.6).
 *
 * Encodes/decodes custom route data for URL-based sharing
 * and generates shareable text for social platforms.
 */

import { formatDistance } from '@/lib/geo/distance'
import { formatGradeRange, type Grade } from '@/lib/grades'
import type { CustomRoute } from '@/stores/custom-route-store'
import type { RouteStats } from '@/lib/routes'

/** Decoded route data from a shared URL */
export interface SharedRouteData {
  name: string
  boulderIds: string[]
}

/**
 * Encode a route into a shareable URL path + query string.
 *
 * Format: /parcours/shared?name=...&boulders=id1,id2,id3
 */
export function encodeRouteUrl(route: CustomRoute): string {
  const params = new URLSearchParams()
  params.set('name', route.name)
  params.set('boulders', route.boulderIds.join(','))
  return `/parcours/shared?${params.toString()}`
}

/**
 * Build a full shareable URL (absolute) from a route.
 */
export function buildShareUrl(route: CustomRoute): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://bleau.info'
  return `${origin}${encodeRouteUrl(route)}`
}

/**
 * Decode route data from URL search params.
 * Returns null if params are invalid or missing.
 */
export function decodeRouteFromUrl(
  searchParams: URLSearchParams
): SharedRouteData | null {
  const name = searchParams.get('name')
  const bouldersParam = searchParams.get('boulders')

  if (!name || !bouldersParam) return null

  const boulderIds = bouldersParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)

  if (boulderIds.length === 0) return null

  return { name, boulderIds }
}

/**
 * Generate shareable text for social platforms.
 *
 * Format:
 * 🧗 Parcours Fontainebleau
 * 📌 Mon parcours
 * ✅ 5 blocs · 5a → 6b
 * 🚶 450 m
 * 📱 Suivre sur Bleau.info: [URL]
 */
export function generateRouteShareText(
  route: CustomRoute,
  stats: RouteStats,
  shareUrl: string
): string {
  const lines = ['🧗 Parcours Fontainebleau', `📌 ${route.name}`]

  const gradeInfo =
    stats.gradeMin && stats.gradeMax
      ? ` · ${formatGradeRange(stats.gradeMin as Grade, stats.gradeMax as Grade)}`
      : ''

  lines.push(
    `✅ ${stats.boulderCount} bloc${stats.boulderCount > 1 ? 's' : ''}${gradeInfo}`
  )

  if (stats.totalDistance > 0) {
    lines.push(`🚶 ${formatDistance(stats.totalDistance)}`)
  }

  lines.push('', `📱 Suivre sur Bleau.info : ${shareUrl}`)

  return lines.join('\n')
}
