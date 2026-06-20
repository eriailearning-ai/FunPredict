/**
 * Live Score Sync API -- /api/sync-scores
 * Fetches FIFA World Cup 2026 results from football-data.org and updates the DB.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcPoints } from '@/lib/scoring'
import { requireAdmin } from '@/lib/auth'

const WC2026_ID = 2000
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? ''
const BASE_URL = 'https://api.football-data.org/v4'
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev'

interface FDMatch {
  id: number
  utcDate: string
  status: string
  homeTeam: { name: string; shortName: string; tla: string }
  awayTeam: { name: string; shortName: string; tla: string }
  score: { fullTime: { home: number | null; away: number | null }; winner: string | null }
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

    const isFinished = lm.status === 'FINISHED'
    const isLive = ['IN_PLAY', 'PAUSED'].includes(lm.status)

    if (match.status === 'finished' && match.homeScore === home && match.awayScore === away) continue

    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore: home,
        awayScore: away,
        status: isFinished ? 'finished' : isLive ? 'live' : match.status,
        locked: isFinished || isLive,
      },
    })
    updated++

    if (isFinished) {
      const predictions = await prisma.prediction.findMany({ where: { matchId: match.id } })
      for (const pred of predictions) {
        const points = calcPoints(pred.homeScore, pred.awayScore, home, away, pred.joker)
        await prisma.prediction.update({ where: { id: pred.id }, data: { points } })
        scored++
      }
    }
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

  return { ok: true, updated, scored, total: liveMatches.length }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (auth !== CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await syncMatchResults()
  return NextResponse.json(result)
}

// Admin "Sync Now" button — uses session auth instead of cron secret
export async function POST() {
  await requireAdmin()
  const result = await syncMatchResults()
  return NextResponse.json(result)
}
