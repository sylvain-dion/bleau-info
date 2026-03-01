import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataExportButton } from '@/components/profile/data-export-button'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2025-06-15T10:30:00Z',
  last_sign_in_at: '2026-02-28T14:00:00Z',
  user_metadata: {
    display_name: 'Jean Grimpeur',
    full_name: 'Jean Grimpeur',
    max_grade: '6b+',
    avatar_preset: 'climber',
    avatar_url: null,
  },
  app_metadata: {},
  aud: 'authenticated',
} as unknown as User

describe('DataExportButton', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>
  let revokeObjectURLMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockUser, isLoading: false })

    // Mock URL.createObjectURL and revokeObjectURL
    createObjectURLMock = vi.fn(() => 'blob:mock-url')
    revokeObjectURLMock = vi.fn()
    global.URL.createObjectURL = createObjectURLMock
    global.URL.revokeObjectURL = revokeObjectURLMock
  })

  it('should render the export button', () => {
    render(<DataExportButton />)
    expect(screen.getByText('Télécharger mes données')).toBeInTheDocument()
  })

  it('should trigger download when clicked', () => {
    render(<DataExportButton />)

    // Set up spies AFTER render so React can mount the component
    const clickMock = vi.fn()
    const originalAppendChild = document.body.appendChild.bind(document.body)
    const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = clickMock
        return node
      }
      return originalAppendChild(node)
    })
    const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    fireEvent.click(screen.getByText('Télécharger mes données'))

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1)

    appendChildMock.mockRestore()
    removeChildMock.mockRestore()
  })

  it('should create a Blob with correct JSON structure', () => {
    render(<DataExportButton />)

    // Set up spies AFTER render
    const originalAppendChild = document.body.appendChild.bind(document.body)
    const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = vi.fn()
        return node
      }
      return originalAppendChild(node)
    })
    const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    fireEvent.click(screen.getByText('Télécharger mes données'))

    // Check the Blob was created with correct content
    const blobArg = (createObjectURLMock.mock.calls[0] as [Blob])[0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toBe('application/json')

    appendChildMock.mockRestore()
    removeChildMock.mockRestore()
  })

  it('should be disabled when no user is logged in', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    render(<DataExportButton />)

    const button = screen.getByText('Télécharger mes données').closest('button')
    expect(button).toBeDisabled()
  })

  it('should set correct filename with date', () => {
    let capturedHref = ''
    let capturedDownload = ''

    render(<DataExportButton />)

    // Set up spies AFTER render
    const originalAppendChild = document.body.appendChild.bind(document.body)
    const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        capturedHref = node.href
        capturedDownload = node.download
        node.click = vi.fn()
        return node
      }
      return originalAppendChild(node)
    })
    const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    fireEvent.click(screen.getByText('Télécharger mes données'))

    expect(capturedDownload).toMatch(/^bleau-info-donnees-\d{4}-\d{2}-\d{2}\.json$/)
    expect(capturedHref).toBe('blob:mock-url')

    appendChildMock.mockRestore()
    removeChildMock.mockRestore()
  })
})
