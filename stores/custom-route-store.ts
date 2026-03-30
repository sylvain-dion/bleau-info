import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** A user-created boulder route (Story 9.5). */
export interface CustomRoute {
  id: string
  name: string
  /** Ordered boulder IDs defining the route */
  boulderIds: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

interface CustomRouteState {
  routes: CustomRoute[]

  createRoute: (name: string) => string
  deleteRoute: (routeId: string) => void
  renameRoute: (routeId: string, name: string) => void
  addBoulder: (routeId: string, boulderId: string) => void
  removeBoulder: (routeId: string, boulderId: string) => void
  reorderBoulders: (routeId: string, boulderIds: string[]) => void
  togglePublic: (routeId: string) => void
  getRoute: (routeId: string) => CustomRoute | undefined
}

function generateId(): string {
  return `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function touch(route: CustomRoute): CustomRoute {
  return { ...route, updatedAt: new Date().toISOString() }
}

export const useCustomRouteStore = create<CustomRouteState>()(
  persist(
    (set, get) => ({
      routes: [],

      createRoute: (name) => {
        const id = generateId()
        const now = new Date().toISOString()
        const route: CustomRoute = {
          id,
          name,
          boulderIds: [],
          isPublic: false,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ routes: [route, ...s.routes] }))
        return id
      },

      deleteRoute: (routeId) => {
        set((s) => ({ routes: s.routes.filter((r) => r.id !== routeId) }))
      },

      renameRoute: (routeId, name) => {
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? touch({ ...r, name }) : r
          ),
        }))
      },

      addBoulder: (routeId, boulderId) => {
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            if (r.boulderIds.includes(boulderId)) return r
            return touch({ ...r, boulderIds: [...r.boulderIds, boulderId] })
          }),
        }))
      },

      removeBoulder: (routeId, boulderId) => {
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId
              ? touch({
                  ...r,
                  boulderIds: r.boulderIds.filter((id) => id !== boulderId),
                })
              : r
          ),
        }))
      },

      reorderBoulders: (routeId, boulderIds) => {
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? touch({ ...r, boulderIds }) : r
          ),
        }))
      },

      togglePublic: (routeId) => {
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? touch({ ...r, isPublic: !r.isPublic }) : r
          ),
        }))
      },

      getRoute: (routeId) => {
        return get().routes.find((r) => r.id === routeId)
      },
    }),
    { name: 'bleau-custom-routes' }
  )
)
