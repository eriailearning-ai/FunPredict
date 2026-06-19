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

export const revalidate = 60

export default async function GroupsPage() {
  const [sidebarData, session, teams, matches] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }).catch(() => []),
    prisma.match.findMany({
      where: { stage: 'group' },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  // Build standings from finished matches
  type Standing = { id: number; name: string; code: string; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
  const standingMap: Record<number, Standing> = {}
  for (const t of teams) {
    standingMap[t.id] = { id: t.id, name: t.name, code: t.code, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }
  }
  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue
    const h = standingMap[m.homeTeamId]
    const a = standingMap[m.awayTeamId]
    if (!h || !a) continue
    h.P++; a.P++
    h.GF += m.homeScore; h.GA += m.awayScore
    a.GF += m.awayScore; a.GA += m.homeScore
    h.GD = h.GF - h.GA; a.GD = a.GF - a.GA
    if (m.homeScore > m.awayScore) { h.W++; h.Pts += 3; a.L++ }
    else if (m.homeScore < m.awayScore) { a.W++; a.Pts += 3; h.L++ }
    else { h.D++; h.Pts++; a.D++; a.Pts++ }
  }

  // Group teams
  const byGroup: Record<string, any[]> = {}
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
                  Full Standings
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {GROUPS.map(g => {
                const groupTeams = (byGroup[g] ?? [])
                  .map((t: any) => standingMap[t.id] ?? { ...t, P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0 })
                  .sort((a: Standing, b: Standing) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)

                return (
                  <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 text-white text-sm font-bold" style={{ background: '#1e3a5f' }}>
                      Group {g}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-500 font-medium w-6">#</th>
                            <th className="px-2 py-2 text-left text-gray-500 font-medium">Team</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">P</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">W</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">D</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">L</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">GF</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">GA</th>
                            <th className="px-2 py-2 text-center text-gray-500 font-medium">GD</th>
                            <th className="px-2 py-2 text-center text-gray-800 font-bold">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupTeams.length === 0 ? (
                            <tr><td colSpan={10} className="px-3 py-4 text-center text-gray-400">No teams loaded</td></tr>
                          ) : groupTeams.map((t: Standing, i: number) => (
                            <tr key={t.id} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/40' : ''}`}>
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1.5">
                                  <FlagImg iso2={toIso2(t.code)} name={t.name} size="sm" />
                                  <span className="font-medium text-gray-800 truncate max-w-[80px]">{t.name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.P}</td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.W}</td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.D}</td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.L}</td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.GF}</td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.GA}</td>
                              <td className="px-2 py-2 text-center text-gray-500">{t.GD >= 0 ? '+' : ''}{t.GD}</td>
                              <td className="px-2 py-2 text-center font-black" style={{ color: '#1e3a5f' }}>{t.Pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400">🟢 Top 2 advance · Group phase</p>
                    </div>

                    {/* Group matches */}
                    {(() => {
                      const gm = matches.filter((m: any) => m.group === g)
                      if (gm.length === 0) return null
                      return (
                        <div className="border-t border-gray-100">
                          {gm.map((m: any) => (
                            <div key={m.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0 text-xs">
                              <FlagImg iso2={toIso2(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="sm" />
                              <span className="flex-1 text-gray-700 truncate">{m.homeTeam?.name}</span>
                              <span className="font-bold w-10 text-center" style={{ color: m.status === 'finished' ? '#111827' : '#6b7280' }}>
                                {m.status === 'finished' ? `${m.homeScore}–${m.awayScore}` : new Date(m.matchDate).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}
                              </span>
                              <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam?.name}</span>
                              <FlagImg iso2={toIso2(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="sm" />
                            </div>
                          ))}
                        </div>
                      )
                    })()}
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
