'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'

/**
 * Headless component that synchronizes the Supabase auth state
 * with the Zustand auth store.
 *
 * - On mount: calls `getUser()` to check the current session
 * - Subscribes to `onAuthStateChange` for real-time session updates
 * - Unsubscribes on unmount
 *
 * Mount this once in the root layout.
 */
export function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>

    try {
      supabase = createClient()
    } catch {
      // Supabase not configured — mark as done loading with no user
      setLoading(false)
      return
    }

    // Check current session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return null
}
