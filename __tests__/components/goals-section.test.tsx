import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { GoalsSection } from '@/components/profile/goals-section'
import { useGoalsStore } from '@/stores/goals-store'
import type { BadgeInput } from '@/lib/badges'

const EMPTY_INPUT: BadgeInput = {
  tickCount: 0,
  uniqueBoulders: 0,
  maxGrade: '',
  sectorsVisited: 0,
  circuitsCompleted: 0,
}

function resetStore() {
  useGoalsStore.setState({ goals: [] })
}

describe('GoalsSection — empty state', () => {
  beforeEach(() => resetStore())

  it('shows the empty prompt when there are no goals', () => {
    render(<GoalsSection input={EMPTY_INPUT} />)
    expect(screen.getByText(/Fixez-vous une cible/i)).toBeInTheDocument()
  })

  it('renders the "add goal" button', () => {
    render(<GoalsSection input={EMPTY_INPUT} />)
    expect(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    ).toBeInTheDocument()
  })
})

describe('GoalsSection — populated', () => {
  beforeEach(() => resetStore())

  it('renders one card per goal', () => {
    useGoalsStore.getState().addGoal({ type: 'tickCount', target: 50 })
    useGoalsStore.getState().addGoal({ type: 'sectorsVisited', target: 5 })

    render(<GoalsSection input={{ ...EMPTY_INPUT, tickCount: 10 }} />)

    expect(screen.getByText('Nombre de croix')).toBeInTheDocument()
    expect(screen.getByText('Secteurs visités')).toBeInTheDocument()
  })

  it('shows the achieved counter in the header', () => {
    useGoalsStore.getState().addGoal({ type: 'tickCount', target: 5 })
    useGoalsStore.getState().addGoal({ type: 'tickCount', target: 100 })

    render(<GoalsSection input={{ ...EMPTY_INPUT, tickCount: 10 }} />)

    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('reconcileAchievements stamps achievedAt when stats meet a goal', () => {
    const goal = useGoalsStore
      .getState()
      .addGoal({ type: 'tickCount', target: 5 })
    expect(goal.achievedAt).toBe(null)

    render(<GoalsSection input={{ ...EMPTY_INPUT, tickCount: 10 }} />)

    const after = useGoalsStore
      .getState()
      .goals.find((g) => g.id === goal.id)
    expect(after?.achievedAt).toBeTruthy()
  })

  it('removes a goal when the delete button is clicked', () => {
    const goal = useGoalsStore
      .getState()
      .addGoal({ type: 'tickCount', target: 100 })

    render(<GoalsSection input={EMPTY_INPUT} />)

    const card = screen.getByTestId(`goal-card-${goal.id}`)
    fireEvent.click(within(card).getByRole('button', { name: /Supprimer/i }))

    expect(useGoalsStore.getState().goals).toHaveLength(0)
  })
})

describe('GoalsSection — suggestions', () => {
  beforeEach(() => resetStore())

  it('renders chip suggestions when no active goals exist', () => {
    render(<GoalsSection input={{ ...EMPTY_INPUT, tickCount: 7 }} />)
    // suggested next milestone above 7 is 10
    expect(
      screen.getByRole('button', { name: /Nombre de croix.*10/i }),
    ).toBeInTheDocument()
  })

  it('clicking a suggestion adds the corresponding goal', () => {
    render(<GoalsSection input={{ ...EMPTY_INPUT, tickCount: 7 }} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Nombre de croix.*10/i }),
    )
    const goals = useGoalsStore.getState().goals
    expect(goals).toHaveLength(1)
    expect(goals[0].type).toBe('tickCount')
    expect(goals[0].target).toBe(10)
  })

  it('hides a suggestion once a matching active goal exists', () => {
    useGoalsStore.getState().addGoal({ type: 'tickCount', target: 50 })
    render(<GoalsSection input={{ ...EMPTY_INPUT, tickCount: 7 }} />)
    expect(
      screen.queryByRole('button', { name: /^Ajouter l'objectif Nombre de croix/i }),
    ).not.toBeInTheDocument()
  })
})
