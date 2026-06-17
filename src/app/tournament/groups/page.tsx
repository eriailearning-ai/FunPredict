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

export default async function GroupsPage() {
  const [sidebarData, session, teams] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }).catch(() => []),
  ])

  function isoFlag(code: string) { return CODE3_TO_ISO2[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2) }

  type Team = { id: number; name: string; code: string; flagCode: string; group: string; flag: string }
  const byGroup: Record<string, Team[]> = {}
  for (const t of teams) {
    if (!byGroup[t.group]) byGroup[t.group] = []
    byGroup[t.group].push(t)
  }

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Groups</h1>
            <p className="text-sm text-gray-500 mb-5">All 12 groups — top 2 advance, best 8 third-place teams also advance.</p>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map(g => {
                const groupTeams = byGroup[g] ?? []
                return (
                  <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 text-white text-sm font-bold" style={{ background: '#1e3a5f' }}>
                      Group {g}
                    </div>
                    <div className="p-3 space-y-2">
                      {groupTeams.length === 0 ? (
                        <p className="text-xs text-gray-400 p-2">No teams loaded</p>
                      ) : groupTeams.map((t, i) => (
                        <div key={t.id} className="flex items-center gap-3 py-1">
                          <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                          <FlagImg iso2={isoFlag(t.code)} name={t.name} size="sm" />
                          <span className="text-sm font-medium text-gray-800">{t.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 pb-3">
                      <Link href="/standings" className="text-xs text-blue-600 hover:underline">View standings →</Link>
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
