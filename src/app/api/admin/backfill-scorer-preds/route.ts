/**
 * One-time backfill: copies scorer answers from the old BonusAnswer system
 * into the new Prediction.scorerPred column.
 *
 * Safe to run multiple times — only updates rows where scorerPred IS NULL.
 *
 * POST /api/admin/backfill-scorer-preds
 * Returns: { updated, skipped, notFound }
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  await requireAdmin()

  // 1. Find all per-match bonus questions (stage = 'm<matchId>')
  const matchQuestions: any[] = await (prisma as any).bonusQuestion.findMany({
    where: { stage: { startsWith: 'm' } },
    include: { answers: true },
  })

  let updated  = 0
  let skipped  = 0   // scorerPred already set — don't overwrite
  let notFound = 0   // no matching prediction row

  for (const q of matchQuestions) {
    // Extract numeric matchId from stage string e.g. 'm42' → 42
    const matchId = parseInt(q.stage.slice(1), 10)
    if (isNaN(matchId)) continue

    for (const ans of q.answers) {
      if (!ans.answer?.trim()) continue

      // Find the prediction for this user + match
      const pred = await prisma.prediction.findUnique({
        where: { userId_matchId: { userId: ans.userId, matchId } },
      })

      if (!pred) { notFound++; continue }

      // Only backfill if scorerPred is currently null — never overwrite a live pick
      if ((pred as any).scorerPred !== null && (pred as any).scorerPred !== undefined && (pred as any).scorerPred !== '') {
        skipped++
        continue
      }

      await prisma.prediction.update({
        where: { id: pred.id },
        data: { scorerPred: ans.answer.trim() } as any,
      })
      updated++
    }
  }

  return NextResponse.json({ ok: true, updated, skipped, notFound })
}
