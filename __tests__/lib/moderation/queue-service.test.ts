import { describe, it, expect, beforeEach } from 'vitest'
import {
  collectQueueItems,
  filterQueueItems,
  extractQueueSectors,
  getPendingCount,
  type QueueFilters,
} from '@/lib/moderation/queue-service'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'

describe('collectQueueItems', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({ drafts: [] })
    useSuggestionStore.setState({ suggestions: [] })
  })

  it('returns empty array when no pending items', () => {
    expect(collectQueueItems()).toHaveLength(0)
  })

  it('includes drafts with status pending', () => {
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: 'd1',
          name: 'Test Bloc',
          grade: '5a',
          sector: 'Cul de Chien',
          style: 'dalle',
          status: 'pending',
          syncStatus: 'local',
          potentialDuplicate: false,
          photoBlurHash: null,
          updatedAt: new Date().toISOString(),
        } as any,
      ],
    })

    const items = collectQueueItems()
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('creation')
    expect(items[0].name).toBe('Test Bloc')
  })

  it('includes suggestions with moderationStatus pending', () => {
    useSuggestionStore.setState({
      suggestions: [
        {
          id: 's1',
          name: 'Modified Bloc',
          grade: '6a',
          sector: 'Apremont',
          style: 'devers',
          moderationStatus: 'pending',
          syncStatus: 'synced',
          photoBlurHash: null,
          updatedAt: new Date().toISOString(),
        } as any,
      ],
    })

    const items = collectQueueItems()
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('modification')
  })

  it('sorts by priority: duplicates first, then creations, then modifications', () => {
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: 'd-normal',
          name: 'Normal Draft',
          grade: '4a',
          sector: 'Test',
          style: 'bloc',
          status: 'pending',
          syncStatus: 'local',
          potentialDuplicate: false,
          photoBlurHash: null,
          updatedAt: '2026-01-01T00:00:00Z',
        } as any,
        {
          id: 'd-dupe',
          name: 'Duplicate Draft',
          grade: '5b',
          sector: 'Test',
          style: 'dalle',
          status: 'pending',
          syncStatus: 'local',
          potentialDuplicate: true,
          photoBlurHash: null,
          updatedAt: '2026-01-02T00:00:00Z',
        } as any,
      ],
    })

    useSuggestionStore.setState({
      suggestions: [
        {
          id: 's-mod',
          name: 'Suggestion',
          grade: '6a',
          sector: 'Test',
          style: 'devers',
          moderationStatus: 'pending',
          syncStatus: 'synced',
          photoBlurHash: null,
          updatedAt: '2026-01-03T00:00:00Z',
        } as any,
      ],
    })

    const items = collectQueueItems()
    expect(items).toHaveLength(3)
    expect(items[0].priority).toBe('duplicate')
    expect(items[1].priority).toBe('creation')
    expect(items[2].priority).toBe('modification')
  })

  it('flags potential duplicates correctly', () => {
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: 'd-dupe',
          name: 'Dupe',
          grade: '5a',
          sector: 'Test',
          style: 'bloc',
          status: 'pending',
          syncStatus: 'local',
          potentialDuplicate: true,
          photoBlurHash: null,
          updatedAt: new Date().toISOString(),
        } as any,
      ],
    })

    const items = collectQueueItems()
    expect(items[0].potentialDuplicate).toBe(true)
    expect(items[0].reason).toContain('Doublon')
  })
})

describe('filterQueueItems', () => {
  const items = [
    { type: 'creation' as const, sector: 'Cul de Chien' },
    { type: 'modification' as const, sector: 'Apremont' },
    { type: 'creation' as const, sector: 'Apremont' },
  ] as any[]

  it('returns all items with default filters', () => {
    const filters: QueueFilters = { type: 'all', sector: null }
    expect(filterQueueItems(items, filters)).toHaveLength(3)
  })

  it('filters by type', () => {
    const filters: QueueFilters = { type: 'creation', sector: null }
    expect(filterQueueItems(items, filters)).toHaveLength(2)
  })

  it('filters by sector', () => {
    const filters: QueueFilters = { type: 'all', sector: 'Apremont' }
    expect(filterQueueItems(items, filters)).toHaveLength(2)
  })

  it('combines type and sector filters', () => {
    const filters: QueueFilters = { type: 'creation', sector: 'Apremont' }
    expect(filterQueueItems(items, filters)).toHaveLength(1)
  })
})

describe('extractQueueSectors', () => {
  it('returns unique sorted sectors', () => {
    const items = [
      { sector: 'Cul de Chien' },
      { sector: 'Apremont' },
      { sector: 'Cul de Chien' },
    ] as any[]

    const sectors = extractQueueSectors(items)
    expect(sectors).toEqual(['Apremont', 'Cul de Chien'])
  })
})

describe('getPendingCount', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({ drafts: [] })
    useSuggestionStore.setState({ suggestions: [] })
  })

  it('returns 0 when no pending items', () => {
    expect(getPendingCount()).toBe(0)
  })

  it('counts pending drafts and suggestions', () => {
    useBoulderDraftStore.setState({
      drafts: [
        { status: 'pending', syncStatus: 'local' } as any,
        { status: 'draft', syncStatus: 'local' } as any,
      ],
    })
    useSuggestionStore.setState({
      suggestions: [
        { moderationStatus: 'pending' } as any,
        { moderationStatus: 'approved' } as any,
      ],
    })

    expect(getPendingCount()).toBe(2) // 1 pending draft + 1 pending suggestion
  })
})
