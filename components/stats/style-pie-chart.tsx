'use client'

import type { StyleCount } from '@/lib/stats'

interface StylePieChartProps {
  data: StyleCount[]
}

interface SliceData {
  startAngle: number
  endAngle: number
  percentage: number
  color: string
  label: string
  count: number
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

function computeSlices(data: StyleCount[]): SliceData[] {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) return []

  const slices: SliceData[] = []
  let currentAngle = 0

  for (const entry of data) {
    const percentage = entry.count / total
    const sliceAngle = percentage * 360
    slices.push({
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      percentage,
      color: entry.color,
      label: entry.label,
      count: entry.count,
    })
    currentAngle += sliceAngle
  }

  return slices
}

export function StylePieChart({ data }: StylePieChartProps) {
  const slices = computeSlices(data)
  const cx = 120
  const cy = 100
  const radius = 80
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div aria-label="Graphique de répartition par style d'ascension" role="img">
      <svg viewBox="0 0 240 200" className="mx-auto w-full max-w-[240px]">
        {slices.length === 1 ? (
          <circle cx={cx} cy={cy} r={radius} fill={slices[0].color} />
        ) : (
          slices.map((slice) => (
            <path
              key={slice.label}
              d={describeArc(cx, cy, radius, slice.startAngle, slice.endAngle)}
              fill={slice.color}
            />
          ))
        )}
        {/* Percentage labels */}
        {slices.map((slice) => {
          if (slice.percentage < 0.05) return null
          const midAngle = (slice.startAngle + slice.endAngle) / 2
          const labelR = radius * 0.6
          const pos = polarToCartesian(cx, cy, labelR, midAngle)
          return (
            <text
              key={`label-${slice.label}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={13}
              fontWeight={600}
            >
              {`${(slice.percentage * 100).toFixed(0)}%`}
            </text>
          )
        })}
      </svg>
      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4">
        {data.map((entry) => (
          <div key={entry.style} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.label} ({entry.count}/{total})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
