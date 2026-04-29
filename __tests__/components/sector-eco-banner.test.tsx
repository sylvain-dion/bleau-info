import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectorEcoBanner } from '@/components/sector/sector-eco-banner'

describe('SectorEcoBanner', () => {
  it('renders nothing when no zones overlap the sector', () => {
    const { container } = render(
      <SectorEcoBanner
        sectorSlug="franchard-isatis"
        now={new Date('2026-04-15T12:00:00Z')}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for an unknown sector slug', () => {
    const { container } = render(
      <SectorEcoBanner
        sectorSlug="mars-base-alpha"
        now={new Date('2026-04-15T12:00:00Z')}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows the nidification banner during the season at Cul de Chien', () => {
    render(
      <SectorEcoBanner
        sectorSlug="cul-de-chien"
        now={new Date('2026-04-15T12:00:00Z')}
      />,
    )
    const banner = screen.getByTestId('sector-eco-banner')
    expect(banner.getAttribute('data-severity')).toBe('forbidden')
    expect(banner.getAttribute('role')).toBe('alert')
    expect(screen.getByText(/Faucon Pèlerin/)).toBeDefined()
  })

  it('drops the nidification banner outside the season', () => {
    const { container } = render(
      <SectorEcoBanner
        sectorSlug="cul-de-chien"
        now={new Date('2026-01-15T12:00:00Z')}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows the year-round humidity banner at Bas Cuvier', () => {
    render(
      <SectorEcoBanner
        sectorSlug="bas-cuvier"
        now={new Date('2026-01-15T12:00:00Z')}
      />,
    )
    const banner = screen.getByTestId('sector-eco-banner')
    expect(banner.getAttribute('data-severity')).toBe('info')
    expect(banner.getAttribute('role')).toBe('note')
  })

  it('expands and collapses zone details on click', () => {
    render(
      <SectorEcoBanner
        sectorSlug="cul-de-chien"
        now={new Date('2026-04-15T12:00:00Z')}
      />,
    )
    const trigger = screen.getByTestId('sector-eco-banner').querySelector('button')
    expect(trigger).not.toBeNull()
    if (!trigger) return

    // Collapsed initially — detail item not shown
    expect(
      screen.queryByTestId('eco-zone-detail-zone-nidification-cul-de-chien'),
    ).toBeNull()

    fireEvent.click(trigger)
    expect(
      screen.getByTestId('eco-zone-detail-zone-nidification-cul-de-chien'),
    ).toBeDefined()
    expect(screen.getByText(/escalade interdite du 1er mars au 30 juin/)).toBeDefined()

    fireEvent.click(trigger)
    expect(
      screen.queryByTestId('eco-zone-detail-zone-nidification-cul-de-chien'),
    ).toBeNull()
  })
})
