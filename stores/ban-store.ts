/**
 * Zustand store for user ban/suspension state.
 *
 * Tracks banned and suspended users locally (mock).
 * In production this would be a database column + RLS.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BanRecord {
  userId: string
  displayName: string
  /** Permanent ban timestamp (null = not banned) */
  bannedAt: string | null
  banReason: string | null
  /** Temporary suspension end (null = not suspended) */
  suspendedUntil: string | null
  suspensionReason: string | null
  /** Who performed the action */
  moderatorId: string
}

interface BanState {
  bans: BanRecord[]

  /** Ban a user permanently */
  banUser: (
    userId: string,
    displayName: string,
    reason: string,
    moderatorId: string
  ) => void

  /** Suspend a user temporarily */
  suspendUser: (
    userId: string,
    displayName: string,
    until: string,
    reason: string,
    moderatorId: string
  ) => void

  /** Lift a ban or suspension */
  unbanUser: (userId: string) => void

  /** Check if a user is currently banned or suspended */
  isUserRestricted: (userId: string) => {
    restricted: boolean
    reason: string | null
    type: 'banned' | 'suspended' | null
    until: string | null
  }

  /** Get all active restrictions */
  getActiveRestrictions: () => BanRecord[]

  /** Get a specific user's ban record */
  getBanRecord: (userId: string) => BanRecord | undefined
}

export const useBanStore = create<BanState>()(
  persist(
    (set, get) => ({
      bans: [],

      banUser(userId, displayName, reason, moderatorId) {
        set((state) => {
          const existing = state.bans.find((b) => b.userId === userId)
          if (existing) {
            return {
              bans: state.bans.map((b) =>
                b.userId === userId
                  ? {
                      ...b,
                      bannedAt: new Date().toISOString(),
                      banReason: reason,
                      suspendedUntil: null,
                      suspensionReason: null,
                      moderatorId,
                    }
                  : b
              ),
            }
          }
          return {
            bans: [
              ...state.bans,
              {
                userId,
                displayName,
                bannedAt: new Date().toISOString(),
                banReason: reason,
                suspendedUntil: null,
                suspensionReason: null,
                moderatorId,
              },
            ],
          }
        })
      },

      suspendUser(userId, displayName, until, reason, moderatorId) {
        set((state) => {
          const existing = state.bans.find((b) => b.userId === userId)
          if (existing) {
            return {
              bans: state.bans.map((b) =>
                b.userId === userId
                  ? {
                      ...b,
                      bannedAt: null,
                      banReason: null,
                      suspendedUntil: until,
                      suspensionReason: reason,
                      moderatorId,
                    }
                  : b
              ),
            }
          }
          return {
            bans: [
              ...state.bans,
              {
                userId,
                displayName,
                bannedAt: null,
                banReason: null,
                suspendedUntil: until,
                suspensionReason: reason,
                moderatorId,
              },
            ],
          }
        })
      },

      unbanUser(userId) {
        set((state) => ({
          bans: state.bans.filter((b) => b.userId !== userId),
        }))
      },

      isUserRestricted(userId) {
        const record = get().bans.find((b) => b.userId === userId)
        if (!record) {
          return { restricted: false, reason: null, type: null, until: null }
        }

        if (record.bannedAt) {
          return {
            restricted: true,
            reason: record.banReason,
            type: 'banned',
            until: null,
          }
        }

        if (record.suspendedUntil) {
          const isExpired = new Date(record.suspendedUntil) < new Date()
          if (isExpired) {
            return { restricted: false, reason: null, type: null, until: null }
          }
          return {
            restricted: true,
            reason: record.suspensionReason,
            type: 'suspended',
            until: record.suspendedUntil,
          }
        }

        return { restricted: false, reason: null, type: null, until: null }
      },

      getActiveRestrictions() {
        const now = new Date()
        return get().bans.filter((b) => {
          if (b.bannedAt) return true
          if (b.suspendedUntil) return new Date(b.suspendedUntil) > now
          return false
        })
      },

      getBanRecord(userId) {
        return get().bans.find((b) => b.userId === userId)
      },
    }),
    {
      name: 'bleau-bans',
    }
  )
)
