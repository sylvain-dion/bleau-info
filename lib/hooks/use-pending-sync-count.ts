import { useMemo } from 'react'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useTickStore } from '@/stores/tick-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import { useCommentStore } from '@/stores/comment-store'

/**
 * Aggregate unsynced item count across all stores.
 *
 * Selects stable array references from each store and derives
 * the count with useMemo to avoid infinite re-render loops.
 */
export function usePendingSyncCount(): {
  pendingCount: number
  hasPending: boolean
} {
  const drafts = useBoulderDraftStore((s) => s.drafts)
  const suggestions = useSuggestionStore((s) => s.suggestions)
  const ticks = useTickStore((s) => s.ticks)
  const submissions = useVideoSubmissionStore((s) => s.submissions)
  const comments = useCommentStore((s) => s.comments)

  const pendingCount = useMemo(() => {
    let count = 0

    for (const d of drafts) {
      if (d.syncStatus === 'local' || d.syncStatus === 'error') count++
    }
    for (const s of suggestions) {
      if (s.syncStatus === 'local' || s.syncStatus === 'error') count++
    }
    for (const t of ticks) {
      if (t.syncStatus === 'local' || t.syncStatus === 'error') count++
    }
    for (const v of submissions) {
      if (v.syncStatus === 'local' || v.syncStatus === 'error') count++
    }
    for (const c of comments) {
      if (c.syncStatus === 'local' || c.syncStatus === 'error') count++
    }

    return count
  }, [drafts, suggestions, ticks, submissions, comments])

  return { pendingCount, hasPending: pendingCount > 0 }
}
