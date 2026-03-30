/**
 * Heatmap data builder for the activity heatmap layer (Story 12.3).
 *
 * Augments boulder GeoJSON features with an `_activity` property
 * combining local tick count (last 30 days) and mock community popularity.
 * Runs entirely client-side for offline support.
 */

import { getMockPopularity } from '@/lib/popularity'
import type { Tick } from '@/lib/validations/tick'
import type { FeatureCollection, Feature, Point } from 'geojson'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Count ticks per boulder for the last 30 days.
 */
function countRecentTicks(ticks: Tick[]): Map<string, number> {
  const cutoff = Date.now() - THIRTY_DAYS_MS
  const counts = new Map<string, number>()

  for (const tick of ticks) {
    const tickTime = new Date(tick.tickDate).getTime()
    if (tickTime >= cutoff) {
      counts.set(tick.boulderId, (counts.get(tick.boulderId) ?? 0) + 1)
    }
  }

  return counts
}

/**
 * Build heatmap GeoJSON from boulder features and tick history.
 *
 * Each feature gets an `_activity` property = local recent ticks + mock popularity.
 * Features with zero activity are included (heatmap-weight handles them).
 */
export function buildHeatmapData(
  boulderFeatures: Feature<Point>[],
  ticks: Tick[]
): FeatureCollection<Point> {
  const recentCounts = countRecentTicks(ticks)

  const features = boulderFeatures
    .filter((f) => !f.properties?._isCircuitDot)
    .map((f) => {
      const id = f.properties?.id as string
      const localCount = recentCounts.get(id) ?? 0
      const mockCount = getMockPopularity(id)

      return {
        ...f,
        properties: {
          ...f.properties,
          _activity: localCount + mockCount,
        },
      }
    })

  return { type: 'FeatureCollection', features }
}
