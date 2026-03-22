'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users, ShieldOff, ShieldCheck, Search } from 'lucide-react'
import { useBanStore } from '@/stores/ban-store'
import { BanUserDialog } from '@/components/moderation/ban-user-dialog'

/** Mock user list for development */
const MOCK_USERS = [
  { id: 'user-1', name: 'Jean Grimpeur', trustScore: 45, role: null },
  { id: 'user-2', name: 'Marie Escalade', trustScore: 120, role: null },
  { id: 'user-3', name: 'Pierre Bloc', trustScore: 10, role: null },
  { id: 'user-4', name: 'Sophie Rocher', trustScore: 200, role: null },
  { id: 'user-5', name: 'Luc Paroi', trustScore: 0, role: null },
  { id: 'user-6', name: 'Mod Fontainebleau', trustScore: 80, role: 'moderator' },
]

/**
 * User management page — `/admin/users`
 *
 * Moderators can view users, ban/suspend them,
 * and lift restrictions.
 */
export default function UsersPage() {
  const bans = useBanStore((s) => s.bans)
  const isUserRestricted = useBanStore((s) => s.isUserRestricted)
  const [search, setSearch] = useState('')
  const [banTarget, setBanTarget] = useState<{
    userId: string
    displayName: string
    isRestricted: boolean
  } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return MOCK_USERS
    const q = search.toLowerCase()
    return MOCK_USERS.filter((u) => u.name.toLowerCase().includes(q))
  }, [search])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
            <p className="text-xs text-muted-foreground">
              Gestion des droits de contribution
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filteredUsers.map((user) => {
          const restriction = mounted
            ? isUserRestricted(user.id)
            : { restricted: false, type: null, reason: null, until: null }

          return (
            <div
              key={user.id}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                restriction.restricted
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  {user.role && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                      {user.role}
                    </span>
                  )}
                  {restriction.restricted && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      {restriction.type === 'banned' ? 'Banni' : 'Suspendu'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Score : {user.trustScore} pts
                  {restriction.restricted && restriction.reason && (
                    <span className="ml-2 text-destructive">
                      — {restriction.reason}
                    </span>
                  )}
                  {restriction.until && (
                    <span className="ml-1 text-muted-foreground">
                      (jusqu&apos;au{' '}
                      {new Date(restriction.until).toLocaleDateString('fr-FR')})
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBanTarget({
                    userId: user.id,
                    displayName: user.name,
                    isRestricted: restriction.restricted,
                  })
                }
                className={`ml-3 shrink-0 rounded-md p-2 transition-colors ${
                  restriction.restricted
                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    : 'text-destructive hover:bg-destructive/10'
                }`}
                aria-label={
                  restriction.restricted
                    ? `Réhabiliter ${user.name}`
                    : `Suspendre ${user.name}`
                }
              >
                {restriction.restricted ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Active restrictions summary */}
      {mounted && bans.length > 0 && (
        <div className="mt-6 rounded-lg bg-destructive/5 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-destructive">
            {bans.length} restriction{bans.length > 1 ? 's' : ''} active
            {bans.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Ban dialog */}
      {banTarget && (
        <BanUserDialog
          userId={banTarget.userId}
          displayName={banTarget.displayName}
          isRestricted={banTarget.isRestricted}
          onClose={() => setBanTarget(null)}
          onComplete={() => setBanTarget(null)}
        />
      )}
    </div>
  )
}
