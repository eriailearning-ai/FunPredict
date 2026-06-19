import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import LiveMatchCards, { type LiveMatch } from '@/components/ui/LiveMatchCards'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
  }).catch(() => ({
    topPerformers: [], nextMatch: null, comingUp: null,
    groupAStandings: [], topScorers: [],
  }))

  // Visit stats for admin display
  const visitStatsSetting = isAdmin
    ? await prisma.setting.findUnique({ where: { key: 'site_visit_stats' } }).catch(() => null)
    : null
  let visitStats: { total: number; unique: number } | null = null
  if (visitStatsSetting) {
    try { visitStats = JSON.parse(visitStatsSetting.value) } catch {}
  }

  // Fetch: any live matches + next upcoming + recently finished (last 2 days)
  const nowUtc = new Date()
  const twoDaysAgo = new Date(nowUtc.getTime() - 2 * 24 * 60 * 60 * 1000)

  const rawLiveMatches = await prisma.match.findMany({
    where: {
      OR: [
        { status: 'live' },
        { status: 'upcoming' },                                        // all upcoming
        { status: 'finished', matchDate: { gte: twoDaysAgo } },       // recent results
      ],
    },
    orderBy: { matchDate: 'asc' },
    include: { homeTeam: true, awayTeam: true },
    take: 12,
  }).catch(() => [])

  const liveMatches: LiveMatch[] = rawLiveMatches.map(m => ({
    id: m.id,
    homeTeam: { name: m.homeTeam.name, flag: toIso2(m.homeTeam.code) },
    awayTeam: { name: m.awayTeam.name, flag: toIso2(m.awayTeam.code) },
    matchDate: m.matchDate.toISOString(),
    stage: m.stage,
    group: m.group,
    venue: m.venue,
    status: m.status,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
  }))

  const approvedUsers = await prisma.user.findMany({
    where: { status: 'approved' },
    include: { predictions: { select: { points: true } } },
  }).catch(() => [])

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
      <Navbar
        user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null}
        visitStats={visitStats}
      />

      {/* ── Banner — logo overlay is built into SiteBanner ── */}
      <SiteBanner />

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* LEFT / MAIN */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* ── Follow the World Cup action ── */}
          <LiveMatchCards matches={liveMatches} />

          {/* League standings */}
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
