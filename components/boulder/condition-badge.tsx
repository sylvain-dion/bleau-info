'use client'

import { useMemo } from 'react'
import { useConditionReportStore } from '@/stores/condition-report-store'
import {
  CONDITION_CONFIG,
  RECENT_THRESHOLD_MS,
} from '@/lib/validations/condition'

interface ConditionBadgeProps {
  boulderId: string
}

/**
 * Compact badge showing the dominant condition from the last 48h.
 *
 * Shows emoji + label + report count. Hidden if no recent reports.
 */
export function ConditionBadge({ boulderId }: ConditionBadgeProps) {
  const allReports = useConditionReportStore((s) => s.reports)

  const { dominant, recentCount } = useMemo(() => {
    const cutoff = Date.now() - RECENT_THRESHOLD_MS
    const recent = allReports.filter(
      (r) =>
        r.boulderId === boulderId &&
        new Date(r.reportedAt).getTime() > cutoff
    )
    if (recent.length === 0) return { dominant: null, recentCount: 0 }

    const counts = new Map<string, number>()
    for (const r of recent) {
      counts.set(r.condition, (counts.get(r.condition) ?? 0) + 1)
    }

    let dom = recent[0].condition
    let max = 0
    for (const [cond, count] of counts) {
      if (count > max) {
        max = count
        dom = cond as typeof dom
      }
    }

    return { dominant: dom, recentCount: recent.length }
  }, [allReports, boulderId])

  if (!dominant) return null

  const config = CONDITION_CONFIG[dominant]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
    >
      <span>{config.emoji}</span>
      {config.label}
      {recentCount > 1 && (
        <span className="text-[10px] opacity-70">({recentCount})</span>
      )}
    </span>
  )
}
