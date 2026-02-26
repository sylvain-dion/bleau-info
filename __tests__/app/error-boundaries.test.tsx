import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import * as Sentry from '@sentry/nextjs'
import ErrorPage from '@/app/error'

describe('Error Boundary (app/error.tsx)', () => {
  it('should render error message', () => {
    const error = new Error('Test error')
    const reset = vi.fn()

    render(<ErrorPage error={error} reset={reset} />)

    expect(screen.getByText(/quelque chose s'est mal passé/i)).toBeInTheDocument()
  })

  it('should render retry button', () => {
    const error = new Error('Test error')
    const reset = vi.fn()

    render(<ErrorPage error={error} reset={reset} />)

    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
  })

  it('should call Sentry.captureException on mount', () => {
    const error = new Error('Test error')
    const reset = vi.fn()

    render(<ErrorPage error={error} reset={reset} />)

    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })

  it('should call reset when retry button is clicked', () => {
    const error = new Error('Test error')
    const reset = vi.fn()

    render(<ErrorPage error={error} reset={reset} />)

    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }))
    expect(reset).toHaveBeenCalled()
  })

  it('should have accessible retry button with min touch target', () => {
    const error = new Error('Test error')
    const reset = vi.fn()

    render(<ErrorPage error={error} reset={reset} />)

    const button = screen.getByRole('button', { name: /réessayer/i })
    expect(button.className).toContain('min-touch')
  })
})
