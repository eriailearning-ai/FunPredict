import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CODE3_TO_ISO2 } from '@/lib/flags'
import Link from 'next/link'

export const revalidate = 60

export default async function TournamentPage() {
  const [sidebarData, session, matches] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  function isoFlag(code: string) { return CODE3_TO_ISO2[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2) }
  function fmtDate(d: Date) { return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
  function fmtTime(d: Date) { return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }

  // Group by date
  const byDate: Record<string, any[]> = {}
  for (const m of matches) {
    const key = fmtDate(m.matchDate)
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
          <span className="text-gray-700">Matches</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
            <p className="text-sm text-gray-500">Full World Cup 2026 schedule grouped by day.</p>

            <div className="flex gap-2 mb-2">
              <Link href="/schedule" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#1e3a5f' }}>Full schedule</Link>
              <Link href="/tournament/groups" className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">By group</Link>
            </div>

            {Object.entries(byDate).map(([dateStr, dayMatches]) => (
              <div key={dateStr}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-gray-800">{dateStr}</h2>
                  <Link href="/tournament/groups" className="text-xs text-blue-600 hover:underline">View groups</Link>
                </div>
                <div className="space-y-2">
                  {dayMatches.map(m => (
                    <div key={m.id} className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImg iso2={isoFlag(m.homeTeam.code)} name={m.homeTeam.name} size="md" />
                        <span className="text-sm font-semibold text-gray-800 truncate">{m.homeTeam.name}</span>
                      </div>
                      <div className="text-center flex-shrink-0 px-2">
                        {m.status === 'finished' ? (
                          <span className="text-base font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                        ) : (
                          <span className="text-sm font-bold text-gray-500">{fmtTime(m.matchDate)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-semibold text-gray-800 truncate text-right">{m.awayTeam.name}</span>
                        <FlagImg iso2={isoFlag(m.awayTeam.code)} name={m.awayTeam.name} size="md" />
                      </div>
                      <div className="hidden sm:block text-xs text-gray-400 ml-2 text-right flex-shrink-0 w-32">
                        <div>{m.stage === 'group' ? `Group ${m.group}` : m.group}</div>
                        <div className="truncate">{m.venue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {matches.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>No matches loaded yet.</p>
                <p className="text-xs mt-2">Use the admin panel to import the schedule.</p>
              </div>
            )}
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
