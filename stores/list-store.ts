import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoulderList, BoulderListItem } from '@/lib/validations/list'

interface ListState {
  /** All user-created boulder lists */
  lists: BoulderList[]

  /** Create a new empty list */
  createList: (name: string, emoji: string) => string

  /** Delete a list by ID */
  deleteList: (listId: string) => void

  /** Rename a list and/or change its emoji */
  renameList: (listId: string, name: string, emoji: string) => void

  /** Add a boulder to a list (no-op if already present) */
  addBoulderToList: (
    listId: string,
    boulder: { id: string; name: string; grade: string }
  ) => void

  /** Remove a boulder from a list */
  removeBoulderFromList: (listId: string, boulderId: string) => void

  /** Move a list up or down in the display order */
  moveList: (listId: string, direction: 'up' | 'down') => void

  /** Get all list IDs that contain a specific boulder */
  getListsForBoulder: (boulderId: string) => string[]

  /** Get a single list by ID */
  getList: (listId: string) => BoulderList | undefined

  /** Check if a boulder is in any list */
  isBoulderInAnyList: (boulderId: string) => boolean
}

/** Generate a simple unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name, emoji) => {
        const id = generateId()
        const now = new Date().toISOString()
        const list: BoulderList = {
          id,
          name,
          emoji,
          items: [],
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ lists: [...state.lists, list] }))
        return id
      },

      deleteList: (listId) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
        }))
      },

      renameList: (listId, name, emoji) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? { ...l, name, emoji, updatedAt: new Date().toISOString() }
              : l
          ),
        }))
      },

      addBoulderToList: (listId, boulder) => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l
            // Skip if already present
            if (l.items.some((item) => item.boulderId === boulder.id)) return l
            const newItem: BoulderListItem = {
              boulderId: boulder.id,
              boulderName: boulder.name,
              boulderGrade: boulder.grade,
              addedAt: new Date().toISOString(),
            }
            return {
              ...l,
              items: [...l.items, newItem],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeBoulderFromList: (listId, boulderId) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.filter((item) => item.boulderId !== boulderId),
                  updatedAt: new Date().toISOString(),
                }
              : l
          ),
        }))
      },

      moveList: (listId, direction) => {
        set((state) => {
          const idx = state.lists.findIndex((l) => l.id === listId)
          if (idx === -1) return state

          const targetIdx = direction === 'up' ? idx - 1 : idx + 1
          if (targetIdx < 0 || targetIdx >= state.lists.length) return state

          const updated = [...state.lists]
          const temp = updated[idx]
          updated[idx] = updated[targetIdx]
          updated[targetIdx] = temp
          return { lists: updated }
        })
      },

      getListsForBoulder: (boulderId) => {
        return get()
          .lists.filter((l) => l.items.some((item) => item.boulderId === boulderId))
          .map((l) => l.id)
      },

      getList: (listId) => {
        return get().lists.find((l) => l.id === listId)
      },

      isBoulderInAnyList: (boulderId) => {
        return get().lists.some((l) =>
          l.items.some((item) => item.boulderId === boulderId)
        )
      },
    }),
    {
      name: 'bleau-lists',
    }
  )
)
