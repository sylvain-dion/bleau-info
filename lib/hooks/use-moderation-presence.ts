'use client'

import { useEffect, useRef } from 'react'
import { usePresenceStore } from '@/stores/presence-store'

const LOCAL_MOD_ID = 'local-moderator'
const LOCAL_MOD_NAME = 'Vous'

/**
 * Manages the current moderator's presence in the session.
 *
 * - Joins on mount, leaves on unmount
 * - Tracks which item is being reviewed
 * - In production: would use Supabase Realtime Presence
 */
export function useModerationPresence() {
  const joinSession = usePresenceStore((s) => s.joinSession)
  const leaveSession = usePresenceStore((s) => s.leaveSession)
  const startReviewing = usePresenceStore((s) => s.startReviewing)
  const stopReviewing = usePresenceStore((s) => s.stopReviewing)
  const getReviewerForItem = usePresenceStore((s) => s.getReviewerForItem)
  const joinedRef = useRef(false)

  // Join session on mount
  useEffect(() => {
    if (!joinedRef.current) {
      joinSession(LOCAL_MOD_ID, LOCAL_MOD_NAME)
      joinedRef.current = true
    }

    return () => {
      leaveSession(LOCAL_MOD_ID)
      joinedRef.current = false
    }
  }, [joinSession, leaveSession])

  return {
    /** Mark an item as being reviewed by the current moderator */
    reviewItem(itemId: string) {
      startReviewing(LOCAL_MOD_ID, itemId)
    },

    /** Stop reviewing the current item */
    stopReview() {
      stopReviewing(LOCAL_MOD_ID)
    },

    /** Check if another moderator is reviewing an item */
    getOtherReviewer(itemId: string) {
      return getReviewerForItem(itemId, LOCAL_MOD_ID)
    },

    /** Current moderator ID */
    moderatorId: LOCAL_MOD_ID,
  }
}
