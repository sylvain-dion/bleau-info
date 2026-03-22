'use client'

import { Eye } from 'lucide-react'

interface PresenceBadgeProps {
  reviewerName: string
}

/**
 * Badge showing that another moderator is reviewing an item.
 *
 * Displayed on queue items that are currently locked by someone.
 */
export function PresenceBadge({ reviewerName }: PresenceBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
      <Eye className="h-3 w-3" />
      <span className="truncate">En revue par {reviewerName}</span>
    </div>
  )
}
