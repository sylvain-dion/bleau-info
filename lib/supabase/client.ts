import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

/** Singleton browser client — avoids creating multiple instances. */
let cachedClient: BrowserClient | null = null

/**
 * Creates a Supabase client for use in browser (Client Components).
 *
 * This uses `@supabase/ssr` which stores the session in HttpOnly cookies
 * rather than localStorage, improving security.
 *
 * Returns `null` if environment variables are missing (instead of throwing).
 * Callers must handle the `null` case — typically by skipping auth operations.
 */
export function createClient(): BrowserClient | null {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — auth disabled'
      )
    }
    return null
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return cachedClient
}
