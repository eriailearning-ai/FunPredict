import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const NAV = [
  { group: 'Overview', items: [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
  ]},
  { group: 'Players', items: [
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/leagues', label: 'Leagues', icon: '🏆' },
    { href: '/admin/audit', label: 'Audit Log', icon: '📋' },
  ]},
  { group: 'Tournament', items: [
    { href: '/admin/matches', label: 'Matches', icon: '📅' },
    { href: '/admin/teams', label: 'Teams', icon: '🚩' },
    { href: '/admin/sync', label: 'Score Sync', icon: '🔄' },
  ]},
  { group: 'Engagement', items: [
    { href: '/admin/bonus', label: 'Bonus Questions', icon: '❓' },
    { href: '/admin/polls', label: 'Audience Polls', icon: '🗳️' },
  ]},
  { group: 'System', items: [
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]},
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user || (user.role !== 'admin' && user.role !== 'superplayer')) redirect('/auth/login')

  return (
    <div className="min-h-screen flex" style={{ background: '#f4f6fb' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: '#1e2d40', minHeight: '100vh' }}>
        {/* Logo area */}
        <div className="px-4 py-5 border-b border-blue-900">
          <Link href="/admin" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/eagle-logo.png" alt="Admin" className="h-8 w-auto" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">FIFAFun</p>
              <p className="text-blue-400 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <p className="px-4 py-1 text-xs font-bold text-blue-500 uppercase tracking-widest">{group}</p>
              {items.map(({ href, label, icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-900 hover:text-white transition-colors">
                  <span className="text-base w-5">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="px-4 py-4 border-t border-blue-900 space-y-2">
          <Link href="/predictions" className="flex items-center gap-2 text-xs text-blue-400 hover:text-white">
            <span>👁</span> Player view
          </Link>
          <Link href="/" className="flex items-center gap-2 text-xs text-blue-400 hover:text-white">
            <span>🏠</span> Public site
          </Link>
          <div className="pt-2 border-t border-blue-900">
            <p className="text-xs text-blue-500 truncate">{(user as any).nickname || user.name}</p>
            <form action="/api/auth/logout" method="POST">
              <button className="text-xs text-red-400 hover:text-red-300 mt-1">Logout</button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm text-gray-500">
            WorldCup FIFAFun 2026 — Admin
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/predictions" className="text-blue-600 hover:underline text-xs">← Player view</Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">{(user as any).nickname || user.name}</span>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
