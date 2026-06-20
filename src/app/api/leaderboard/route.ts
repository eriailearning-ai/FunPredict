import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { status: 'approved', role: 'player' },
    include: { predictions: { select: { points: true } } },
    orderBy: { name: 'asc' },
  })

  const board = users.map((u) => ({
    id: u.id,
    name: u.name,
    total: u.predictions.reduce((s, p) => s + (p.points ?? 0), 0),
    played: u.predictions.filter((p) => p.points !== null).length,
    exact: u.predictions.filter((p) => p.points === 3).length,
  })).sort((a, b) => b.total - a.total)

  return NextResponse.json(board)
}
