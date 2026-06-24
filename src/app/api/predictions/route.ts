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
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { matchId, joker } = body
    const homeScore: number | undefined = body.homeScore
    const awayScore: number | undefined = body.awayScore
    const hasScorerField = 'scorerPred' in body
    const scorerPred: string | null = body.scorerPred ?? null

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (match.locked || match.status === 'finished') {
      return NextResponse.json({ error: 'Predictions are closed for this match' }, { status: 400 })
    }

    // Joker enforcement: one per stage — once used anywhere in the stage, can't use again
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
            { error: 'Joker already used for this stage.' },
            { status: 400 }
          )
        }
      }
    }

    const hasJokerField = 'joker' in body

    if (hasScorerField || homeScore !== undefined || awayScore !== undefined) {
      // Full save (score + scorer). Only update joker if explicitly sent —
      // savePred never sends joker, so we must not overwrite an existing joker=true.
      if (hasJokerField) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "Prediction" ("userId", "matchId", "homeScore", "awayScore", joker, "scorerPred", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT ("userId", "matchId") DO UPDATE SET
            "homeScore"  = EXCLUDED."homeScore",
            "awayScore"  = EXCLUDED."awayScore",
            joker        = EXCLUDED.joker,
            "scorerPred" = EXCLUDED."scorerPred",
            "updatedAt"  = NOW()
        `, user.id, matchId, homeScore ?? 0, awayScore ?? 0, joker ?? false, scorerPred)
      } else {
        // joker not sent — preserve whatever is already in DB
        await prisma.$executeRawUnsafe(`
          INSERT INTO "Prediction" ("userId", "matchId", "homeScore", "awayScore", joker, "scorerPred", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, false, $5, NOW(), NOW())
          ON CONFLICT ("userId", "matchId") DO UPDATE SET
            "homeScore"  = EXCLUDED."homeScore",
            "awayScore"  = EXCLUDED."awayScore",
            "scorerPred" = EXCLUDED."scorerPred",
            "updatedAt"  = NOW()
        `, user.id, matchId, homeScore ?? 0, awayScore ?? 0, scorerPred)
      }
    } else {
      // Joker-only toggle — never touches scores or scorerPred
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Prediction" ("userId", "matchId", "homeScore", "awayScore", joker, "createdAt", "updatedAt")
        VALUES ($1, $2, 0, 0, $3, NOW(), NOW())
        ON CONFLICT ("userId", "matchId") DO UPDATE SET
          joker       = EXCLUDED.joker,
          "updatedAt" = NOW()
      `, user.id, matchId, joker ?? false)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[predictions POST]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
