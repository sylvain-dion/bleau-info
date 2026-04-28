import { describe, it, expect } from 'vitest'
import {
  buildAchievementShare,
  buildBadgeShare,
  buildGoalShare,
  buildStreakShare,
  getShareOrigin,
  isEarnedBadge,
} from '@/lib/social-share'
import type { BadgeStatus, EarnedBadge } from '@/lib/badges'
import type { StreakStats } from '@/lib/streaks'
import type { Goal, GoalProgress } from '@/lib/goals'
import type { AchievementEvent } from '@/lib/achievements'

const earnedBadge: EarnedBadge = {
  earned: true,
  value: 100,
  definition: {
    id: 'volume-100',
    category: 'volume',
    label: 'Centurion',
    description: '100 croix',
    threshold: 100,
    icon: 'Trophy',
    color: 'text-amber-500',
  },
}

const lockedBadge: BadgeStatus = {
  earned: false,
  value: 50,
  progress: 0.5,
  definition: {
    id: 'volume-100',
    category: 'volume',
    label: 'Centurion',
    description: '100 croix',
    threshold: 100,
    icon: 'Trophy',
    color: 'text-amber-500',
  },
}

function streak(currentStreak: number): StreakStats {
  return {
    currentStreak,
    longestStreak: currentStreak,
    totalClimbingDays: currentStreak,
    lastClimbedOn: '2026-04-28',
  }
}

function goal(partial: Partial<Goal> & Pick<Goal, 'type' | 'target'>): Goal {
  return {
    id: 'g1',
    deadline: null,
    createdAt: '2026-04-01T00:00:00Z',
    achievedAt: null,
    ...partial,
  }
}

function progress(partial: Partial<GoalProgress> & Pick<GoalProgress, 'goal' | 'isAchieved'>): GoalProgress {
  return {
    currentNumeric: 0,
    targetNumeric: 0,
    currentDisplay: '',
    targetDisplay: '',
    progress: partial.isAchieved ? 1 : 0,
    daysRemaining: null,
    status: partial.isAchieved ? 'achieved' : 'active',
    ...partial,
  }
}

describe('isEarnedBadge', () => {
  it('returns true for an earned badge', () => {
    expect(isEarnedBadge(earnedBadge)).toBe(true)
  })
  it('returns false for a locked badge', () => {
    expect(isEarnedBadge(lockedBadge)).toBe(false)
  })
})

describe('getShareOrigin', () => {
  it('falls back to the production origin off-window', () => {
    // Vitest's jsdom env defines window — temporarily clobber it.
    const originalWindow = globalThis.window
    // @ts-expect-error — intentional clobber for this test only
    delete globalThis.window
    expect(getShareOrigin()).toBe('https://bleau.info')
    globalThis.window = originalWindow
  })

  it('reads window.location.origin when defined', () => {
    expect(getShareOrigin()).toMatch(/^https?:\/\//)
  })
})

describe('buildBadgeShare', () => {
  it('produces a French headline and includes the description', () => {
    const share = buildBadgeShare(earnedBadge)
    expect(share.title).toBe('Badge Centurion débloqué')
    expect(share.text).toContain('Badge Centurion débloqué')
    expect(share.text).toContain('100 croix')
    expect(share.text).toContain(share.url)
  })

  it('appends the app tagline + URL', () => {
    const share = buildBadgeShare(earnedBadge)
    expect(share.text).toMatch(/Bleau\.info/)
    expect(share.text.endsWith(share.url)).toBe(true)
  })
})

describe('buildStreakShare', () => {
  it('returns null below the 3-day threshold', () => {
    expect(buildStreakShare(streak(2))).toBeNull()
    expect(buildStreakShare(streak(0))).toBeNull()
  })

  it('emits a 7-day "semaine de feu" share', () => {
    const s = buildStreakShare(streak(7))
    expect(s).not.toBeNull()
    expect(s!.title).toContain("7 jours d'affilée")
    expect(s!.text).toContain('Une semaine de feu')
  })

  it('uses singular wording for a 3-day streak', () => {
    const s = buildStreakShare(streak(3))
    expect(s!.title).toContain('3 jours')
    expect(s!.text).toContain('🔥 3 jours')
  })

  it('escalates flavor for very long streaks', () => {
    expect(buildStreakShare(streak(365))!.text).toContain('Une année entière')
    expect(buildStreakShare(streak(120))!.text).toContain('100 jours sans pause')
    expect(buildStreakShare(streak(45))!.text).toContain('mois de grimpe')
  })
})

describe('buildGoalShare', () => {
  it('returns null when the goal is not yet achieved', () => {
    const p = progress({
      goal: goal({ type: 'tickCount', target: 50 }),
      isAchieved: false,
    })
    expect(buildGoalShare(p)).toBeNull()
  })

  it('formats a numeric goal with its unit', () => {
    const p = progress({
      goal: goal({ type: 'tickCount', target: 50 }),
      isAchieved: true,
    })
    const share = buildGoalShare(p)!
    expect(share.title).toContain('Objectif atteint')
    expect(share.text).toContain('50 croix')
    expect(share.text).toContain('Nombre de croix')
  })

  it('formats a grade goal via formatGrade', () => {
    const p = progress({
      goal: goal({ type: 'maxGrade', target: '7a' }),
      isAchieved: true,
    })
    const share = buildGoalShare(p)!
    expect(share.text).toContain('7A')
  })
})

describe('buildAchievementShare', () => {
  function makeEvent(kind: AchievementEvent['kind']): AchievementEvent {
    return {
      id: `${kind}:demo`,
      kind,
      title: 'Centurion',
      subtitle: '100 croix',
      icon: 'Trophy',
      color: 'text-amber-500',
      earnedAt: '2026-04-28T10:00:00Z',
    }
  }

  it('uses the right header per kind', () => {
    expect(buildAchievementShare(makeEvent('badge')).text).toContain(
      '🏆 Badge débloqué',
    )
    expect(buildAchievementShare(makeEvent('streak')).text).toContain(
      '🔥 Streak atteint',
    )
    expect(buildAchievementShare(makeEvent('goal')).text).toContain(
      '🎯 Objectif atteint',
    )
  })

  it('appends the app tagline and URL', () => {
    const share = buildAchievementShare(makeEvent('badge'))
    expect(share.text).toMatch(/Bleau\.info/)
    expect(share.text.endsWith(share.url)).toBe(true)
  })
})
