/**
 * On-demand ISR revalidation webhook.
 *
 * Called by Supabase (or any external system) when boulder/sector
 * data changes. Revalidates the affected paths so the next visitor
 * gets fresh content without waiting for the hourly timer.
 *
 * Usage:
 *   POST /api/revalidate
 *   Headers: { Authorization: Bearer <REVALIDATION_SECRET> }
 *   Body:    { "path": "/blocs/cul-de-chien-1" }
 *        or  { "paths": ["/blocs/cul-de-chien-1", "/secteurs/cul-de-chien"] }
 */

import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

interface RevalidateBody {
  path?: string
  paths?: string[]
}

export async function POST(request: NextRequest) {
  // Verify secret token
  const secret = process.env.REVALIDATION_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = (await request.json()) as RevalidateBody
    const pathsToRevalidate: string[] = []

    if (body.path) {
      pathsToRevalidate.push(body.path)
    }

    if (body.paths && Array.isArray(body.paths)) {
      pathsToRevalidate.push(...body.paths)
    }

    if (pathsToRevalidate.length === 0) {
      return NextResponse.json(
        { error: 'Missing "path" or "paths" in request body' },
        { status: 400 }
      )
    }

    // Revalidate each path
    const results: Array<{ path: string; revalidated: boolean }> = []

    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path)
        results.push({ path, revalidated: true })
      } catch {
        results.push({ path, revalidated: false })
      }
    }

    return NextResponse.json({
      revalidated: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
