/**
 * GET /api/admin/knockout-matches
 * Returns all non-group-stage matches with team info for the knockout bracket admin page.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const matches: any[] = await prisma.$queryRawUnsafe(`
      SELECT m.id, m."group", m.stage, m."matchDate", m.venue,
             m."homeScore", m."awayScore", m.status,
             ht.id AS "homeId", ht.code AS "homeCode", ht.name AS "homeName",
             at.id AS "awayId", at.code AS "awayCode", at.name AS "awayName"
      FROM "Match" m
      JOIN "Team" ht ON ht.id = m."homeTeamId"
      JOIN "Team" at ON at.id = m."awayTeamId"
      WHERE m.stage <> 'group'
      ORDER BY m."matchDate" ASC
    `)

    return NextResponse.json({
      matches: matches.map(m => ({
        id:        Number(m.id),
        group:     m.group,
        stage:     m.stage,
        matchDate: m.matchDate,
        venue:     m.venue,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status:    m.status,
        homeTeam:  { id: Number(m.homeId), code: m.homeCode, name: m.homeName },
        awayTeam:  { id: Number(m.awayId), code: m.awayCode, name: m.awayName },
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
