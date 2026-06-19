import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import { fmtTime, fmtDayHeader, stageLine } from '@/lib/fmt'
import Link from 'next/link'

export const revalidate = 60

export default async function SchedulePage() {
  const [sidebarData, session, matches] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  // Group by day string
  const byDate: Record<string, any[]> = {}
  for (const m of matches) {
    const key = fmtDayHeader(m.matchDate)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(m)
  }

  const isApproved = (session as any)?.status === 'approved'

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Full Schedule</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-4">

            {/* Dark header card */}
            <div className="rounded-xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
              <h1 className="text-2xl font-black text-yellow-400 mb-1">Full Schedule</h1>
              <p className="text-sm text-gray-300">Full World Cup 2026 schedule grouped by day. Tap match to predict or view stats.</p>
            </div>

            {/* Tab bar */}
            <div className="rounded-lg overflow-hidden flex" style={{ background: '#111827' }}>
              <span className="px-4 py-2.5 text-xs font-bold text-white tracking-widest uppercase border-b-2 border-yellow-400">
                MATCHES
              </span>
            </div>

            {/* BY DAY / BRACKET links */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <Link
                href="/schedule"
                className="flex-1 py-3 text-sm font-bold tracking-wide text-center text-white"
                style={{ background: '#1e3a5f' }}
              >
                BY DAY
              </Link>
              <Link
                href="/tournament"
                className="flex-1 py-3 text-sm font-bold tracking-wide text-center border-l border-gray-200 text-gray-600"
                style={{ background: '#f3f4f6' }}
              >
                FULL BRACKET
              </Link>
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
                    <h2 className="text-lg font-black text-gray-900">{dateStr}</h2>
                    <Link href="/tournament/groups" className="text-xs font-semibold hover:underline" style={{ color: '#8b1c2c' }}>
                      View groups
                    </Link>
                  </div>

                  <div className="space-y-2 mb-6">
                    {dayMatches.map((m: any) => (
                      <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Home */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FlagImg iso2={toIso2(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="md" />
                            <span className="text-sm font-semibold text-gray-800 truncate">{m.homeTeam?.name}</span>
                          </div>
                          {/* Score or time */}
                          <div className="text-center flex-shrink-0 w-16">
                            {m.status === 'finished' ? (
                              <span className="text-lg font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                            ) : (
                              <span className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{fmtTime(m.matchDate)}</span>
                            )}
                          </div>
                          {/* Away */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-sm font-semibold text-gray-800 text-right truncate">{m.awayTeam?.name}</span>
                            <FlagImg iso2={toIso2(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="md" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">{stageLine(m.stage, m.group, m.venue)}</p>
                        {isApproved && m.status === 'upcoming' && !m.locked && (
                          <Link href="/predictions" className="text-xs font-semibold hover:underline block mt-1" style={{ color: '#8b1c2c' }}>
                            Enter your prediction →
                          </Link>
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
