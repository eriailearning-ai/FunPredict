import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { matchId, homeScore, awayScore, scorers } = await req.json()

  // Normalise to a clean array and a lookup Set
  const scorerList: string[] = (scorers ?? []).map((s: string) => s.trim()).filter(Boolean)
  const scorerSet = new Set(scorerList.map(s => s.toLowerCase()))

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: 'finished', locked: true, scorers: scorerList },
  })

  const predictions = await prisma.prediction.findMany({ where: { matchId } })
  for (const pred of predictions) {
    const scorerCorrect =
      !!((pred as any).scorerPred) &&
      scorerSet.has(((pred as any).scorerPred as string).toLowerCase().trim())
    const points = calcPoints(
      pred.homeScore, pred.awayScore,
      homeScore, awayScore,
      pred.joker,
      scorerCorrect,
    )
    await prisma.prediction.update({ where: { id: pred.id }, data: { points } })
  }

  return NextResponse.json({ ok: true, scored: predictions.length })
}
