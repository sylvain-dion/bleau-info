'use client'

import {
  Mountain,
  MapPin,
  Palette,
  Sun,
  Cloud,
  CloudSun,
  Baby,
  Hash,
  ArrowUpRight,
} from 'lucide-react'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type {
  BoulderProperties,
  CircuitColor,
  BoulderStyle,
  BoulderExposure,
} from '@/lib/data/mock-boulders'
import { getTopoData } from '@/lib/data/mock-topos'
import { formatGrade } from '@/lib/grades'
import { TopoViewer } from '@/components/topo/topo-viewer'

/** Labels for boulder styles in French */
const STYLE_LABELS: Record<BoulderStyle, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

/** Labels for exposure in French */
const EXPOSURE_LABELS: Record<BoulderExposure, string> = {
  ombre: 'À l\u2019ombre',
  soleil: 'Au soleil',
  'mi-ombre': 'Mi-ombre',
}

/** Icons for exposure types */
function ExposureIcon({ exposure, className }: { exposure: BoulderExposure; className?: string }) {
  switch (exposure) {
    case 'soleil':
      return <Sun className={className} />
    case 'ombre':
      return <Cloud className={className} />
    case 'mi-ombre':
      return <CloudSun className={className} />
  }
}

/** Circuit color chip with optional shape indicator */
function CircuitBadge({ circuit }: { circuit: CircuitColor }) {
  const color = CIRCUIT_COLORS[circuit]
  const label = circuit.charAt(0).toUpperCase() + circuit.slice(1)

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color: circuit === 'blanc' ? '#71717a' : color,
        border: circuit === 'blanc' ? '1px solid #d4d4d8' : 'none',
      }}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}

interface BoulderDetailProps {
  properties: BoulderProperties
  coordinates: [number, number]
  /** Whether the sheet is expanded beyond Peek state */
  isExpanded: boolean
}

export function BoulderDetail({ properties, coordinates, isExpanded }: BoulderDetailProps) {
  const { name, grade, sector, circuit, circuitNumber, style, exposure, strollerAccessible } =
    properties

  return (
    <div className="space-y-4">
      {/* ── Peek content: always visible ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-foreground">{name}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{sector}</span>
          </div>
        </div>

        {/* Grade badge */}
        <div className="flex shrink-0 flex-col items-center rounded-lg bg-primary/10 px-3 py-1.5">
          <span className="text-xl font-bold text-primary">{formatGrade(grade)}</span>
        </div>
      </div>

      {/* Circuit + Style tags (always visible) */}
      <div className="flex flex-wrap items-center gap-2">
        {circuit && <CircuitBadge circuit={circuit} />}
        {circuitNumber && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Hash className="h-3 w-3" />
            {circuitNumber}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Mountain className="h-3 w-3" />
          {STYLE_LABELS[style]}
        </span>
      </div>

      {/* ── Half/Full content: shown when expanded ── */}
      {isExpanded && (
        <>
          {/* Divider */}
          <div className="border-t border-border" />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Exposure */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ExposureIcon exposure={exposure} className="h-4 w-4 text-muted-foreground" />
                {EXPOSURE_LABELS[exposure]}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Exposition</p>
            </div>

            {/* Stroller access */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Baby className="h-4 w-4 text-muted-foreground" />
                {strollerAccessible ? 'Oui' : 'Non'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Accès poussette</p>
            </div>

            {/* Style */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Palette className="h-4 w-4 text-muted-foreground" />
                {STYLE_LABELS[style]}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Style d&apos;escalade</p>
            </div>

            {/* Coordinates */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                {coordinates[1].toFixed(5)}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {coordinates[0].toFixed(5)}
              </p>
            </div>
          </div>

          {/* Topo viewer or placeholder */}
          <div className="border-t border-border pt-4">
            <TopoSection name={name} boulderId={properties.id} />
          </div>
        </>
      )}
    </div>
  )
}

/** Renders TopoViewer if topo data exists, otherwise a placeholder */
function TopoSection({ name, boulderId }: { name: string; boulderId: string }) {
  const topo = getTopoData(boulderId)

  if (!topo) {
    return (
      <>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Topo</h3>
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <div className="text-center">
            <Mountain className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p>Topo non disponible</p>
            <p className="text-xs">Aucun tracé pour ce bloc</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <TopoViewer
      boulderName={name}
      photoUrl={topo.photoUrl}
      circuitColor={topo.circuitColor}
      drawing={topo.drawing}
    />
  )
}
