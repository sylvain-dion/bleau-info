'use client'

import { MapPin } from 'lucide-react'
import { haversineDistance } from '@/lib/sync/conflict-resolver'

interface Coords {
  lat: number
  lng: number
}

interface MiniMapDiffProps {
  original: Coords | null
  proposed: Coords
}

/**
 * Visual GPS comparison showing two markers on an SVG mini-map.
 *
 * Displays:
 * - A schematic SVG showing relative positions of both points
 * - Distance between the two points (meters)
 * - Coordinate values side-by-side
 *
 * No real map tiles — a simple visual representation is sufficient
 * for the moderation review. Real Mapbox integration can be added later.
 */
export function MiniMapDiff({ original, proposed }: MiniMapDiffProps) {
  const distance = original
    ? Math.round(
        haversineDistance(
          original.lat,
          original.lng,
          proposed.lat,
          proposed.lng
        )
      )
    : null

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      {/* SVG mini-map visualization */}
      <div className="mb-3 flex items-center justify-center">
        <svg
          viewBox="0 0 200 120"
          className="h-24 w-full max-w-[200px]"
          aria-label="Comparaison de position GPS"
        >
          {/* Background grid */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect width="200" height="120" fill="url(#grid)" rx="4" />

          {original ? (
            <>
              {/* Line connecting points */}
              <line
                x1="70"
                y1="60"
                x2="130"
                y2="60"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 2"
                className="text-muted-foreground"
              />

              {/* Original marker (red) */}
              <circle
                cx="70"
                cy="60"
                r="6"
                className="fill-red-500/20 stroke-red-500"
                strokeWidth="2"
              />
              <circle cx="70" cy="60" r="2" className="fill-red-500" />
              <text
                x="70"
                y="82"
                textAnchor="middle"
                className="fill-red-600 dark:fill-red-400"
                fontSize="8"
                fontWeight="600"
              >
                Actuel
              </text>

              {/* Proposed marker (green) */}
              <circle
                cx="130"
                cy="60"
                r="6"
                className="fill-emerald-500/20 stroke-emerald-500"
                strokeWidth="2"
              />
              <circle cx="130" cy="60" r="2" className="fill-emerald-500" />
              <text
                x="130"
                y="82"
                textAnchor="middle"
                className="fill-emerald-600 dark:fill-emerald-400"
                fontSize="8"
                fontWeight="600"
              >
                Proposé
              </text>

              {/* Distance label */}
              {distance != null && (
                <text
                  x="100"
                  y="50"
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="9"
                  fontWeight="700"
                >
                  {distance} m
                </text>
              )}
            </>
          ) : (
            <>
              {/* Single marker for creation */}
              <circle
                cx="100"
                cy="55"
                r="8"
                className="fill-emerald-500/20 stroke-emerald-500"
                strokeWidth="2"
              />
              <circle cx="100" cy="55" r="3" className="fill-emerald-500" />
              <text
                x="100"
                y="80"
                textAnchor="middle"
                className="fill-emerald-600 dark:fill-emerald-400"
                fontSize="9"
                fontWeight="600"
              >
                Position proposée
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Coordinate values */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {original && (
          <div className="rounded bg-red-50 p-2 dark:bg-red-950/20">
            <div className="flex items-center gap-1 font-medium text-red-700 dark:text-red-400">
              <MapPin className="h-2.5 w-2.5" />
              Actuel
            </div>
            <p className="mt-0.5 font-mono text-red-600 dark:text-red-300">
              {original.lat.toFixed(6)}, {original.lng.toFixed(6)}
            </p>
          </div>
        )}
        <div
          className={`rounded bg-emerald-50 p-2 dark:bg-emerald-950/20 ${
            !original ? 'col-span-2' : ''
          }`}
        >
          <div className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
            <MapPin className="h-2.5 w-2.5" />
            Proposé
          </div>
          <p className="mt-0.5 font-mono text-emerald-600 dark:text-emerald-300">
            {proposed.lat.toFixed(6)}, {proposed.lng.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  )
}
