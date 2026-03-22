import Link from 'next/link'
import {
  ArrowLeft,
  Mountain,
  Map,
  Download,
  CheckCircle2,
} from 'lucide-react'
import type { SectorDetail } from '@/lib/data/boulder-service'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'

interface SectorHeaderProps {
  sector: SectorDetail
  isOfflineReady?: boolean
}

/**
 * Rich header for the sector page (Story 13.1).
 *
 * Shows sector name, zone, aggregated stats, circuit badges,
 * minimap link, and offline download CTA.
 */
export function SectorHeader({
  sector,
  isOfflineReady = false,
}: SectorHeaderProps) {
  return (
    <div className="mb-6">
      {/* Back nav */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Carte
      </Link>

      <div className="flex gap-4">
        {/* Minimap placeholder */}
        <Link
          href={`/?sector=${sector.slug}`}
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 transition-colors hover:bg-muted"
          aria-label={`Voir ${sector.name} sur la carte`}
        >
          <Map className="h-8 w-8 text-muted-foreground/50" />
        </Link>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5 text-muted-foreground">
            <Mountain className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Secteur
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {sector.name}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{sector.zone}</p>

          {/* Stats chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatChip label={`${sector.boulderCount} blocs`} />
            {sector.gradeMin && sector.gradeMax && (
              <StatChip label={`${sector.gradeMin} → ${sector.gradeMax}`} />
            )}
            {sector.circuitCount > 0 && (
              <StatChip
                label={`${sector.circuitCount} circuit${sector.circuitCount > 1 ? 's' : ''}`}
              />
            )}
          </div>

          {/* Circuit color badges */}
          {sector.circuitColors.length > 0 && (
            <div className="mt-2 flex gap-1">
              {sector.circuitColors.map((color) => (
                <span
                  key={color}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[9px] font-bold"
                  style={{
                    backgroundColor:
                      CIRCUIT_COLORS[color as keyof typeof CIRCUIT_COLORS] ??
                      '#94a3b8',
                  }}
                  title={`Circuit ${color}`}
                  aria-label={`Circuit ${color}`}
                >
                  {color.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Offline CTA */}
      <div className="mt-4">
        {isOfflineReady ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Disponible hors-ligne
          </div>
        ) : (
          <Link
            href={`/?download=${sector.slug}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger le pack secteur
          </Link>
        )}
      </div>
    </div>
  )
}

function StatChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  )
}
