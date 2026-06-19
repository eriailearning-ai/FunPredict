/**
 * getSidebarData() — fetch all data needed by the shared sidebar.
 * Call from any server-side page component and pass as props.
 */
import { prisma } from './db'
import { CODE3_TO_ISO2 } from './flags'

export type SidebarPerformer = {
  display: string
  league: string
  cheeringFrom: string
  total: number
  medal?: string   // '🥇' | '🥈' | '🥉' — set explicitly when showing league leaders
}

export type SidebarMatch = {
  id: number
  homeTeam: { name: string; code: string; flag: string }
  awayTeam: { name: string; code: string; flag: string }
  matchDate: string
  group: string
  status: string
  isToday?: boolean
}

export type SidebarStanding = {
  flag: string
  name: string
  p: number
  pts: number
  gd: string
}

export type TopScorer = { name: string; team: string; goals: number; assists: number }

export type SidebarData = {
  topPerformers: SidebarPerformer[]
  nextMatch: SidebarMatch | null
  comingUp: SidebarMatch | null
  groupAStandings: SidebarStanding[]
  topScorers: TopScorer[]
}

function isoFlag(code: string): string {
  return CODE3_TO_ISO2[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2)
}

// Hardcoded Group A standings (kept in sync with standings page)
// Updated as matches are played during the tournament
const GROUP_A_FALLBACK: SidebarStanding[] = [
  { flag: 'mx', name: 'Mexico',       p: 1, pts: 3, gd: '2-0' },
  { flag: 'kr', name: 'South Korea',  p: 1, pts: 3, gd: '2-1' },
  { flag: 'cz', name: 'Czechia',      p: 1, pts: 0, gd: '1-2' },
  { flag: 'za', name: 'South Africa', p: 1, pts: 0, gd: '0-2' },
]

export async function getSidebarData(opts?: {
  userLeague?: string
  isAdmin?: boolean
}): Promise<SidebarData> {
  const { userLeague = '', isAdmin = false } = opts ?? {}

  const [allUsers, upcoming, groupATeams, groupAMatches, scorerSetting] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'approved' },
      include: { predictions: { select: { points: true } } },
    }).catch(() => []),

    prisma.match.findMany({
      where: {
        status: { in: ['upcoming', 'live'] },
        matchDate: { gte: new Date() },   // never show past matches
      },
      orderBy: { matchDate: 'asc' },
      take: 2,
      include: { homeTeam: true, awayTeam: true },
    }).catch(() => []),

    prisma.team.findMany({ where: { group: 'A' } }).catch(() => []),

    prisma.match.findMany({
      where: { group: 'A', status: 'finished' },
      include: { homeTeam: true, awayTeam: true },
    }).catch(() => []),

    prisma.setting.findUnique({ where: { key: 'top_scorers' } }).catch(() => null),
  ])

  const fullBoard: SidebarPerformer[] = allUsers
    .map(u => ({
      display:      (u as any).nickname || (u as any).username || u.name,
      league:       (u as any).league   ?? '',
      cheeringFrom: (u as any).cheeringFrom ?? '',
      total:        u.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)

  const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']
  const isPlayer = !isAdmin && userLeague !== ''
  const isGuest  = !isAdmin && !isPlayer

  let topPerformers: SidebarPerformer[]

  if (isPlayer) {
    // Player: own league only, medals by rank position
    topPerformers = fullBoard.filter(p => p.league === userLeague)
  } else if (isGuest) {
    // Guest: #1 from each league, all get 🥇
    topPerformers = LEAGUES
      .map(league => fullBoard.find(p => p.league === league))
      .filter((p): p is SidebarPerformer => !!p)
      .map(p => ({ ...p, medal: '🥇' }))
  } else {
    // Admin: top performers across all leagues
    topPerformers = fullBoard
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const toSidebarMatch = (m: any): SidebarMatch => {
    const matchDay = new Date(m.matchDate).toISOString().slice(0, 10)
    return {
      id: m.id,
      homeTeam: { name: m.homeTeam.name, code: m.homeTeam.code, flag: isoFlag(m.homeTeam.code) },
      awayTeam: { name: m.awayTeam.name, code: m.awayTeam.code, flag: isoFlag(m.awayTeam.code) },
      matchDate: m.matchDate.toISOString(),
      group: m.group,
      status: m.status,
      isToday: matchDay === todayStr,
    }
  }

  // Compute Group A standings from finished matches in DB
  let groupAStandings: SidebarStanding[]
  if (groupAMatches.length > 0 && groupATeams.length > 0) {
    const tally: Record<number, { name: string; code: string; p: number; w: number; d: number; l: number; gf: number; ga: number }> = {}
    for (const t of groupATeams) {
      tally[t.id] = { name: t.name, code: t.code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
    }
    for (const m of groupAMatches) {
      if (m.homeScore === null || m.awayScore === null) continue
      const hs = m.homeScore, as_ = m.awayScore
      if (tally[m.homeTeamId]) {
        tally[m.homeTeamId].p++; tally[m.homeTeamId].gf += hs; tally[m.homeTeamId].ga += as_
        if (hs > as_) tally[m.homeTeamId].w++; else if (hs === as_) tally[m.homeTeamId].d++; else tally[m.homeTeamId].l++
      }
      if (tally[m.awayTeamId]) {
        tally[m.awayTeamId].p++; tally[m.awayTeamId].gf += as_; tally[m.awayTeamId].ga += hs
        if (as_ > hs) tally[m.awayTeamId].w++; else if (as_ === hs) tally[m.awayTeamId].d++; else tally[m.awayTeamId].l++
      }
    }
    groupAStandings = Object.values(tally)
      .map(t => ({
        flag: isoFlag(t.code),
        name: t.name,
        p: t.p,
        pts: t.w * 3 + t.d,
        gd: `${t.gf}-${t.ga}`,
      }))
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts
        const agd = parseInt(a.gd.split('-')[0]) - parseInt(a.gd.split('-')[1])
        const bgd = parseInt(b.gd.split('-')[0]) - parseInt(b.gd.split('-')[1])
        return bgd - agd
      })
  } else {
    // Fall back to hardcoded standings when DB has no match results
    groupAStandings = GROUP_A_FALLBACK
  }

  const topScorers: TopScorer[] = scorerSetting ? JSON.parse(scorerSetting.value) : []

  return {
    topPerformers,
    nextMatch: upcoming[0] ? toSidebarMatch(upcoming[0]) : null,
    comingUp: upcoming[1] ? toSidebarMatch(upcoming[1]) : null,
    groupAStandings,
    topScorers,
  }
}
