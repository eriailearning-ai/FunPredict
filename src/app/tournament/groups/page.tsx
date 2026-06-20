import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import { GROUPS } from '@/lib/fmt'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const [sidebarData, session, teams] = await Promise.all([
    getSidebarData().catch(() => ({
      topPerformers: [], nextMatch: null, comingUp: null,
      groupAStandings: [], topScorers: [],
    })),
    getSession().catch(() => null),
    prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }).catch(() => []),
  ])

  // Group teams by group letter
  const byGroup: Record<string, typeof teams> = {}
  for (const t of teams) {
    if (!byGroup[t.group]) byGroup[t.group] = []
    byGroup[t.group].push(t)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/tournament" className="hover:underline">Matches</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Groups</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            {/* Dark header card */}
            <div className="rounded-xl px-6 py-5 mb-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-yellow-400 mb-1">Groups</h1>
                  <p className="text-sm text-gray-300">All 12 groups — top 2 advance + best 8 third-place teams.</p>
                </div>
                <Link href="/standings" className="px-4 py-2 rounded-lg text-white text-sm font-semibold border border-white/30 hover:bg-white/10 transition-colors">
                  View Standings →
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {GROUPS.map(g => {
                const groupTeams = byGroup[g] ?? []

                return (
                  <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Group header */}
                    <div className="px-4 py-3 text-white text-sm font-bold" style={{ background: '#1e3a5f' }}>
                      Group {g}
                    </div>

                    {/* Team list — no stats, just flag + name */}
                    <div className="divide-y divide-gray-50">
                      {groupTeams.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-gray-400 text-center">No teams loaded</p>
                      ) : groupTeams.map((t, i) => (
                        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'bg-green-50/30' : ''}`}>
                          {/* Advance indicator */}
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
                          <FlagImg iso2={toIso2(t.code)} name={t.name} size="sm" />
                          <span className="text-sm font-medium text-gray-800">{t.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400">🟢 Top 2 advance</p>
                      <Link href="/standings" className="text-[11px] font-semibold hover:underline" style={{ color: '#8b1c2c' }}>
                        Standings →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
