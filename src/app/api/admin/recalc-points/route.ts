/**
 * Recalculates points for ALL predictions on ALL finished matches.
 * Uses the stored match.scorers array so scorer bonus is applied correctly.
 * Safe to run multiple times.
 *
 * POST /api/admin/recalc-points
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST() {
  await requireAdmin()

  const finishedMatches = await prisma.match.findMany({
    where: { status: 'finished' },
  })

  let totalPredictions = 0
  let totalUpdated = 0

  for (const match of finishedMatches) {
    if (match.homeScore === null || match.awayScore === null) continue

    const scorerSet = new Set(
      ((match as any).scorers ?? []).map((s: string) => s.toLowerCase().trim()).filter(Boolean)
    )

    const predictions = await prisma.prediction.findMany({ where: { matchId: match.id } })
    totalPredictions += predictions.length

    for (const pred of predictions) {
      const scorerCorrect =
        !!((pred as any).scorerPred) &&
        scorerSet.has(((pred as any).scorerPred as string).toLowerCase().trim())

      const points = calcPoints(
        pred.homeScore, pred.awayScore,
        match.homeScore, match.awayScore,
        pred.joker,
        scorerCorrect,
      )

      if (points !== pred.points) {
        await prisma.prediction.update({ where: { id: pred.id }, data: { points } })
        totalUpdated++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    matchesProcessed: finishedMatches.length,
    predictionsChecked: totalPredictions,
    predictionsUpdated: totalUpdated,
  })
}
