import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import TournamentTabs from '@/components/ui/TournamentTabs'
import type { MatchRow } from '@/components/ui/TournamentTabs'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TournamentPage() {
  const [sidebarData, session, rawMatches] = await Promise.all([
    getSidebarData().catch(() => ({
      topPerformers: [], nextMatch: null, comingUp: null,
      groupAStandings: [], topScorers: [],
    })),
    getSession().catch(() => null),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  // Serialize for client component (convert Date → ISO string, add ISO2 flags)
  const matches: MatchRow[] = rawMatches.map(m => ({
    id: m.id,
    homeTeam: {
      name: m.homeTeam.name,
      code: m.homeTeam.code,
      flag: toIso2(m.homeTeam.code),
    },
    awayTeam: {
      name: m.awayTeam.name,
      code: m.awayTeam.code,
      flag: toIso2(m.awayTeam.code),
    },
    matchDate: m.matchDate.toISOString(),
    group: m.group,
    stage: m.stage,
    venue: m.venue ?? '',
    status: m.status,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
  }))

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Matches</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <TournamentTabs matches={matches} />
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
