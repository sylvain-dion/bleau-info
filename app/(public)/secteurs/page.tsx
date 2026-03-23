import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, Mountain, ArrowRight } from 'lucide-react'
import { getAllSectorSlugs, getSectorDetail } from '@/lib/data/boulder-service'

export const metadata: Metadata = {
  title: 'Secteurs — Bleau.info',
  description:
    'Tous les secteurs de bloc à Fontainebleau : nombre de blocs, cotations, circuits.',
}

/**
 * Sector index page — lists all sectors with summary stats.
 */
export default function SecteursPage() {
  const slugs = getAllSectorSlugs()
  const sectors = slugs
    .map((s) => getSectorDetail(s.slug))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name, 'fr'))

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Back to map */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <MapPin className="h-4 w-4" />
        Carte
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
        Secteurs
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {sectors.length} secteurs à Fontainebleau
      </p>

      <div className="space-y-2">
        {sectors.map((sector) => {
          if (!sector) return null
          return (
            <Link
              key={sector.slug}
              href={`/secteurs/${sector.slug}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mountain className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{sector.name}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{sector.boulderCount} blocs</span>
                  {sector.gradeMin && sector.gradeMax && (
                    <span>
                      {sector.gradeMin} → {sector.gradeMax}
                    </span>
                  )}
                  {sector.circuitCount > 0 && (
                    <span>
                      {sector.circuitCount} circuit
                      {sector.circuitCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </main>
  )
}
