import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Report reason presets */
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensant' },
  { value: 'dangerous', label: 'Information fausse/dangereuse' },
  { value: 'other', label: 'Autre' },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]['value']

export interface CommentReport {
  id: string
  commentId: string
  reporterId: string
  reason: ReportReason
  createdAt: string
}

/** Threshold for auto-hiding a comment */
const AUTO_HIDE_THRESHOLD = 3

interface CommentReportState {
  reports: CommentReport[]

  /** File a report. Returns false if user already reported this comment. */
  addReport: (commentId: string, reporterId: string, reason: ReportReason) => boolean

  /** Check if a user has already reported a comment. */
  hasReported: (commentId: string, reporterId: string) => boolean

  /** Get report count for a comment. */
  getReportCount: (commentId: string) => number

  /** Check if a comment should be hidden (3+ reports). */
  isHidden: (commentId: string) => boolean
}

function generateId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useCommentReportStore = create<CommentReportState>()(
  persist(
    (set, get) => ({
      reports: [],

      addReport: (commentId, reporterId, reason) => {
        if (get().hasReported(commentId, reporterId)) return false

        const report: CommentReport = {
          id: generateId(),
          commentId,
          reporterId,
          reason,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          reports: [...state.reports, report],
        }))

        return true
      },

      hasReported: (commentId, reporterId) => {
        return get().reports.some(
          (r) => r.commentId === commentId && r.reporterId === reporterId
        )
      },

      getReportCount: (commentId) => {
        return get().reports.filter((r) => r.commentId === commentId).length
      },

      isHidden: (commentId) => {
        return (
          get().reports.filter((r) => r.commentId === commentId).length >=
          AUTO_HIDE_THRESHOLD
        )
      },
    }),
    { name: 'bleau-comment-reports' }
  )
)
