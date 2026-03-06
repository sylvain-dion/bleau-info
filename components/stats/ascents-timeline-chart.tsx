'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyAscent } from '@/lib/stats'
import type { Annotation } from '@/lib/validations/annotation'
import { AnnotationMarkers } from './annotation-markers'

interface AscentsTimelineChartProps {
  data: MonthlyAscent[]
  annotationsByMonth?: Map<string, Annotation[]>
}

const AXIS_COLOR = '#71717A'

function TimelineTooltip({
  active,
  payload,
  label,
  annotationsByMonth,
  labelToMonth,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  annotationsByMonth: Map<string, Annotation[]>
  labelToMonth: Map<string, string>
}) {
  if (!active || !payload?.length) return null

  const month = label ? labelToMonth.get(label) : undefined
  const monthAnnotations = month
    ? (annotationsByMonth.get(month) ?? [])
    : []

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} croix</p>
      {monthAnnotations.map((a) => (
        <p key={a.id} className="mt-0.5 text-xs text-blue-400">
          📌 {a.text}
        </p>
      ))}
    </div>
  )
}

export function AscentsTimelineChart({
  data,
  annotationsByMonth = new Map(),
}: AscentsTimelineChartProps) {
  const monthToLabel = useMemo(
    () => new Map(data.map((d) => [d.month, d.label])),
    [data]
  )

  const labelToMonth = useMemo(
    () => new Map(data.map((d) => [d.label, d.month])),
    [data]
  )

  const hasAnnotations = annotationsByMonth.size > 0

  return (
    <div aria-label="Graphique des ascensions par mois" role="img">
      <ResponsiveContainer width="100%" height={hasAnnotations ? 250 : 220}>
        <BarChart
          data={data}
          margin={{ top: hasAnnotations ? 20 : 4, right: 4, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={AXIS_COLOR}
            opacity={0.2}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            tickLine={false}
            axisLine={{ stroke: AXIS_COLOR, strokeOpacity: 0.3 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <TimelineTooltip
                annotationsByMonth={annotationsByMonth}
                labelToMonth={labelToMonth}
              />
            }
          />
          <Bar
            dataKey="count"
            fill="#FF6B00"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          {hasAnnotations && (
            <AnnotationMarkers
              annotationsByMonth={annotationsByMonth}
              monthToLabel={monthToLabel}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
