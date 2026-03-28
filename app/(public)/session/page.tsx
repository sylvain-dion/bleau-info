'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Share2,
  Copy,
  CheckCircle2,
  Trophy,
  Mountain,
  Calendar,
  Clipboard,
} from 'lucide-react'
import {
  generateSessionSummary,
  generateShareText,
} from '@/lib/data/session-summary'
import { useTickStore } from '@/stores/tick-store'
import { toast } from 'sonner'

export default function SessionPage() {
  const [copied, setCopied] = useState(false)
  const ticks = useTickStore((s) => s.ticks)

  const summary = useMemo(
    () => generateSessionSummary(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ticks.length]
  )

  if (!summary.hasActivity) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center">
        <Mountain className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <h1 className="text-lg font-bold text-foreground">
          Pas encore de séance aujourd&apos;hui
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Loguez des croix pour générer un résumé de session.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la carte
        </Link>
      </main>
    )
  }

  const shareText = generateShareText(summary)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
        return
      } catch {
        // User cancelled or not supported
      }
    }
    // Fallback: copy to clipboard
    handleCopy()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('Copié dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Session card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {summary.dateFormatted}
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
            Résumé de séance
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black text-primary">{summary.tickCount}</p>
            <p className="text-[10px] text-muted-foreground">
              bloc{summary.tickCount > 1 ? 's' : ''}
            </p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black text-foreground">
              {summary.gradeMin ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">min</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black text-foreground">
              {summary.gradeMax ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">max</p>
          </div>
        </div>

        {/* Highlight */}
        {summary.highlight && (
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Meilleur bloc
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-foreground">
              {summary.highlight.boulderName}{' '}
              <span className="text-primary">({summary.highlight.grade})</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.highlight.style}
            </p>
          </div>
        )}

        {/* Tick list */}
        <div className="px-6 py-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Détail
          </p>
          <div className="space-y-1.5">
            {summary.ticks.map((tick, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-foreground">{tick.boulderName}</span>
                </div>
                <span className="text-muted-foreground">
                  {tick.grade} · {tick.style}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        {summary.conditions.length > 0 && (
          <div className="border-t border-border px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {summary.conditions.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
                >
                  {c.emoji} {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 text-center text-[10px] text-muted-foreground/50">
          Bleau.info — Guide d&apos;escalade de Fontainebleau
        </div>
      </div>

      {/* Share actions */}
      <div className="mt-4 space-y-3">
        {/* Primary share */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Social share buttons */}
        <div className="flex flex-wrap gap-2">
          <SocialButton
            label="WhatsApp"
            color="bg-[#25D366] hover:bg-[#20BD5A]"
            icon={<WhatsAppIcon />}
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          />
          <SocialButton
            label="Messenger"
            color="bg-[#0084FF] hover:bg-[#0073E6]"
            icon={<MessengerIcon />}
            href={`fb-messenger://share/?link=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&app_id=0`}
          />
          <SocialButton
            label="Instagram"
            color="bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90"
            icon={<InstagramIcon />}
            onClick={handleCopy}
            tooltip="Texte copié — collez dans Instagram"
          />
          <SocialButton
            label="SMS"
            color="bg-[#34C759] hover:bg-[#2DB84D]"
            icon={<SmsIcon />}
            href={`sms:?body=${encodeURIComponent(shareText)}`}
            mobileOnly
          />
        </div>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Social share button
// ---------------------------------------------------------------------------

function SocialButton({
  label,
  color,
  icon,
  href,
  onClick,
  tooltip,
  mobileOnly,
}: {
  label: string
  color: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  tooltip?: string
  mobileOnly?: boolean
}) {
  const className = `flex flex-1 min-w-[70px] items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium text-white transition-all ${color} ${
    mobileOnly ? 'sm:hidden' : ''
  }`

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={tooltip}
      >
        {icon}
        {label}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.()
        if (tooltip) toast.info(tooltip)
      }}
      className={className}
    >
      {icon}
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inline SVG icons (avoid extra dependencies)
// ---------------------------------------------------------------------------

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function SmsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
