import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  Mountain,
  Ruler,
  Sun,
  Baby,
  MapPin,
} from 'lucide-react'
import {
  getAllBoulderIds,
  getBoulderById,
  toSlug,
} from '@/lib/data/boulder-service'
import { BoulderActionBar } from '@/components/boulder/boulder-action-bar'
import { VideoCarousel } from '@/components/boulder/video-carousel'
import { CommentSection } from '@/components/boulder/comment-section'

/**
 * ISR revalidation: regenerate page every hour.
 * On-demand revalidation via /api/revalidate overrides this.
 */
export const revalidate = 3600

/**
 * Pre-generate pages for all known boulders at build time.
 */
export function generateStaticParams(): Array<{ id: string }> {
  return getAllBoulderIds().map((id) => ({ id }))
}

/**
 * Dynamic metadata for SEO.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const boulder = getBoulderById(id)

  if (!boulder) {
    return { title: 'Bloc introuvable — Bleau.info' }
  }

  return {
    title: `${boulder.name} (${boulder.grade}) — ${boulder.sector} — Bleau.info`,
    description: `Bloc ${boulder.name}, cotation ${boulder.grade}, style ${boulder.style} dans le secteur ${boulder.sector} à Fontainebleau.`,
    openGraph: {
      title: `${boulder.name} (${boulder.grade})`,
      description: `Secteur ${boulder.sector} — ${boulder.style} — Fontainebleau`,
    },
  }
}

/**
 * Boulder detail page — ISR-generated.
 *
 * Server component that pre-renders at build time and
 * revalidates every hour or on-demand via webhook.
 */
export default async function BlocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const boulder = getBoulderById(id)

  if (!boulder) notFound()

  const sectorSlug = toSlug(boulder.sector)

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-6">
      {/* Back nav */}
      <Link
        href={`/secteurs/${sectorSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {boulder.sector}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {boulder.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <GradeBadge grade={boulder.grade} />
          <StyleBadge style={boulder.style} />
          {boulder.circuit && (
            <CircuitBadge
              color={boulder.circuit}
              number={boulder.circuitNumber}
            />
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <InfoCard
          icon={<Mountain className="h-4 w-4" />}
          label="Secteur"
          value={boulder.sector}
        />
        <InfoCard
          icon={<Sun className="h-4 w-4" />}
          label="Exposition"
          value={EXPOSURE_LABELS[boulder.exposure]}
        />
        <InfoCard
          icon={<MapPin className="h-4 w-4" />}
          label="Coordonnées"
          value={`${boulder.latitude.toFixed(5)}, ${boulder.longitude.toFixed(5)}`}
        />
        <InfoCard
          icon={<Baby className="h-4 w-4" />}
          label="Poussette"
          value={boulder.strollerAccessible ? 'Accessible' : 'Non accessible'}
        />
      </div>

      {/* Topo placeholder */}
      {boulder.topo && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Topo</h2>
          <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-muted">
            <div className="text-center text-sm text-muted-foreground">
              <Ruler className="mx-auto mb-2 h-6 w-6" />
              <p>Topo disponible</p>
              <p className="text-xs">Aperçu interactif sur la carte</p>
            </div>
          </div>
        </section>
      )}

      {/* Videos — same carousel as map view */}
      <VideoCarousel
        boulderId={boulder.id}
        mockVideos={boulder.videos}
      />

      {/* Comments */}
      <CommentSection
        boulderId={boulder.id}
        boulderName={boulder.name}
      />

      {/* Action bar (client component) */}
      <BoulderActionBar
        boulderId={boulder.id}
        boulderName={boulder.name}
        grade={boulder.grade}
        style={boulder.style}
        sector={boulder.sector}
        latitude={boulder.latitude}
        longitude={boulder.longitude}
      />

      {/* ISR timestamp (dev helper, hidden in production) */}
      <p className="mt-8 text-center text-[10px] text-muted-foreground/50">
        Généré le {new Date().toISOString()}
      </p>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
      {grade}
    </span>
  )
}

function StyleBadge({ style }: { style: string }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
      {STYLE_LABELS[style] ?? style}
    </span>
  )
}

function CircuitBadge({
  color,
  number,
}: {
  color: string
  number: number | null
}) {
  return (
    <span
      className="rounded-full px-3 py-1 text-sm font-medium"
      style={{
        backgroundColor: CIRCUIT_COLORS[color] ?? '#888',
        color: ['jaune', 'blanc', 'orange'].includes(color)
          ? '#1a1a1a'
          : '#fff',
      }}
    >
      {number != null ? `n°${number}` : color}
    </span>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STYLE_LABELS: Record<string, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

const EXPOSURE_LABELS: Record<string, string> = {
  ombre: 'Ombre',
  soleil: 'Soleil',
  'mi-ombre': 'Mi-ombre',
}

const CIRCUIT_COLORS: Record<string, string> = {
  jaune: '#FACC15',
  bleu: '#3B82F6',
  rouge: '#EF4444',
  blanc: '#F5F5F5',
  orange: '#F97316',
  noir: '#1a1a1a',
}
