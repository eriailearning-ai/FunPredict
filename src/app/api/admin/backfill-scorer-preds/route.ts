/**
 * One-time backfill: copies scorer answers from the old BonusAnswer system
 * into the new Prediction.scorerPred column.
 *
 * Optimised for Vercel hobby (10s limit):
 *  - Two bulk queries instead of N+1
 *  - Single $executeRawUnsafe UPDATE per matched row
 *  - Safe to run multiple times (only fills NULL scorerPred rows)
 *
 * POST /api/admin/backfill-scorer-preds
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()

    // 1. Fetch all per-match bonus questions (stage = 'm<matchId>') with answers in one query
    const matchQuestions: any[] = await (prisma as any).bonusQuestion.findMany({
      where: { stage: { startsWith: 'm' } },
      select: { id: true, stage: true, answers: { select: { userId: true, answer: true } } },
    })

    if (matchQuestions.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, skipped: 0, notFound: 0, message: 'No per-match bonus questions found' })
    }

    // 2. Build lookup: { userId_matchId -> answer }
    type Entry = { matchId: number; userId: string; answer: string }
    const entries: Entry[] = []
    for (const q of matchQuestions) {
      const matchId = parseInt(q.stage.slice(1), 10)
      if (isNaN(matchId)) continue
      for (const ans of (q.answers ?? [])) {
        if (ans.answer?.trim()) {
          entries.push({ matchId, userId: ans.userId, answer: ans.answer.trim() })
        }
      }
    }

    if (entries.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, skipped: 0, notFound: 0, message: 'No bonus answers found' })
    }

    // 3. Fetch all relevant predictions in one bulk query
    const matchIds  = [...new Set(entries.map(e => e.matchId))]
    const userIds   = [...new Set(entries.map(e => e.userId))]
    const predictions = await prisma.prediction.findMany({
      where: { matchId: { in: matchIds }, userId: { in: userIds } },
      select: { id: true, matchId: true, userId: true, scorerPred: true } as any,
    })

    // Build map: "userId:matchId" -> prediction
    const predMap = new Map<string, any>()
    for (const p of predictions) predMap.set(`${p.userId}:${p.matchId}`, p)

    // 4. Determine which rows to update (scorerPred currently null/empty)
    const toUpdate: { id: number; answer: string }[] = []
    let skipped  = 0
    let notFound = 0

    for (const e of entries) {
      const pred = predMap.get(`${e.userId}:${e.matchId}`)
      if (!pred) { notFound++; continue }
      const existing = (pred as any).scorerPred
      if (existing !== null && existing !== undefined && existing !== '') { skipped++; continue }
      toUpdate.push({ id: pred.id, answer: e.answer })
    }

    // 5. Update in one raw SQL statement per row (fast, avoids Prisma overhead)
    //    We batch into groups of 50 to stay within query limits
    const BATCH = 50
    for (let i = 0; i < toUpdate.length; i += BATCH) {
      const batch = toUpdate.slice(i, i + BATCH)
      for (const { id, answer } of batch) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Prediction" SET "scorerPred" = $1 WHERE id = $2`,
          answer, id
        )
      }
    }

    return NextResponse.json({
      ok: true,
      updated: toUpdate.length,
      skipped,
      notFound,
    })
  } catch (err: any) {
    console.error('[backfill-scorer-preds]', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
