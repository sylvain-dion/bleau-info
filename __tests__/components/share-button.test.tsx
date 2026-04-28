import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareButton } from '@/components/share/share-button'
import type { AchievementShare } from '@/lib/social-share'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from 'sonner'

const share: AchievementShare = {
  title: 'Badge Centurion débloqué',
  text: '🏆 Badge Centurion débloqué !\n100 croix\n\n📱 Bleau.info\nhttps://bleau.info',
  url: 'https://bleau.info',
}

const originalNavigator = globalThis.navigator

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    writable: true,
    configurable: true,
  })
})

describe('<ShareButton /> — default variant', () => {
  it('renders the icon and "Partager" label', () => {
    render(<ShareButton share={share} />)
    expect(screen.getByText('Partager')).toBeInTheDocument()
    expect(screen.getByTestId('share-button')).toHaveAttribute(
      'aria-label',
      'Partager : Badge Centurion débloqué',
    )
  })

  it('honours a custom aria-label', () => {
    render(<ShareButton share={share} ariaLabel="Partager mon badge" />)
    expect(screen.getByTestId('share-button')).toHaveAttribute(
      'aria-label',
      'Partager mon badge',
    )
  })
})

describe('<ShareButton /> — icon variant', () => {
  it('renders just the icon', () => {
    render(<ShareButton share={share} variant="icon" />)
    expect(screen.queryByText('Partager')).not.toBeInTheDocument()
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })
})

describe('<ShareButton /> — Web Share API', () => {
  it('calls navigator.share with the payload when available', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share: shareSpy })

    render(<ShareButton share={share} />)
    await userEvent.click(screen.getByTestId('share-button'))

    expect(shareSpy).toHaveBeenCalledOnce()
    expect(shareSpy.mock.calls[0][0]).toEqual({
      title: share.title,
      text: share.text,
      url: share.url,
    })
  })

  it('does not fall back to clipboard when the user cancels the sheet', async () => {
    const abort = Object.assign(new Error('user cancelled'), {
      name: 'AbortError',
    })
    const shareSpy = vi.fn().mockRejectedValue(abort)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      share: shareSpy,
      clipboard: { writeText },
    })

    render(<ShareButton share={share} />)
    await userEvent.click(screen.getByTestId('share-button'))

    expect(shareSpy).toHaveBeenCalledOnce()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to clipboard on non-abort share errors', async () => {
    const shareSpy = vi.fn().mockRejectedValue(new Error('boom'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      share: shareSpy,
      clipboard: { writeText },
    })

    render(<ShareButton share={share} />)
    await userEvent.click(screen.getByTestId('share-button'))

    expect(writeText).toHaveBeenCalledWith(share.text)
    expect(toast.success).toHaveBeenCalledWith(
      'Texte copié dans le presse-papier',
    )
  })
})

describe('<ShareButton /> — clipboard fallback', () => {
  it('writes the share text and shows a success toast', async () => {
    // Remove navigator.share to force the clipboard path
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator, share: undefined, clipboard: { writeText } },
      writable: true,
      configurable: true,
    })

    render(<ShareButton share={share} />)
    await userEvent.click(screen.getByTestId('share-button'))

    expect(writeText).toHaveBeenCalledWith(share.text)
    expect(toast.success).toHaveBeenCalledWith(
      'Texte copié dans le presse-papier',
    )
    // Brief "Copié" state appears after the click
    expect(screen.getByText('Copié')).toBeInTheDocument()
  })

  it('shows an error toast when clipboard fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator, share: undefined, clipboard: { writeText } },
      writable: true,
      configurable: true,
    })

    render(<ShareButton share={share} />)
    await userEvent.click(screen.getByTestId('share-button'))

    expect(toast.error).toHaveBeenCalledWith('Impossible de copier le texte')
  })
})
