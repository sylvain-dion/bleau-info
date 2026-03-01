import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Protected route layout.
 *
 * Server-side check: verifies the user is authenticated via `getUser()`.
 * If not, redirects to /login. This provides defense-in-depth on top of
 * the middleware session refresh.
 *
 * Pages inside `app/(auth)/` will only render for authenticated users.
 * No pages exist here yet — this is infrastructure for Stories 3.2+.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let isAuthenticated = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {
    // Supabase not configured — allow through in dev
    isAuthenticated = false
  }

  if (!isAuthenticated) {
    redirect('/login')
  }

  return <>{children}</>
}
