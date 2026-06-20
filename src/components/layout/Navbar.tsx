'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

// null = guest | role:'player' = logged-in player | role:'admin' = admin/superuser
type NavUser = { name: string; nickname?: string; role: string } | null

interface Props {
  user: NavUser
  /** optional visit stats shown to admins */
  visitStats?: { total: number; unique: number } | null
}

export default function Navbar({ user, visitStats }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [wc2026Open, setWc2026Open] = useState(false)

  const isActive = (href: string) => pathname?.startsWith(href)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }

  const displayName = user?.nickname || user?.name || ''
  const isAdmin = user?.role === 'admin'

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center h-14 gap-3">

          {/* Space reserved for the logo overlay that sits in the SiteBanner (desktop) */}
          <div className="flex-shrink-0 w-[200px] hidden lg:block" />

          {/* Brand text — hidden on all viewports (logo in banner serves as branding) */}

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 text-sm font-medium">
            {/* FIFA World Cup 2026 dropdown */}
            <div className="relative"
              onMouseEnter={() => setWc2026Open(true)}
              onMouseLeave={() => setWc2026Open(false)}>
              <button className={`px-3 py-2 rounded-md hover:text-red-700 transition-colors ${isActive('/tournament') || isActive('/schedule') ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
                FIFA WC 2026 ▾
              </button>
              {wc2026Open && (
                <div className="absolute top-full left-0 bg-red-700 text-white rounded-b-lg shadow-xl py-1 w-44 z-50">
                  {[
                    { label: 'Matches', href: '/tournament' },
                    { label: 'Teams', href: '/tournament/teams' },
                    { label: 'Groups', href: '/tournament/groups' },
                    { label: 'Venues', href: '/tournament/venues' },
                    { label: 'Full Schedule', href: '/schedule' },
                    { label: 'Power Rankings', href: '/tournament/power-rankings' },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href}
                      className="block px-4 py-2 text-sm hover:bg-red-800 transition-colors">
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/standings"
              className={`px-3 py-2 rounded-md hover:text-red-700 transition-colors ${isActive('/standings') ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
              Standings
            </Link>
            <Link href="/highlights"
              className={`px-3 py-2 rounded-md hover:text-red-700 transition-colors ${isActive('/highlights') ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
              Highlights
            </Link>
            <Link href="/predictions"
              className="px-3 py-2 rounded-md font-bold transition-colors"
              style={{ color: isActive('/predictions') ? '#8b1c2c' : '#1e3a5f' }}>
              Go FIFAFun 2⚽26
            </Link>
          </div>

          {/* Auth / user — right side */}
          <div className="hidden lg:flex items-center gap-2 text-sm ml-auto">
            {/* Admin visit stats */}
            {isAdmin && visitStats && (
              <span className="text-xs text-gray-400 font-medium mr-1">
                {visitStats.total.toLocaleString()} visits · {visitStats.unique.toLocaleString()} unique
              </span>
            )}
            {user ? (
              <>
                <Link href="/profile" className="text-gray-600 font-medium text-xs hover:text-blue-700">{displayName}</Link>
                {isAdmin && (
                  <Link href="/admin" className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded font-semibold">⚙ Admin</Link>
                )}
                {user.role === 'superplayer' && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded font-semibold">⭐ SuperPlayer</span>
                )}
                <button onClick={logout} className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-md">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-900 font-medium">Login</Link>
                <span className="text-gray-300">|</span>
                <Link href="/auth/register" className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg" style={{ background: '#8b1c2c' }}>Register</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden ml-auto p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-current transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-1">
            <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/tournament" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Matches</Link>
            <Link href="/tournament/teams" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Teams</Link>
            <Link href="/standings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Standings</Link>
            <Link href="/tournament/power-rankings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Power Rankings</Link>
            <Link href="/highlights" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Highlights</Link>
            <Link href="/predictions" className="block px-4 py-2 text-sm font-bold hover:bg-red-50 rounded-md" style={{ color: '#8b1c2c' }} onClick={() => setMenuOpen(false)}>Go FIFAFun 2⚽26</Link>
            <Link href="/schedule" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Full Schedule</Link>
            {/* Mobile visit stats for admin */}
            {isAdmin && visitStats && (
              <p className="px-4 py-1 text-xs text-gray-400">
                {visitStats.total.toLocaleString()} visits · {visitStats.unique.toLocaleString()} unique
              </p>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2">
              {user ? (
                <>
                  <Link href="/profile" className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>👤 {displayName}</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-4 py-2 text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link href="/auth/register" className="block px-4 py-2 text-sm font-semibold" style={{ color: '#8b1c2c' }} onClick={() => setMenuOpen(false)}>Register free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
