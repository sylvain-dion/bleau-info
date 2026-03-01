import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * DELETE /api/auth/delete-account
 *
 * GDPR account deletion (FR-36). Authenticates the requesting user via
 * the session cookie, then hard-deletes their account using the Supabase
 * Admin API (requires SUPABASE_SERVICE_ROLE_KEY).
 *
 * Future stories will add database cleanup (anonymize contributions, etc.)
 * before the auth deletion.
 */
export async function DELETE() {
  try {
    // 1. Verify the user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Check for service role key (required for admin deletion)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante. Contactez l\'administrateur.' },
        { status: 500 }
      )
    }

    // 3. Delete the user via Admin API
    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('[delete-account] Failed to delete user:', deleteError.message)
      return NextResponse.json(
        { error: 'Impossible de supprimer le compte. Veuillez réessayer.' },
        { status: 500 }
      )
    }

    // 4. Sign out the current session (cookie cleanup)
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[delete-account] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    )
  }
}
