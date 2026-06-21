import { NextRequest, NextResponse } from 'next/server'

/**
 * Access levels:
 *  Guest      — public pages (no session required)
 *  Player     — /predictions + any page needing a session cookie
 *  Admin      — /admin/* (checked server-side in admin layout too)
 */

const PUBLIC_PATHS = [
  // Public marketing / info pages
  '/', '/standings', '/highlights', '/discussions', '/leaderboard',
  '/schedule', '/tournament',
  '/disclaimer', '/privacy',
  // Auth flow
  '/auth/login', '/auth/register', '/auth/verify', '/auth/forgot-password', '/auth/reset-password',
  // Public APIs
  '/api/auth/login', '/api/auth/register', '/api/auth/verify',
  '/api/auth/forgot-password', '/api/auth/reset-password',
  '/api/admin/quick-action',          // one-click approve/deny from email (token-secured)
  '/api/debug', '/api/sync-scores', '/api/polls', '/api/scores', '/api/bonus',
  '/api/tournament',                               // public schedule/teams/matches data
  // Dev helpers
  '/test',
  // Images, flags etc are handled by static matcher below
]

// Pages that require a session (players + admin)
// Everything not in PUBLIC_PATHS above falls here

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow all static assets regardless
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|txt)$/)
  ) return NextResponse.next()

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) return NextResponse.next()

  // /predictions is accessible to guests (shows join CTA) — handled in page.tsx
  if (pathname.startsWith('/predictions')) return NextResponse.next()

  // Everything else requires a session
  const session = req.cookies.get('session')?.value
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // /admin/* role check is done server-side in admin/layout.tsx
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
