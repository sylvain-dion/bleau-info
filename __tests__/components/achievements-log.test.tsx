import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AchievementsLog } from '@/components/profile/achievements-log'
import { useAchievementsStore } from '@/stores/achievements-store'
import type { AchievementEvent } from '@/lib/achievements'

function reset() {
  useAchievementsStore.setState({
    seenBadgeIds: [],
    seenStreakMilestones: [],
    seenGoalIds: [],
    log: [],
    queue: [],
  })
}

function makeEvent(i: number): AchievementEvent {
  return {
    id: `badge:b${i}`,
    kind: 'badge',
    title: `Badge ${i}`,
    subtitle: `Sub ${i}`,
    icon: 'Trophy',
    color: 'text-amber-500',
    earnedAt: new Date(Date.now() - i * 1000).toISOString(),
  }
}

describe('<AchievementsLog />', () => {
  beforeEach(() => reset())

  it('renders nothing when the log is empty', () => {
    const { container } = render(<AchievementsLog />)
    expect(container.firstChild).toBeNull()
  })

  it('renders up to the preview limit and a count badge', () => {
    useAchievementsStore.setState({
      log: Array.from({ length: 8 }, (_, i) => makeEvent(i)),
    })
    render(<AchievementsLog />)
    expect(screen.getByTestId('achievements-log')).toBeInTheDocument()
    // 5 visible by default
    expect(screen.getByText('Badge 0')).toBeInTheDocument()
    expect(screen.getByText('Badge 4')).toBeInTheDocument()
    expect(screen.queryByText('Badge 5')).not.toBeInTheDocument()
    // count of total entries
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('expands when "Tout voir" is clicked', async () => {
    const user = userEvent.setup()
    useAchievementsStore.setState({
      log: Array.from({ length: 8 }, (_, i) => makeEvent(i)),
    })
    render(<AchievementsLog />)
    await user.click(screen.getByRole('button', { name: /Tout voir/i }))
    expect(screen.getByText('Badge 7')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Réduire/i }),
    ).toBeInTheDocument()
  })

  it('does not show the toggle when the log fits within the preview', () => {
    useAchievementsStore.setState({
      log: [makeEvent(0), makeEvent(1)],
    })
    render(<AchievementsLog />)
    expect(
      screen.queryByRole('button', { name: /Tout voir/i }),
    ).not.toBeInTheDocument()
  })

  it("formats timestamps as relative French", () => {
    useAchievementsStore.setState({
      log: [
        {
          ...makeEvent(0),
          earnedAt: new Date(Date.now() - 30_000).toISOString(),
        },
      ],
    })
    render(<AchievementsLog />)
    expect(screen.getByText(/à l'instant/)).toBeInTheDocument()
  })
})
