import { describe, it, expect } from 'vitest'
import {
  statusBadge,
  getDraftStatus,
  getVideoStatus,
  isOnline,
  groupMediaByBoulder,
  filterAndSortBoulderDrafts,
  buildRecentContributions,
  countContributions,
} from '@/lib/contributions-hub'
import type { BoulderDraft } from '@/stores/boulder-draft-store'
import type { VideoSubmission } from '@/stores/video-submission-store'

const FAKE_BOULDER = (id: string) => ({
  name: id === 'b1' ? 'La Marie-Rose' : id === 'b2' ? 'Karma' : id,
  sector: id === 'b1' ? 'Cuvier' : id === 'b2' ? 'Bas Cuvier' : null,
})

function makeDraft(overrides: Partial<BoulderDraft> = {}): BoulderDraft {
  return {
    id: overrides.id ?? 'd1',
    name: overrides.name ?? 'New Boulder',
    grade: overrides.grade ?? '6a',
    style: overrides.style ?? 'dalle',
    sector: overrides.sector ?? 'Cuvier',
    description: overrides.description ?? '',
    height: overrides.height ?? null,
    exposure: overrides.exposure ?? null,
    strollerAccessible: overrides.strollerAccessible ?? false,
    photoBlurHash: overrides.photoBlurHash ?? null,
    photoWidth: overrides.photoWidth ?? null,
    photoHeight: overrides.photoHeight ?? null,
    latitude: overrides.latitude ?? null,
    longitude: overrides.longitude ?? null,
    topoDrawing: overrides.topoDrawing ?? null,
    videoUrl: overrides.videoUrl ?? null,
    potentialDuplicate: overrides.potentialDuplicate ?? false,
    syncStatus: overrides.syncStatus ?? 'local',
    status: overrides.status ?? 'draft',
    pendingDeletion: overrides.pendingDeletion,
    createdAt: overrides.createdAt ?? '2026-01-01T10:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T10:00:00Z',
  }
}

