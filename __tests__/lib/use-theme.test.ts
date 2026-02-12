import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '@/lib/hooks/use-theme'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? matches : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorageMock.clear()
    document.documentElement.classList.remove('dark')
    // Default to light mode preference
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMediaMock(false),
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should default to system theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('should default to light resolved theme when system prefers light', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('should default to dark resolved theme when system prefers dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMediaMock(true),
      writable: true,
    })

    const { result } = renderHook(() => useTheme())
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorage.getItem('theme')).toBe('dark')
    expect(result.current.theme).toBe('dark')
  })

  it('should apply dark class to document when theme is dark', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should remove dark class in light mode', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should respect system preference when theme is system', () => {
    // Mock system as dark
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMediaMock(true),
      writable: true,
    })

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('system')
    })

    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should load theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  it('should handle invalid localStorage values', () => {
    localStorage.setItem('theme', 'invalid-theme')

    const { result } = renderHook(() => useTheme())

    // Should default to system if invalid value
    expect(result.current.theme).toBe('system')
  })

  it('should cycle through theme states correctly', () => {
    const { result } = renderHook(() => useTheme())

    // Start with system
    expect(result.current.theme).toBe('system')

    // Set to light
    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')

    // Set to dark
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')

    // Set back to system
    act(() => {
      result.current.setTheme('system')
    })
    expect(result.current.theme).toBe('system')
  })

  it('should update resolvedTheme when switching from dark to light', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.resolvedTheme).toBe('dark')

    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.resolvedTheme).toBe('light')
  })
})
