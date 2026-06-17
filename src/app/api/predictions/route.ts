import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { match: { matchDate: 'asc' } },
  })
  return NextResponse.json(predictions)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { matchId, joker } = body
  const homeScore: number | undefined = body.homeScore
  const awayScore: number | undefined = body.awayScore

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.locked || match.status === 'finished') {
    return NextResponse.json({ error: 'Predictions are closed for this match' }, { status: 400 })
  }

  // Joker enforcement: one per group stage — clear any existing joker in same group/stage
  if (joker === true) {
    const sameGroupMatchIds = await prisma.match.findMany({
      where: { group: match.group, stage: match.stage },
      select: { id: true },
    })
    const otherIds = sameGroupMatchIds.map(m => m.id).filter(id => id !== matchId)
    if (otherIds.length > 0) {
      await prisma.prediction.updateMany({
        where: { userId: user.id, matchId: { in: otherIds }, joker: true },
        data: { joker: false },
      })
    }
  }

  const updateData: any = {}
  if (homeScore !== undefined) updateData.homeScore = homeScore
  if (awayScore !== undefined) updateData.awayScore = awayScore
  if (joker !== undefined)    updateData.joker     = joker

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    create: {
      userId: user.id, matchId,
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      joker: joker ?? false,
    },
    update: updateData,
  })
  return NextResponse.json(prediction)
}
