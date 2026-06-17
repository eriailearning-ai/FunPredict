import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import PredictionsClient from './PredictionsClient'
import { CODE3_TO_ISO2 } from '@/lib/flags'

export const revalidate = 30

const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']

export default async function PredictionsPage() {
  const user = await getSession().catch(() => null)
  const isApproved  = user?.status === 'approved'
  const isAdmin     = user?.role === 'admin'
  const userLeague  = (user as any)?.league ?? ''

  // All approved users for leaderboard + top performers
  const allUsers = await prisma.user.findMany({
    where: { status: 'approved' },
    include: { predictions: { select: { points: true } } },
  }).catch(() => [])

  const fullBoard = allUsers
    .map(u => ({
      id:           u.id,
      display:      (u as any).nickname || (u as any).username || u.name,
      league:       (u as any).league   ?? '',
      cheeringFrom: (u as any).cheeringFrom ?? '',
      total:        u.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)

  // Players see only their own league; admins see all
  const isPlayer = isApproved && !isAdmin
  const topPerformers = isPlayer
    ? fullBoard.filter(p => p.league === userLeague)
    : fullBoard

  // Scoreboard tab: admins see all leagues, players see only their own
  const visibleLeagues = isAdmin ? LEAGUES : (isPlayer ? [userLeague] : LEAGUES)
  const leagueScoreboards = visibleLeagues.map(league => ({
    league,
    players: (isAdmin ? fullBoard : topPerformers)
      .filter(p => p.league === league)
      .map((p, i) => ({ ...p, rank: i + 1 })),
  }))

  // Group A for sidebar
  const groupATeams = await prisma.team.findMany({ where: { group: 'A' } }).catch(() => [])
  const groupAStandings = groupATeams.map(t => ({
    flag: CODE3_TO_ISO2[t.code?.toUpperCase()] ?? t.code?.toLowerCase()?.slice(0, 2) ?? '',
    code: t.code,
    p: 0, pts: 0, gd: '0-0',
  }))

  // Next 2 upcoming matches for sidebar
  const upcoming = await prisma.match.findMany({
    where: { status: 'upcoming' },
    orderBy: { matchDate: 'asc' },
    take: 2,
    include: { homeTeam: true, awayTeam: true },
  }).catch(() => [])

  function matchFlag(code: string) {
    return CODE3_TO_ISO2[code?.toUpperCase()] ?? code?.toLowerCase()?.slice(0, 2) ?? ''
  }

  const toSidebarMatch = (m: any) => m ? {
    id: m.id,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, code: m.homeTeam.code, flag: matchFlag(m.homeTeam.code) },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, code: m.awayTeam.code, flag: matchFlag(m.awayTeam.code) },
    matchDate: m.matchDate.toISOString(),
    group: m.group,
    stage: m.stage,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    locked: m.locked,
  } : null

  const nextMatch = toSidebarMatch(upcoming[0] ?? null)
  const comingUp  = toSidebarMatch(upcoming[1] ?? null)

  // Player-specific data
  let matches: any[] = []
  let predMap: Record<number, any> = {}
  let userTotalPoints = 0
  let userRank = 0

  if (isApproved) {
    const allMatches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => [])

    matches = allMatches.map(m => ({
      ...m,
      matchDate: m.matchDate.toISOString(),
      homeTeam: { ...m.homeTeam, flag: matchFlag(m.homeTeam.code) },
      awayTeam: { ...m.awayTeam, flag: matchFlag(m.awayTeam.code) },
    }))

    const myPreds = await prisma.prediction.findMany({ where: { userId: user!.id } }).catch(() => [])
    predMap = Object.fromEntries(myPreds.map(p => [p.matchId, p]))
    userTotalPoints = myPreds.reduce((s, p) => s + (p.points ?? 0), 0)

    const myDisplay = (user as any)?.nickname || (user as any)?.username || user?.name
    userRank = topPerformers.findIndex(p => p.display === myDisplay) + 1
  }

  return (
    <PredictionsClient
      isLoggedIn={isApproved}
      matches={matches}
      predMap={predMap}
      userName={user?.name ?? ''}
      userRole={user?.role ?? ''}
      userNickname={(user as any)?.nickname || (user as any)?.username || user?.name || ''}
      userLeague={(user as any)?.league ?? ''}
      userTotalPoints={userTotalPoints}
      userRank={userRank}
      topPerformers={topPerformers}
      leagueScoreboards={leagueScoreboards}
      groupAStandings={groupAStandings}
      nextMatch={nextMatch}
      comingUp={comingUp}
    />
  )
}
