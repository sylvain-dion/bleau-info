'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Mountain,
  Trophy,
  Map,
  Route,
  Calendar,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { getClimberProfile } from '@/lib/data/mock-climbers'
import { BadgesSection } from '@/components/profile/badges-section'
import { computeBadges } from '@/lib/badges'

export default function ClimberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const profile = getClimberProfile(id)

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center">
        <Mountain className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <h1 className="text-lg font-bold text-foreground">Profil introuvable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce grimpeur n&apos;existe pas.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </main>
    )
  }

  // Private profile
  if (!profile.privacy.profilePublic) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl font-bold text-muted-foreground">
              {profile.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground">
            {profile.displayName}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Profil privé
          </div>
        </div>
      </main>
    )
  }

  const memberDate = new Date(profile.memberSince).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      {/* Back */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl font-bold text-muted-foreground">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {profile.displayName}
          </h1>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Membre depuis {memberDate}
          </p>
        </div>
      </div>

      {/* Stats */}
      {profile.privacy.statsPublic && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="Croix"
            value={String(profile.stats.tickCount)}
          />
          <StatCard
            icon={<Mountain className="h-4 w-4 text-primary" />}
            label="Blocs uniques"
            value={String(profile.stats.uniqueBoulders)}
          />
          <StatCard
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            label="Cotation max"
            value={profile.stats.maxGrade}
          />
          <StatCard
            icon={<Map className="h-4 w-4 text-blue-500" />}
            label="Secteurs visités"
            value={String(profile.stats.sectorsVisited)}
          />
          <StatCard
            icon={<Route className="h-4 w-4 text-purple-500" />}
            label="Circuits terminés"
            value={String(profile.stats.circuitsCompleted)}
          />
        </div>
      )}

      {/* Badges — Story 14.1 */}
      {profile.privacy.statsPublic && (
        <BadgesSection badges={computeBadges(profile.stats)} />
      )}

      {/* Recent ascensions */}
      {profile.privacy.ascensionsPublic &&
        profile.recentAscensions.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Dernières ascensions
            </h2>
            <div className="space-y-2">
              {profile.recentAscensions.slice(0, 10).map((asc, i) => (
                <Link
                  key={`${asc.boulderId}-${i}`}
                  href={`/blocs/${asc.boulderId}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {asc.boulderName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asc.sector} · {asc.grade}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(asc.tickDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {TICK_STYLE_LABELS[asc.style] ?? asc.style}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      {/* Ascensions hidden */}
      {!profile.privacy.ascensionsPublic && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          <EyeOff className="mx-auto h-5 w-5" />
          <span>Ascensions masquées par l&apos;utilisateur</span>
        </div>
      )}
    </main>
  )
}

// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {icon}
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

const TICK_STYLE_LABELS: Record<string, string> = {
  flash: 'Flash',
  a_vue: 'À vue',
  travaille: 'Après travail',
}
