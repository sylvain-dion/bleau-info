'use client'

import { Award, Sparkles, TrendingUp } from 'lucide-react'
import {
  computePersonalRecords,
  computeMaxGradeTimeline,
  formatRelativeDay,
  type PersonalRecord,
  type MaxGradeMonth,
} from '@/lib/progression'
import { GRADE_SCALE, formatGrade } from '@/lib/grades'
import type { Tick } from '@/lib/validations/tick'
import { ShareButton } from '@/components/share/share-button'
import { buildRecordShare } from '@/lib/social-share'

interface PersonalRecordsProps {
  ticks: Tick[]
  /** Number of months to plot in the sparkline. Default 12. */
  months?: number
}

/**
 * Personal records & grade progression timeline (Story 14.6).
 *
 * Two stacked panels:
 *  1. List of "first 6a / first 7a / …" milestone cards, each with a
 *     share button that posts the moment to socials.
 *  2. A small SVG sparkline of the max grade per month over the last
 *     N months — the analytical chart on /statistiques shows ascent
 *     counts; this one shows ceiling progression.
 *
 * Hidden entirely when there are no qualifying records (no tier
 * reached yet) — empty state already lives in BadgesSection above.
 */
export function PersonalRecords({ ticks, months = 12 }: PersonalRecordsProps) {
  const records = computePersonalRecords(ticks)
  const timeline = computeMaxGradeTimeline(ticks, months)

  if (records.length === 0) return null

  return (
    <section className="mb-6" aria-labelledby="personal-records-heading">
      <h2
        id="personal-records-heading"
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <Award className="h-4 w-4 text-muted-foreground" />
        Records personnels
        <span className="text-[10px] font-normal text-muted-foreground">
          {records.length} jalon{records.length > 1 ? 's' : ''}
        </span>
      </h2>

      <ul
        className="mb-3 space-y-2"
        data-testid="personal-records-list"
      >
        {records.map((record) => (
          <RecordRow key={record.tier} record={record} />
        ))}
      </ul>

      <GradeTimelineCard timeline={timeline} />
    </section>
  )
}

// ---------------------------------------------------------------------------

interface RecordRowProps {
  record: PersonalRecord
}

function RecordRow({ record }: RecordRowProps) {
  const tierLabel = formatGrade(record.tier)
  const gradeLabel = formatGrade(record.grade)
  const sameAsTier = record.grade.toLowerCase() === record.tier.toLowerCase()
  const share = buildRecordShare(record)
  const relative = formatRelativeDay(record.tickDate)

  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
      data-testid={`record-${record.tier}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
        <span className="text-xs font-black text-amber-600 dark:text-amber-400">
          {tierLabel}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {record.label}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {sameAsTier
            ? record.boulderName
            : `${record.boulderName} (${gradeLabel})`}
        </p>
        <p className="text-[10px] text-muted-foreground/80">{relative}</p>
      </div>

      <ShareButton
        share={share}
        variant="icon"
        ariaLabel={`Partager le record ${record.label}`}
      />
    </li>
  )
}

// ---------------------------------------------------------------------------
// Sparkline: max grade per month
// ---------------------------------------------------------------------------

interface GradeTimelineCardProps {
  timeline: MaxGradeMonth[]
}

const SPARK_WIDTH = 320
const SPARK_HEIGHT = 60
const SPARK_PADDING = 6

function GradeTimelineCard({ timeline }: GradeTimelineCardProps) {
  // Need at least 2 active months to draw a useful line.
  const activeCount = timeline.filter((m) => m.maxGradeIndex >= 0).length
  if (activeCount < 2) return null

  const indices = timeline
    .map((m) => m.maxGradeIndex)
    .filter((i) => i >= 0)
  const minIdx = Math.min(...indices)
  const maxIdx = Math.max(...indices)
  // Pad the y-axis range so a flat plateau still has visual room.
  const yLow = Math.max(0, minIdx - 1)
  const yHigh = Math.min(GRADE_SCALE.length - 1, Math.max(maxIdx, yLow + 1))

  const innerWidth = SPARK_WIDTH - SPARK_PADDING * 2
  const innerHeight = SPARK_HEIGHT - SPARK_PADDING * 2
  const stepX =
    timeline.length > 1 ? innerWidth / (timeline.length - 1) : innerWidth

  const points = timeline.map((m, i) => {
    if (m.maxGradeIndex < 0) return null
    const x = SPARK_PADDING + i * stepX
    const ratio = (m.maxGradeIndex - yLow) / (yHigh - yLow || 1)
    const y = SPARK_PADDING + (1 - ratio) * innerHeight
    return { x, y, month: m, idx: i }
  })

  // Build path segments, breaking on null (empty months).
  const pathSegments: string[] = []
  let currentSegment = ''
  for (const p of points) {
    if (p === null) {
      if (currentSegment) pathSegments.push(currentSegment)
      currentSegment = ''
      continue
    }
    currentSegment += currentSegment === ''
      ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      : ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }
  if (currentSegment) pathSegments.push(currentSegment)

  const peakLabel = formatGrade(GRADE_SCALE[maxIdx])
  const lowLabel = formatGrade(GRADE_SCALE[minIdx])

  return (
    <div
      className="rounded-lg border border-border bg-card p-3"
      data-testid="grade-timeline"
    >
      <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Niveau max — {timeline.length} derniers mois
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          {peakLabel}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
        className="h-12 w-full"
        role="img"
        aria-label={`Évolution du niveau max sur ${timeline.length} mois — entre ${lowLabel} et ${peakLabel}`}
      >
        {pathSegments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />
        ))}
        {points.map((p, i) =>
          p === null ? null : (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.month.maxGradeIndex === maxIdx ? 2.4 : 1.6}
              className={
                p.month.maxGradeIndex === maxIdx
                  ? 'fill-amber-500'
                  : 'fill-primary'
              }
            >
              <title>{`${p.month.label} : ${formatGrade(p.month.maxGrade ?? '')}`}</title>
            </circle>
          ),
        )}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span>{timeline[0]?.label}</span>
        <span>{timeline[timeline.length - 1]?.label}</span>
      </div>
    </div>
  )
}
