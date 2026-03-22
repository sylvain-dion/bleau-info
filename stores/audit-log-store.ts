/**
 * Zustand store for audit log entries.
 *
 * Records moderation actions (manual and auto-validation) for
 * transparency and moderator review.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuditAction =
  | 'auto_approved'
  | 'manually_approved'
  | 'rejected'
  | 'changes_requested'

export interface AuditLogEntry {
  id: string
  /** ID of the draft or suggestion */
  submissionId: string
  /** Type of submission */
  submissionType: 'draft' | 'suggestion'
  /** Name of the boulder */
  boulderName: string
  /** Action taken */
  action: AuditAction
  /** Reason string (e.g. 'trusted_user', 'duplicate', etc.) */
  reason: string
  /** Trust score at time of action */
  trustScore: number
  /** Effective role at time of action */
  effectiveRole: string
  /** ISO timestamp */
  createdAt: string
}

interface AuditLogState {
  entries: AuditLogEntry[]

  /** Add an audit log entry */
  addEntry: (data: Omit<AuditLogEntry, 'id' | 'createdAt'>) => void

  /** Get all auto-approved entries */
  getAutoApproved: () => AuditLogEntry[]

  /** Get recent entries (last N) */
  getRecent: (limit: number) => AuditLogEntry[]
}

function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry(data) {
        const entry: AuditLogEntry = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          entries: [entry, ...state.entries],
        }))
      },

      getAutoApproved() {
        return get().entries.filter((e) => e.action === 'auto_approved')
      },

      getRecent(limit) {
        return get().entries.slice(0, limit)
      },
    }),
    {
      name: 'bleau-audit-log',
    }
  )
)
