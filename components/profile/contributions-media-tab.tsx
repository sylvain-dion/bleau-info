'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Video,
  ExternalLink,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
} from 'lucide-react'
import {
  groupMediaByBoulder,
  statusBadge,
  type ContributionStatus,
  type MediaFilters,
} from '@/lib/contributions-hub'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import type { VideoSubmission } from '@/stores/video-submission-store'
import { useAuthStore } from '@/stores/auth-store'
import { getBoulderById } from '@/lib/data/boulder-service'
import { parseVideoUrl } from '@/lib/video'
import { VideoSubmissionDrawer } from '@/components/boulder/video-submission-drawer'
import { ContributionStatusPill } from '@/components/profile/contribution-status-pill'
import {
  ContributionDeleteDialog,
  type ContributionDeleteTarget,
} from '@/components/profile/contribution-delete-dialog'
import { getVideoStatus } from '@/lib/contributions-hub'

const STATUS_OPTIONS: Array<{ value: ContributionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'online', label: statusBadge('online').label },
  { value: 'pending', label: statusBadge('pending').label },
  { value: 'rejected', label: statusBadge('rejected').label },
  { value: 'pending_deletion', label: statusBadge('pending_deletion').label },
]

/**
 * Tab "Médias" of the contributions hub (Story 5.8).
 *
 * Aggregates the user's video submissions, groups them by boulder, and
 * exposes filters for status / sector / search. Each row exposes Edit
 * (drawer) + Delete (soft-delete dialog).
 */
export function ContributionsMediaTab() {
  const { user } = useAuthStore()
  const allVideos = useVideoSubmissionStore((s) => s.submissions)
  const requestDeletion = useVideoSubmissionStore((s) => s.requestDeletion)

  const userVideos = useMemo(
    () => (user ? allVideos.filter((v) => v.userId === user.id) : []),
    [allVideos, user],
  )

  const [filters, setFilters] = useState<MediaFilters>({})
  const [editing, setEditing] = useState<{
    boulderId: string
    submissionId: string
  } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    target: ContributionDeleteTarget
  } | null>(null)

  const sectorOptions = useMemo(() => {
    const sectors = new Set<string>()
    for (const v of userVideos) {
      const meta = lookupBoulder(v.boulderId)
      if (meta?.sector) sectors.add(meta.sector)
    }
    return Array.from(sectors).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [userVideos])

  const groups = useMemo(
    () => groupMediaByBoulder(userVideos, lookupBoulder, filters),
    [userVideos, filters],
  )

  if (userVideos.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center"
        data-testid="media-empty"
      >
        <Video className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">Aucun média</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajoutez une vidéo depuis la fiche d&apos;un bloc pour la
          retrouver ici.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filters.search ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            placeholder="Rechercher un bloc, un grimpeur…"
            aria-label="Rechercher dans mes médias"
            className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Statut"
            value={filters.status ?? 'all'}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                status: v as ContributionStatus | 'all',
              }))
            }
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label="Secteur"
            value={filters.sector ?? 'all'}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                sector: v === 'all' ? null : v,
              }))
            }
            options={[
              { value: 'all', label: 'Tous secteurs' },
              ...sectorOptions.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          {countVideos(groups)} vidéo
          {countVideos(groups) > 1 ? 's' : ''} sur {userVideos.length}
        </p>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground"
          data-testid="media-empty-filtered"
        >
          Aucun média ne correspond à ces filtres.
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {groups.map((group) => (
            <li
              key={group.boulderId}
              className="rounded-xl border border-border bg-card p-4"
              data-testid={`media-group-${group.boulderId}`}
            >
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <Link
                  href={`/blocs/${group.boulderId}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-foreground hover:underline">
                    {group.boulderName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {group.sector ?? 'Secteur inconnu'} ·{' '}
                    {group.videoCount} vidéo
                    {group.videoCount > 1 ? 's' : ''}
                  </p>
                </Link>
                <Link
                  href={`/blocs/${group.boulderId}`}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={`Ouvrir la fiche du bloc ${group.boulderName}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <ul className="space-y-2" role="list">
                {group.videos.map((video) => (
                  <VideoRow
                    key={video.id}
                    video={video}
                    onEdit={() =>
                      setEditing({
                        boulderId: video.boulderId,
                        submissionId: video.id,
                      })
                    }
                    onDelete={() =>
                      setPendingDelete({
                        id: video.id,
                        target: {
                          title:
                            video.climberName ??
                            `Vidéo · ${group.boulderName}`,
                          status: getVideoStatus(video),
                        },
                      })
                    }
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {/* Edit drawer */}
      {editing && (
        <VideoSubmissionDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          boulderId={editing.boulderId}
          editSubmissionId={editing.submissionId}
        />
      )}

      {/* Soft-delete dialog */}
      <ContributionDeleteDialog
        open={!!pendingDelete}
        target={pendingDelete?.target ?? null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() =>
          pendingDelete ? requestDeletion(pendingDelete.id) : 'noop'
        }
      />
    </div>
  )
}

function VideoRow({
  video,
  onEdit,
  onDelete,
}: {
  video: VideoSubmission
  onEdit: () => void
  onDelete: () => void
}) {
  const parsed = parseVideoUrl(video.videoUrl)
  const provider = parsed?.provider === 'youtube' ? 'YouTube' : 'Vimeo'
  const status = getVideoStatus(video)

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
        {provider === 'YouTube' ? 'YT' : 'VM'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {video.climberName ?? `Vidéo ${provider}`}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {video.videographerName
            ? `Vidéo : ${video.videographerName} · `
            : ''}
          {formatDate(video.createdAt)}
        </p>
      </div>
      <ContributionStatusPill status={status} />
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Modifier la vidéo"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Supprimer la vidéo"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}) {
  return (
    <label className="relative flex flex-1 items-center text-xs">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-1.5 pr-7 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground"
        aria-hidden="true"
      />
    </label>
  )
}

function lookupBoulder(id: string) {
  const boulder = getBoulderById(id)
  if (!boulder) return null
  return { name: boulder.name, sector: boulder.sector ?? null }
}

function countVideos(groups: { videoCount: number }[]): number {
  return groups.reduce((acc, g) => acc + g.videoCount, 0)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
