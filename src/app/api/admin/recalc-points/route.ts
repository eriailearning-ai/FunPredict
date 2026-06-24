/**
 * Recalculates points for ALL predictions on ALL finished matches.
 * Uses the stored match.scorers array so scorer bonus is applied correctly.
 * Safe to run multiple times.
 *
 * Optimised for Vercel hobby (10s limit):
 *  - Bulk-fetches all finished matches + all their predictions in two queries
 *  - Only issues UPDATE when the stored points value actually changes
 *
 * POST /api/admin/recalc-points
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints, scorerMatches } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()

    // 1. All finished matches with a recorded score — raw SQL to get `scorers` array
    //    (Prisma client may be older than schema, so use raw to avoid field-unknown errors)
    const finishedMatches: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, "homeScore", "awayScore", scorers
       FROM "Match"
       WHERE status = 'finished'
         AND "homeScore" IS NOT NULL
         AND "awayScore" IS NOT NULL`
    )

    if (finishedMatches.length === 0) {
      return NextResponse.json({ ok: true, matchesProcessed: 0, predictionsChecked: 0, predictionsUpdated: 0 })
    }

    const matchIds = finishedMatches.map((m: any) => m.id)

    // 2. All predictions for those matches — raw SQL to get `scorerPred`
    const predictions: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, "matchId", "homeScore", "awayScore", joker, points, "scorerPred"
       FROM "Prediction"
       WHERE "matchId" = ANY($1::int[])`,
      matchIds
    )

    // 3. Build match lookup
    const matchMap = new Map(finishedMatches.map((m: any) => [m.id, m]))

    // 4. Recalculate and collect rows that need updating
    const updates: { id: number; points: number }[] = []

    for (const pred of predictions) {
      const match = matchMap.get(Number(pred.matchId))
      if (!match || match.homeScore === null || match.awayScore === null) continue

      const scorerSet = new Set(
        (match.scorers ?? []).map((s: string) => s.toLowerCase().trim()).filter(Boolean)
      )
      const scorerPred: string = pred.scorerPred ?? ''
      const scorerCorrect = scorerMatches(scorerPred, [...scorerSet])

      // Raw SQL returns BigInt for numeric columns — coerce to Number
      const points = calcPoints(
        Number(pred.homeScore), Number(pred.awayScore),
        Number(match.homeScore), Number(match.awayScore),
        Boolean(pred.joker),
        scorerCorrect,
      )

      if (points !== Number(pred.points)) {
        updates.push({ id: Number(pred.id), points })
      }
    }

    // 5. Apply updates in batches of 50
    const BATCH = 50
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH)
      for (const { id, points } of batch) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Prediction" SET points = $1 WHERE id = $2`,
          points, id
        )
      }
    }

    return NextResponse.json({
      ok: true,
      matchesProcessed: finishedMatches.length,
      predictionsChecked: predictions.length,
      predictionsUpdated: updates.length,
    })
  } catch (err: any) {
    console.error('[recalc-points]', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
