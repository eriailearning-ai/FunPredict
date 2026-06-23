import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  // Raw SQL so scorers[] is always returned regardless of Prisma client version
  const rows: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      m.id, m."matchDate", m.group, m.stage, m.status,
      m."homeScore", m."awayScore", m.locked,
      m.scorers,
      ht.id AS ht_id, ht.name AS ht_name, ht.code AS ht_code,
      at.id AS at_id, at.name AS at_name, at.code AS at_code
    FROM "Match" m
    JOIN "Team" ht ON ht.id = m."homeTeamId"
    JOIN "Team" at ON at.id = m."awayTeamId"
    ORDER BY m."matchDate" ASC
  `)
  const matches = rows.map(r => ({
    id: Number(r.id),
    matchDate: r.matchdate,
    group: r.group,
    stage: r.stage,
    status: r.status,
    homeScore: r.homescore !== null ? Number(r.homescore) : null,
    awayScore: r.awayscore !== null ? Number(r.awayscore) : null,
    locked: Boolean(r.locked),
    scorers: r.scorers ?? [],
    homeTeam: { id: Number(r.ht_id), name: r.ht_name, code: r.ht_code },
    awayTeam: { id: Number(r.at_id), name: r.at_name, code: r.at_code },
  }))
  return NextResponse.json(matches)
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { matchId, action } = await req.json()

  if (action === 'lock') {
    await prisma.match.update({ where: { id: matchId }, data: { locked: true } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'unlock') {
    await prisma.match.update({ where: { id: matchId }, data: { locked: false } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
