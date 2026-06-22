import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']

export default async function LeaderboardPage() {
  const session = await getSession().catch(() => null)

  const isAdmin       = session?.role === 'admin'
  const isSuperPlayer = session?.role === 'superplayer'
  const seeAll        = isAdmin || isSuperPlayer
  const isLoggedIn    = !!session
  const userLeague    = (session as any)?.league ?? ''

  const sidebarData = await getSidebarData({
    userLeague: isLoggedIn ? userLeague : '',
    isAdmin,
  })

  const allUsers = await prisma.user.findMany({
    where: { status: 'approved', role: { in: ['player', 'superplayer'] } },
    include: { predictions: { select: { points: true } } },
  }).catch(() => [])

  type Row = {
    id: string; display: string; league: string
    cheeringFrom: string; total: number; played: number; exact: number
  }

  const fullBoard: Row[] = allUsers.map(u => ({
    id:           u.id,
    display:      (u as any).nickname || (u as any).username || u.name,
    league:       (u as any).league   ?? '',
    cheeringFrom: (u as any).cheeringFrom ?? '',
    total:        u.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
    played:       u.predictions.filter(p => p.points !== null).length,
    exact:        u.predictions.filter(p => p.points === 5).length,
  })).sort((a, b) => b.total - a.total || a.display.localeCompare(b.display))

  // Admin/superplayer see all leagues; logged-in player sees own league; guest sees all (with teaser)
  const board = (!seeAll && isLoggedIn && userLeague) ? fullBoard.filter(p => p.league === userLeague) : fullBoard
  const visibleLeagues = seeAll ? LEAGUES : (isLoggedIn && userLeague) ? [userLeague] : LEAGUES

  const currentUserId = session?.id

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Top Performers</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-5">

            {/* Page title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Top Performers</h1>
              <p className="text-sm text-gray-500 mt-1">
                {seeAll
                  ? 'All players across all leagues.'
                  : (isLoggedIn && userLeague)
                    ? `Showing ${userLeague} — your league.`
                    : 'Log in to see your full league standings.'}
              </p>
            </div>

            {/* Guest: show #1 from each league as a public teaser */}
            {!session && (
              <div className="space-y-3">
                {(['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners'] as const).map(league => {
                  const leader = fullBoard.find(p => p.league === league)
                  return (
                    <div key={league} className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-3">
                      <span className="text-2xl">🥇</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{leader ? leader.display : '—'}</p>
                        <p className="text-xs text-gray-400">{league}</p>
                      </div>
                      <span className="text-sm font-black" style={{ color: '#1e3a5f' }}>
                        {leader ? `${leader.total} pts` : '0 pts'}
                      </span>
                    </div>
                  )
                })}
                <div className="bg-white rounded-xl shadow-sm p-5 text-center">
                  <p className="text-sm text-gray-500 mb-3">Log in to see your full league standings.</p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/auth/login"
                      className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
                      style={{ background: '#1e3a5f' }}>Log in</Link>
                    <Link href="/auth/register"
                      className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
                      style={{ background: '#8b1c2c' }}>Register free</Link>
                  </div>
                </div>
              </div>
            )}

            {board.length === 0 && session ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-500 text-sm">No players in your league yet.</p>
              </div>
            ) : board.length > 0 && (
              <>
                {/* Overall table (admin sees all leagues; player sees own league) */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-800">
                        {seeAll ? 'All Players' : (userLeague || 'Rankings')}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">{board.length} player{board.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Admin view</span>
                    )}
                    {isSuperPlayer && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">⭐ SuperPlayer view</span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: '#1e3a5f' }}>
                        <tr>
                          <th className="px-4 py-3 text-left text-white text-xs font-bold">#</th>
                          <th className="px-4 py-3 text-left text-white text-xs font-bold">Player</th>
                          {seeAll && <th className="px-4 py-3 text-left text-white text-xs font-bold hidden sm:table-cell">League</th>}
                          <th className="px-4 py-3 text-center text-white text-xs font-bold">Matches</th>
                          <th className="px-4 py-3 text-center text-white text-xs font-bold">Exact</th>
                          <th className="px-4 py-3 text-center text-white text-xs font-bold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {board.map((p, i) => (
                          <tr key={p.id}
                            className={`border-t border-gray-50 transition-colors ${
                              p.id === currentUserId
                                ? 'bg-blue-50 font-semibold'
                                : i === 0 ? 'bg-yellow-50'
                                : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-semibold text-gray-800">
                                {p.display}
                                {p.id === currentUserId && <span className="ml-1 text-blue-600">(you)</span>}
                              </div>
                              {p.cheeringFrom && <div className="text-xs text-gray-400">{p.cheeringFrom}</div>}
                            </td>
                            {seeAll && (
                              <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{p.league}</td>
                            )}
                            <td className="px-4 py-3 text-center text-xs text-gray-500">{p.played}</td>
                            <td className="px-4 py-3 text-center text-xs text-green-600 font-medium">{p.exact}</td>
                            <td className="px-4 py-3 text-center text-sm font-black" style={{ color: '#1e3a5f' }}>{p.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Admin/SuperPlayer: per-league breakdown tables */}
                {seeAll && visibleLeagues.map(league => {
                  const members = fullBoard.filter(p => p.league === league)
                  if (members.length === 0) return null
                  return (
                    <div key={league} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-blue-900">{league}</h2>
                        <p className="text-xs text-gray-400">{members.length} player{members.length !== 1 ? 's' : ''}</p>
                      </div>
                      <table className="w-full text-sm">
                        <tbody>
                          {members.map((p, i) => (
                            <tr key={p.id} className={`border-t border-gray-50 ${p.id === currentUserId ? 'bg-blue-50 font-semibold' : ''}`}>
                              <td className="px-5 py-2.5 text-gray-400 text-xs w-6">{i + 1}</td>
                              <td className="px-3 py-2.5 text-xs font-medium text-gray-700">
                                {p.display}
                                {p.id === currentUserId && <span className="ml-1 text-blue-600">(you)</span>}
                              </td>
                              <td className="px-3 py-2.5 text-right pr-5 text-xs font-black" style={{ color: '#1e3a5f' }}>{p.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </>
            )}

            {/* Scoring rules */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">How points are scored</h2>
              <p className="text-sm text-gray-600 mb-4">Your total is the sum of points from every finished match plus any bonus questions you answered correctly.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Exact score', val: '5' },
                  { label: 'Correct outcome only', val: '3' },
                  { label: 'Per correct team goals', val: '1' },
                  { label: 'Joker multiplier', val: '×2' },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl p-3 text-center text-white" style={{ background: '#1e3a5f' }}>
                    <div className="text-xs text-gray-300 mb-1">{label}</div>
                    <div className="text-2xl font-black text-yellow-400">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