function makeVideo(overrides: Partial<VideoSubmission> = {}): VideoSubmission {
  return {
    id: overrides.id ?? 'v1',
    boulderId: overrides.boulderId ?? 'b1',
    videoUrl: overrides.videoUrl ?? 'https://youtube.com/watch?v=x',
    climberName: overrides.climberName ?? null,
    videographerName: overrides.videographerName ?? null,
    moderationStatus: overrides.moderationStatus ?? 'pending',
    syncStatus: overrides.syncStatus ?? 'local',
    pendingDeletion: overrides.pendingDeletion,
    userId: overrides.userId ?? 'u1',
    createdAt: overrides.createdAt ?? '2026-01-01T10:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T10:00:00Z',
  }
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

describe('status helpers', () => {
  it('maps draft statuses to hub statuses', () => {
    expect(getDraftStatus(makeDraft({ status: 'draft' }))).toBe('draft')
    expect(getDraftStatus(makeDraft({ status: 'pending' }))).toBe('pending')
    expect(getDraftStatus(makeDraft({ status: 'changes_requested' }))).toBe(
      'pending',
    )
    expect(getDraftStatus(makeDraft({ status: 'approved' }))).toBe('online')
    expect(getDraftStatus(makeDraft({ status: 'rejected' }))).toBe('rejected')
  })

  it('returns "pending_deletion" when the deletion flag is set', () => {
    const draft = makeDraft({ status: 'approved', pendingDeletion: true })
    expect(getDraftStatus(draft)).toBe('pending_deletion')
  })

  it('maps video moderation statuses to hub statuses', () => {
    expect(getVideoStatus(makeVideo({ moderationStatus: 'pending' }))).toBe(
      'pending',
    )
    expect(getVideoStatus(makeVideo({ moderationStatus: 'approved' }))).toBe(
      'online',
    )
    expect(getVideoStatus(makeVideo({ moderationStatus: 'rejected' }))).toBe(
      'rejected',
    )
  })

  it('returns "pending_deletion" for videos awaiting moderator removal', () => {
    const v = makeVideo({ moderationStatus: 'approved', pendingDeletion: true })
    expect(getVideoStatus(v)).toBe('pending_deletion')
  })

  it('exposes a localized label and class for each status', () => {
    expect(statusBadge('online').label).toBe('En ligne')
    expect(statusBadge('draft').label).toBe('Brouillon')
    expect(statusBadge('pending').label).toBe('En attente')
    expect(statusBadge('rejected').label).toBe('Refusé')
    expect(statusBadge('pending_deletion').label).toBe('Suppression en attente')
  })

  it('isOnline returns true only for "online"', () => {
    expect(isOnline('online')).toBe(true)
    expect(isOnline('draft')).toBe(false)
    expect(isOnline('pending')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// groupMediaByBoulder
// ---------------------------------------------------------------------------

describe('groupMediaByBoulder', () => {
  it('returns an empty array when there are no videos', () => {
    expect(groupMediaByBoulder([], FAKE_BOULDER)).toEqual([])
  })

  it('groups videos by boulder id', () => {
    const videos = [
      makeVideo({ id: '1', boulderId: 'b1', updatedAt: '2026-01-10T00:00:00Z' }),
      makeVideo({ id: '2', boulderId: 'b1', updatedAt: '2026-02-10T00:00:00Z' }),
      makeVideo({ id: '3', boulderId: 'b2', updatedAt: '2026-01-15T00:00:00Z' }),
    ]
    const groups = groupMediaByBoulder(videos, FAKE_BOULDER)
    expect(groups).toHaveLength(2)
    expect(groups[0].boulderId).toBe('b1') // most recent activity first
    expect(groups[0].videoCount).toBe(2)
    expect(groups[1].boulderId).toBe('b2')
    expect(groups[1].videoCount).toBe(1)
  })

  it('uses the most recent updatedAt as the group sort key', () => {
    const videos = [
      makeVideo({ id: '1', boulderId: 'b1', updatedAt: '2026-01-01T00:00:00Z' }),
      makeVideo({ id: '2', boulderId: 'b2', updatedAt: '2026-04-01T00:00:00Z' }),
    ]
    const [first, second] = groupMediaByBoulder(videos, FAKE_BOULDER)
    expect(first.boulderId).toBe('b2')
    expect(second.boulderId).toBe('b1')
  })

  it('marks groups with at least one approved video as hasOnline', () => {
    const videos = [
      makeVideo({ boulderId: 'b1', moderationStatus: 'pending' }),
      makeVideo({ id: 'v2', boulderId: 'b1', moderationStatus: 'approved' }),
    ]
    const [g] = groupMediaByBoulder(videos, FAKE_BOULDER)
    expect(g.hasOnline).toBe(true)
  })

  it('falls back to the boulder id when the lookup returns null', () => {
    const groups = groupMediaByBoulder(
      [makeVideo({ boulderId: 'unknown' })],
      () => null,
    )
    expect(groups[0].boulderName).toBe('unknown')
    expect(groups[0].sector).toBeNull()
  })

  it('filters by status', () => {
    const videos = [
      makeVideo({ id: 'a', boulderId: 'b1', moderationStatus: 'approved' }),
      makeVideo({ id: 'b', boulderId: 'b2', moderationStatus: 'pending' }),
    ]
    const groups = groupMediaByBoulder(videos, FAKE_BOULDER, {
      status: 'online',
    })
    expect(groups.map((g) => g.boulderId)).toEqual(['b1'])
  })

  it('filters by sector via the boulder lookup', () => {
    const videos = [
      makeVideo({ id: 'a', boulderId: 'b1' }),
      makeVideo({ id: 'b', boulderId: 'b2' }),
    ]
    const groups = groupMediaByBoulder(videos, FAKE_BOULDER, {
      sector: 'Bas Cuvier',
    })
    expect(groups.map((g) => g.boulderId)).toEqual(['b2'])
  })

  it('filters by date range', () => {
    const videos = [
      makeVideo({ id: 'a', boulderId: 'b1', createdAt: '2026-01-01T00:00:00Z' }),
      makeVideo({ id: 'b', boulderId: 'b2', createdAt: '2026-04-01T00:00:00Z' }),
    ]
    const groups = groupMediaByBoulder(videos, FAKE_BOULDER, {
      fromDate: '2026-03-01',
    })
    expect(groups.map((g) => g.boulderId)).toEqual(['b2'])
  })

  it('returns nothing when the media type is restricted to "photo"', () => {
    const groups = groupMediaByBoulder(
      [makeVideo({ boulderId: 'b1' })],
      FAKE_BOULDER,
      { mediaType: 'photo' },
    )
    expect(groups).toEqual([])
  })

  it('runs an accent-insensitive search over name + climber + videographer', () => {
    const videos = [
      makeVideo({ boulderId: 'b1', climberName: 'Élise' }),
      makeVideo({ id: 'v2', boulderId: 'b2' }),
    ]
    const groups = groupMediaByBoulder(videos, FAKE_BOULDER, {
      search: 'elise',
    })
    expect(groups.map((g) => g.boulderId)).toEqual(['b1'])
  })
})

// ---------------------------------------------------------------------------
// filterAndSortBoulderDrafts
// ---------------------------------------------------------------------------

describe('filterAndSortBoulderDrafts', () => {
  const drafts = [
    makeDraft({
      id: 'd1',
      name: 'Beta Bloc',
      sector: 'Cuvier',
      status: 'approved',
      createdAt: '2026-01-10T10:00:00Z',
    }),
    makeDraft({
      id: 'd2',
      name: 'Alpha Bloc',
      sector: 'Apremont',
      status: 'pending',
      createdAt: '2026-02-10T10:00:00Z',
    }),
    makeDraft({
      id: 'd3',
      name: 'Charlie Bloc',
      sector: 'Cuvier',
      status: 'rejected',
      createdAt: '2025-12-10T10:00:00Z',
    }),
  ]

  it('returns all drafts when no filter is set (default sort: date desc)', () => {
    const out = filterAndSortBoulderDrafts(drafts, {})
    expect(out.map((d) => d.id)).toEqual(['d2', 'd1', 'd3'])
  })

  it('sorts by date ascending', () => {
    const out = filterAndSortBoulderDrafts(drafts, {}, 'date-asc')
    expect(out.map((d) => d.id)).toEqual(['d3', 'd1', 'd2'])
  })

  it('sorts by name ascending (French collation)', () => {
    const out = filterAndSortBoulderDrafts(drafts, {}, 'name-asc')
    expect(out.map((d) => d.name)).toEqual([
      'Alpha Bloc',
      'Beta Bloc',
      'Charlie Bloc',
    ])
  })

  it('filters by status', () => {
    const out = filterAndSortBoulderDrafts(drafts, { status: 'online' })
    expect(out.map((d) => d.id)).toEqual(['d1'])
  })

  it('runs an accent-insensitive search over name + sector', () => {
    const out = filterAndSortBoulderDrafts(drafts, { search: 'cuvier' })
    expect(out.map((d) => d.id).sort()).toEqual(['d1', 'd3'])
  })

  it('treats "all" status as a no-op', () => {
    expect(
      filterAndSortBoulderDrafts(drafts, { status: 'all' }).length,
    ).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// buildRecentContributions
// ---------------------------------------------------------------------------

describe('buildRecentContributions', () => {
  it('returns an empty array when limit is non-positive', () => {
    expect(buildRecentContributions([], [], FAKE_BOULDER, 0)).toEqual([])
    expect(buildRecentContributions([], [], FAKE_BOULDER, -1)).toEqual([])
  })

  it('merges drafts and videos and sorts by recency', () => {
    const drafts = [
      makeDraft({
        id: 'd1',
        name: 'Bloc A',
        updatedAt: '2026-04-01T00:00:00Z',
      }),
    ]
    const videos = [
      makeVideo({
        id: 'v1',
        boulderId: 'b1',
        updatedAt: '2026-04-15T00:00:00Z',
      }),
    ]
    const out = buildRecentContributions(drafts, videos, FAKE_BOULDER, 5)
    expect(out.map((c) => c.id)).toEqual(['v1', 'd1'])
    expect(out[0].kind).toBe('video')
    expect(out[1].kind).toBe('boulder')
  })

  it('caps the output at the requested limit', () => {
    const drafts = Array.from({ length: 10 }, (_, i) =>
      makeDraft({
        id: `d${i}`,
        updatedAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }),
    )
    const out = buildRecentContributions(drafts, [], FAKE_BOULDER, 3)
    expect(out).toHaveLength(3)
  })

  it('produces a tab-anchored href for each item', () => {
    const drafts = [makeDraft({ id: 'd1', updatedAt: '2026-04-01T00:00:00Z' })]
    const videos = [makeVideo({ id: 'v1', updatedAt: '2026-04-15T00:00:00Z' })]
    const out = buildRecentContributions(drafts, videos, FAKE_BOULDER, 5)
    expect(out.find((c) => c.kind === 'video')?.href).toBe(
      '/profil/contributions?tab=media',
    )
    expect(out.find((c) => c.kind === 'boulder')?.href).toBe(
      '/profil/contributions?tab=boulders',
    )
  })
})

// ---------------------------------------------------------------------------
// countContributions
// ---------------------------------------------------------------------------

describe('countContributions', () => {
  it('counts totals and the online / pending shares', () => {
    const drafts = [
      makeDraft({ status: 'approved' }),
      makeDraft({ id: 'd2', status: 'pending' }),
      makeDraft({ id: 'd3', status: 'draft' }),
    ]
    const videos = [
      makeVideo({ moderationStatus: 'approved' }),
      makeVideo({ id: 'v2', moderationStatus: 'pending' }),
    ]
    const counts = countContributions(drafts, videos)
    expect(counts.totalBoulders).toBe(3)
    expect(counts.totalMedia).toBe(2)
    expect(counts.onlineCount).toBe(2)
    expect(counts.pendingCount).toBe(2)
  })

  it('counts pending_deletion as pending', () => {
    const drafts = [
      makeDraft({ status: 'approved', pendingDeletion: true }),
    ]
    const counts = countContributions(drafts, [])
    expect(counts.pendingCount).toBe(1)
    expect(counts.onlineCount).toBe(0)
  })
})
