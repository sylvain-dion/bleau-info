'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Bird,
  Droplets,
  Info,
  Leaf,
  ChevronDown,
} from 'lucide-react'
import { sectorHasActiveZones, highestSeverity } from '@/lib/environmental-zones'
import type {
  EnvironmentalZoneFeature,
  EnvironmentalZoneSeverity,
  EnvironmentalZoneType,
} from '@/lib/data/mock-environmental-zones'

interface SectorEcoBannerProps {
  /** URL slug of the sector — used to look up overlapping zones. */
  sectorSlug: string
  /** Override "now" for testing / SSR determinism. */
  now?: Date
}

/**
 * Story 14e.1 — Banner shown above the sector tabs when one or more
 * environmental zones overlap the sector.
 *
 * - **Forbidden** zone present → red tone, no climbing (visual cue)
 * - **Warning** zone → amber tone (erosion, restoration, etc.)
 * - **Info** zone → blue tone (year-round wet rock, generic protected)
 *
 * Multiple zones collapse into one banner; tap "Détails" to expand.
 * Renders nothing when no zones are active.
 */
export function SectorEcoBanner({ sectorSlug, now }: SectorEcoBannerProps) {
  const zones = sectorHasActiveZones(sectorSlug, now)
  const severity = highestSeverity(zones)
  const [expanded, setExpanded] = useState(false)

  if (zones.length === 0 || severity === null) return null

  const tone = TONES[severity]
  const summary =
    zones.length === 1
      ? zones[0].properties.title
      : `${zones.length} zones sensibles dans ce secteur`

  return (
    <div
      data-testid="sector-eco-banner"
      data-severity={severity}
      role={severity === 'forbidden' ? 'alert' : 'note'}
      className={`mb-3 rounded-xl border ${tone.container}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full items-start gap-3 px-3 py-2.5 text-left ${tone.button}`}
        aria-expanded={expanded}
        aria-controls={`eco-zones-${sectorSlug}`}
      >
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${tone.icon}`}>
          {iconFor(severity)}
        </span>
        <span className="flex-1 text-sm font-medium">{summary}</span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          } ${tone.icon}`}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <ul
          id={`eco-zones-${sectorSlug}`}
          className={`space-y-2 border-t px-3 py-2.5 text-xs ${tone.detail}`}
        >
          {zones.map((zone) => (
            <li
              key={zone.properties.id}
              data-testid={`eco-zone-detail-${zone.properties.id}`}
              className="flex items-start gap-2"
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center ${tone.icon}`}>
                {iconForType(zone.properties.type)}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{zone.properties.title}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {zone.properties.description}
                </p>
                <ZoneMeta zone={zone} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ZoneMeta({ zone }: { zone: EnvironmentalZoneFeature }) {
  const { validFrom, validTo, source } = zone.properties
  const window = formatWindow(validFrom, validTo)

  if (!window && !source) return null

  return (
    <p className="mt-1 text-[11px] text-muted-foreground">
      {window}
      {window && source ? ' · ' : ''}
      {source ? `Source : ${source}` : ''}
    </p>
  )
}

function formatWindow(from: string | null, to: string | null): string {
  if (!from && !to) return 'Toute l’année'
  if (from && to) return `${formatFR(from)} → ${formatFR(to)}`
  if (from) return `À partir du ${formatFR(from)}`
  return `Jusqu’au ${formatFR(to as string)}`
}

function formatFR(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function iconFor(severity: EnvironmentalZoneSeverity) {
  switch (severity) {
    case 'forbidden':
      return <AlertTriangle className="h-5 w-5" aria-hidden="true" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5" aria-hidden="true" />
    case 'info':
      return <Info className="h-5 w-5" aria-hidden="true" />
  }
}

function iconForType(type: EnvironmentalZoneType) {
  switch (type) {
    case 'nidification':
      return <Bird className="h-4 w-4" aria-hidden="true" />
    case 'erosion':
      return <Leaf className="h-4 w-4" aria-hidden="true" />
    case 'humidity':
      return <Droplets className="h-4 w-4" aria-hidden="true" />
    case 'protection':
      return <Info className="h-4 w-4" aria-hidden="true" />
  }
}

// Tailwind tones — kept literal so the JIT picks them up.
const TONES: Record<
  EnvironmentalZoneSeverity,
  { container: string; button: string; icon: string; detail: string }
> = {
  forbidden: {
    container: 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
    button: 'text-red-900 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-950/50 rounded-xl',
    icon: 'text-red-600 dark:text-red-400',
    detail: 'border-red-200 text-red-900 dark:border-red-900 dark:text-red-100',
  },
  warning: {
    container:
      'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
    button:
      'text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-950/50 rounded-xl',
    icon: 'text-amber-600 dark:text-amber-400',
    detail: 'border-amber-200 text-amber-900 dark:border-amber-900 dark:text-amber-100',
  },
  info: {
    container: 'border-sky-300 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30',
    button: 'text-sky-900 hover:bg-sky-100 dark:text-sky-200 dark:hover:bg-sky-950/50 rounded-xl',
    icon: 'text-sky-600 dark:text-sky-400',
    detail: 'border-sky-200 text-sky-900 dark:border-sky-900 dark:text-sky-100',
  },
}
