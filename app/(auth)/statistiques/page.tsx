import { redirect } from 'next/navigation'

/**
 * Story 4.6 fold: the dedicated `/statistiques` page is now the
 * "Mes statistiques" tab inside the `/profil/mes-ascensions` hub.
 *
 * We keep this route as a permanent redirect so existing bookmarks,
 * notifications, and intra-app links continue to work.
 */
export default function StatistiquesRedirect() {
  redirect('/profil/mes-ascensions')
}
