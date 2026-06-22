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
import { calcPoints } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()

    // 1. All finished matches with a recorded score
    const finishedMatches = await prisma.match.findMany({
      where: { status: 'finished', homeScore: { not: null }, awayScore: { not: null } },
    })

    if (finishedMatches.length === 0) {
      return NextResponse.json({ ok: true, matchesProcessed: 0, predictionsChecked: 0, predictionsUpdated: 0 })
    }

    const matchIds = finishedMatches.map(m => m.id)

    // 2. All predictions for those matches in one query
    const predictions = await prisma.prediction.findMany({
      where: { matchId: { in: matchIds } },
    })

    // 3. Build match lookup
    const matchMap = new Map(finishedMatches.map(m => [m.id, m]))

    // 4. Recalculate and collect rows that need updating
    const updates: { id: number; points: number }[] = []

    for (const pred of predictions) {
      const match = matchMap.get(pred.matchId)
      if (!match || match.homeScore === null || match.awayScore === null) continue

      const scorerSet = new Set(
        ((match as any).scorers ?? []).map((s: string) => s.toLowerCase().trim()).filter(Boolean)
      )
      const scorerPred: string = (pred as any).scorerPred ?? ''
      const scorerCorrect = !!scorerPred && scorerSet.has(scorerPred.toLowerCase().trim())

      const points = calcPoints(
        pred.homeScore, pred.awayScore,
        match.homeScore, match.awayScore,
        pred.joker,
        scorerCorrect,
      )

      if (points !== pred.points) {
        updates.push({ id: pred.id, points })
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
