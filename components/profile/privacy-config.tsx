'use client'

import Link from 'next/link'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import { usePrivacyStore } from '@/stores/privacy-store'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Privacy settings toggles for the profile page.
 */
export function PrivacyConfig() {
  const settings = usePrivacyStore((s) => s.settings)
  const updateSettings = usePrivacyStore((s) => s.updateSettings)
  const { user } = useAuthStore()

  return (
    <div className="space-y-2">
      <Toggle
        label="Profil public"
        description="Votre profil est visible par les autres grimpeurs"
        enabled={settings.profilePublic}
        onChange={(v) => updateSettings({ profilePublic: v })}
      />
      <Toggle
        label="Statistiques publiques"
        description="Nombre de croix, cotation max, secteurs visités"
        enabled={settings.statsPublic}
        onChange={(v) => updateSettings({ statsPublic: v })}
        disabled={!settings.profilePublic}
      />
      <Toggle
        label="Ascensions publiques"
        description="Dernières ascensions visibles sur votre profil"
        enabled={settings.ascensionsPublic}
        onChange={(v) => updateSettings({ ascensionsPublic: v })}
        disabled={!settings.profilePublic}
      />
      <Toggle
        label="Carnet public"
        description="Carnet de croix complet accessible par tous"
        enabled={settings.logbookPublic}
        onChange={(v) => updateSettings({ logbookPublic: v })}
        disabled={!settings.profilePublic}
      />
      <Toggle
        label="Apparaître dans les feeds"
        description="Votre activité est nominative dans les fils de secteur"
        enabled={settings.showInFeed}
        onChange={(v) => updateSettings({ showInFeed: v })}
      />

      {/* Preview link */}
      {user && settings.profilePublic && (
        <Link
          href={`/grimpeurs/${user.id}`}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Eye className="h-3 w-3" />
          Voir mon profil public
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}

      {!settings.profilePublic && (
        <p className="mt-2 text-xs text-muted-foreground">
          Votre profil est privé. Seuls votre nom et avatar sont visibles.
        </p>
      )}
    </div>
  )
}

function Toggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50'
      } ${enabled ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}
    >
      <div className="flex items-center gap-2">
        {enabled ? (
          <Eye className="h-3.5 w-3.5 text-primary" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={`h-4 w-7 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-3' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  )
}
