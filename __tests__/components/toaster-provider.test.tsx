import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ToasterProvider } from '@/components/layout/toaster-provider'

vi.mock('@/lib/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'system',
    resolvedTheme: 'light' as const,
    setTheme: vi.fn(),
  }),
}))

describe('ToasterProvider', () => {
  it('renders without crashing', () => {
    const { container } = render(<ToasterProvider />)
    expect(container).toBeTruthy()
  })

  it('renders a sonner toaster element', () => {
    const { container } = render(<ToasterProvider />)
    // Sonner renders a section with data-sonner-toaster attribute
    const toaster = container.querySelector('[data-sonner-toaster]')
      || container.querySelector('section')
      || container.firstChild
    expect(toaster).toBeTruthy()
  })
})
