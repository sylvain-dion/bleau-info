import { describe, it, expect, beforeEach } from 'vitest'
import { usePresenceStore } from '@/stores/presence-store'

describe('presence-store', () => {
  beforeEach(() => {
    usePresenceStore.setState({ moderators: [] })
  })

  it('joinSession adds a moderator', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    expect(usePresenceStore.getState().moderators).toHaveLength(1)
    expect(usePresenceStore.getState().moderators[0].name).toBe('Alice')
  })

  it('joinSession does not duplicate existing moderator', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    expect(usePresenceStore.getState().moderators).toHaveLength(1)
  })

  it('leaveSession removes a moderator', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().leaveSession('mod-1')
    expect(usePresenceStore.getState().moderators).toHaveLength(0)
  })

  it('startReviewing sets reviewingItemId', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().startReviewing('mod-1', 'item-42')
    expect(usePresenceStore.getState().moderators[0].reviewingItemId).toBe('item-42')
  })

  it('stopReviewing clears reviewingItemId', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().startReviewing('mod-1', 'item-42')
    usePresenceStore.getState().stopReviewing('mod-1')
    expect(usePresenceStore.getState().moderators[0].reviewingItemId).toBeNull()
  })

  it('getReviewerForItem returns reviewer excluding self', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().joinSession('mod-2', 'Bob')
    usePresenceStore.getState().startReviewing('mod-2', 'item-42')

    const reviewer = usePresenceStore
      .getState()
      .getReviewerForItem('item-42', 'mod-1')
    expect(reviewer).not.toBeNull()
    expect(reviewer!.name).toBe('Bob')
  })

  it('getReviewerForItem returns null when self is reviewing', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().startReviewing('mod-1', 'item-42')

    const reviewer = usePresenceStore
      .getState()
      .getReviewerForItem('item-42', 'mod-1')
    expect(reviewer).toBeNull()
  })

  it('getReviewerForItem returns null for unreviewed items', () => {
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    const reviewer = usePresenceStore
      .getState()
      .getReviewerForItem('item-99', 'mod-1')
    expect(reviewer).toBeNull()
  })

  it('getActiveCount returns moderator count', () => {
    expect(usePresenceStore.getState().getActiveCount()).toBe(0)
    usePresenceStore.getState().joinSession('mod-1', 'Alice')
    usePresenceStore.getState().joinSession('mod-2', 'Bob')
    expect(usePresenceStore.getState().getActiveCount()).toBe(2)
  })

  it('simulateOtherModerator adds a moderator with reviewing state', () => {
    usePresenceStore.getState().simulateOtherModerator('Eve', 'item-7')
    const mods = usePresenceStore.getState().moderators
    expect(mods).toHaveLength(1)
    expect(mods[0].name).toBe('Eve')
    expect(mods[0].reviewingItemId).toBe('item-7')
  })
})
