/**
 * Session summary generator.
 *
 * Aggregates today's ticks + conditions into a shareable summary.
 */

import { useTickStore } from '@/stores/tick-store'
import { useConditionReportStore } from '@/stores/condition-report-store'
import { CONDITION_CONFIG } from '@/lib/validations/condition'
import { todayISO } from '@/lib/validations/tick'

export interface SessionSummary {
  date: string
  dateFormatted: string
  sectors: string[]
  tickCount: number
  gradeMin: string | null
  gradeMax: string | null
  /** Highest graded tick of the session */
  highlight: {
    boulderName: string
    grade: string
    style: string
  } | null
  /** All ticks in order */
  ticks: {
    boulderName: string
    grade: string
    style: string
  }[]
  /** Conditions reported during session */
  conditions: { label: string; emoji: string; boulderName: string }[]
  /** Whether user has activity today */
  hasActivity: boolean
}

const STYLE_LABELS: Record<string, string> = {
  flash: 'Flash ⚡',
  a_vue: 'À vue 👁️',
  travaille: 'Après travail 💪',
}

/**
 * Generate a summary of today's climbing session.
 */
export function generateSessionSummary(): SessionSummary {
  const today = todayISO()
  const allTicks = useTickStore.getState().ticks

  const todayTicks = allTicks.filter((t) => t.tickDate === today)

  if (todayTicks.length === 0) {
    return {
      date: today,
      dateFormatted: formatDate(today),
      sectors: [],
      tickCount: 0,
      gradeMin: null,
      gradeMax: null,
      highlight: null,
      ticks: [],
      conditions: [],
      hasActivity: false,
    }
  }

  const sectors = [...new Set(todayTicks.map((t) => {
    // Extract sector from boulder name (rough heuristic)
    return t.boulderName.split(' - ')[0] || 'Fontainebleau'
  }))]

  const grades = todayTicks.map((t) => t.boulderGrade).sort()

  // Find highlight: highest grade
  const sorted = [...todayTicks].sort((a, b) =>
    b.boulderGrade.localeCompare(a.boulderGrade)
  )
  const best = sorted[0]

  const ticks = todayTicks.map((t) => ({
    boulderName: t.boulderName,
    grade: t.boulderGrade,
    style: STYLE_LABELS[t.tickStyle] ?? t.tickStyle,
  }))

  // Conditions reported today
  const todayConditions = useConditionReportStore
    .getState()
    .reports.filter((r) => r.reportedAt.startsWith(today))
    .map((r) => ({
      label: CONDITION_CONFIG[r.condition].label,
      emoji: CONDITION_CONFIG[r.condition].emoji,
      boulderName: r.boulderName,
    }))

  return {
    date: today,
    dateFormatted: formatDate(today),
    sectors,
    tickCount: todayTicks.length,
    gradeMin: grades[0] ?? null,
    gradeMax: grades[grades.length - 1] ?? null,
    highlight: best
      ? {
          boulderName: best.boulderName,
          grade: best.boulderGrade,
          style: STYLE_LABELS[best.tickStyle] ?? best.tickStyle,
        }
      : null,
    ticks,
    conditions: todayConditions,
    hasActivity: true,
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Generate a shareable text for the session.
 */
export function generateShareText(summary: SessionSummary): string {
  if (!summary.hasActivity) return ''

  const lines = [
    `🧗 Séance à Fontainebleau — ${summary.dateFormatted}`,
    '',
    `✅ ${summary.tickCount} bloc${summary.tickCount > 1 ? 's' : ''} réalisé${summary.tickCount > 1 ? 's' : ''}`,
  ]

  if (summary.gradeMin && summary.gradeMax) {
    lines.push(`📊 ${summary.gradeMin} → ${summary.gradeMax}`)
  }

  if (summary.highlight) {
    lines.push(`⭐ Best: ${summary.highlight.boulderName} (${summary.highlight.grade}) — ${summary.highlight.style}`)
  }

  if (summary.conditions.length > 0) {
    const cond = summary.conditions[0]
    lines.push(`${cond.emoji} Conditions: ${cond.label}`)
  }

  lines.push('', '📱 via Bleau.info')

  return lines.join('\n')
}
