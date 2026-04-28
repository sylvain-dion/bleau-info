import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GoalCard } from '@/components/profile/goal-card'
import type { Goal } from '@/lib/goals'
import type { BadgeInput } from '@/lib/badges'

const EMPTY_INPUT: BadgeInput = {
  tickCount: 0,
  uniqueBoulders: 0,
  maxGrade: '',
  sectorsVisited: 0,
  circuitsCompleted: 0,
}

function makeGoal(partial: Partial<Goal> = {}): Goal {
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

describe('GoalCard', () => {
  it('renders the goal label and current/target values', () => {
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    render(
      <GoalCard
        goal={goal}
        input={{ ...EMPTY_INPUT, tickCount: 25 }}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByText('Nombre de croix')).toBeInTheDocument()
    const card = screen.getByTestId('goal-card-g1')
    expect(card.textContent).toMatch(/25\s*\/\s*100\s*croix/)
  })

  it('shows percentage in the footer', () => {
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    render(
      <GoalCard
        goal={goal}
        input={{ ...EMPTY_INPUT, tickCount: 25 }}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('marks an achieved goal with the "Atteint" footer', () => {
    const goal = makeGoal({ type: 'tickCount', target: 50 })
    render(
      <GoalCard
        goal={goal}
        input={{ ...EMPTY_INPUT, tickCount: 80 }}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByText('Atteint')).toBeInTheDocument()
    const root = screen.getByTestId('goal-card-g1')
    expect(root.dataset.status).toBe('achieved')
  })

  it('calls onRemove when the delete button is clicked', () => {
    const onRemove = vi.fn()
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    render(
      <GoalCard
        goal={goal}
        input={{ ...EMPTY_INPUT, tickCount: 0 }}
        onRemove={onRemove}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: /Supprimer l'objectif/i }),
    )
    expect(onRemove).toHaveBeenCalledWith('g1')
  })

  it('renders a grade goal target with formatted grade label', () => {
    const goal = makeGoal({ type: 'maxGrade', target: '7a' })
    render(
      <GoalCard
        goal={goal}
        input={{ ...EMPTY_INPUT, maxGrade: '6c+' }}
        onRemove={() => {}}
      />,
    )
    const card = screen.getByTestId('goal-card-g1')
    expect(card.textContent).toMatch(/6C\+\s*\/\s*7A/)
  })

  it('shows "Sans échéance" when no deadline is set', () => {
    const goal = makeGoal({ deadline: null })
    render(
      <GoalCard
        goal={goal}
        input={EMPTY_INPUT}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByText('Sans échéance')).toBeInTheDocument()
  })

  it('exposes progress on the progressbar role', () => {
    const goal = makeGoal({ type: 'tickCount', target: 100 })
    render(
      <GoalCard
        goal={goal}
        input={{ ...EMPTY_INPUT, tickCount: 50 }}
        onRemove={() => {}}
      />,
    )
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('50')
  })
})
