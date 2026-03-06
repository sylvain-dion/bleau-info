import type { Tick, TickStyle } from '@/lib/validations/tick'
import { TICK_STYLE_OPTIONS } from '@/lib/validations/tick'
import { getGradeIndex } from '@/lib/grades'

/** Data point for the monthly ascents chart */
export interface MonthlyAscent {
  /** "YYYY-MM" key for sorting */
  month: string
  /** French label: "jan. 2026" */
  label: string
  count: number
}

/** Data point for grade distribution chart */
export interface GradeCount {
  grade: string
  count: number
}

/** Data point for tick style pie chart */
export interface StyleCount {
  style: TickStyle
  label: string
  count: number
  color: string
}

/** All aggregated statistics derived from ticks */
export interface TickStats {
  totalTicks: number
  uniqueBoulders: number
  monthlyAscents: MonthlyAscent[]
  gradeDistribution: GradeCount[]
  styleDistribution: StyleCount[]
}

/** Hex colors matching each tick style for chart fills */
const STYLE_COLORS: Record<TickStyle, string> = {
  flash: '#F59E0B',
  a_vue: '#3B82F6',
  travaille: '#FF6B00',
}

/** Format a YYYY-MM string to a French short label */
function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

/** Generate all YYYY-MM keys between two months (inclusive) */
function generateMonthRange(first: string, last: string): string[] {
  const months: string[] = []
  const [startYear, startMonth] = first.split('-').map(Number)
  const [endYear, endMonth] = last.split('-').map(Number)

  let y = startYear
  let m = startMonth

  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }

  return months
}

/** Group ticks by month, filling gaps with zero-count entries */
export function computeMonthlyAscents(ticks: Tick[]): MonthlyAscent[] {
  if (ticks.length === 0) return []

  const countByMonth = new Map<string, number>()
  for (const tick of ticks) {
    const key = tick.tickDate.slice(0, 7)
    countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1)
  }

  const sortedKeys = [...countByMonth.keys()].sort()
  const allMonths = generateMonthRange(sortedKeys[0], sortedKeys[sortedKeys.length - 1])

  return allMonths.map((month) => ({
    month,
    label: formatMonthLabel(month),
    count: countByMonth.get(month) ?? 0,
  }))
}

/** Count ticks per grade, sorted by climbing scale */
export function computeGradeDistribution(ticks: Tick[]): GradeCount[] {
  if (ticks.length === 0) return []

  const countByGrade = new Map<string, number>()
  for (const tick of ticks) {
    const grade = tick.boulderGrade
    countByGrade.set(grade, (countByGrade.get(grade) ?? 0) + 1)
  }

  return [...countByGrade.entries()]
    .sort(([a], [b]) => getGradeIndex(a) - getGradeIndex(b))
    .map(([grade, count]) => ({ grade, count }))
}

/** Count ticks per style with labels and colors */
export function computeStyleDistribution(ticks: Tick[]): StyleCount[] {
  const countByStyle = new Map<TickStyle, number>()
  for (const tick of ticks) {
    countByStyle.set(tick.tickStyle, (countByStyle.get(tick.tickStyle) ?? 0) + 1)
  }

  return TICK_STYLE_OPTIONS
    .filter((opt) => (countByStyle.get(opt.key) ?? 0) > 0)
    .map((opt) => ({
      style: opt.key,
      label: opt.label,
      count: countByStyle.get(opt.key) ?? 0,
      color: STYLE_COLORS[opt.key],
    }))
}

/** Compute all statistics from a list of ticks */
export function computeTickStats(ticks: Tick[]): TickStats {
  return {
    totalTicks: ticks.length,
    uniqueBoulders: new Set(ticks.map((t) => t.boulderId)).size,
    monthlyAscents: computeMonthlyAscents(ticks),
    gradeDistribution: computeGradeDistribution(ticks),
    styleDistribution: computeStyleDistribution(ticks),
  }
}
