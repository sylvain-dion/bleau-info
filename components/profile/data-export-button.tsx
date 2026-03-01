'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Exports all personal user data as a JSON file (GDPR data portability).
 *
 * Gathers data from the Zustand auth store (Supabase user object)
 * and triggers a browser download. Currently includes auth profile +
 * user_metadata. Future stories will add ticks, contributions, etc.
 */
export function DataExportButton() {
  const { user } = useAuthStore()
  const [isExporting, setIsExporting] = useState(false)

  function handleExport() {
    if (!user) return

    setIsExporting(true)

    try {
      const exportData = {
        _meta: {
          exported_at: new Date().toISOString(),
          format_version: '1.0',
          application: 'Bleau.info',
        },
        profile: {
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name ?? null,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_preset: user.user_metadata?.avatar_preset ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          max_grade: user.user_metadata?.max_grade ?? null,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
        },
        // Future stories will populate these sections:
        ascensions: [],
        contributions: [],
        lists: [],
      }

      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `bleau-info-donnees-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || !user}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 min-touch"
    >
      <Download className="h-4 w-4" />
      {isExporting ? 'Préparation...' : 'Télécharger mes données'}
    </button>
  )
}
