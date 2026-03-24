'use client'

import { useState } from 'react'
import { Flag, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useCommentReportStore,
  REPORT_REASONS,
  type ReportReason,
} from '@/stores/comment-report-store'
import { showCommentReportedToast } from '@/lib/feedback'

interface ReportCommentButtonProps {
  commentId: string
}

/**
 * Flag button to report a comment as inappropriate.
 *
 * Shows a dropdown with reason choices. Prevents double-reporting.
 */
export function ReportCommentButton({ commentId }: ReportCommentButtonProps) {
  const { user } = useAuthStore()
  const addReport = useCommentReportStore((s) => s.addReport)
  const reports = useCommentReportStore((s) => s.reports)
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const alreadyReported = reports.some(
    (r) => r.commentId === commentId && r.reporterId === user.id
  )

  if (alreadyReported) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Check className="h-2.5 w-2.5" />
        Signalé
      </span>
    )
  }

  function handleReport(reason: ReportReason) {
    if (!user) return
    const success = addReport(commentId, user.id, reason)
    if (success) {
      showCommentReportedToast()
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Signaler ce commentaire"
      >
        <Flag className="h-2.5 w-2.5" />
        Signaler
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-50 mb-1 w-52 rounded-lg border border-border bg-card p-1 shadow-lg">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleReport(r.value)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
