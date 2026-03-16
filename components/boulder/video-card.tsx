'use client'

import { VideoEmbed } from './video-embed'
import { User, Video } from 'lucide-react'

interface VideoCardProps {
  videoUrl: string
  climberName?: string | null
  videographerName?: string | null
}

/**
 * Single video card: responsive embed + optional credits below.
 *
 * Displays climber and/or videographer names when provided.
 */
export function VideoCard({ videoUrl, climberName, videographerName }: VideoCardProps) {
  const hasCredits = climberName || videographerName

  return (
    <div className="min-w-[300px] max-w-[360px] shrink-0 snap-start">
      <VideoEmbed videoUrl={videoUrl} />

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
