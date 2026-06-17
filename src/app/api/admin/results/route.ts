import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { matchId, homeScore, awayScore } = await req.json()

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: 'finished', locked: true },
  })

  const predictions = await prisma.prediction.findMany({ where: { matchId } })
  for (const pred of predictions) {
    const points = calcPoints(pred.homeScore, pred.awayScore, homeScore, awayScore)
    await prisma.prediction.update({ where: { id: pred.id }, data: { points } })
  }

  return NextResponse.json({ ok: true, scored: predictions.length })
}
