/**
 * Activity feed service for sectors.
 *
 * Aggregates recent events (ticks, condition reports, new drafts)
 * from local stores into a unified timeline.
 * In production, this would query Supabase.
 */

import { useTickStore } from '@/stores/tick-store'
import { useConditionReportStore } from '@/stores/condition-report-store'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { CONDITION_CONFIG } from '@/lib/validations/condition'

export type ActivityType = 'tick' | 'condition' | 'new_boulder'

export interface ActivityEvent {
  id: string
  type: ActivityType
  /** Display name (anonymized if private) */
  userName: string
  userId: string | null
  /** Event description */
  description: string
  /** Related boulder */
  boulderId: string | null
  boulderName: string | null
  /** ISO timestamp */
  timestamp: string
  /** Extra metadata for display */
  meta?: {
    grade?: string
    tickStyle?: string
    condition?: string
    conditionEmoji?: string
  }
}

export interface SectorActivitySummary {
  ticksThisWeek: number
  conditionsThisWeek: number
  newBouldersThisWeek: number
  /** Top 3 most ticked boulders this week */
  popularBoulders: { id: string; name: string; tickCount: number }[]
}

const TICK_STYLE_LABELS: Record<string, string> = {
  flash: 'flash',
  a_vue: 'à vue',
  travaille: 'après travail',
}

/**
 * Collect activity events for a sector from local stores.
 *
 * @param boulderIds Set of boulder IDs in the sector
 * @param limit Max events to return
 */
export function collectSectorActivity(
  boulderIds: Set<string>,
  limit = 20
): ActivityEvent[] {
  const events: ActivityEvent[] = []

  // Ticks
  const ticks = useTickStore.getState().ticks
  for (const tick of ticks) {
    if (!boulderIds.has(tick.boulderId)) continue
    const styleLabel = TICK_STYLE_LABELS[tick.tickStyle] ?? tick.tickStyle
    events.push({
      id: `tick-${tick.id}`,
      type: 'tick',
      userName: tick.userId ? 'Vous' : 'Un grimpeur',
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
    if (!boulderIds.has(report.boulderId)) continue
    const config = CONDITION_CONFIG[report.condition]
    events.push({
      id: `cond-${report.id}`,
      type: 'condition',
      userName: report.userName,
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

  // New boulders (approved drafts in this sector)
  const drafts = useBoulderDraftStore.getState().drafts
  for (const draft of drafts) {
    if (draft.status !== 'approved' && draft.status !== 'pending') continue
    if (!boulderIds.has(draft.id)) continue
    events.push({
      id: `boulder-${draft.id}`,
      type: 'new_boulder',
      userName: 'Un contributeur',
      userId: null,
      description: `a ajouté "${draft.name}" (${draft.grade})`,
      boulderId: draft.id,
      boulderName: draft.name,
      timestamp: draft.createdAt,
      meta: { grade: draft.grade },
    })
  }

  // Sort by timestamp (newest first) and limit
  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

/**
 * Compute weekly summary for a sector.
 */
export function computeWeeklySummary(
  boulderIds: Set<string>
): SectorActivitySummary {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  const ticks = useTickStore.getState().ticks.filter(
    (t) => boulderIds.has(t.boulderId) && new Date(t.createdAt).getTime() > weekAgo
  )

  const conditions = useConditionReportStore.getState().reports.filter(
    (r) => boulderIds.has(r.boulderId) && new Date(r.reportedAt).getTime() > weekAgo
  )

  const drafts = useBoulderDraftStore.getState().drafts.filter(
    (d) =>
      boulderIds.has(d.id) &&
      (d.status === 'approved' || d.status === 'pending') &&
      new Date(d.createdAt).getTime() > weekAgo
  )

  // Popular boulders
  const boulderTicks = new Map<string, { name: string; count: number }>()
  for (const tick of ticks) {
    const existing = boulderTicks.get(tick.boulderId)
    if (existing) {
      existing.count++
    } else {
      boulderTicks.set(tick.boulderId, { name: tick.boulderName, count: 1 })
    }
  }

  const popularBoulders = Array.from(boulderTicks.entries())
    .map(([id, { name, count }]) => ({ id, name, tickCount: count }))
    .sort((a, b) => b.tickCount - a.tickCount)
    .slice(0, 3)

  return {
    ticksThisWeek: ticks.length,
    conditionsThisWeek: conditions.length,
    newBouldersThisWeek: drafts.length,
    popularBoulders,
  }
}
