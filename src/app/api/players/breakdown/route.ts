/**
 * GET /api/players/breakdown?userId=xxx
 * Single query — minimises Neon round-trips to avoid Vercel 10 s timeout.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // One query: user info + all finished predictions — avoids cold-start timeout
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        u.name        AS u_name,
        u.nickname    AS u_nickname,
        u.username    AS u_username,
        u.status      AS u_status,
        p."homeScore" AS pred_h,
        p."awayScore" AS pred_a,
        p.joker       AS joker,
        p."scorerPred" AS scorer_pred,
        p.points      AS stored_points,
        m."homeScore" AS real_h,
        m."awayScore" AS real_a,
        m.scorers     AS scorers,
        m."matchDate" AS match_date,
        ht.name       AS home_team,
        at.name       AS away_team
      FROM "User" u
      LEFT JOIN "Prediction" p ON p."userId" = u.id
      LEFT JOIN "Match" m      ON m.id = p."matchId" AND m.status = 'finished'
      LEFT JOIN "Team" ht      ON ht.id = m."homeTeamId"
      LEFT JOIN "Team" at      ON at.id = m."awayTeamId"
      WHERE u.id = $1 AND u.status = 'approved'
      ORDER BY m."matchDate" ASC
    `, userId)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const first = rows[0]
    const displayName = first.u_nickname || first.u_username || first.u_name

    // Filter to rows where a finished match actually exists
    const matchRows = rows.filter(r => r.home_team !== null)

    let grandTotal = 0
    const breakdown = matchRows.map(r => {
      const pts = r.stored_points !== null ? Number(r.stored_points) : 0
      grandTotal += pts

      const predH = Number(r.pred_h), predA = Number(r.pred_a)
      const hasRealScore = r.real_h !== null && r.real_a !== null
      const realH = hasRealScore ? Number(r.real_h) : null
      const realA = hasRealScore ? Number(r.real_a) : null

      const scorerPred: string = r.scorer_pred ?? ''
      const scorerSet = new Set<string>((r.scorers ?? []).map((s: string) => s.toLowerCase().trim()))
      const scorerCorrect = !!scorerPred && scorerSet.has(scorerPred.toLowerCase().trim())

      let scoreType: string
      if (!hasRealScore) {
        scoreType = 'pending'
      } else if (predH === realH && predA === realA) {
        scoreType = 'exact'
      } else if (Math.sign(predH - predA) === Math.sign(realH! - realA!)) {
        scoreType = 'outcome'
      } else {
        const partial = (predH === realH ? 1 : 0) + (predA === realA ? 1 : 0)
        scoreType = partial > 0 ? 'partial' : 'wrong'
      }

      return {
        match:        `${r.home_team} vs ${r.away_team}`,
        matchDate:    r.match_date,
        myPick:       `${predH}–${predA}`,
        result:       hasRealScore ? `${realH}–${realA}` : '?–?',
        scoreType,
        scorerPred:   scorerPred || null,
        scorerCorrect,
        joker:        Boolean(r.joker),
        points:       pts,
      }
    })

    return NextResponse.json({ userId, name: displayName, grandTotal, breakdown })

  } catch (err: any) {
    console.error('[players/breakdown]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
