import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ConditionReport,
  ConditionValue,
} from '@/lib/validations/condition'
import {
  RECENT_THRESHOLD_MS,
  ARCHIVE_THRESHOLD_MS,
} from '@/lib/validations/condition'
import type { SyncStatus } from '@/lib/sync/types'

type ReportInput = Omit<ConditionReport, 'id' | 'reportedAt' | 'syncStatus'>

interface ConditionReportState {
  reports: ConditionReport[]

  /** Add a new condition report. Returns the generated ID. */
  addReport: (data: ReportInput) => string

  /** Remove a report by ID. */
  removeReport: (id: string) => void

  /** Get recent reports for a boulder (last 7 days, newest first). */
  getReportsForBoulder: (boulderId: string) => ConditionReport[]

  /** Get the dominant condition from the last 48h for a boulder. */
  getDominantCondition: (boulderId: string) => ConditionValue | null

  /** Count recent reports (last 48h) for a boulder. */
  getRecentCount: (boulderId: string) => number

  /** Update sync status for a report. */
  setSyncStatus: (id: string, status: SyncStatus) => void

  /** Get all reports that need syncing. */
  getUnsyncedReports: () => ConditionReport[]
}

function generateId(): string {
  return `cond-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useConditionReportStore = create<ConditionReportState>()(
  persist(
    (set, get) => ({
      reports: [],

      addReport: (data) => {
        const id = generateId()
        const report: ConditionReport = {
          ...data,
          id,
          reportedAt: new Date().toISOString(),
          syncStatus: 'local',
        }
        set((state) => ({
          reports: [report, ...state.reports],
        }))
        return id
      },

      removeReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }))
      },

      getReportsForBoulder: (boulderId) => {
        const cutoff = Date.now() - ARCHIVE_THRESHOLD_MS
        return get()
          .reports.filter(
            (r) =>
              r.boulderId === boulderId &&
              new Date(r.reportedAt).getTime() > cutoff
          )
          .sort(
            (a, b) =>
              new Date(b.reportedAt).getTime() -
              new Date(a.reportedAt).getTime()
          )
      },

      getDominantCondition: (boulderId) => {
        const cutoff = Date.now() - RECENT_THRESHOLD_MS
        const recent = get().reports.filter(
          (r) =>
            r.boulderId === boulderId &&
            new Date(r.reportedAt).getTime() > cutoff
        )
        if (recent.length === 0) return null

        const counts = new Map<ConditionValue, number>()
        for (const r of recent) {
          counts.set(r.condition, (counts.get(r.condition) ?? 0) + 1)
        }

        let dominant: ConditionValue = recent[0].condition
        let maxCount = 0
        for (const [cond, count] of counts) {
          if (count > maxCount) {
            maxCount = count
            dominant = cond
          }
        }
        return dominant
      },

      getRecentCount: (boulderId) => {
        const cutoff = Date.now() - RECENT_THRESHOLD_MS
        return get().reports.filter(
          (r) =>
            r.boulderId === boulderId &&
            new Date(r.reportedAt).getTime() > cutoff
        ).length
      },

      setSyncStatus: (id, status) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, syncStatus: status } : r
          ),
        }))
      },

      getUnsyncedReports: () => {
        return get().reports.filter(
          (r) => r.syncStatus === 'local' || r.syncStatus === 'error'
        )
      },
    }),
    { name: 'bleau-condition-reports' }
  )
)
