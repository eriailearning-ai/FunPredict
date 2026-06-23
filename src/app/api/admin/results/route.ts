import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { matchId, homeScore, awayScore, scorers } = await req.json()

  // Normalise scorer list
  const scorerList: string[] = (scorers ?? []).map((s: string) => s.trim()).filter(Boolean)
  const scorerSet = new Set(scorerList.map(s => s.toLowerCase()))

  // Save match result (use raw SQL for scorers — Prisma client may predate schema change)
  await prisma.$executeRawUnsafe(
    `UPDATE "Match"
     SET "homeScore" = $1, "awayScore" = $2, status = 'finished', locked = true, scorers = $3
     WHERE id = $4`,
    homeScore, awayScore, scorerList, matchId
  )

  // Fetch predictions with scorerPred via raw SQL (bypasses stale Prisma client)
  const predictions: any[] = await prisma.$queryRawUnsafe(
    `SELECT id, "homeScore", "awayScore", joker, points, "scorerPred"
     FROM "Prediction"
     WHERE "matchId" = $1`,
    matchId
  )

  for (const pred of predictions) {
    const scorerPred: string = pred.scorerPred ?? ''
    const scorerCorrect = !!scorerPred && scorerSet.has(scorerPred.toLowerCase().trim())

    const points = calcPoints(
      Number(pred.homeScore), Number(pred.awayScore),
      homeScore, awayScore,
      Boolean(pred.joker),
      scorerCorrect,
    )

    await prisma.$executeRawUnsafe(
      `UPDATE "Prediction" SET points = $1 WHERE id = $2`,
      points, Number(pred.id)
    )
  }

  return NextResponse.json({ ok: true, scored: predictions.length })
}
