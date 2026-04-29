'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ChevronRight, Sparkles, Mountain, Video } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import { getBoulderById } from '@/lib/data/boulder-service'
import { buildRecentContributions } from '@/lib/contributions-hub'
import { ContributionStatusPill } from '@/components/profile/contribution-status-pill'

interface RecentContributionsSectionProps {
  /** How many entries to show. Default 5. */
  limit?: number
}

/**
 * Profile home block — "Mes dernières contributions" (Story 5.8).
 *
 * Aggregates recent boulder drafts + video submissions for the signed-in
 * user, sorted by most recent activity. Hidden when the user has no
 * contributions: the empty state lives on the dedicated hub.
 */
export function RecentContributionsSection({
  limit = 5,
}: RecentContributionsSectionProps) {
  const { user } = useAuthStore()
  const drafts = useBoulderDraftStore((s) => s.drafts)
  const allVideos = useVideoSubmissionStore((s) => s.submissions)

  const userVideos = useMemo(
    () => (user ? allVideos.filter((v) => v.userId === user.id) : []),
    [allVideos, user],
  )

  const recent = useMemo(
    () => buildRecentContributions(drafts, userVideos, lookupBoulder, limit),
    [drafts, userVideos, limit],
  )

  if (recent.length === 0) return null

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-5"
      aria-labelledby="recent-contributions-heading"
      data-testid="recent-contributions-section"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h2
            id="recent-contributions-heading"
            className="text-sm font-semibold text-foreground"
          >
            Mes dernières contributions
          </h2>
        </div>
        <Link
          href="/profil/contributions"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          data-testid="recent-contributions-see-all"
        >
          Voir tout
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="space-y-2" role="list">
        {recent.map((item) => {
          const Icon = item.kind === 'boulder' ? Mountain : Video
          return (
            <li
              key={`${item.kind}-${item.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.subtitle}
                  {' · '}
                  {formatDate(item.date)}
                </p>
              </div>
              <ContributionStatusPill status={item.status} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function lookupBoulder(id: string) {
  const boulder = getBoulderById(id)
  if (!boulder) return null
  return { name: boulder.name, sector: boulder.sector ?? null }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}
