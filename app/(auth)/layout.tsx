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
  const supabase = await createClient()

  // If Supabase is not configured (missing env vars), skip auth check in dev
  if (!supabase) {
    if (process.env.NODE_ENV !== 'development') {
      redirect('/login')
    }
    return <>{children}</>
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
