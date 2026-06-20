import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import StandingsTabs from '@/components/ui/StandingsTabs'
import type { StandingGroup } from '@/components/ui/StandingsTabs'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StandingsPage() {
  const session = await getSession().catch(() => null)
  const isAdmin    = session?.role === 'admin' || session?.role === 'superplayer'
  const userLeague = (session as any)?.league ?? ''
  const sidebarData = await getSidebarData({ userLeague: session ? userLeague : '', isAdmin })
    .catch(() => ({ topPerformers: [], nextMatch: null, comingUp: null, groupAStandings: [], topScorers: [] }))

  // Load all group-stage teams, finished matches, and last sync time from DB
  const [teams, matches, lastSyncSetting] = await Promise.all([
    prisma.team.findMany({ orderBy: { group: 'asc' } }).catch(() => []),
    prisma.match.findMany({
      where: { stage: 'group', status: 'finished' },
      include: { homeTeam: true, awayTeam: true },
    }).catch(() => []),
    prisma.setting.findUnique({ where: { key: 'last_sync_at' } }).catch(() => null),
  ])

  // Build tally per team
  type Tally = { code: string; name: string; group: string; mp: number; w: number; d: number; l: number; gf: number; ga: number }
  const tally: Record<number, Tally> = {}
  for (const t of teams) {
    tally[t.id] = { code: t.code, name: t.name, group: t.group ?? '', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
  }
  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue
    const hs = m.homeScore, as_ = m.awayScore
    if (tally[m.homeTeamId]) {
      tally[m.homeTeamId].mp++
      tally[m.homeTeamId].gf += hs; tally[m.homeTeamId].ga += as_
      if (hs > as_) tally[m.homeTeamId].w++
      else if (hs === as_) tally[m.homeTeamId].d++
      else tally[m.homeTeamId].l++
    }
    if (tally[m.awayTeamId]) {
      tally[m.awayTeamId].mp++
      tally[m.awayTeamId].gf += as_; tally[m.awayTeamId].ga += hs
      if (as_ > hs) tally[m.awayTeamId].w++
      else if (as_ === hs) tally[m.awayTeamId].d++
      else tally[m.awayTeamId].l++
    }
  }

  // Group teams into StandingGroup[]
  const byGroup: Record<string, Tally[]> = {}
  for (const t of Object.values(tally)) {
    if (!t.group || t.group === '') continue
    if (!byGroup[t.group]) byGroup[t.group] = []
    byGroup[t.group].push(t)
  }

  const GROUPS: StandingGroup[] = Object.keys(byGroup).sort().map(g => ({
    group: g,
    teams: byGroup[g]
      .map(t => ({
        flag: toIso2(t.code),
        name: t.name,
        mp: t.mp, w: t.w, d: t.d, l: t.l,
        gf: t.gf, ga: t.ga,
        gd: t.gf - t.ga,
        pts: t.w * 3 + t.d,
      }))
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf),
  }))

  const lastSyncAt = lastSyncSetting?.value ? new Date(lastSyncSetting.value) : null
  const syncLabel = lastSyncAt
    ? (() => {
        const mins = Math.round((Date.now() - lastSyncAt.getTime()) / 60000)
        if (mins < 1)  return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24)  return `${hrs}h ago`
        return lastSyncAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      })()
    : 'not synced yet'

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Standings</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <StandingsTabs groups={GROUPS} />
            <p className="text-xs text-gray-400 mt-4 text-center">
              Live from database · Last synced: {syncLabel} · {matches.length} finished match{matches.length !== 1 ? 'es' : ''}
            </p>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
