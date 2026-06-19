import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
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

  const isAdmin    = session?.role === 'admin'
  const isPlayer   = !!session && !isAdmin
  const userLeague = (session as any)?.league ?? ''

  const sidebarData = await getSidebarData({
    userLeague: isPlayer ? userLeague : '',
    isAdmin,
  })

  const approvedUsers = await prisma.user.findMany({
    where: { status: 'approved' },
    include: { predictions: { select: { points: true } } },
  }).catch(() => [])

  // Players only see their own league; guests + admins see all
  const visibleLeagues = isPlayer ? LEAGUES.filter(l => l === userLeague) : LEAGUES

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

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

      {/* Slideshow banner */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(160px, 35vw, 320px)' }}>
        {/* Background: try local image, fall back to gradient */}
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(/images/banners/hero-soccer.png), linear-gradient(135deg,#0d1b3e,#8b1c2c)`
        }} />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-yellow-400 font-bold uppercase mb-2">WorldCup Fun</p>
          <h1 className="text-xl sm:text-3xl font-black mb-3">Welcome to FIFAFun Predict!</h1>
          <p className="text-sm text-gray-300 mb-5 max-w-md">Predict scores, preview league leaders, and register free to join FIFAFun.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/auth/register" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#8b1c2c' }}>Register free</Link>
            <Link href="/auth/login" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#1e3a5f' }}>Log in</Link>
            <Link href="/leaderboard" className="px-4 py-2 rounded-lg font-semibold text-sm text-white border border-white hover:bg-white hover:text-gray-900 transition-colors">
              {isPlayer ? userLeague + ' standings' : 'League standings'}
            </Link>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* LEFT / MAIN */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* League standings anchor */}
          <div id="wcp-league-dashboard-title">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {isPlayer ? userLeague + ' standings' : LEAGUES[0] + ', ' + LEAGUES[1] + ', and ' + LEAGUES[2] + ' standings'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {isPlayer
                ? `Your league leaderboard. Log in and predict to climb the rankings!`
                : `Compare ${LEAGUES.join(', ')}. Each league has its own leaderboard — open a league for the full ranking.`}
            </p>

            <div className={`grid grid-cols-1 ${visibleLeagues.length > 1 ? 'sm:grid-cols-3' : 'sm:grid-cols-1 max-w-sm'} gap-4`}>
              {leagueBoards.map(({ league, members }) => (
                <div key={league} className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4" style={{ borderColor: LEAGUE_BORDER[league] }}>
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
                      {session ? 'Full leaderboard →' : 'Log in for full leaderboard →'}
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
