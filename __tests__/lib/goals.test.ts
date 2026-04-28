import { describe, it, expect } from 'vitest'
import {
  computeGoalProgress,
  suggestGoals,
  validateGoalTarget,
  getGoalTypeMeta,
  GOAL_TYPES,
  type Goal,
} from '@/lib/goals'
import type { BadgeInput } from '@/lib/badges'

const TODAY = new Date(2026, 3, 27) // 2026-04-27 (month 0-indexed)

function makeGoal(partial: Partial<Goal>): Goal {
  return {
    id: 'g1',
    type: 'tickCount',
    target: 100,
    deadline: null,
    createdAt: '2026-01-01T00:00:00Z',
    achievedAt: null,
    ...partial,
  }
}

const EMPTY_INPUT: BadgeInput = {
  tickCount: 0,
  uniqueBoulders: 0,
  maxGrade: '',
  sectorsVisited: 0,
  circuitsCompleted: 0,
}

describe('GOAL_TYPES catalog', () => {
  it('exposes 6 goal types', () => {
    expect(GOAL_TYPES).toHaveLength(6)
  })
  it('has unique types', () => {
    const types = GOAL_TYPES.map((g) => g.type)
    expect(new Set(types).size).toBe(types.length)
  })
  it('exposes a metadata lookup', () => {
    expect(getGoalTypeMeta('tickCount').label).toBe('Nombre de croix')
    expect(getGoalTypeMeta('maxGrade').shape).toBe('grade')
  })
})

describe('computeGoalProgress — count goals', () => {
  it('reports zero progress on empty stats', () => {
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    const result = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result.progress).toBe(0)
    expect(result.isAchieved).toBe(false)
    expect(result.status).toBe('active')
    expect(result.currentDisplay).toBe('0')
    expect(result.targetDisplay).toBe('100')
  })

  it('clamps progress to 1 when current exceeds target', () => {
    const goal = makeGoal({ type: 'tickCount', target: 50 })
    const input = { ...EMPTY_INPUT, tickCount: 80 }
    const result = computeGoalProgress(goal, input, TODAY)
    expect(result.progress).toBe(1)
    expect(result.isAchieved).toBe(true)
    expect(result.status).toBe('achieved')
  })

  it('marks as achieved exactly at the threshold', () => {
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    const input = { ...EMPTY_INPUT, tickCount: 100 }
    const result = computeGoalProgress(goal, input, TODAY)
    expect(result.isAchieved).toBe(true)
    expect(result.progress).toBe(1)
  })

  it('does not mark achieved one below the threshold', () => {
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    const input = { ...EMPTY_INPUT, tickCount: 99 }
    const result = computeGoalProgress(goal, input, TODAY)
    expect(result.isAchieved).toBe(false)
    expect(result.progress).toBeCloseTo(0.99, 5)
  })

  it('handles longestStreak via the optional input field', () => {
    const goal = makeGoal({ type: 'longestStreak', target: 7 })
    const result1 = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result1.currentNumeric).toBe(0)

    const result2 = computeGoalProgress(
      goal,
      { ...EMPTY_INPUT, longestStreak: 9 },
      TODAY,
    )
    expect(result2.isAchieved).toBe(true)
  })

  it('honours achievedAt even if stats regress', () => {
    const goal = makeGoal({
      type: 'tickCount',
      target: 50,
      achievedAt: '2026-04-20T10:00:00Z',
    })
    const result = computeGoalProgress(
      goal,
      { ...EMPTY_INPUT, tickCount: 5 },
      TODAY,
    )
    expect(result.isAchieved).toBe(true)
    expect(result.status).toBe('achieved')
  })
})

describe('computeGoalProgress — grade goals', () => {
  it('treats higher grade as achieved', () => {
    const goal = makeGoal({ type: 'maxGrade', target: '6a' })
    const input: BadgeInput = { ...EMPTY_INPUT, maxGrade: '6c+' }
    const result = computeGoalProgress(goal, input, TODAY)
    expect(result.isAchieved).toBe(true)
    expect(result.targetDisplay).toBe('6A')
    expect(result.currentDisplay).toBe('6C+')
  })

  it('treats lower grade as not achieved', () => {
    const goal = makeGoal({ type: 'maxGrade', target: '7a' })
    const input: BadgeInput = { ...EMPTY_INPUT, maxGrade: '6c+' }
    const result = computeGoalProgress(goal, input, TODAY)
    expect(result.isAchieved).toBe(false)
    expect(result.progress).toBeGreaterThan(0)
    expect(result.progress).toBeLessThan(1)
  })

  it('renders em-dash when no max grade is set', () => {
    const goal = makeGoal({ type: 'maxGrade', target: '5a' })
    const result = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result.currentDisplay).toBe('—')
    expect(result.isAchieved).toBe(false)
  })
})

