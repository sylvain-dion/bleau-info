import { describe, it, expect } from 'vitest'
import {
  TRUST_ROLES,
  getRoleConfig,
  getEffectiveRole,
  getNextLevel,
  getTrustProgress,
} from '@/lib/trust'

describe('trust system', () => {
  describe('TRUST_ROLES', () => {
    it('should have 5 roles in hierarchy order', () => {
      expect(TRUST_ROLES).toHaveLength(5)
      expect(TRUST_ROLES.map((r) => r.key)).toEqual([
        'user',
        'contributor',
        'trusted',
        'moderator',
        'admin',
      ])
    })

    it('should have increasing order values', () => {
      for (let i = 1; i < TRUST_ROLES.length; i++) {
        expect(TRUST_ROLES[i].order).toBeGreaterThan(TRUST_ROLES[i - 1].order)
      }
    })

    it('should have French labels', () => {
      const labels = TRUST_ROLES.map((r) => r.label)
      expect(labels).toContain('Utilisateur')
      expect(labels).toContain('Contributeur')
      expect(labels).toContain('Modérateur')
    })
  })

  describe('getRoleConfig', () => {
    it('should return matching role config', () => {
      expect(getRoleConfig('trusted').label).toBe('Trusted')
      expect(getRoleConfig('admin').label).toBe('Admin')
    })

    it('should fall back to "user" for unknown role', () => {
      expect(getRoleConfig('superadmin').key).toBe('user')
      expect(getRoleConfig('').key).toBe('user')
    })
  })

  describe('getEffectiveRole', () => {
    it('should return "user" for score 0 with no role', () => {
      expect(getEffectiveRole(0).key).toBe('user')
    })

    it('should return "contributor" for score > 0', () => {
      expect(getEffectiveRole(1).key).toBe('contributor')
      expect(getEffectiveRole(50).key).toBe('contributor')
      expect(getEffectiveRole(99).key).toBe('contributor')
    })

    it('should return "trusted" for score >= 100', () => {
      expect(getEffectiveRole(100).key).toBe('trusted')
      expect(getEffectiveRole(500).key).toBe('trusted')
    })

    it('should prioritize explicit role over score', () => {
      expect(getEffectiveRole(0, 'moderator').key).toBe('moderator')
      expect(getEffectiveRole(200, 'admin').key).toBe('admin')
      expect(getEffectiveRole(50, 'trusted').key).toBe('trusted')
    })

    it('should ignore unknown explicit role and use score', () => {
      expect(getEffectiveRole(50, 'unknown').key).toBe('contributor')
      expect(getEffectiveRole(0, null).key).toBe('user')
    })
  })

  describe('getNextLevel', () => {
    it('should return trusted as next level for user', () => {
      const role = getEffectiveRole(0)
      const next = getNextLevel(role, 0)
      expect(next).not.toBeNull()
      expect(next!.role.key).toBe('trusted')
      expect(next!.pointsNeeded).toBe(100)
    })

    it('should return trusted as next level for contributor', () => {
      const role = getEffectiveRole(50)
      const next = getNextLevel(role, 50)
      expect(next).not.toBeNull()
      expect(next!.role.key).toBe('trusted')
      expect(next!.pointsNeeded).toBe(50)
    })

    it('should return null for trusted (max score-based role)', () => {
      const role = getEffectiveRole(100)
      expect(getNextLevel(role, 100)).toBeNull()
    })

    it('should return null for moderator', () => {
      const role = getEffectiveRole(0, 'moderator')
      expect(getNextLevel(role, 0)).toBeNull()
    })

    it('should return null for admin', () => {
      const role = getEffectiveRole(0, 'admin')
      expect(getNextLevel(role, 0)).toBeNull()
    })
  })

  describe('getTrustProgress', () => {
    it('should return 0% for score 0 as user', () => {
      const role = getEffectiveRole(0)
      expect(getTrustProgress(0, role)).toBe(0)
    })

    it('should return 50% for score 50 as contributor', () => {
      const role = getEffectiveRole(50)
      expect(getTrustProgress(50, role)).toBe(50)
    })

    it('should return 100% for trusted (max score-based level)', () => {
      const role = getEffectiveRole(100)
      expect(getTrustProgress(100, role)).toBe(100)
    })

    it('should return 100% for moderator', () => {
      const role = getEffectiveRole(0, 'moderator')
      expect(getTrustProgress(0, role)).toBe(100)
    })

    it('should return 100% for admin', () => {
      const role = getEffectiveRole(0, 'admin')
      expect(getTrustProgress(0, role)).toBe(100)
    })

    it('should clamp between 0 and 100', () => {
      const role = getEffectiveRole(0)
      expect(getTrustProgress(0, role)).toBeGreaterThanOrEqual(0)
      expect(getTrustProgress(999, role)).toBeLessThanOrEqual(100)
    })
  })
})
