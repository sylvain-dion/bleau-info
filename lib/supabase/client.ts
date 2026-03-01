import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser (Client Components).
 *
 * This uses `@supabase/ssr` which stores the session in HttpOnly cookies
 * rather than localStorage, improving security.
 *
 * @throws if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
