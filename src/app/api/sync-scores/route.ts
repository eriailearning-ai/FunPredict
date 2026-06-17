/**
 * Live Score Sync API — /api/sync-scores
 *
 * Fetches current FIFA World Cup 2026 match results from football-data.org
 * and auto-updates the database. No admin manual entry needed.
 *
 * Usage:
 *  - Call GET /api/sync-scores from a cron job (e.g. every 5 min during matches)
 *  - Or call it from an admin dashboard "Sync Now" button (no score editing)
 *
 * Setup:
 *  1. Register free at https://www.football-data.org (free tier = 10 req/min)
 *  2. Set FOOTBALL_DATA_API_KEY in .env.local
 *
 * Scoring is automatically calculated for all existing predictions after sync.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcPoints } from '@/lib/scoring'

// football-data.org competition ID for FIFA World Cup 2026
const WC2026_ID = 2000  // FIFA World Cup
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? ''
const BASE_URL = 'https://api.football-data.org/v4'

// Allow only cron secret or admin session to trigger sync
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev'

interface FDMatch {
  id: number
  utcDate: string
  status: string  // TIMED | IN_PLAY | PAUSED | FINISHED | POSTPONED
  homeTeam: { name: string; shortName: string; tla: string }
  awayTeam: { name: string; shortName: string; tla: string }
  score: {
    fullTime: { home: number | null; away: number | null }
    winner: string | null
  }
}

async function syncMatchResults() {
  if (!API_KEY) {
    return { error: 'FOOTBALL_DATA_API_KEY not set in .env.local. Register free at https://www.football-data.org' }
  }

  // Fetch all World Cup 2026 matches
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

    // Find matching match in our DB by team codes
    const match = await prisma.match.findFirst({
      where: {
        homeTeam: { code: lm.homeTeam.tla },
        awayTeam: { code: lm.awayTeam.tla },
      },
    })
    if (!match) continue

    const isFinished = lm.status === 'FINISHED'
    const isLive = ['IN_PLAY', 'PAUSED'].includes(lm.status)

    // Skip if already finished and scores match
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

    // Score predictions if match is finished
    if (isFinished) {
      const predictions = await prisma.prediction.findMany({ where: { matchId: match.id } })
      for (const pred of predictions) {
        const points = calcPoints(pred.homeScore, pred.awayScore, home, away)
        await prisma.prediction.update({ where: { id: pred.id }, data: { points } })
        scored++
      }
    }
  }

  return { ok: true, updated, scored, total: liveMatches.length }
}

export async function GET(req: NextRequest) {
  // Allow cron secret OR local dev
  const auth = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (auth !== CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await syncMatchResults()
  return NextResponse.json(result)
}

// Also allow POST for "Sync Now" button in admin (no score editing needed)
export async function POST(req: NextRequest) {
  return GET(req)
}
