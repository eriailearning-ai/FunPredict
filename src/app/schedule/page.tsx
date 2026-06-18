import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CODE3_TO_ISO2 } from '@/lib/flags'
import Link from 'next/link'

export const revalidate = 300

function isoFlag(code: string) { return CODE3_TO_ISO2[code?.toUpperCase()] ?? code?.toLowerCase()?.slice(0,2) ?? '' }

function fmtDayHeader(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function stageLine(stage: string, group: string, venue: string) {
  const stageLabel = stage === 'group' ? `First stage · Group ${group}` :
    ({ R32:'Round of 32', R16:'Round of 16', QF:'Quarter-finals', SF:'Semi-final', '3rd':'Third place', F:'Final' } as any)[group] ?? group
  return venue ? `${stageLabel} · ${venue}` : stageLabel
}

export default async function SchedulePage() {
  const [sidebarData, session, matches] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  // Group by day
  const byDate: Record<string, any[]> = {}
  for (const m of matches) {
    const key = fmtDayHeader(m.matchDate)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(m)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Full Schedule</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Full Schedule</h1>
                <p className="text-sm text-gray-500 mt-1">Full World Cup 2026 schedule grouped by day.</p>
              </div>
              {session?.status === 'approved' && (
                <Link href="/predictions" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#8b1c2c' }}>
                  Go Predict →
                </Link>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex gap-3 border-b border-gray-200">
              <Link href="/schedule" className="text-sm pb-2 border-b-2 border-blue-600 text-blue-700 font-semibold">Matches</Link>
              <span className="text-sm pb-2 text-gray-400 cursor-default">By day</span>
              <Link href="/tournament" className="text-sm pb-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700">Full bracket</Link>
            </div>

            {matches.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>No matches loaded yet.</p>
                <p className="text-xs mt-2">Use Admin → Seed DB to import the schedule.</p>
              </div>
            ) : (
              Object.entries(byDate).map(([dateStr, dayMatches]) => (
                <div key={dateStr}>
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">{dateStr}</h2>
                    <Link href="/tournament/groups" className="text-xs text-blue-600 hover:underline">View groups</Link>
                  </div>

                  {/* Match cards */}
                  <div className="space-y-2">
                    {dayMatches.map((m: any) => (
                      <div key={m.id} className="bg-white rounded-xl shadow-sm px-5 py-4">
                        {/* Match row */}
                        <div className="flex items-center gap-3">
                          {/* Home */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FlagImg iso2={isoFlag(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="md" />
                            <span className="text-sm font-semibold text-gray-800">{m.homeTeam?.name}</span>
                          </div>

                          {/* Score or time */}
                          <div className="text-center flex-shrink-0 w-16">
                            {m.status === 'finished' ? (
                              <span className="text-lg font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                            ) : (
                              <span className="text-sm font-bold text-gray-500">{fmtTime(m.matchDate)}</span>
                            )}
                          </div>

                          {/* Away */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-sm font-semibold text-gray-800 text-right">{m.awayTeam?.name}</span>
                            <FlagImg iso2={isoFlag(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="md" />
                          </div>
                        </div>

                        {/* Stage/venue line */}
                        <p className="text-xs text-gray-400 mt-2">{stageLine(m.stage, m.group, m.venue)}</p>

                        {/* Predict CTA for approved players */}
                        {session?.status === 'approved' && m.status === 'upcoming' && !m.locked && (
                          <div className="mt-2">
                            <Link href="/predictions" className="text-xs text-blue-600 hover:underline font-medium">
                              Enter your prediction →
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
