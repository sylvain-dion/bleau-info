'use client'

import { Share2, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  buildShareUrl,
  generateRouteShareText,
} from '@/lib/route-sharing'
import { computeRouteStats } from '@/lib/routes'
import type { CustomRoute } from '@/stores/custom-route-store'

interface RouteShareButtonProps {
  route: CustomRoute
}

/**
 * Share button row with Web Share API, WhatsApp, Messenger,
 * and clipboard fallback (Story 9.6).
 */
export function RouteShareButton({ route }: RouteShareButtonProps) {
  const [copied, setCopied] = useState(false)

  if (route.boulderIds.length === 0) return null

  const shareUrl = buildShareUrl(route)
  const stats = computeRouteStats(route.boulderIds)
  const shareText = generateRouteShareText(route, stats, shareUrl)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: route.name,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled — fall through
      }
    }
    handleCopy()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Lien copié dans le presse-papier')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const messengerUrl = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}&app_id=0`

  return (
    <div className="flex items-center gap-1.5">
      {/* Native share */}
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Partager le parcours"
      >
        <Share2 className="h-3.5 w-3.5" />
        Partager
      </button>

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white transition-opacity hover:opacity-80"
        aria-label="Partager sur WhatsApp"
      >
        <WhatsAppIcon />
      </a>

      {/* Messenger */}
      <a
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0084FF] text-white transition-opacity hover:opacity-80"
        aria-label="Partager sur Messenger"
      >
        <MessengerIcon />
      </a>

      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Copier le lien"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.113-1.14l-.287-.172-2.6.772.772-2.6-.172-.287A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
    </svg>
  )
}

function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.15.16.14.25.34.26.56l.05 1.78c.02.56.6.92 1.1.68l1.98-.87c.17-.08.36-.1.55-.06.88.24 1.82.37 2.81.37 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.56l-2.91 4.62c-.46.74-1.44.93-2.13.42l-2.31-1.73a.6.6 0 00-.72 0l-3.12 2.37c-.42.32-.96-.18-.68-.63l2.91-4.62c.46-.74 1.44-.93 2.13-.42l2.31 1.73a.6.6 0 00.72 0l3.12-2.37c.42-.32.96.18.68.63z" />
    </svg>
  )
}
