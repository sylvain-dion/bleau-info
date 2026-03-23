import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getAllSectorSlugs,
  getBouldersBySector,
  getSectorDetail,
} from '@/lib/data/boulder-service'
import { OfflineSectorWrapper } from '@/components/sector/offline-sector-wrapper'

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
 * Sector hub page — ISR-generated with offline-first support.
 *
 * Server renders sector data for SEO + online users.
 * Client-side OfflineSectorWrapper detects offline state and
 * falls back to IndexedDB data when the pack is cached (Story 13.6).
 */
export default async function SecteurPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const sector = getSectorDetail(slug)

  if (!sector) notFound()

  const boulders = getBouldersBySector(slug)
    .sort((a, b) => a.grade.localeCompare(b.grade))
    .map((b) => ({
      id: b.id,
      name: b.name,
      grade: b.grade,
      style: b.style,
      circuit: b.circuit,
      circuitNumber: b.circuitNumber,
      exposure: b.exposure,
    }))

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <OfflineSectorWrapper
        serverSector={sector}
        serverBoulders={boulders}
        sectorSlug={slug}
        sectorName={sector.name}
      />
    </main>
  )
}
