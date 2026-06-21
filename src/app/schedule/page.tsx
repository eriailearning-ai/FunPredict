import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import { stageName } from '@/lib/fmt'
import LocalTime from '@/components/ui/LocalTime'
import ScrollToToday from '@/components/ui/ScrollToToday'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/** Short date label like "Thu, Jun 12" — always in ET so grouping matches FIFA */
function fmtDayShort(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/New_York',
  })
}

/** "YYYY-MM-DD" key for grouping — ET date so late-night matches fall on the right day */
function dayKey(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export default async function SchedulePage() {
  const [session, matches] = await Promise.all([
    getSession().catch(() => null),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  const isApproved = (session as any)?.status === 'approved'

  // Group by day (ET)
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const byDate: Record<string, typeof matches> = {}
  for (const m of matches) {
    const k = dayKey(m.matchDate)
    if (!byDate[k]) byDate[k] = []
    byDate[k].push(m)
  }
  const dayKeys = Object.keys(byDate).sort()

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />
      <ScrollToToday />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Full Schedule</span>
        </nav>

        {/* Header */}
        <div className="rounded-xl px-6 py-5 mb-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-yellow-400 mb-1">Full Schedule</h1>
              <p className="text-sm text-gray-300">
                {matches.length > 0
                  ? `${matches.length} matches across ${dayKeys.length} matchdays`
                  : 'FIFA World Cup 2026™ complete schedule'}
              </p>
            </div>
            <Link href="/tournament" className="px-4 py-2 rounded-lg text-white text-sm font-semibold border border-white/30 hover:bg-white/10 transition-colors">
              Full Bracket →
            </Link>
          </div>
        </div>

        {/* Schedule */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">⚽</p>
            <p className="font-semibold">Schedule loading…</p>
            <p className="text-xs mt-1">Please try refreshing in a moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayKeys.map(dk => (
              <div key={dk} id={dk === todayKey ? 'today' : undefined} style={dk === todayKey ? { scrollMarginTop: 80 } : undefined}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                    {fmtDayShort(byDate[dk][0].matchDate)}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Match rows for this day */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {byDate[dk].map((m) => {
                    const finished = m.status === 'finished'
                    const live     = m.status === 'live'
                    return (
                      <div key={m.id} className="flex items-center gap-2 sm:gap-4 px-4 py-3">
                        {/* Time / Score */}
                        <div className="w-16 sm:w-20 flex-shrink-0 text-center">
                          {finished ? (
                            <span className="text-sm font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                          ) : live ? (
                            <span className="text-xs font-bold text-green-600">LIVE</span>
                          ) : (
                            <LocalTime iso={m.matchDate.toISOString()} className="text-xs font-semibold" color="#1e3a5f" />
                          )}
                        </div>

                        {/* Home team */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className={`text-sm truncate ${finished && m.homeScore! > m.awayScore! ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                            {m.homeTeam.name}
                          </span>
                          <FlagImg iso2={toIso2(m.homeTeam.code)} name={m.homeTeam.name} size="sm" />
                        </div>

                        {/* vs divider */}
                        <span className="text-[10px] text-gray-300 font-medium flex-shrink-0 hidden sm:block">vs</span>

                        {/* Away team */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <FlagImg iso2={toIso2(m.awayTeam.code)} name={m.awayTeam.name} size="sm" />
                          <span className={`text-sm truncate ${finished && m.awayScore! > m.homeScore! ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                            {m.awayTeam.name}
                          </span>
                        </div>

                        {/* Stage info (desktop only) */}
                        <div className="hidden sm:flex flex-col items-end flex-shrink-0 w-36">
                          <span className="text-[10px] text-gray-400 text-right leading-tight">{stageName(m.stage, m.group)}</span>
                          {m.venue && <span className="text-[10px] text-gray-300 text-right truncate w-full">{m.venue}</span>}
                          {isApproved && m.status === 'upcoming' && !(m as any).locked && (
                            <Link href="/predictions" className="text-[10px] font-semibold hover:underline mt-0.5" style={{ color: '#8b1c2c' }}>
                              Predict →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
