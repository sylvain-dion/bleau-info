'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { AchievementShare } from '@/lib/social-share'

interface ShareButtonProps {
  share: AchievementShare
  /**
   * Visual variant:
   *  - `icon`: a single round icon (used in tight spaces — badge popovers,
   *    goal card headers, streak card corners)
   *  - `default`: icon + "Partager" label (used as a primary CTA — the
   *    achievement celebration overlay)
   */
  variant?: 'icon' | 'default'
  /** Override the accessible label. Defaults to `share.title`. */
  ariaLabel?: string
  /** Optional className appended to the button's tailwind set. */
  className?: string
}

const COPIED_RESET_MS = 2000

/**
 * Reusable share button for personal achievements (Story 14.5).
 *
 * Tries the Web Share API first (mobile-first; native sheet on iOS /
 * Android). Falls back to writing `share.text` to the clipboard with
 * a toast confirmation on desktop or unsupported browsers.
 *
 * The button briefly flips to a checkmark to confirm the copy and
 * resets after 2 seconds.
 */
export function ShareButton({
  share,
  variant = 'default',
  ariaLabel,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: share.title,
          text: share.text,
          url: share.url,
        })
        return
      } catch (err) {
        // AbortError = user cancelled the share sheet — silent.
        if (err instanceof Error && err.name === 'AbortError') return
        // Otherwise fall through to clipboard.
      }
    }
    await copyToClipboard()
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(share.text)
      setCopied(true)
      toast.success('Texte copié dans le presse-papier')
      setTimeout(() => setCopied(false), COPIED_RESET_MS)
    } catch {
      toast.error('Impossible de copier le texte')
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={ariaLabel ?? `Partager : ${share.title}`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
        data-testid="share-button"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={ariaLabel ?? `Partager : ${share.title}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted ${className}`}
      data-testid="share-button"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Copié
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          Partager
        </>
      )}
    </button>
  )
}
