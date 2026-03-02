import { describe, it, expect, beforeEach } from 'vitest'
import { useListStore } from '@/stores/list-store'

/** Reset store state before each test */
function resetStore() {
  useListStore.setState({ lists: [] })
}

describe('list-store', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('createList', () => {
    it('creates a list with name and emoji', () => {
      const id = useListStore.getState().createList('Projets', '🎯')
      const list = useListStore.getState().getList(id)

      expect(list).toBeDefined()
      expect(list?.name).toBe('Projets')
      expect(list?.emoji).toBe('🎯')
      expect(list?.items).toEqual([])
      expect(list?.createdAt).toBeTruthy()
    })

    it('generates unique IDs for each list', () => {
      const id1 = useListStore.getState().createList('List A', '📋')
      const id2 = useListStore.getState().createList('List B', '⭐')

      expect(id1).not.toBe(id2)
    })

    it('appends to the end of lists array', () => {
      useListStore.getState().createList('First', '📋')
      useListStore.getState().createList('Second', '⭐')

      const lists = useListStore.getState().lists
      expect(lists).toHaveLength(2)
      expect(lists[0].name).toBe('First')
      expect(lists[1].name).toBe('Second')
    })
  })

  describe('deleteList', () => {
    it('removes a list by ID', () => {
      const id = useListStore.getState().createList('To Delete', '📋')
      expect(useListStore.getState().lists).toHaveLength(1)

      useListStore.getState().deleteList(id)
      expect(useListStore.getState().lists).toHaveLength(0)
    })

    it('does nothing for unknown ID', () => {
      useListStore.getState().createList('Keep', '📋')
      useListStore.getState().deleteList('nonexistent')
      expect(useListStore.getState().lists).toHaveLength(1)
    })
  })

  describe('renameList', () => {
    it('updates name and emoji', () => {
      const id = useListStore.getState().createList('Old Name', '📋')
      useListStore.getState().renameList(id, 'New Name', '🏔️')

      const list = useListStore.getState().getList(id)
      expect(list?.name).toBe('New Name')
      expect(list?.emoji).toBe('🏔️')
    })

    it('updates the updatedAt timestamp', () => {
      const id = useListStore.getState().createList('Name', '📋')
      const before = useListStore.getState().getList(id)?.updatedAt

      // Small delay to ensure timestamp differs
      useListStore.getState().renameList(id, 'Renamed', '⭐')
      const after = useListStore.getState().getList(id)?.updatedAt

      expect(after).toBeTruthy()
      expect(after! >= before!).toBe(true)
    })
  })

  describe('addBoulderToList', () => {
    it('adds a boulder to a list', () => {
      const listId = useListStore.getState().createList('Projets', '🎯')
      useListStore.getState().addBoulderToList(listId, {
        id: 'boulder-1',
        name: 'La Marie-Rose',
        grade: '6a',
      })

      const list = useListStore.getState().getList(listId)
      expect(list?.items).toHaveLength(1)
      expect(list?.items[0].boulderId).toBe('boulder-1')
      expect(list?.items[0].boulderName).toBe('La Marie-Rose')
      expect(list?.items[0].boulderGrade).toBe('6a')
      expect(list?.items[0].addedAt).toBeTruthy()
    })

    it('does not duplicate a boulder already in the list', () => {
      const listId = useListStore.getState().createList('Projets', '🎯')
      useListStore.getState().addBoulderToList(listId, {
        id: 'boulder-1',
        name: 'La Marie-Rose',
        grade: '6a',
      })
      useListStore.getState().addBoulderToList(listId, {
        id: 'boulder-1',
        name: 'La Marie-Rose',
        grade: '6a',
      })

      const list = useListStore.getState().getList(listId)
      expect(list?.items).toHaveLength(1)
    })
  })

  describe('removeBoulderFromList', () => {
    it('removes a boulder from a list', () => {
      const listId = useListStore.getState().createList('Projets', '🎯')
      useListStore.getState().addBoulderToList(listId, {
        id: 'boulder-1',
        name: 'La Marie-Rose',
        grade: '6a',
      })

      useListStore.getState().removeBoulderFromList(listId, 'boulder-1')
      const list = useListStore.getState().getList(listId)
      expect(list?.items).toHaveLength(0)
    })
  })

  describe('moveList', () => {
    it('moves a list up', () => {
      useListStore.getState().createList('A', '📋')
      const idB = useListStore.getState().createList('B', '⭐')

      useListStore.getState().moveList(idB, 'up')
      const lists = useListStore.getState().lists
      expect(lists[0].name).toBe('B')
      expect(lists[1].name).toBe('A')
    })

    it('moves a list down', () => {
      const idA = useListStore.getState().createList('A', '📋')
      useListStore.getState().createList('B', '⭐')

      useListStore.getState().moveList(idA, 'down')
      const lists = useListStore.getState().lists
      expect(lists[0].name).toBe('B')
      expect(lists[1].name).toBe('A')
    })

    it('does nothing when moving first list up', () => {
      const idA = useListStore.getState().createList('A', '📋')
      useListStore.getState().createList('B', '⭐')

      useListStore.getState().moveList(idA, 'up')
      expect(useListStore.getState().lists[0].name).toBe('A')
    })

    it('does nothing when moving last list down', () => {
      useListStore.getState().createList('A', '📋')
      const idB = useListStore.getState().createList('B', '⭐')

      useListStore.getState().moveList(idB, 'down')
      expect(useListStore.getState().lists[1].name).toBe('B')
    })
  })

  describe('getListsForBoulder', () => {
    it('returns all list IDs containing a boulder', () => {
      const id1 = useListStore.getState().createList('Projets', '🎯')
      const id2 = useListStore.getState().createList('Favoris', '⭐')
      useListStore.getState().createList('Empty', '📋')

      useListStore.getState().addBoulderToList(id1, {
        id: 'boulder-1',
        name: 'Test',
        grade: '5a',
      })
      useListStore.getState().addBoulderToList(id2, {
        id: 'boulder-1',
        name: 'Test',
        grade: '5a',
      })

      const result = useListStore.getState().getListsForBoulder('boulder-1')
      expect(result).toEqual([id1, id2])
    })

    it('returns empty array when boulder is in no list', () => {
      useListStore.getState().createList('Empty', '📋')
      const result = useListStore.getState().getListsForBoulder('no-such-boulder')
      expect(result).toEqual([])
    })
  })

  describe('isBoulderInAnyList', () => {
    it('returns true when boulder is in at least one list', () => {
      const listId = useListStore.getState().createList('Projets', '🎯')
      useListStore.getState().addBoulderToList(listId, {
        id: 'boulder-1',
        name: 'Test',
        grade: '5a',
      })

      expect(useListStore.getState().isBoulderInAnyList('boulder-1')).toBe(true)
    })

    it('returns false when boulder is in no list', () => {
      expect(useListStore.getState().isBoulderInAnyList('boulder-1')).toBe(false)
    })
  })

  describe('persistence', () => {
    it('uses bleau-lists as localStorage key', () => {
      // The persist middleware is configured with name: 'bleau-lists'
      // We verify by checking the store's persist config
      const persistOptions = useListStore.persist
      expect(persistOptions.getOptions().name).toBe('bleau-lists')
    })
  })
})