describe('computeGoalProgress — deadlines', () => {
  it('reports days remaining for a future deadline', () => {
    const goal = makeGoal({ deadline: '2026-05-01' })
    const result = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result.daysRemaining).toBe(4) // 27 -> 1 = +4 days
    expect(result.status).toBe('active')
  })

  it('reports zero days remaining when deadline is today', () => {
    const goal = makeGoal({ deadline: '2026-04-27' })
    const result = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result.daysRemaining).toBe(0)
  })

  it('reports negative days remaining when deadline is past', () => {
    const goal = makeGoal({ deadline: '2026-04-20' })
    const result = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result.daysRemaining).toBe(-7)
    expect(result.status).toBe('expired')
  })

  it('keeps an achieved goal as achieved even past deadline', () => {
    const goal = makeGoal({
      type: 'tickCount',
      target: 5,
      deadline: '2026-04-20',
    })
    const input = { ...EMPTY_INPUT, tickCount: 10 }
    const result = computeGoalProgress(goal, input, TODAY)
    expect(result.status).toBe('achieved')
  })

  it('returns null daysRemaining when no deadline is set', () => {
    const goal = makeGoal({ deadline: null })
    const result = computeGoalProgress(goal, EMPTY_INPUT, TODAY)
    expect(result.daysRemaining).toBe(null)
  })
})

describe('suggestGoals', () => {
  it('returns at most 5 suggestions', () => {
    const suggestions = suggestGoals({
      ...EMPTY_INPUT,
      tickCount: 7,
      sectorsVisited: 1,
      circuitsCompleted: 0,
      longestStreak: 1,
    })
    expect(suggestions.length).toBeLessThanOrEqual(5)
  })

  it('proposes the next milestone above the current value', () => {
    const suggestions = suggestGoals({
      ...EMPTY_INPUT,
      tickCount: 7,
    })
    const tick = suggestions.find((s) => s.type === 'tickCount')
    expect(tick?.target).toBe(10)
  })

  it('skips a category once the user is past the top milestone', () => {
    const suggestions = suggestGoals({
      ...EMPTY_INPUT,
      tickCount: 1000,
      sectorsVisited: 50,
    })
    expect(suggestions.find((s) => s.type === 'tickCount')).toBeUndefined()
    expect(suggestions.find((s) => s.type === 'sectorsVisited')).toBeUndefined()
  })

  it('proposes 5a as the first grade target for a new climber', () => {
    const suggestions = suggestGoals(EMPTY_INPUT)
    const grade = suggestions.find((s) => s.type === 'maxGrade')
    expect(grade?.target).toBe('5a')
  })

  it('proposes the next round grade above the current max', () => {
    const suggestions = suggestGoals({ ...EMPTY_INPUT, maxGrade: '6a+' })
    const grade = suggestions.find((s) => s.type === 'maxGrade')
    expect(grade?.target).toBe('6b')
  })
})

describe('validateGoalTarget', () => {
  it('rejects empty input', () => {
    expect(validateGoalTarget('tickCount', '')).toMatch(/Définissez/)
    expect(validateGoalTarget('tickCount', '   ')).toMatch(/Définissez/)
  })

  it('rejects non-integer numbers', () => {
    expect(validateGoalTarget('tickCount', '12.5')).toMatch(/entier/)
    expect(validateGoalTarget('tickCount', 'abc')).toMatch(/entier/)
  })

  it('rejects zero or negative numbers', () => {
    expect(validateGoalTarget('tickCount', '0')).toMatch(/positive/)
    expect(validateGoalTarget('tickCount', '-3')).toMatch(/positive/)
  })

  it('rejects unrealistic numbers', () => {
    expect(validateGoalTarget('tickCount', '999999')).toMatch(/élevée/)
  })

  it('accepts a sensible numeric target', () => {
    expect(validateGoalTarget('tickCount', '50')).toBe(null)
    expect(validateGoalTarget('longestStreak', '14')).toBe(null)
  })

  it('rejects an invalid grade', () => {
    expect(validateGoalTarget('maxGrade', 'foo')).toBe('Niveau invalide')
  })

  it('accepts a valid grade', () => {
    expect(validateGoalTarget('maxGrade', '7a+')).toBe(null)
  })
})
