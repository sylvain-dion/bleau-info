/**
 * Pure helpers for the "Mes contributions" hub (Story 5.8).
 *
 * The hub aggregates two distinct stores:
 *  - `useBoulderDraftStore` — créations de blocs (Tab "Blocs")
 *  - `useVideoSubmissionStore` — vidéos ajoutées à un bloc (Tab "Médias")
 *
 * Photos uploaded to existing boulders are out of scope until a future
 * story introduces a dedicated store; the helpers here keep the
 * "media" type general enough to fold them in later without breaking
 * the public API.
 */

import type { BoulderDraft } from '@/stores/boulder-draft-store'
import type { VideoSubmission } from '@/stores/video-submission-store'

// ---------------------------------------------------------------------------
// Status — "En ligne" / "Brouillon" / "En attente" / "Refusé"
// ---------------------------------------------------------------------------

export type ContributionStatus =
  | 'online'
  | 'draft'
  | 'pending'
  | 'rejected'
  | 'pending_deletion'

export interface ContributionStatusBadge {
  status: ContributionStatus
  label: string
  /** Tailwind class name for the chip background + text. */
  className: string
}

const STATUS_LABELS: Record<ContributionStatus, ContributionStatusBadge> = {
  online: {
    status: 'online',
    label: 'En ligne',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  draft: {
    status: 'draft',
    label: 'Brouillon',
    className: 'bg-muted text-muted-foreground',
  },
  pending: {
    status: 'pending',
    label: 'En attente',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  rejected: {
    status: 'rejected',
    label: 'Refusé',
    className: 'bg-destructive/10 text-destructive',
  },
  pending_deletion: {
    status: 'pending_deletion',
    label: 'Suppression en attente',
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  },
}

export function statusBadge(status: ContributionStatus): ContributionStatusBadge {
  return STATUS_LABELS[status]
}

/** Map a `BoulderDraft.status` (+ deletion flag) to a hub status. */
export function getDraftStatus(draft: BoulderDraft): ContributionStatus {
  if (draft.pendingDeletion) return 'pending_deletion'
  switch (draft.status) {
    case 'approved':
      return 'online'
    case 'rejected':
      return 'rejected'
    case 'pending':
    case 'changes_requested':
      return 'pending'
    case 'draft':
    default:
      return 'draft'
  }
}

/** Map a `VideoSubmission.moderationStatus` (+ deletion flag) to a hub status. */
export function getVideoStatus(video: VideoSubmission): ContributionStatus {
  if (video.pendingDeletion) return 'pending_deletion'
  switch (video.moderationStatus) {
    case 'approved':
      return 'online'
    case 'rejected':
      return 'rejected'
    case 'pending':
    default:
      return 'pending'
  }
}

/** True if the entry is publicly visible — soft-delete must go through moderation. */
export function isOnline(status: ContributionStatus): boolean {
  return status === 'online'
}

// ---------------------------------------------------------------------------
// Media tab — group videos by boulder
// ---------------------------------------------------------------------------

export interface BoulderMediaGroup {
  boulderId: string
  boulderName: string
  sector: string | null
  videoCount: number
  /** Most recent activity (max of all media `updatedAt`). */
  lastUpdatedAt: string
  videos: VideoSubmission[]
  /** True if any media in the group is publicly visible. */
  hasOnline: boolean
}

export interface MediaFilters {
  search?: string
  /** Currently only `'video'` until a photo store lands. */
  mediaType?: 'all' | 'video' | 'photo'
  status?: ContributionStatus | 'all'
  sector?: string | null
  /** ISO date — only entries on/after. */
  fromDate?: string | null
  /** ISO date — only entries on/before. */
  toDate?: string | null
}

const NORMALIZE_REGEX = /[\u0300-\u036f]/g
function normalize(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(NORMALIZE_REGEX, '')
}

/**
 * Group media items by boulder, ready for the Médias tab.
 *
 * @param videos     all video submissions for the user
 * @param boulderLookup  function returning `{ name, sector }` for a
 *   boulder id — typically `getBoulderById` mapped to those fields, or
 *   a tick-store fallback. Returning `null` is fine: the boulder name
 *   collapses to the id and the row stays visible.
 * @param filters    active toolbar filters
 */
export function groupMediaByBoulder(
  videos: VideoSubmission[],
  boulderLookup: (id: string) => { name: string; sector: string | null } | null,
  filters: MediaFilters = {},
): BoulderMediaGroup[] {
  const filtered = filterVideos(videos, filters, boulderLookup)
  const buckets = new Map<string, BoulderMediaGroup>()

  for (const v of filtered) {
    const meta = boulderLookup(v.boulderId)
    const id = v.boulderId
    let bucket = buckets.get(id)
    if (!bucket) {
      bucket = {
        boulderId: id,
        boulderName: meta?.name ?? id,
        sector: meta?.sector ?? null,
        videoCount: 0,
        lastUpdatedAt: v.updatedAt,
        videos: [],
        hasOnline: false,
      }
      buckets.set(id, bucket)
    }
    bucket.videos.push(v)
    bucket.videoCount += 1
    if (v.updatedAt > bucket.lastUpdatedAt) bucket.lastUpdatedAt = v.updatedAt
    if (getVideoStatus(v) === 'online') bucket.hasOnline = true
  }

  // Sort each group's videos newest first.
  for (const bucket of buckets.values()) {
    bucket.videos.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.lastUpdatedAt < b.lastUpdatedAt ? 1 : -1,
  )
}

function filterVideos(
  videos: VideoSubmission[],
  filters: MediaFilters,
  boulderLookup: (id: string) => { name: string; sector: string | null } | null,
): VideoSubmission[] {
  const search = filters.search?.trim() ?? ''
  const needle = search ? normalize(search) : ''
  const sector = filters.sector ?? null
  const from = filters.fromDate ?? null
  const to = filters.toDate ?? null

  return videos.filter((v) => {
    const status = getVideoStatus(v)
    if (filters.mediaType && filters.mediaType === 'photo') return false
    if (
      filters.status &&
      filters.status !== 'all' &&
      filters.status !== status
    ) {
      return false
    }
    const meta = boulderLookup(v.boulderId)
    if (sector && meta?.sector !== sector) return false
    if (from && v.createdAt < from) return false
    if (to && v.createdAt > to) return false
    if (needle) {
      const haystack = normalize(
        `${meta?.name ?? v.boulderId} ${v.climberName ?? ''} ${
          v.videographerName ?? ''
        }`,
      )
      if (!haystack.includes(needle)) return false
    }
    return true
  })
}

// ---------------------------------------------------------------------------
// Boulders tab
// ---------------------------------------------------------------------------

export type BoulderSortKey = 'date-desc' | 'date-asc' | 'name-asc'

export interface BoulderFilters {
  search?: string
  status?: ContributionStatus | 'all'
}

export function filterAndSortBoulderDrafts(
  drafts: BoulderDraft[],
  filters: BoulderFilters,
  sortKey: BoulderSortKey = 'date-desc',
): BoulderDraft[] {
  const search = filters.search?.trim() ?? ''
  const needle = search ? normalize(search) : ''

  const filtered = drafts.filter((d) => {
    if (
      filters.status &&
      filters.status !== 'all' &&
      filters.status !== getDraftStatus(d)
    ) {
      return false
    }
    if (needle) {
      const haystack = normalize(`${d.name} ${d.sector}`)
      if (!haystack.includes(needle)) return false
    }
    return true
  })

  const sorted = [...filtered]
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'date-asc':
        return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
      case 'name-asc':
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      case 'date-desc':
      default:
        return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    }
  })
  return sorted
}

