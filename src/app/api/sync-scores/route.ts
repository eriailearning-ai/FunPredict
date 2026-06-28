/**
 * Live Score Sync API -- /api/sync-scores
 * Fetches FIFA World Cup 2026 results from football-data.org and updates the DB.
 * Auto-populates Match.scorers from the API goals array — no manual entry needed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcPoints, scorerMatches } from '@/lib/scoring'
import { requireAdmin } from '@/lib/auth'

const WC2026_ID = 2000
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? ''
const BASE_URL = 'https://api.football-data.org/v4'
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev'

interface FDGoal {
  minute: number
  type: string   // 'NORMAL' | 'PENALTY' | 'OWN_GOAL'
  scorer: { id: number; name: string }
  team: { id: number; name: string }
}

interface FDMatch {
  id: number
  utcDate: string
  status: string
  homeTeam: { name: string; shortName: string; tla: string }
  awayTeam: { name: string; shortName: string; tla: string }
  score: { fullTime: { home: number | null; away: number | null }; winner: string | null }
  goals?: FDGoal[]
}

async function syncMatchResults() {
  if (!API_KEY) {
    return { error: 'FOOTBALL_DATA_API_KEY not set. Register free at https://www.football-data.org' }
  }

  const res = await fetch(`${BASE_URL}/competitions/${WC2026_ID}/matches`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    return { error: `football-data.org returned ${res.status}: ${await res.text()}` }
  }

  const data = await res.json()
  const liveMatches: FDMatch[] = data.matches ?? []

  let updated = 0
  let scored = 0

  // Map football-data.org match id → DB match id, for scorer backfill below
  const fdToDbId = new Map<number, number>()

  for (const lm of liveMatches) {
    const { home, away } = lm.score.fullTime
    if (home === null || away === null) continue

    const match = await prisma.match.findFirst({
      where: {
        homeTeam: { code: lm.homeTeam.tla },
        awayTeam: { code: lm.awayTeam.tla },
      },
    })
    if (!match) continue
    if (lm.status === 'FINISHED') fdToDbId.set(lm.id, match.id)

    const isFinished = lm.status === 'FINISHED'
    const isLive = ['IN_PLAY', 'PAUSED'].includes(lm.status)

    // Extract scorer names from goals (exclude own goals — they count for the other team)
    const apiScorers: string[] = (lm.goals ?? [])
      .filter(g => g.type !== 'OWN_GOAL')
      .map(g => g.scorer?.name)
      .filter(Boolean)

    // Skip only when scores are unchanged AND the API has no scorer data to add
    // If apiScorers is non-empty, always process — needed to backfill Match.scorers
    if (match.status === 'finished' && match.homeScore === home && match.awayScore === away && apiScorers.length === 0) continue

    // Update match scores + auto-populate scorers from API
    if (apiScorers.length > 0) {
      // We have scorer data from the API — save it
      await prisma.$executeRawUnsafe(
        `UPDATE "Match" SET "homeScore" = $1, "awayScore" = $2, status = $3, locked = $4, scorers = $5::text[]
         WHERE id = $6`,
        home, away,
        isFinished ? 'finished' : isLive ? 'live' : match.status,
        isFinished || isLive,
        '{' + apiScorers.map(s => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',') + '}',
        match.id
      )
    } else {
      // No scorer data yet (match in progress or API didn't return goals) — don't wipe existing scorers
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: home,
          awayScore: away,
          status: isFinished ? 'finished' : isLive ? 'live' : match.status,
          locked: isFinished || isLive,
        },
      })
    }
    updated++

    if (isFinished) {
      // Use raw SQL so scorerPred is included regardless of Prisma client version
      const predictions: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, "homeScore", "awayScore", joker, "scorerPred" FROM "Prediction" WHERE "matchId" = $1`,
        match.id
      )
      // Use API scorers if available; fall back to whatever is stored in DB
      const scorerSet = new Set<string>(
        apiScorers.length > 0
          ? apiScorers.map(s => s.toLowerCase().trim())
          : (await prisma.$queryRawUnsafe<any[]>(`SELECT scorers FROM "Match" WHERE id = $1`, match.id))[0]?.scorers?.map((s: string) => s.toLowerCase().trim()) ?? []
      )
      for (const pred of predictions) {
        const scorerPred: string = pred.scorerPred ?? ''
        const scorerCorrect = scorerMatches(scorerPred, [...scorerSet])
        const points = calcPoints(
          Number(pred.homeScore), Number(pred.awayScore),
          home, away,
          Boolean(pred.joker),
          scorerCorrect,
        )
        await prisma.$executeRawUnsafe(
          `UPDATE "Prediction" SET points = $1 WHERE id = $2`,
          points, Number(pred.id)
        )
        scored++
      }
    }
  }

  // Sync knockout team assignments — for API matches whose DB slot still has TBD teams,
  // look up by matchDate and update homeTeamId/awayTeamId.
  let teamsUpdated = 0
  try {
    const tbdTeam: any = await prisma.team.findFirst({ where: { code: 'TBD' } })
    if (tbdTeam) {
      for (const lm of liveMatches) {
        // Only process TIMED / SCHEDULED / IN_PLAY / FINISHED knockout matches with real teams
        if (!lm.homeTeam?.tla || !lm.awayTeam?.tla) continue
        if (lm.homeTeam.tla === 'TBD' || lm.awayTeam.tla === 'TBD') continue

        // Check if a TBD match exists at this exact UTC kickoff time
        const kickoff = new Date(lm.utcDate)
        const tbdMatch: any = await prisma.match.findFirst({
          where: {
            matchDate: kickoff,
            homeTeamId: tbdTeam.id,
          },
        })
        if (!tbdMatch) continue

        // Resolve team IDs from our DB
        const [homeTeam, awayTeam] = await Promise.all([
          prisma.team.findFirst({ where: { code: lm.homeTeam.tla } }),
          prisma.team.findFirst({ where: { code: lm.awayTeam.tla } }),
        ])
        if (!homeTeam || !awayTeam) continue

        await prisma.$executeRawUnsafe(
          `UPDATE "Match" SET "homeTeamId" = $1, "awayTeamId" = $2 WHERE id = $3`,
          homeTeam.id, awayTeam.id, tbdMatch.id
        )
        teamsUpdated++
      }
    }
  } catch (knockoutErr) {
    console.error('[sync-scores knockout teams]', knockoutErr)
  }

  // Backfill scorers for finished matches that still have an empty scorers array.
  // The competitions endpoint doesn't return goals — fetch individual match endpoints instead.
  // Limit to 5 per sync to stay within free-tier rate limits (10 req/min).
  try {
    const emptyScorers: any[] = await prisma.$queryRawUnsafe(`
      SELECT id FROM "Match"
      WHERE status = 'finished'
        AND (scorers IS NULL OR scorers = '{}')
        AND id = ANY($1::int[])
    `, [...fdToDbId.values()])

    const toBackfill = emptyScorers.slice(0, 5)
    const dbToFd = new Map([...fdToDbId.entries()].map(([fd, db]) => [db, fd]))

    for (const row of toBackfill) {
      const dbId = Number(row.id)
      const fdId = dbToFd.get(dbId)
      if (!fdId) continue

      const mRes = await fetch(`${BASE_URL}/matches/${fdId}`, {
        headers: { 'X-Auth-Token': API_KEY },
        next: { revalidate: 0 },
      })
      if (!mRes.ok) continue

      const mData = await mRes.json()
      const goals: FDGoal[] = mData.match?.goals ?? mData.goals ?? []
      const names: string[] = goals
        .filter(g => g.type !== 'OWN_GOAL')
        .map(g => g.scorer?.name)
        .filter(Boolean)

      if (names.length === 0) continue

      const pgArr = '{' + names.map(n => `"${n.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',') + '}'
      await prisma.$executeRawUnsafe(
        `UPDATE "Match" SET scorers = $1::text[] WHERE id = $2`,
        pgArr, dbId
      )

      // Recalculate points for predictions on this match
      const preds: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, "homeScore", "awayScore", joker, "scorerPred" FROM "Prediction" WHERE "matchId" = $1`, dbId
      )
      const matchRow: any[] = await prisma.$queryRawUnsafe(
        `SELECT "homeScore", "awayScore" FROM "Match" WHERE id = $1`, dbId
      )
      if (!matchRow[0]) continue
      const { homeScore: mH, awayScore: mA } = matchRow[0]
      for (const pred of preds) {
        const sc = scorerMatches(pred.scorerPred ?? '', names)
        const pts = calcPoints(Number(pred.homeScore), Number(pred.awayScore), Number(mH), Number(mA), Boolean(pred.joker), sc)
        await prisma.$executeRawUnsafe(`UPDATE "Prediction" SET points = $1 WHERE id = $2`, pts, Number(pred.id))
        scored++
      }
      updated++
    }
  } catch (backfillErr) {
    console.error('[sync-scores backfill]', backfillErr)
  }

  try {
    const scorersRes = await fetch(`${BASE_URL}/competitions/${WC2026_ID}/scorers?limit=10`, {
      headers: { 'X-Auth-Token': API_KEY },
      next: { revalidate: 0 },
    })
    if (scorersRes.ok) {
      const sd = await scorersRes.json()
      const scorers = (sd.scorers ?? []).slice(0, 10).map((s: any) => ({
        name:    s.player?.name ?? 'Unknown',
        team:    s.team?.shortName ?? s.team?.name ?? '',
        goals:   s.goals ?? 0,
        assists: s.assists ?? 0,
      }))
      await prisma.setting.upsert({
        where:  { key: 'top_scorers' },
        create: { key: 'top_scorers', value: JSON.stringify(scorers) },
        update: { value: JSON.stringify(scorers) },
      })
    }
  } catch {}

  await prisma.setting.upsert({
    where:  { key: 'last_sync_at' },
    create: { key: 'last_sync_at', value: new Date().toISOString() },
    update: { value: new Date().toISOString() },
  }).catch(() => {})

  return { ok: true, updated, scored, teamsUpdated, total: liveMatches.length }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (auth !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await syncMatchResults()
  return NextResponse.json(result)
}

export async function POST() {
  await requireAdmin()
  const result = await syncMatchResults()
  return NextResponse.json(result)
}
