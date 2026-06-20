import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: 'asc' },
  })
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