// ---------------------------------------------------------------------------
// Recent contributions for the profile home
// ---------------------------------------------------------------------------

export type ContributionKind = 'boulder' | 'video'

export interface RecentContribution {
  kind: ContributionKind
  /** Underlying entity id. */
  id: string
  title: string
  subtitle: string
  status: ContributionStatus
  /** Most recent activity date used for sorting. */
  date: string
  /** Anchor used by the profile home link. */
  href: string
}

/**
 * Combine boulder drafts and video submissions into a single recent feed
 * for the profile home. Sorted by most recent activity, capped to `limit`.
 */
export function buildRecentContributions(
  drafts: BoulderDraft[],
  videos: VideoSubmission[],
  boulderLookup: (id: string) => { name: string; sector: string | null } | null,
  limit: number,
): RecentContribution[] {
  if (limit <= 0) return []
  const items: RecentContribution[] = []

  for (const d of drafts) {
    items.push({
      kind: 'boulder',
      id: d.id,
      title: d.name || '(sans nom)',
      subtitle: d.sector || 'Secteur inconnu',
      status: getDraftStatus(d),
      date: d.updatedAt,
      href: '/profil/contributions?tab=boulders',
    })
  }
  for (const v of videos) {
    const meta = boulderLookup(v.boulderId)
    items.push({
      kind: 'video',
      id: v.id,
      title: meta?.name ?? v.boulderId,
      subtitle: v.climberName ?? 'Vidéo soumise',
      status: getVideoStatus(v),
      date: v.updatedAt,
      href: '/profil/contributions?tab=media',
    })
  }

  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return items.slice(0, limit)
}

// ---------------------------------------------------------------------------
// Aggregate counters used by the global header
// ---------------------------------------------------------------------------

export interface ContributionCounts {
  totalBoulders: number
  totalMedia: number
  onlineCount: number
  pendingCount: number
}

export function countContributions(
  drafts: BoulderDraft[],
  videos: VideoSubmission[],
): ContributionCounts {
  let online = 0
  let pending = 0
  for (const d of drafts) {
    const s = getDraftStatus(d)
    if (s === 'online') online += 1
    else if (s === 'pending' || s === 'pending_deletion') pending += 1
  }
  for (const v of videos) {
    const s = getVideoStatus(v)
    if (s === 'online') online += 1
    else if (s === 'pending' || s === 'pending_deletion') pending += 1
  }
  return {
    totalBoulders: drafts.length,
    totalMedia: videos.length,
    onlineCount: online,
    pendingCount: pending,
  }
}
