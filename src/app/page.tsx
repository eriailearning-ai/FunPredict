import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import BannerCarousel from '@/components/ui/BannerCarousel'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 60

const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']
const LEAGUE_BORDER: Record<string, string> = {
  'Aila Attackers': '#1e3a5f',
  'Sukuti Strikers': '#1e3a5f',
  'Gorkhali Gooners': '#8b1c2c',
}

export default async function Home() {
  const session = await getSession().catch(() => null)

  const isAdmin       = session?.role === 'admin' || session?.role === 'superplayer'
  const isLoggedIn    = !!session
  const userLeague    = (session as any)?.league ?? ''

  const sidebarData = await getSidebarData({
    userLeague: isLoggedIn ? userLeague : '',
    isAdmin,
  })

  const approvedUsers = await prisma.user.findMany({
    where: { status: 'approved' },
    include: { predictions: { select: { points: true } } },
  }).catch(() => [])

  // Show all leagues to everyone (WP site shows all 3 leagues publicly)
  const visibleLeagues = LEAGUES

  const leagueBoards = visibleLeagues.map(league => {
    const members = approvedUsers
      .filter(u => (u as any).league === league)
      .map(u => ({
        id: u.id,
        display: (u as any).nickname || (u as any).username || u.name,
        total: u.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
    return { league, members }
  })
  const myLeague = userLeague

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

      {/* ── Banner with logo overlay ── */}
      <div className="relative">
        {/* Logo overlaid at top-left of banner */}
        <div
          className="absolute hidden sm:flex items-end justify-center bg-white shadow-lg"
          style={{
            left: 24, top: 0, zIndex: 20,
            borderRadius: '0 0 20px 20px',
            padding: '6px 14px 14px',
            minWidth: 140,
          }}
        >
          <img
            src="/images/logo/cropped-worldcup-eagle-logo-1.png"
            alt="FIFAFun 2026"
            style={{ height: 110, width: 'auto' }}
          />
        </div>

        <BannerCarousel>
          {/* Hero text centered in banner */}
          <p className="text-xs sm:text-sm tracking-[0.3em] text-yellow-400 font-bold uppercase mb-2">WorldCup Fun</p>
          <h1 className="text-xl sm:text-3xl font-black mb-3 text-center">Welcome to FIFAFun Predict!</h1>
          <p className="text-sm text-gray-300 mb-5 max-w-md text-center">
            Predict scores, preview league leaders, and register free to join FIFAFun.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {isLoggedIn ? (
              <>
                <Link href="/predictions" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#8b1c2c' }}>Go FIFAFun ⚽</Link>
                <Link href="/leaderboard" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#1e3a5f' }}>
                  {myLeague ? myLeague + ' standings' : 'League standings'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#8b1c2c' }}>Register free</Link>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#1e3a5f' }}>Log in</Link>
                <Link href="/leaderboard" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                  League standings
                </Link>
              </>
            )}
          </div>
        </BannerCarousel>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* LEFT / MAIN */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* League standings anchor */}
          <div id="wcp-league-dashboard-title">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">League Standings</h2>
            <p className="text-sm text-gray-500 mb-4">
              {isLoggedIn && myLeague
                ? `You're in ${myLeague}. Predict matches to climb the leaderboard!`
                : isLoggedIn
                  ? 'All league standings — predict matches to earn points!'
                  : `Register free to join one of our ${LEAGUES.length} leagues and compete!`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {leagueBoards.map(({ league, members }) => (
                <div key={league}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border-t-4 ${myLeague === league ? 'ring-2 ring-yellow-400' : ''}`}
                  style={{ borderColor: LEAGUE_BORDER[league] }}>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-0.5" style={{ color: '#1e3a5f' }}>{league}</h3>
                    <p className="text-xs text-gray-400 mb-3">{members.length} player{members.length !== 1 ? 's' : ''}</p>

                    {members.length === 0 ? (
                      <>
                        <p className="text-xs text-gray-400 italic mb-3">Sample preview — register or log in to compete.</p>
                        <p className="text-xs text-gray-500 mb-3">Leader: <strong>—</strong> · 0 pts</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600 mb-3">Leader: <strong>{members[0].display}</strong> · {members[0].total} pts</p>
                        <div className="space-y-2">
                          {members.slice(0, 5).map((m, i) => (
                            <div key={m.id} className="flex items-center text-sm border-t border-gray-50 pt-1.5">
                              <span className="w-5 text-xs text-gray-400">{i + 1}</span>
                              <span className="flex-1 text-xs text-gray-600">{m.display}</span>
                              <span className="text-xs font-bold text-gray-800">{m.total}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="px-5 pb-4">
                    <Link href="/leaderboard" className="text-xs font-semibold hover:underline" style={{ color: '#8b1c2c' }}>
                      Full leaderboard →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-4">
              <Link href="/schedule" className="text-sm font-semibold hover:underline" style={{ color: '#8b1c2c' }}>
                View full 2026 World Cup bracket schedule →
              </Link>
            </div>
          </div>

          {/* Friends & Family Fun */}
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
            <h3 className="font-bold text-blue-900 text-base mb-1">Friends &amp; Family Fun</h3>
            <p className="text-sm text-gray-500 mb-3">This site is purely for fun and entertainment only. Predictions are for bragging rights among people you know.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/disclaimer" className="text-sm text-gray-500 hover:underline border border-gray-200 px-4 py-1.5 rounded-lg">Disclaimer</Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:underline border border-gray-200 px-4 py-1.5 rounded-lg">Privacy Policy</Link>
            </div>
          </div>
        </main>

        {/* RIGHT: Sidebar */}
        <Sidebar {...sidebarData} isLoggedIn={!!session} />
      </div>

      <Footer />
    </div>
  )
}
