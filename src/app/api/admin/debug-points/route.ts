/**
 * Debug endpoint — shows per-match points breakdown for a user.
 * GET /api/admin/debug-points?name=goalking
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const name = req.nextUrl.searchParams.get('name') ?? ''

  const user = await prisma.user.findFirst({
    where: { name: { contains: name, mode: 'insensitive' } },
    select: { id: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: `No user found matching "${name}"` }, { status: 404 })

  const rows: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      p.id,
      p."matchId",
      p."homeScore"  AS pred_h,
      p."awayScore"  AS pred_a,
      p.joker,
      p."scorerPred",
      p.points       AS stored_points,
      m."homeScore"  AS real_h,
      m."awayScore"  AS real_a,
      m.scorers,
      m.status,
      ht.name        AS home_team,
      at.name        AS away_team
    FROM "Prediction" p
    JOIN "Match" m  ON m.id = p."matchId"
    JOIN "Team"  ht ON ht.id = m."homeTeamId"
    JOIN "Team"  at ON at.id = m."awayTeamId"
    WHERE p."userId" = $1
    ORDER BY p."matchId"
  `, user.id)

  let grandTotal = 0
  const breakdown = rows.map(r => {
    const isFinished = r.status === 'finished'
    const scorerSet  = new Set((r.scorers ?? []).map((s: string) => s.toLowerCase().trim()))
    const scorerPred: string = r.scorerpred ?? ''   // postgres lowercases column names
    const scorerCorrect = !!scorerPred && scorerSet.has(scorerPred.toLowerCase().trim())

    let scoreLabel = 'pending'
    let recalcPts  = r.stored_points ?? 0

    if (isFinished && r.real_h !== null && r.real_a !== null) {
      const predH = Number(r.pred_h), predA = Number(r.pred_a)
      const realH = Number(r.real_h), realA = Number(r.real_a)
      recalcPts = calcPoints(predH, predA, realH, realA, Boolean(r.joker), scorerCorrect)

      if (predH === realH && predA === realA)            scoreLabel = 'exact (5)'
      else if (Math.sign(predH - predA) === Math.sign(realH - realA)) scoreLabel = 'outcome (3)'
      else {
        let p = 0
        if (predH === realH) p++
        if (predA === realA) p++
        scoreLabel = p > 0 ? `partial (${p})` : 'wrong (0)'
      }
      grandTotal += recalcPts
    }

    return {
      match: `${r.home_team} vs ${r.away_team}`,
      myPick: `${r.pred_h}-${r.pred_a}`,
      result: isFinished ? `${r.real_h}-${r.real_a}` : 'TBD',
      scoreLabel,
      joker: Boolean(r.joker),
      scorerPred: scorerPred || null,
      matchScorers: r.scorers ?? [],
      scorerCorrect,
      storedPoints: r.stored_points,
      recalcPoints: isFinished ? recalcPts : null,
      mismatch: isFinished && r.stored_points !== recalcPts,
    }
  })

  return NextResponse.json({
    user: user.name,
    email: user.email,
    grandTotal,
    storedTotal: rows.reduce((s, r) => s + (r.stored_points ?? 0), 0),
    breakdown,
  }, { status: 200 })
}
