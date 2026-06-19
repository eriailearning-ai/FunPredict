import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import TeamsGrid from '@/components/ui/TeamsGrid'
import type { TeamRow } from '@/components/ui/TeamsGrid'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import { CONFEDERATION } from '@/lib/fmt'
import Link from 'next/link'

export const revalidate = 3600

export default async function TeamsPage() {
  const [sidebarData, session, rawTeams] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }).catch(() => []),
  ])

  const teams: TeamRow[] = rawTeams.map(t => ({
    id: t.id,
    code: t.code.toUpperCase(),
    name: t.name,
    group: t.group,
    flag: toIso2(t.code),
    confederation: CONFEDERATION[t.code.toUpperCase()] ?? '—',
  }))

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
          <span className="text-gray-700">Teams</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <TeamsGrid teams={teams} />
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
