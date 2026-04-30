/**
 * Story 15.3 — "Grimpons ensemble" broadcast store.
 *
 * Holds open climbing calls (a public meet-up signal) and the RSVPs
 * from other users. Persisted via zustand/persist so a user keeps
 * track of calls they hosted or replied to across reloads.
 *
 * Local-first like the rest of phase 2 — no real backend yet. The mock
 * seed is loaded once on first persist hydration so the page is never
 * desolate during the demo.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayISO } from '@/lib/validations/climbing-call'
import type {
  ClimbingCall,
  CallResponse,
} from '@/lib/validations/climbing-call'
import { mockClimbingCalls, mockCallResponses } from '@/lib/data/mock-climbing-calls'

interface ClimbingCallState {
  calls: ClimbingCall[]
  responses: CallResponse[]
  /** True once the seed has been loaded into the persisted state. */
  seeded: boolean

  /** Create a new call. Returns the generated ID. */
  createCall: (
    data: Omit<ClimbingCall, 'id' | 'createdAt'>,
  ) => string

  /** Delete a call (host only — caller is responsible for the check). */
  deleteCall: (id: string) => void

  /**
   * Add or update the current user's RSVP to a call. Each user can
   * have at most one response per call; calling this again with a new
   * status overwrites the previous one.
   */
  respond: (
    callId: string,
    user: { id: string; name: string },
    status: CallResponse['status'],
  ) => void

  /** Remove the current user's RSVP for a call. */
  withdrawResponse: (callId: string, userId: string) => void

  /** All calls planned today or later, ordered by date asc then by createdAt asc. */
  getActiveCalls: () => ClimbingCall[]

  /** Active calls scoped to a sector. */
  getCallsForSector: (sectorSlug: string) => ClimbingCall[]

  /** All responses for one call, ordered by respondedAt asc. */
  getResponsesForCall: (callId: string) => CallResponse[]
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function sortByDate(a: ClimbingCall, b: ClimbingCall): number {
  if (a.plannedDate !== b.plannedDate) {
    return a.plannedDate < b.plannedDate ? -1 : 1
  }
  return a.createdAt < b.createdAt ? -1 : 1
}

export const useClimbingCallStore = create<ClimbingCallState>()(
  persist(
    (set, get) => ({
      // Seed eagerly on first creation so SSR and hydrate match.
      calls: mockClimbingCalls,
      responses: mockCallResponses,
      seeded: true,

      createCall: (data) => {
        const id = generateId('call')
        const call: ClimbingCall = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ calls: [call, ...state.calls] }))
        return id
      },

      deleteCall: (id) =>
        set((state) => ({
          calls: state.calls.filter((c) => c.id !== id),
          responses: state.responses.filter((r) => r.callId !== id),
        })),

      respond: (callId, user, status) =>
        set((state) => {
          const next = state.responses.filter(
            (r) => !(r.callId === callId && r.userId === user.id),
          )
          next.push({
            callId,
            userId: user.id,
            userName: user.name,
            status,
            respondedAt: new Date().toISOString(),
          })
          return { responses: next }
        }),

      withdrawResponse: (callId, userId) =>
        set((state) => ({
          responses: state.responses.filter(
            (r) => !(r.callId === callId && r.userId === userId),
          ),
        })),

      getActiveCalls: () => {
        const cutoff = todayISO()
        return get()
          .calls.filter((c) => c.plannedDate >= cutoff)
          .sort(sortByDate)
      },

      getCallsForSector: (sectorSlug) => {
        const cutoff = todayISO()
        return get()
          .calls.filter(
            (c) => c.sectorSlug === sectorSlug && c.plannedDate >= cutoff,
          )
          .sort(sortByDate)
      },

      getResponsesForCall: (callId) =>
        get()
          .responses.filter((r) => r.callId === callId)
          .sort((a, b) =>
            a.respondedAt < b.respondedAt ? -1 : 1,
          ),
    }),
    {
      name: 'bleau-climbing-calls',
      // Persist user-created data + seeded marker. Mock seed is included
      // in the initial state so the store is never empty in dev/demo.
    },
  ),
)
