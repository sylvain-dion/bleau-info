/**
 * Global activity feed service.
 *
 * Aggregates events from all sectors the user follows
 * (offline packs + favorites). Falls back to "Découverte"
 * feed with popular activity for new users.
 */

import { useTickStore } from '@/stores/tick-store'
import { useConditionReportStore } from '@/stores/condition-report-store'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { CONDITION_CONFIG } from '@/lib/validations/condition'
import type { ActivityEvent } from './activity-feed'

const TICK_STYLE_LABELS: Record<string, string> = {
  flash: 'flash',
  a_vue: 'à vue',
  travaille: 'après travail',
}

/**
 * Collect global feed events from all user-relevant sectors.
 *
 * Prioritizes: 1) sectors with offline packs, 2) all activity if no packs.
 */
export function collectGlobalFeed(limit = 30): {
  events: ActivityEvent[]
  isDiscoveryMode: boolean
  followedSectorCount: number
} {
  // Determine followed sectors (those with offline packs)
  const offlineSectors = useOfflineSectorStore.getState().sectors
  const followedSectorNames = new Set(
    Object.values(offlineSectors)
      .filter((s) => s.status === 'downloaded')
      .map((s) => s.name)
  )

  const isDiscoveryMode = followedSectorNames.size === 0

  const events: ActivityEvent[] = []

  // Ticks
  const ticks = useTickStore.getState().ticks
  for (const tick of ticks) {
    const styleLabel = TICK_STYLE_LABELS[tick.tickStyle] ?? tick.tickStyle
    events.push({
      id: `tick-${tick.id}`,
      type: 'tick',
      userName: tick.userId ? 'Vous' : 'Un grimpeur',
      authorName: tick.userId ? 'Vous' : null,
      userId: tick.userId,
      description: `a enchaîné ${tick.boulderName} (${tick.boulderGrade}) en ${styleLabel}`,
      boulderId: tick.boulderId,
      boulderName: tick.boulderName,
      timestamp: tick.createdAt,
      meta: {
        grade: tick.boulderGrade,
        tickStyle: tick.tickStyle,
      },
    })
  }

  // Condition reports
  const reports = useConditionReportStore.getState().reports
  for (const report of reports) {
    const config = CONDITION_CONFIG[report.condition]
    events.push({
      id: `cond-${report.id}`,
      type: 'condition',
      userName: report.userName,
      authorName: report.userName,
      userId: report.userId,
      description: `a reporté "${config.label}" sur ${report.boulderName}`,
      boulderId: report.boulderId,
      boulderName: report.boulderName,
      timestamp: report.reportedAt,
      meta: {
        condition: report.condition,
        conditionEmoji: config.emoji,
      },
    })
  }

  // Sort by recency
  const sorted = events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return {
    events: sorted.slice(0, limit),
    isDiscoveryMode,
    followedSectorCount: followedSectorNames.size,
  }
}
