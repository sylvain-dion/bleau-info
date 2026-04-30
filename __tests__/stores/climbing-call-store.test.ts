import { describe, it, expect, beforeEach } from 'vitest'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { todayISO } from '@/lib/validations/climbing-call'

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function resetStore() {
  useClimbingCallStore.setState({
    calls: [],
    responses: [],
    seeded: true,
  })
}

describe('climbing-call-store', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('createCall', () => {
    it('creates a call with auto-generated id and timestamp', () => {
      const id = useClimbingCallStore.getState().createCall({
        hostUserId: 'u-1',
        hostName: 'Test',
        sectorSlug: 'apremont',
        sectorName: 'Apremont',
        plannedDate: addDays(3),
        message: 'Hello',
      })

      const call = useClimbingCallStore.getState().calls.find((c) => c.id === id)
      expect(call).toBeDefined()
      expect(call?.id).toBe(id)
      expect(call?.createdAt).toBeTruthy()
      expect(call?.message).toBe('Hello')
    })

    it('places the new call at the top of the list', () => {
      const { createCall } = useClimbingCallStore.getState()
      const idA = createCall({
        hostUserId: 'u-1',
        hostName: 'A',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(1),
        message: '',
      })
      const idB = createCall({
        hostUserId: 'u-2',
        hostName: 'B',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(2),
        message: '',
      })
      const calls = useClimbingCallStore.getState().calls
      expect(calls[0].id).toBe(idB)
      expect(calls[1].id).toBe(idA)
    })
  })

  describe('deleteCall', () => {
    it('removes the call AND its responses', () => {
      const { createCall, respond, deleteCall } =
        useClimbingCallStore.getState()
      const id = createCall({
        hostUserId: 'host',
        hostName: 'H',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(1),
        message: '',
      })
      respond(id, { id: 'guest', name: 'G' }, 'going')

      deleteCall(id)

      const state = useClimbingCallStore.getState()
      expect(state.calls.find((c) => c.id === id)).toBeUndefined()
      expect(state.responses.filter((r) => r.callId === id)).toHaveLength(0)
    })
  })

  describe('respond', () => {
    it('adds a response with the given status', () => {
      const { createCall, respond, getResponsesForCall } =
        useClimbingCallStore.getState()
      const id = createCall({
        hostUserId: 'host',
        hostName: 'H',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(1),
        message: '',
      })
      respond(id, { id: 'guest', name: 'Guest' }, 'going')

      const responses = getResponsesForCall(id)
      expect(responses).toHaveLength(1)
      expect(responses[0].userId).toBe('guest')
      expect(responses[0].status).toBe('going')
    })

    it('overwrites an existing response when the same user replies again', () => {
      const { createCall, respond, getResponsesForCall } =
        useClimbingCallStore.getState()
      const id = createCall({
        hostUserId: 'host',
        hostName: 'H',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(1),
        message: '',
      })
      respond(id, { id: 'guest', name: 'Guest' }, 'going')
      respond(id, { id: 'guest', name: 'Guest' }, 'maybe')

      const responses = getResponsesForCall(id)
      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe('maybe')
    })

    it('keeps responses from different users separated', () => {
      const { createCall, respond, getResponsesForCall } =
        useClimbingCallStore.getState()
      const id = createCall({
        hostUserId: 'host',
        hostName: 'H',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(1),
        message: '',
      })
      respond(id, { id: 'a', name: 'A' }, 'going')
      respond(id, { id: 'b', name: 'B' }, 'maybe')

      expect(getResponsesForCall(id)).toHaveLength(2)
    })
  })

  describe('withdrawResponse', () => {
    it('removes only the matching response', () => {
      const { createCall, respond, withdrawResponse, getResponsesForCall } =
        useClimbingCallStore.getState()
      const id = createCall({
        hostUserId: 'host',
        hostName: 'H',
        sectorSlug: 's',
        sectorName: 'S',
        plannedDate: addDays(1),
        message: '',
      })
      respond(id, { id: 'a', name: 'A' }, 'going')
      respond(id, { id: 'b', name: 'B' }, 'maybe')

      withdrawResponse(id, 'a')

      const left = getResponsesForCall(id)
      expect(left).toHaveLength(1)
      expect(left[0].userId).toBe('b')
    })
  })

  describe('getActiveCalls', () => {
    it('filters out past calls', () => {
      useClimbingCallStore.setState({
        calls: [
          {
            id: 'past',
            hostUserId: 'h',
            hostName: 'H',
            sectorSlug: 's',
            sectorName: 'S',
            plannedDate: '2000-01-01',
            message: '',
            createdAt: '2000-01-01T00:00:00Z',
          },
          {
            id: 'today',
            hostUserId: 'h',
            hostName: 'H',
            sectorSlug: 's',
            sectorName: 'S',
            plannedDate: todayISO(),
            message: '',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        responses: [],
        seeded: true,
      })

      const active = useClimbingCallStore.getState().getActiveCalls()
      expect(active.map((c) => c.id)).toEqual(['today'])
    })

    it('orders by date asc, then by createdAt asc', () => {
      const earlierCreated = '2026-01-01T00:00:00Z'
      const laterCreated = '2026-01-02T00:00:00Z'
      useClimbingCallStore.setState({
        calls: [
          {
            id: 'b-day-2',
            hostUserId: 'h',
            hostName: 'H',
            sectorSlug: 's',
            sectorName: 'S',
            plannedDate: addDays(2),
            message: '',
            createdAt: laterCreated,
          },
          {
            id: 'a-day-1',
            hostUserId: 'h',
            hostName: 'H',
            sectorSlug: 's',
            sectorName: 'S',
            plannedDate: addDays(1),
            message: '',
            createdAt: laterCreated,
          },
          {
            id: 'a-day-1-earlier',
            hostUserId: 'h',
            hostName: 'H',
            sectorSlug: 's',
            sectorName: 'S',
            plannedDate: addDays(1),
            message: '',
            createdAt: earlierCreated,
          },
        ],
        responses: [],
        seeded: true,
      })

      const active = useClimbingCallStore.getState().getActiveCalls()
      expect(active.map((c) => c.id)).toEqual([
        'a-day-1-earlier',
        'a-day-1',
        'b-day-2',
      ])
    })
  })

  describe('getCallsForSector', () => {
    it('returns active calls for the given sector only', () => {
      const { createCall, getCallsForSector } =
        useClimbingCallStore.getState()
      createCall({
        hostUserId: 'h',
        hostName: 'H',
        sectorSlug: 'apremont',
        sectorName: 'Apremont',
        plannedDate: addDays(1),
        message: '',
      })
      createCall({
        hostUserId: 'h',
        hostName: 'H',
        sectorSlug: 'cul-de-chien',
        sectorName: 'Cul de Chien',
        plannedDate: addDays(1),
        message: '',
      })

      const apremont = getCallsForSector('apremont')
      expect(apremont).toHaveLength(1)
      expect(apremont[0].sectorSlug).toBe('apremont')
    })
  })
})
