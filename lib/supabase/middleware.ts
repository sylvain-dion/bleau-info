import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Refreshes the Supabase session on every request via middleware.
 *
 * Uses `getUser()` (not `getSession()`) to server-validate the JWT.
 * This ensures expired tokens are refreshed and invalid tokens are rejected.
 *
 * Returns `NextResponse.next()` if env vars are missing so the app
 * continues to work without Supabase (development fallback).
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Early return if Supabase is not configured — app still works without auth
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Do NOT use getSession() here. getUser() sends a request to
  // the Supabase Auth server to validate the JWT, while getSession() only
  // reads the JWT from the cookie without validation.
  await supabase.auth.getUser()

  return supabaseResponse
}
