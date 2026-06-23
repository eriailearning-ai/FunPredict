import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { match: { matchDate: 'asc' } },
  })
  return NextResponse.json(predictions)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { matchId, joker } = body
  const homeScore: number | undefined = body.homeScore
  const awayScore: number | undefined = body.awayScore
  // undefined = not sent (joker-only toggle); null = explicitly cleared
  const hasScorerField = 'scorerPred' in body
  const scorerPred: string | null = body.scorerPred ?? null

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.locked || match.status === 'finished') {
    return NextResponse.json({ error: 'Predictions are closed for this match' }, { status: 400 })
  }

  // Joker enforcement: one per stage
  if (joker === true) {
    const sameStageMatchIds = await prisma.match.findMany({
      where: { stage: match.stage },
      select: { id: true },
    })
    const otherIds = sameStageMatchIds.map(m => m.id).filter(id => id !== matchId)
    if (otherIds.length > 0) {
      const existingJoker = await prisma.prediction.findFirst({
        where: { userId: user.id, matchId: { in: otherIds }, joker: true },
      })
      if (existingJoker) {
        return NextResponse.json(
          { error: 'Available multiplier(s) for this set of matches already used.' },
          { status: 400 }
        )
      }
    }
  }

  if (hasScorerField || homeScore !== undefined || awayScore !== undefined) {
    // Full save — includes scorerPred (requires scorerPred column to exist)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Prediction" ("userId", "matchId", "homeScore", "awayScore", joker, "scorerPred")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("userId", "matchId") DO UPDATE SET
        "homeScore"  = EXCLUDED."homeScore",
        "awayScore"  = EXCLUDED."awayScore",
        joker        = EXCLUDED.joker,
        "scorerPred" = EXCLUDED."scorerPred"
    `, user.id, matchId, homeScore ?? 0, awayScore ?? 0, joker ?? false, scorerPred)
  } else {
    // Joker-only toggle — safe even before DB migration, never touches scorerPred
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Prediction" ("userId", "matchId", "homeScore", "awayScore", joker)
      VALUES ($1, $2, 0, 0, $3)
      ON CONFLICT ("userId", "matchId") DO UPDATE SET joker = EXCLUDED.joker
    `, user.id, matchId, joker ?? false)
  }

  return NextResponse.json({ ok: true })
}
