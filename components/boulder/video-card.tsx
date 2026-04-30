'use client'

import { User, Video } from 'lucide-react'
import { VideoEmbed } from './video-embed'
import { SpoilerVeil } from './spoiler-veil'
import { useSpoilerPreferenceStore } from '@/stores/spoiler-preference-store'

interface VideoCardProps {
  videoUrl: string
  climberName?: string | null
  videographerName?: string | null
  /** Story 15.1 — uploader flagged the video as showing the beta. */
  containsBeta?: boolean
  /**
   * Boulder this video belongs to. Used by the spoiler-preference store
   * so a per-boulder "Tout afficher" override can reveal it. Optional —
   * cards rendered outside a boulder context just fall back to per-video
   * reveal state keyed on the URL.
   */
  boulderId?: string
}

/**
 * Single video card: responsive embed + optional credits below.
 *
 * Displays climber and/or videographer names when provided.
 * When the video is flagged as beta, hides it behind a spoiler veil
 * until the user explicitly reveals it (Story 15.1).
 */
export function VideoCard({
  videoUrl,
  climberName,
  videographerName,
  containsBeta,
  boulderId,
}: VideoCardProps) {
  const isVideoRevealed = useSpoilerPreferenceStore((s) => s.isVideoRevealed)
  const revealVideo = useSpoilerPreferenceStore((s) => s.revealVideo)

  const hasCredits = climberName || videographerName
  const veilHidden =
    !!containsBeta && !isVideoRevealed(videoUrl, boulderId ?? '')

  return (
    <div className="min-w-[300px] max-w-[360px] shrink-0 snap-start">
      <SpoilerVeil
        hidden={veilHidden}
        kind="video"
        onReveal={() => revealVideo(videoUrl)}
      >
        <VideoEmbed videoUrl={videoUrl} />
      </SpoilerVeil>

      {hasCredits && (
        <div className="mt-1.5 space-y-0.5 px-0.5">
          {climberName && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{climberName}</span>
            </p>
          )}
          {videographerName && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Video className="h-3 w-3 shrink-0" />
              <span className="truncate">{videographerName}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
