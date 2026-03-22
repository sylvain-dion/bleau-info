'use client'

import { useBanStore } from '@/stores/ban-store'

/**
 * Hook that checks if the current user can write (create/edit boulders).
 *
 * Returns restriction info if banned/suspended. Components should
 * check `canWrite` before showing creation forms.
 *
 * In the real app, userId would come from Supabase auth.
 * For mock: reads from localStorage 'bleau-mock-user-id'.
 */
export function useWriteGuard(): {
  canWrite: boolean
  restrictionType: 'banned' | 'suspended' | null
  reason: string | null
  until: string | null
} {
  const isUserRestricted = useBanStore((s) => s.isUserRestricted)

  const userId = getMockUserId()
  if (!userId) {
    return { canWrite: true, restrictionType: null, reason: null, until: null }
  }

  const restriction = isUserRestricted(userId)

  return {
    canWrite: !restriction.restricted,
    restrictionType: restriction.type,
    reason: restriction.reason,
    until: restriction.until,
  }
}

function getMockUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('bleau-mock-user-id')
}
