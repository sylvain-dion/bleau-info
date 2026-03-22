import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getAllSectorSlugs,
  getBouldersBySector,
  getSectorDetail,
} from '@/lib/data/boulder-service'
import { SectorHeader } from '@/components/sector/sector-header'
import { SectorTabsContainer } from '@/components/sector/sector-tabs'

/**
 * ISR: regenerate sector pages every hour.
 */
export const revalidate = 3600

/**
 * Pre-generate pages for all sectors at build time.
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return getAllSectorSlugs().map((s) => ({ slug: s.slug }))
}

/**
 * Dynamic metadata for SEO.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const sector = getSectorDetail(slug)

  if (!sector) {
    return { title: 'Secteur introuvable — Bleau.info' }
  }

  const gradeRange =
    sector.gradeMin && sector.gradeMax
      ? ` · ${sector.gradeMin} à ${sector.gradeMax}`
      : ''

  return {
    title: `${sector.name} — ${sector.boulderCount} blocs${gradeRange} — Bleau.info`,
    description: `Explorez les ${sector.boulderCount} blocs d'escalade du secteur ${sector.name} à Fontainebleau. Cotations, styles, circuits et topos.`,
  }
}

/**
 * Sector hub page — ISR-generated (Story 13.1).
 *
 * Rich header with aggregated stats + tabbed interface.
 * Blocs tab shows the existing grouped boulder list.
 * Other tabs (Circuits, Météo, Activité, Stats) are placeholders
 * activated progressively as Epics 9, 10, 11, 12 are delivered.
 */
export default async function SecteurPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const sector = getSectorDetail(slug)

  if (!sector) notFound()

  const boulders = getBouldersBySector(slug).sort((a, b) =>
    a.grade.localeCompare(b.grade)
  )

  const gradeGroups = groupByGradePrefix(boulders)

  const blocsContent = (
    <>
      {/* Boulder count */}
      <p className="mb-3 text-xs text-muted-foreground">
        {boulders.length} bloc{boulders.length > 1 ? 's' : ''}
      </p>

      {/* Boulder list grouped by grade prefix */}
      <div className="space-y-6">
        {gradeGroups.map(({ prefix, items }) => (
          <section key={prefix}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {prefix}
            </h2>
            <div className="space-y-1">
              {items.map((b) => (
                <Link
                  key={b.id}
                  href={`/blocs/${b.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {b.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {STYLE_LABELS[b.style] ?? b.style}
                      {b.circuit && ` · Circuit ${b.circuit}`}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {b.grade}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Map link */}
      <div className="mt-8 rounded-xl border border-border bg-card p-4 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:underline"
        >
          Voir le secteur sur la carte →
        </Link>
      </div>
    </>
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <SectorHeader sector={sector} />
      <SectorTabsContainer blocsContent={blocsContent} />
    </main>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GradeGroup {
  prefix: string
  items: Array<{
    id: string
    name: string
    grade: string
    style: string
    circuit: string | null
  }>
}

function groupByGradePrefix(
  boulders: Array<{
    id: string
    name: string
    grade: string
    style: string
    circuit: string | null
  }>
): GradeGroup[] {
  const groups = new Map<string, GradeGroup['items']>()

  for (const b of boulders) {
    const prefix = b.grade.charAt(0)
    const label = `${prefix}e niveau`
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(b)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prefix, items]) => ({ prefix, items }))
}

const STYLE_LABELS: Record<string, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}
