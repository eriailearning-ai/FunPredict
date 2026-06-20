import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import PredictionsClient from './PredictionsClient'
import { toIso2 } from '@/lib/flags'

export const dynamic = 'force-dynamic'

const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']

export default async function PredictionsPage() {
  const user = await getSession().catch(() => null)
  const isApproved    = user?.status === 'approved'
  const isAdmin       = user?.role === 'admin'
  const isSuperPlayer = user?.role === 'superplayer'
  const seeAll        = isAdmin || isSuperPlayer
  const userLeague    = (user as any)?.league ?? ''

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

  const topPerformers = (seeAll || !userLeague)
    ? fullBoard
    : fullBoard.filter(p => p.league === userLeague)

  const visibleLeagues = (seeAll || !userLeague) ? LEAGUES : [userLeague]
  const leagueScoreboards = visibleLeagues.map(league => ({
    league,
    players: fullBoard
      .filter(p => p.league === league)
      .map((p, i) => ({ ...p, rank: i + 1 })),
  }))

  const [groupATeams, groupAMatches, scorerSetting] = await Promise.all([
    prisma.team.findMany({ where: { group: 'A' } }).catch(() => []),
    prisma.match.findMany({ where: { group: 'A', status: 'finished' }, include: { homeTeam: true, awayTeam: true } }).catch(() => []),
    prisma.setting.findUnique({ where: { key: 'top_scorers' } }).catch(() => null),
  ])

  const topScorers: { name: string; team: string; goals: number; assists: number }[] =
    scorerSetting ? (() => { try { return JSON.parse(scorerSetting.value) } catch { return [] } })() : []

  type Standing = { flag: string; name: string; p: number; pts: number; gd: string }
  let groupAStandings: Standing[]
  if (groupAMatches.length > 0 && groupATeams.length > 0) {
    const tally: Record<number, { name: string; code: string; p: number; w: number; d: number; l: number; gf: number; ga: number }> = {}
    for (const t of groupATeams) tally[t.id] = { name: t.name, code: t.code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
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
      .map(t => ({ flag: toIso2(t.code), name: t.name, p: t.p, pts: t.w * 3 + t.d, gd: t.gf + '-' + t.ga }))
      .sort((a, b) => b.pts - a.pts)
  } else {
    groupAStandings = groupATeams.map(t => ({ flag: toIso2(t.code), name: t.name, p: 0, pts: 0, gd: '0-0' }))
  }

  const upcoming = await prisma.match.findMany({
    where: {
      status: { in: ['upcoming', 'live'] },
      matchDate: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    },
    orderBy: { matchDate: 'asc' },
    take: 2,
    include: { homeTeam: true, awayTeam: true },
  }).catch(() => [])

  const toSidebarMatch = (m: any) => m ? {
    id: m.id,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, code: m.homeTeam.code, flag: toIso2(m.homeTeam.code) },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, code: m.awayTeam.code, flag: toIso2(m.awayTeam.code) },
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

  let matches: any[] = []
  let predMap: Record<number, any> = {}
  let userTotalPoints = 0
  let userRank = 0
  let bonusMap: Record<number, { questionId: number; answer: string | null; points: number | null; status: string; correctAnswer: string | null }> = {}
  let predDistMap: Record<number, { home: number; draw: number; away: number; total: number }> = {}

  if (isApproved) {
    const allMatches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => [])

    matches = allMatches.map((m: any) => ({
      ...m,
      matchDate: m.matchDate.toISOString(),
      homeTeam: { ...m.homeTeam, flag: toIso2(m.homeTeam.code) },
      awayTeam: { ...m.awayTeam, flag: toIso2(m.awayTeam.code) },
    }))

    const myPreds = await prisma.prediction.findMany({ where: { userId: user!.id } }).catch(() => [])
    predMap = Object.fromEntries(myPreds.map(p => [p.matchId, p]))
    userTotalPoints = myPreds.reduce((s, p) => s + (p.points ?? 0), 0)

    const myDisplay = (user as any)?.nickname || (user as any)?.username || user?.name
    userRank = topPerformers.findIndex(p => p.display === myDisplay) + 1

    // Per-match bonus questions (auto-create if missing)
    try {
      const existingBonus: any[] = await (prisma as any).bonusQuestion.findMany({
        where: { stage: { startsWith: 'm' } },
        select: { id: true, stage: true, status: true },
      })
      const existingStages = new Set<string>(existingBonus.map((q: any) => String(q.stage)))

      const missing = allMatches
        .filter((m: any) => !existingStages.has('m' + m.id))
        .map((m: any) => ({
          question: 'Name one player who will score in ' + m.homeTeam.name + ' vs ' + m.awayTeam.name,
          type: 'single',
          stage: 'm' + m.id,
          options: '[]',
          points: 2,
          status: m.status === 'finished' ? 'closed' : 'open',
        }))
      if (missing.length > 0) {
        await (prisma as any).bonusQuestion.createMany({ data: missing }).catch(() => {})
      }

      const finishedStages = allMatches
        .filter((m: any) => m.status === 'finished')
        .map((m: any) => 'm' + m.id)
      if (finishedStages.length > 0) {
        await (prisma as any).bonusQuestion.updateMany({
          where: { stage: { in: finishedStages }, status: 'open' },
          data: { status: 'closed' },
        }).catch(() => {})
      }

      const matchBonusQs: any[] = await (prisma as any).bonusQuestion.findMany({
        where: { stage: { startsWith: 'm' } },
      })
      const userBonusAs: any[] = user ? await (prisma as any).bonusAnswer.findMany({
        where: { userId: user.id, questionId: { in: matchBonusQs.map((q: any) => q.id) } },
      }).catch(() => []) : []

      for (const q of matchBonusQs) {
        const matchId = parseInt(String(q.stage).slice(1))
        if (!isNaN(matchId)) {
          const ua = userBonusAs.find((a: any) => a.questionId === q.id)
          bonusMap[matchId] = {
            questionId: q.id,
            answer: ua?.answer ?? null,
            points: ua?.points ?? null,
            status: q.status,
            correctAnswer: q.status === 'answered' ? q.correctAnswer : null,
          }
        }
      }
    } catch {}

    // Prediction distribution per match
    try {
      const allPredictions = await prisma.prediction.findMany({
        where: { matchId: { in: allMatches.map((m: any) => m.id) } },
        select: { matchId: true, homeScore: true, awayScore: true },
      })
      for (const pred of allPredictions) {
        if (!predDistMap[pred.matchId]) predDistMap[pred.matchId] = { home: 0, draw: 0, away: 0, total: 0 }
        const d = predDistMap[pred.matchId]
        d.total++
        const hs = pred.homeScore ?? 0
        const as_ = pred.awayScore ?? 0
        if (hs > as_) d.home++
        else if (hs === as_) d.draw++
        else d.away++
      }
    } catch {}
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
      leagueScoreboards=