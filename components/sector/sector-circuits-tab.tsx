'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Route, Hash, ArrowRight, Map } from 'lucide-react'
import { getCircuitsForSector, type CircuitInfo } from '@/lib/data/mock-circuits'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import { toSlug } from '@/lib/data/boulder-service'

interface SectorCircuitsTabProps {
  sectorName: string
  sectorSlug?: string
}

/**
 * Circuits tab for the sector page.
 *
 * Lists all circuits in the sector with color swatch, grade range,
 * boulder count, and a visual indicator.
 */
export function SectorCircuitsTab({ sectorName, sectorSlug }: SectorCircuitsTabProps) {
  const slug = sectorSlug ?? toSlug(sectorName)
  const circuits = useMemo(
    () => getCircuitsForSector(sectorName),
    [sectorName]
  )

  if (circuits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Route className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Aucun circuit dans ce secteur
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {circuits.length} circuit{circuits.length > 1 ? 's' : ''} dans ce secteur
      </p>

      {circuits.map((circuit) => (
        <CircuitCard key={circuit.id} circuit={circuit} sectorSlug={slug} />
      ))}

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        Les circuits sont également visibles sur la carte
      </p>
    </div>
  )
}

function CircuitCard({ circuit, sectorSlug }: { circuit: CircuitInfo; sectorSlug: string }) {
  const colorLabel = CIRCUIT_LABEL[circuit.color] ?? circuit.color

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {/* Color swatch */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: circuit.hexColor + '20' }}
        >
          <div
            className="h-5 w-5 rounded-full"
            style={{ backgroundColor: circuit.hexColor }}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground">
            Circuit {colorLabel}
          </span>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {circuit.boulderCount} blocs
            </span>
            <span>
              {circuit.gradeRange.min} → {circuit.gradeRange.max}
            </span>
          </div>
        </div>
      </div>

      {/* Boulder list preview */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {circuit.boulderIds.map((_, i) => (
          <span
            key={i}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: circuit.hexColor }}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {/* Action: view on map */}
      <Link
        href={`/?circuit=${circuit.color}&sector=${sectorSlug}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Map className="h-3.5 w-3.5" />
        Voir sur la carte
      </Link>
    </div>
  )
}

const CIRCUIT_LABEL: Record<string, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}
