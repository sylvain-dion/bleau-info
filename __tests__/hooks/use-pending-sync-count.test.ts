import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePendingSyncCount } from '@/lib/hooks/use-pending-sync-count'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useTickStore } from '@/stores/tick-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'

describe('usePendingSyncCount', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({ drafts: [] })
    useSuggestionStore.setState({ suggestions: [] })
    useTickStore.setState({ ticks: [] })
    useVideoSubmissionStore.setState({ submissions: [] })
  })

  it('returns 0 when all stores are empty', () => {
    const { result } = renderHook(() => usePendingSyncCount())
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.hasPending).toBe(false)
  })

  it('counts local items as pending', () => {
    useBoulderDraftStore.setState({
      drafts: [
        { id: 'd1', syncStatus: 'local' } as any,
        { id: 'd2', syncStatus: 'synced' } as any,
      ],
    })

    const { result } = renderHook(() => usePendingSyncCount())
    expect(result.current.pendingCount).toBe(1)
    expect(result.current.hasPending).toBe(true)
  })

  it('counts error items as pending', () => {
    useTickStore.setState({
      ticks: [{ id: 't1', syncStatus: 'error' } as any],
    })

    const { result } = renderHook(() => usePendingSyncCount())
    expect(result.current.pendingCount).toBe(1)
  })

  it('aggregates across all 4 stores', () => {
    useBoulderDraftStore.setState({
      drafts: [{ id: 'd1', syncStatus: 'local' } as any],
    })
    useSuggestionStore.setState({
      suggestions: [{ id: 's1', syncStatus: 'error' } as any],
    })
    useTickStore.setState({
      ticks: [{ id: 't1', syncStatus: 'local' } as any],
    })
    useVideoSubmissionStore.setState({
      submissions: [{ id: 'v1', syncStatus: 'local' } as any],
    })

    const { result } = renderHook(() => usePendingSyncCount())
    expect(result.current.pendingCount).toBe(4)
  })

  it('excludes synced and pending items from count', () => {
    useBoulderDraftStore.setState({
      drafts: [
        { id: 'd1', syncStatus: 'synced' } as any,
        { id: 'd2', syncStatus: 'pending' } as any,
      ],
    })

    const { result } = renderHook(() => usePendingSyncCount())
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.hasPending).toBe(false)
  })
})
