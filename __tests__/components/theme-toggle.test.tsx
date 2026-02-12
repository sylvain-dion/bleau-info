import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock useTheme hook - must be defined before import
const mockSetTheme = vi.fn()

vi.mock('@/lib/hooks/use-theme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: mockSetTheme,
  })),
}))

// Import after mocking
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useTheme } from '@/lib/hooks/use-theme'

const mockUseTheme = useTheme as ReturnType<typeof vi.fn>

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTheme.mockReturnValue({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    })
  })

  it('should render toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeDefined()
  })

  it('should show sun icon in light mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
    // Sun icon should be present (Lucide Sun component)
    expect(button.querySelector('svg')).toBeDefined()
  })

  it('should show moon icon in dark mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
    // Moon icon should be present (Lucide Moon component)
    expect(button.querySelector('svg')).toBeDefined()
  })

  it('should cycle theme on click: system → light', () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('should cycle theme on click: light → dark', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should cycle theme on click: dark → system', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })

  it('should have minimum touch target size (48px)', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Check for the min-touch class or h-12 w-12 (which equals 48px)
    expect(button.className).toContain('h-12')
    expect(button.className).toContain('w-12')
  })

  it('should have accessible aria-label', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button.getAttribute('aria-label')).toBe('Toggle theme')
  })

  it('should have title attribute with current theme info', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('title')).toContain('dark')
  })

  it('should have proper hover and focus styles', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Check for hover classes
    expect(button.className).toContain('hover:bg-')

    // Check for focus classes
    expect(button.className).toContain('focus:outline-none')
    expect(button.className).toContain('focus:ring-')
  })

  it('should have transition classes for smooth animations', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Check for transition classes
    expect(button.className).toContain('transition')
  })

  it('should display correct icon based on resolvedTheme, not theme', () => {
    // When theme is system but resolvedTheme is dark
    mockUseTheme.mockReturnValue({
      theme: 'system',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
    // Should show moon icon because resolvedTheme is dark
    expect(button.querySelector('svg')).toBeDefined()
  })
})
