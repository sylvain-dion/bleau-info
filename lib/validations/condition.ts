import type { SyncStatus } from '@/lib/sync/types'

/** Possible rock condition values */
export const CONDITION_VALUES = [
  'sec',
  'humide',
  'gras',
  'mousse',
  'dangereux',
] as const

export type ConditionValue = (typeof CONDITION_VALUES)[number]

/** Labels and emoji for each condition */
export const CONDITION_CONFIG: Record<
  ConditionValue,
  { label: string; emoji: string; color: string }
> = {
  sec: { label: 'Sec', emoji: '☀️', color: 'text-amber-600 bg-amber-500/10' },
  humide: { label: 'Humide', emoji: '💧', color: 'text-blue-600 bg-blue-500/10' },
  gras: { label: 'Gras', emoji: '🫧', color: 'text-purple-600 bg-purple-500/10' },
  mousse: { label: 'Mousse', emoji: '🌿', color: 'text-green-600 bg-green-500/10' },
  dangereux: { label: 'Dangereux', emoji: '⚠️', color: 'text-red-600 bg-red-500/10' },
}

/** A condition report for a boulder */
export interface ConditionReport {
  id: string
  userId: string
  userName: string
  boulderId: string
  boulderName: string
  condition: ConditionValue
  comment: string
  /** ISO timestamp */
  reportedAt: string
  syncStatus: SyncStatus
}

/** Max age for "recent" reports (48 hours in ms) */
export const RECENT_THRESHOLD_MS = 48 * 60 * 60 * 1000

/** Max age before archiving (7 days in ms) */
export const ARCHIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000
