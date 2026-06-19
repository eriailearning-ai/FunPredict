'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

// null = guest | role:'player' = logged-in player | role:'admin' = admin/superuser
type NavUser = { name: string; nickname?: string; role: string } | null

interface Props {
  user: NavUser
}

export default function Navbar({ user }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [wc2026Open, setWc2026Open] = useState(false)

  const isActive = (href: string) => pathname?.startsWith(href)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }

  const displayName = user?.nickname || user?.name || ''

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 mr-2">
            <img
              src="/images/logo/cropped-worldcup-eagle-logo-1.png"
              alt="WorldCup FIFAFun 2026"
              className="h-12 w-auto"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1 text-sm font-medium">
            {/* FIFA World Cup 2026 dropdown */}
            <div className="relative group"
              onMouseEnter={() => setWc2026Open(true)}
              onMouseLeave={() => setWc2026Open(false)}>
              <button className={`px-3 py-2 rounded-md hover:text-red-700 transition-colors ${isActive('/tournament') || isActive('/schedule') ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
                FIFA World Cup 2026 ▾
              </button>
              {wc2026Open && (
                <div className="absolute top-full left-0 bg-red-700 text-white rounded-b-lg shadow-xl py-1 w-44 z-50">
                  {[
                    { label: 'Matches', href: '/tournament' },
                    { label: 'Venues', href: '/tournament/venues' },
                    { label: 'Groups', href: '/tournament/groups' },
                    { label: 'Teams', href: '/tournament/teams' },
                    { label: 'Full Schedule', href: '/schedule' },
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
              className={`px-3 py-2 rounded-md hover:text-red-700 transition-colors font-semibold ${isActive('/predictions') ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
              Go FIFAFun
            </Link>
          </div>

          {/* Auth / user */}
          <div className="hidden lg:flex items-center gap-2 text-sm ml-auto">
            {user ? (
              <>
                <span className="text-gray-600 font-medium text-xs">{displayName}</span>
                {(user.role === 'admin') && (
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
            <Link href="/standings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Standings</Link>
            <Link href="/highlights" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Highlights</Link>
            <Link href="/predictions" className="block px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-md" onClick={() => setMenuOpen(false)}>Go FIFAFun</Link>
            <Link href="/schedule" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMenuOpen(false)}>Full Schedule</Link>
            <div className="border-t border-gray-100 pt-2 mt-2">
              {user ? (
                <>
                  <p className="px-4 py-2 text-sm text-gray-500">{displayName}</p>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-4 py-2 text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link href="/auth/register" className="block px-4 py-2 text-sm text-blue-700 font-semibold" onClick={() => setMenuOpen(false)}>Register free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
