'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Mountain, Activity, Megaphone, Route, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { useAuthStore } from '@/stores/auth-store'
import { todayISO } from '@/lib/validations/climbing-call'

interface NavLink {
  href: string
  label: string
  icon: typeof Mountain
  /** Optional badge count to render to the right of the label. */
  badge?: number
}

const NAV_DEFINITION: readonly { href: string; label: string; icon: typeof Mountain }[] = [
  { href: '/secteurs', label: 'Secteurs', icon: Mountain },
  { href: '/feed', label: 'Feed', icon: Activity },
  { href: '/grimpons', label: 'Grimpons', icon: Megaphone },
  { href: '/parcours', label: 'Parcours', icon: Route },
] as const

interface MainNavContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  links: readonly NavLink[]
  invitationCount: number
}

const MainNavContext = createContext<MainNavContextValue | null>(null)

function useMainNav(): MainNavContextValue {
  const ctx = useContext(MainNavContext)
  if (!ctx) {
    throw new Error('MainNav slots must render inside <MainNavProvider>')
  }
  return ctx
}

/**
 * Provider that owns the shared nav state (open sheet + active
 * invitation count) so both header slots stay in sync without
 * the layout having to thread props through.
 */
export function MainNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const calls = useClimbingCallStore((s) => s.calls)
  const responses = useClimbingCallStore((s) => s.responses)
  const { user } = useAuthStore()

  // Close the sheet when the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Escape closes the sheet.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const invitationCount = useMemo(() => {
    const cutoff = todayISO()
    return calls.filter((c) => {
      if (c.plannedDate < cutoff) return false
      if (user && c.hostUserId === user.id) return false
      if (
        user &&
        responses.some((r) => r.callId === c.id && r.userId === user.id)
      ) {
        return false
      }
      return true
    }).length
  }, [calls, responses, user])

  const links = useMemo<readonly NavLink[]>(
    () =>
      NAV_DEFINITION.map((link) =>
        link.href === '/grimpons'
          ? { ...link, badge: invitationCount }
          : link,
      ),
    [invitationCount],
  )

  return (
    <MainNavContext.Provider value={{ open, setOpen, links, invitationCount }}>
      {children}
    </MainNavContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Slot 1 — desktop link bar (lives next to the logo, hidden on mobile)
// ---------------------------------------------------------------------------

export function MainNavLinks() {
  const { links } = useMainNav()
  const pathname = usePathname()

  return (
    <nav
      className="hidden md:flex md:items-center md:gap-1"
      aria-label="Navigation principale"
      data-testid="main-nav-desktop"
    >
      {links.map((link) => {
        const Icon = link.icon
        const active =
          pathname === link.href || pathname?.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            data-testid={`main-nav-link-${link.label.toLowerCase()}`}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
            {!!link.badge && link.badge > 0 && (
              <span
                className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
                data-testid={`main-nav-badge-${link.label.toLowerCase()}`}
              >
                {link.badge > 99 ? '99+' : link.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Slot 2 — mobile burger (lives in the right-side action cluster, hidden on desktop)
// ---------------------------------------------------------------------------

export function MainNavMobileToggle() {
  const { open, setOpen, invitationCount } = useMainNav()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        aria-label="Ouvrir le menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="main-nav-burger"
      >
        <Menu className="h-5 w-5" />
        {invitationCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
            data-testid="main-nav-burger-badge"
            aria-label={`${invitationCount} invitations`}
          >
            {invitationCount > 9 ? '9+' : invitationCount}
          </span>
        )}
      </button>

      {open && <MobileSheet />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Mobile sheet — slides in from the right
// ---------------------------------------------------------------------------

function MobileSheet() {
  const { setOpen, links } = useMainNav()
  const pathname = usePathname()

  return (
    <div
      className="fixed inset-0 z-[60] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      data-testid="main-nav-sheet"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Fermer le menu"
        data-testid="main-nav-sheet-backdrop"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            data-testid="main-nav-sheet-close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 p-3"
          aria-label="Navigation"
        >
          {links.map((link) => {
            const Icon = link.icon
            const active =
              pathname === link.href || pathname?.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                data-testid={`main-nav-sheet-link-${link.label.toLowerCase()}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {link.label}
                </span>
                {!!link.badge && link.badge > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-primary-foreground"
                    data-testid={`main-nav-sheet-badge-${link.label.toLowerCase()}`}
                  >
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
