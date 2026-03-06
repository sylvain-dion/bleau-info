'use client'

import { ReferenceLine } from 'recharts'
import type { Annotation } from '@/lib/validations/annotation'

const ANNOTATION_COLOR = '#3B82F6'

interface AnnotationPinProps {
  viewBox?: { x: number; y: number }
  count: number
}

function AnnotationPin({ viewBox, count }: AnnotationPinProps) {
  if (!viewBox) return null
  const { x, y } = viewBox
  return (
    <g>
      <circle cx={x} cy={y - 8} r={7} fill={ANNOTATION_COLOR} />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        fill="white"
        fontSize={9}
        fontWeight={700}
      >
        {count}
      </text>
    </g>
  )
}

interface AnnotationMarkersProps {
  annotationsByMonth: Map<string, Annotation[]>
  /** Map from YYYY-MM to the formatted label used on the X axis */
  monthToLabel: Map<string, string>
}

/**
 * Renders Recharts ReferenceLine elements for each annotated month.
 * Must be rendered as direct children of a BarChart.
 */
export function AnnotationMarkers({
  annotationsByMonth,
  monthToLabel,
}: AnnotationMarkersProps) {
  const elements: React.ReactNode[] = []

  for (const [month, annotations] of annotationsByMonth) {
    const label = monthToLabel.get(month)
    if (!label) continue

    elements.push(
      <ReferenceLine
        key={month}
        x={label}
        stroke={ANNOTATION_COLOR}
        strokeDasharray="4 4"
        strokeWidth={1.5}
        label={<AnnotationPin count={annotations.length} />}
      />
    )
  }

  return <>{elements}</>
}
