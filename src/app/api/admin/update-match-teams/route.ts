/**
 * POST /api/admin/update-match-teams
 * Updates homeTeamId / awayTeamId for a knockout match.
 * Used by the Knockout Bracket admin page to assign real teams to TBD slots.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { matchId, homeCode, awayCode } = await req.json()
    if (!matchId || !homeCode || !awayCode) {
      return NextResponse.json({ error: 'matchId, homeCode, awayCode required' }, { status: 400 })
    }

    const [home, away] = await Promise.all([
      prisma.team.findUnique({ where: { code: homeCode } }),
      prisma.team.findUnique({ where: { code: awayCode } }),
    ])
    if (!home) return NextResponse.json({ error: `Team not found: ${homeCode}` }, { status: 404 })
    if (!away) return NextResponse.json({ error: `Team not found: ${awayCode}` }, { status: 404 })

    await prisma.$executeRawUnsafe(
      `UPDATE "Match" SET "homeTeamId" = $1, "awayTeamId" = $2 WHERE id = $3`,
      home.id, away.id, Number(matchId)
    )

    return NextResponse.json({ ok: true, match: matchId, home: home.name, away: away.name })
  } catch (err: any) {
    console.error('[update-match-teams]', err)
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
