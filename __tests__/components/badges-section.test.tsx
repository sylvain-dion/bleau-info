import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BadgesSection } from '@/components/profile/badges-section'
import { computeBadges } from '@/lib/badges'

describe('BadgesSection', () => {
  it('renders nothing when the badge list is empty', () => {
    const { container } = render(<BadgesSection badges={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the earned / total counter in the header', () => {
    const badges = computeBadges({
      tickCount: 100,
      uniqueBoulders: 80,
      maxGrade: '6a',
      sectorsVisited: 3,
      circuitsCompleted: 1,
    })
    render(<BadgesSection badges={badges} />)

    const earned = badges.filter((b) => b.earned).length
    const header = screen.getByText(`${earned} / ${badges.length}`)
    expect(header).toBeInTheDocument()
  })

  it('shows a tile with the badge label for each badge', () => {
    const badges = computeBadges({
      tickCount: 1,
      uniqueBoulders: 1,
      maxGrade: '',
      sectorsVisited: 0,
      circuitsCompleted: 0,
    })
    render(<BadgesSection badges={badges} />)
    // Catalog labels rendered at least once (same label appears in popover on click — but no popover open yet)
    expect(screen.getAllByText('Premier Bloc').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Centurion').length).toBeGreaterThan(0)
  })

  it('marks earned badges with "obtenu" and locked with "non obtenu" in aria-label', () => {
    const badges = computeBadges({
      tickCount: 1,
      uniqueBoulders: 0,
      maxGrade: '',
      sectorsVisited: 0,
      circuitsCompleted: 0,
    })
    render(<BadgesSection badges={badges} />)

    const earnedBtn = screen.getByRole('button', {
      name: /Premier Bloc.*obtenu/i,
    })
    expect(earnedBtn.getAttribute('aria-label')).toMatch(/obtenu/)
    expect(earnedBtn.getAttribute('aria-label')).not.toMatch(/non obtenu/)

    const lockedBtn = screen.getByRole('button', {
      name: /Centurion.*non obtenu/i,
    })
    expect(lockedBtn.getAttribute('aria-label')).toMatch(/non obtenu/)
  })

  it('opens and closes a popover on click', () => {
    const badges = computeBadges({
      tickCount: 1,
      uniqueBoulders: 0,
      maxGrade: '',
      sectorsVisited: 0,
      circuitsCompleted: 0,
    })
    render(<BadgesSection badges={badges} />)

    const button = screen.getByRole('button', {
      name: /Premier Bloc/i,
    })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('displays progress percentage for locked badges in the popover', () => {
    const badges = computeBadges({
      tickCount: 50,
      uniqueBoulders: 0,
      maxGrade: '',
      sectorsVisited: 0,
      circuitsCompleted: 0,
    })
    render(<BadgesSection badges={badges} />)

    const lockedBtn = screen.getByRole('button', { name: /Centurion.*non obtenu/i })
    fireEvent.click(lockedBtn)
    expect(screen.getByText(/Progression : 50%/)).toBeInTheDocument()
  })

  it('omits style badges entirely when optional inputs are missing', () => {
    const badges = computeBadges({
      tickCount: 5,
      uniqueBoulders: 5,
      maxGrade: '5a',
      sectorsVisited: 1,
      circuitsCompleted: 0,
    })
    render(<BadgesSection badges={badges} />)
    expect(screen.queryByText('Flash Apprenti')).not.toBeInTheDocument()
    expect(screen.queryByText('À Vue Expert')).not.toBeInTheDocument()
    expect(screen.queryByText('Passionné')).not.toBeInTheDocument()
  })

  it('shows style badges when optional inputs are provided', () => {
    const badges = computeBadges({
      tickCount: 0,
      uniqueBoulders: 0,
      maxGrade: '',
      sectorsVisited: 0,
      circuitsCompleted: 0,
      flashCount: 0,
      onsightCount: 0,
      uniqueClimbingDays: 0,
    })
    render(<BadgesSection badges={badges} />)
    expect(screen.getByText('Flash Apprenti')).toBeInTheDocument()
    expect(screen.getByText('À Vue Expert')).toBeInTheDocument()
    expect(screen.getByText('Passionné')).toBeInTheDocument()
  })
})
