import { describe, it, expect, beforeEach } from 'vitest'
import { useGoalsStore } from '@/stores/goals-store'
import type { BadgeInput } from '@/lib/badges'

function resetStore() {
  useGoalsStore.setState({ goals: [] })
}

const EMPTY_INPUT: BadgeInput = {
  tickCount: 0,
  uniqueBoulders: 0,
  maxGrade: '',
  sectorsVisited: 0,
  circuitsCompleted: 0,
}

describe('useGoalsStore', () => {
  beforeEach(() => resetStore())

  it('starts with no goals', () => {
    expect(useGoalsStore.getState().goals).toHaveLength(0)
  })

  it('addGoal creates a goal with a generated id and createdAt', () => {
    const goal = useGoalsStore
      .getState()
      .addGoal({ type: 'tickCount', target: 100 })
    expect(goal.id).toMatch(/^goal-/)
    expect(goal.target).toBe(100)
    expect(goal.deadline).toBe(null)
    expect(goal.achievedAt).toBe(null)
    expect(goal.createdAt).toBeTruthy()
    expect(useGoalsStore.getState().goals).toHaveLength(1)
  })

  it('addGoal accepts a deadline', () => {
    const goal = useGoalsStore.getState().addGoal({
      type: 'tickCount',
      target: 50,
      deadline: '2026-12-31',
    })
    expect(goal.deadline).toBe('2026-12-31')
  })

  it('removeGoal deletes by id', () => {
    const a = useGoalsStore.getState().addGoal({ type: 'tickCount', target: 10 })
    const b = useGoalsStore
      .getState()
      .addGoal({ type: 'sectorsVisited', target: 5 })
    useGoalsStore.getState().removeGoal(a.id)
    const goals = useGoalsStore.getState().goals
    expect(goals).toHaveLength(1)
    expect(goals[0].id).toBe(b.id)
  })

  it('updateDeadline mutates only the targeted goal', () => {
    const a = useGoalsStore.getState().addGoal({ type: 'tickCount', target: 10 })
    const b = useGoalsStore
      .getState()
      .addGoal({ type: 'sectorsVisited', target: 5 })
    useGoalsStore.getState().updateDeadline(a.id, '2026-06-01')
    const goals = useGoalsStore.getState().goals
    expect(goals.find((g) => g.id === a.id)?.deadline).toBe('2026-06-01')
    expect(goals.find((g) => g.id === b.id)?.deadline).toBe(null)
  })

  it('reconcileAchievements stamps achievedAt and reports new ids', () => {
    const a = useGoalsStore.getState().addGoal({ type: 'tickCount', target: 5 })
    useGoalsStore.getState().addGoal({ type: 'tickCount', target: 100 })

    const newlyAchieved = useGoalsStore
      .getState()
      .reconcileAchievements({ ...EMPTY_INPUT, tickCount: 7 })

    expect(newlyAchieved).toEqual([a.id])
    const goal = useGoalsStore
      .getState()
      .goals.find((g) => g.id === a.id)
    expect(goal?.achievedAt).toBeTruthy()
  })

  it('reconcileAchievements is idempotent on already-achieved goals', () => {
    const a = useGoalsStore.getState().addGoal({ type: 'tickCount', target: 5 })
    useGoalsStore
      .getState()
      .reconcileAchievements({ ...EMPTY_INPUT, tickCount: 10 })
    const second = useGoalsStore
      .getState()
      .reconcileAchievements({ ...EMPTY_INPUT, tickCount: 10 })
    expect(second).toEqual([])
    const goal = useGoalsStore
      .getState()
      .goals.find((g) => g.id === a.id)
    expect(goal?.achievedAt).toBeTruthy()
  })

  it('clear empties the goal list', () => {
    useGoalsStore.getState().addGoal({ type: 'tickCount', target: 10 })
    useGoalsStore.getState().addGoal({ type: 'sectorsVisited', target: 5 })
    useGoalsStore.getState().clear()
    expect(useGoalsStore.getState().goals).toHaveLength(0)
  })
})
