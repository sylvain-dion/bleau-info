import { describe, it, expect, beforeEach } from 'vitest'
import { useBanStore } from '@/stores/ban-store'
import { useAuditLogStore } from '@/stores/audit-log-store'
import {
  performBan,
  performSuspension,
  performUnban,
} from '@/lib/moderation/ban-service'

describe('ban-service', () => {
  beforeEach(() => {
    useBanStore.setState({ bans: [] })
    useAuditLogStore.setState({ entries: [] })
  })

  describe('performBan', () => {
    it('creates a ban record', () => {
      const result = performBan('user-1', 'Jean', 'Spam', 'mod-1')
      expect(result.success).toBe(true)

      const record = useBanStore.getState().getBanRecord('user-1')
      expect(record).toBeDefined()
      expect(record!.bannedAt).not.toBeNull()
      expect(record!.banReason).toBe('Spam')
    })

    it('creates an audit log entry', () => {
      performBan('user-1', 'Jean', 'Spam', 'mod-1')

      const entries = useAuditLogStore.getState().entries
      expect(entries).toHaveLength(1)
      expect(entries[0].boulderName).toContain('[Ban]')
    })

    it('marks user as restricted', () => {
      performBan('user-1', 'Jean', 'Spam', 'mod-1')

      const restriction = useBanStore.getState().isUserRestricted('user-1')
      expect(restriction.restricted).toBe(true)
      expect(restriction.type).toBe('banned')
    })
  })

  describe('performSuspension', () => {
    it('creates a suspension record', () => {
      const until = new Date(Date.now() + 7 * 86400000).toISOString()
      const result = performSuspension(
        'user-2',
        'Marie',
        until,
        'Contenu douteux',
        'mod-1'
      )
      expect(result.success).toBe(true)

      const record = useBanStore.getState().getBanRecord('user-2')
      expect(record).toBeDefined()
      expect(record!.suspendedUntil).toBe(until)
      expect(record!.bannedAt).toBeNull()
    })

    it('marks user as suspended', () => {
      const until = new Date(Date.now() + 7 * 86400000).toISOString()
      performSuspension('user-2', 'Marie', until, 'Contenu douteux', 'mod-1')

      const restriction = useBanStore.getState().isUserRestricted('user-2')
      expect(restriction.restricted).toBe(true)
      expect(restriction.type).toBe('suspended')
    })
  })

  describe('performUnban', () => {
    it('removes the ban record', () => {
      performBan('user-1', 'Jean', 'Spam', 'mod-1')
      expect(useBanStore.getState().isUserRestricted('user-1').restricted).toBe(
        true
      )

      const result = performUnban('user-1', 'Jean', 'mod-1')
      expect(result.success).toBe(true)
      expect(
        useBanStore.getState().isUserRestricted('user-1').restricted
      ).toBe(false)
    })

    it('creates a rehabilitation audit entry', () => {
      performBan('user-1', 'Jean', 'Spam', 'mod-1')
      performUnban('user-1', 'Jean', 'mod-1')

      const entries = useAuditLogStore.getState().entries
      expect(entries).toHaveLength(2)
      expect(entries[0].boulderName).toContain('[Réhabilitation]')
    })
  })
})

describe('ban-store', () => {
  beforeEach(() => {
    useBanStore.setState({ bans: [] })
  })

  it('isUserRestricted returns false for unknown user', () => {
    const result = useBanStore.getState().isUserRestricted('unknown')
    expect(result.restricted).toBe(false)
  })

  it('expired suspension is not restricted', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    useBanStore.getState().suspendUser(
      'user-1',
      'Jean',
      pastDate,
      'Test',
      'mod-1'
    )

    const result = useBanStore.getState().isUserRestricted('user-1')
    expect(result.restricted).toBe(false)
  })

  it('getActiveRestrictions excludes expired suspensions', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const futureDate = new Date(Date.now() + 86400000).toISOString()

    useBanStore.getState().suspendUser('user-1', 'A', pastDate, 'Expired', 'mod')
    useBanStore.getState().suspendUser('user-2', 'B', futureDate, 'Active', 'mod')
    useBanStore.getState().banUser('user-3', 'C', 'Permanent', 'mod')

    const active = useBanStore.getState().getActiveRestrictions()
    expect(active).toHaveLength(2)
    expect(active.map((a) => a.userId).sort()).toEqual(['user-2', 'user-3'])
  })
})
