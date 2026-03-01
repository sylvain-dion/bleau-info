'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { User, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { profileSchema } from '@/lib/validations/profile'
import { GRADE_SCALE, formatGrade } from '@/lib/grades'
import { ProfileStats } from '@/components/profile/profile-stats'
import { AvatarPicker } from '@/components/profile/avatar-picker'
import { DataExportButton } from '@/components/profile/data-export-button'
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog'
import type { ProfileFormData } from '@/lib/validations/profile'
import type { AvatarPresetKey } from '@/lib/validations/profile'

export default function ProfilPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      maxGrade: '',
      avatarPreset: '',
    },
  })

  // Populate form with existing user_metadata once user loads
  useEffect(() => {
    if (user) {
      reset({
        displayName: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? '',
        maxGrade: user.user_metadata?.max_grade ?? '',
        avatarPreset: user.user_metadata?.avatar_preset ?? '',
      })
    }
  }, [user, reset])

  async function onSubmit(data: ProfileFormData) {
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: data.displayName,
          max_grade: data.maxGrade || null,
          avatar_preset: data.avatarPreset || null,
        },
      })

      if (error) {
        setSaveError(error.message)
      } else {
        setSaveSuccess(true)
        // Refresh auth state so UserMenu picks up changes
        router.refresh()
        // Auto-dismiss success message
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setSaveError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) {
    return null // (auth) layout will redirect
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <ProfileStats
          memberSince={user.created_at ?? new Date().toISOString()}
          tickCount={0}
          contributionPoints={0}
        />
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Informations</h2>

          {/* Display name */}
          <div className="mb-4">
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-foreground">
              Nom d&apos;affichage
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              placeholder="Votre nom ou pseudo"
              className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.displayName ? 'border-destructive' : 'border-input'
              }`}
              {...register('displayName')}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          {/* Max grade */}
          <div>
            <label htmlFor="maxGrade" className="mb-1.5 block text-sm font-medium text-foreground">
              Niveau max à vue
            </label>
            <select
              id="maxGrade"
              className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.maxGrade ? 'border-destructive' : 'border-input'
              }`}
              {...register('maxGrade')}
            >
              <option value="">Non défini</option>
              {GRADE_SCALE.map((grade) => (
                <option key={grade} value={grade}>
                  {formatGrade(grade)}
                </option>
              ))}
            </select>
            {errors.maxGrade && (
              <p className="mt-1 text-xs text-destructive">{errors.maxGrade.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Utilisé pour calibrer les suggestions de blocs
            </p>
          </div>
        </div>

        {/* Avatar picker */}
        <div className="rounded-xl border border-border bg-card p-5">
          <Controller
            name="avatarPreset"
            control={control}
            render={({ field }) => (
              <AvatarPicker
                value={field.value}
                onChange={(key: AvatarPresetKey) => field.onChange(key)}
              />
            )}
          />
          {errors.avatarPreset && (
            <p className="mt-2 text-xs text-destructive">{errors.avatarPreset.message}</p>
          )}
        </div>

        {/* Feedback messages */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>Profil mis à jour avec succès</p>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{saveError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 min-touch"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      {/* GDPR - Données personnelles */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Données personnelles</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Conformément au RGPD, vous pouvez télécharger ou supprimer vos données à tout moment.
        </p>
        <div className="space-y-3">
          <DataExportButton />
          <DeleteAccountDialog />
        </div>
      </div>
    </div>
  )
}
