import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouteShareButton } from '@/components/routes/route-share-button'
import type { CustomRoute } from '@/stores/custom-route-store'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockRoute: CustomRoute = {
  id: 'route-123',
  name: 'Test Parcours',
  boulderIds: ['cul-de-chien-1', 'cul-de-chien-3'],
  isPublic: false,
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-03-15T10:00:00Z',
}

describe('RouteShareButton', () => {
  it('renders nothing when route has no boulders', () => {
    const emptyRoute = { ...mockRoute, boulderIds: [] }
    const { container } = render(<RouteShareButton route={emptyRoute} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders share and copy buttons', () => {
    render(<RouteShareButton route={mockRoute} />)
    expect(screen.getByText('Partager')).toBeDefined()
    expect(screen.getByLabelText('Copier le lien')).toBeDefined()
  })

  it('has accessible labels', () => {
    render(<RouteShareButton route={mockRoute} />)
    expect(screen.getByLabelText('Partager le parcours')).toBeDefined()
    expect(screen.getByLabelText('Copier le lien')).toBeDefined()
  })

  it('copies to clipboard when copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    render(<RouteShareButton route={mockRoute} />)
    await userEvent.click(screen.getByLabelText('Copier le lien'))

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0][0]).toContain('/parcours/shared?')
  })
})
