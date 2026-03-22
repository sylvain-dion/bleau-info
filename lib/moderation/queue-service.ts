/**
 * Moderation queue service.
 *
 * Aggregates pending submissions from boulder-draft and suggestion
 * stores into a unified, priority-sorted queue for moderators.
 */

import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'

/** Submission type for queue display */
export type SubmissionType = 'creation' | 'modification'

/** Priority levels (lower = higher priority) */
export type PriorityLevel = 'duplicate' | 'creation' | 'modification'

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  duplicate: 0,
  creation: 1,
  modification: 2,
}

/** A unified queue item for the moderation UI */
export interface QueueItem {
  id: string
  type: SubmissionType
  priority: PriorityLevel
  /** Boulder/draft name */
  name: string
  grade: string
  sector: string
  style: string
  /** Mock author name (will come from Supabase user metadata later) */
  author: string
  /** ISO timestamp */
  submittedAt: string
  /** Reason this item is in the queue */
  reason: string
  /** Whether flagged as potential duplicate (Story 7.1) */
  potentialDuplicate: boolean
  /** Source store reference for actions */
  sourceType: 'draft' | 'suggestion'
  /** Has photo */
  hasPhoto: boolean
}

/** Filter options for the queue */
export interface QueueFilters {
  type: 'all' | SubmissionType
  sector: string | null
}

/**
 * Collect all pending submissions from both stores.
 *
 * Priority sort: Doublons potentiels > Nouvelles créations > Modifications
 */
export function collectQueueItems(): QueueItem[] {
  const items: QueueItem[] = []

  // Drafts with status 'pending' → creations awaiting moderation
  const drafts = useBoulderDraftStore.getState().drafts
  for (const draft of drafts) {
    if (draft.status !== 'pending' && draft.syncStatus !== 'synced') continue

    const isDuplicate = draft.potentialDuplicate ?? false

    items.push({
      id: draft.id,
      type: 'creation',
      priority: isDuplicate ? 'duplicate' : 'creation',
      name: draft.name,
      grade: draft.grade,
      sector: draft.sector || 'Non défini',
      style: draft.style,
      author: 'Utilisateur local',
      submittedAt: draft.updatedAt,
      reason: isDuplicate
        ? 'Doublon potentiel détecté'
        : 'Nouveau bloc à valider',
      potentialDuplicate: isDuplicate,
      sourceType: 'draft',
      hasPhoto: draft.photoBlurHash !== null,
    })
  }

  // Suggestions with moderationStatus 'pending' → modifications
  const suggestions = useSuggestionStore.getState().suggestions
  for (const suggestion of suggestions) {
    if (suggestion.moderationStatus !== 'pending') continue

    items.push({
      id: suggestion.id,
      type: 'modification',
      priority: 'modification',
      name: suggestion.name,
      grade: suggestion.grade,
      sector: suggestion.sector || 'Non défini',
      style: suggestion.style,
      author: 'Utilisateur local',
      submittedAt: suggestion.updatedAt,
      reason: 'Modification proposée',
      potentialDuplicate: false,
      sourceType: 'suggestion',
      hasPhoto: suggestion.photoBlurHash !== null,
    })
  }

  // Sort by priority, then by date (oldest first)
  return items.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  })
}

/**
 * Apply filters to queue items.
 */
export function filterQueueItems(
  items: QueueItem[],
  filters: QueueFilters
): QueueItem[] {
  return items.filter((item) => {
    if (filters.type !== 'all' && item.type !== filters.type) return false
    if (filters.sector && item.sector !== filters.sector) return false
    return true
  })
}

/**
 * Extract unique sectors from queue items for filter dropdown.
 */
export function extractQueueSectors(items: QueueItem[]): string[] {
  const sectors = new Set(items.map((i) => i.sector))
  return Array.from(sectors).sort()
}

/**
 * Get total pending count (for badge display).
 */
export function getPendingCount(): number {
  const drafts = useBoulderDraftStore.getState().drafts
  const suggestions = useSuggestionStore.getState().suggestions

  const pendingDrafts = drafts.filter(
    (d) => d.status === 'pending' || d.syncStatus === 'synced'
  ).length

  const pendingSuggestions = suggestions.filter(
    (s) => s.moderationStatus === 'pending'
  ).length

  return pendingDrafts + pendingSuggestions
}
