'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogIn, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'

/**
 * User menu for the header.
 *
 * States:
 * - Loading: skeleton circle
 * - Not authenticated: login icon (Link to /login)
 * - Authenticated: avatar/initials + dropdown with sign-out
 */
export function UserMenu() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div
        className="h-8 w-8 animate-pulse rounded-full bg-muted"
        aria-label="Chargement du profil"
      />
    )
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Se connecter"
      >
        <LogIn className="h-5 w-5" />
      </Link>
    )
  }

  return <AuthenticatedMenu />
}

function AuthenticatedMenu() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  async function handleSignOut() {
    setIsOpen(false)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      // Sign-out failed — user will still appear logged in
    }
  }

  const email = user?.email ?? ''
  const initials = getInitials(email, user?.user_metadata?.full_name)
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        aria-label="Menu utilisateur"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {/* User info */}
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name ?? 'Utilisateur'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Extracts initials from name or email */
function getInitials(email: string, fullName?: string): string {
  if (fullName) {
    const parts = fullName.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return (parts[0]?.[0] ?? '?').toUpperCase()
  }

  // Fallback: first letter of email
  return (email[0] ?? '?').toUpperCase()
}
