'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { usePresenceStore } from '@/stores/presence-store'

/**
 * Shows the number of active moderators in the session.
 *
 * Displayed in the moderation page header.
 */
export function ActiveModerators() {
  const count = usePresenceStore((s) => s.moderators.length)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted || count === 0) return null

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Users className="h-3 w-3" />
      <span>
        {count} modérateur{count > 1 ? 's' : ''} actif{count > 1 ? 's' : ''}
      </span>
    </div>
  )
}
