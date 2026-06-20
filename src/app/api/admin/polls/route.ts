import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { votes: true } } },
  })
  return NextResponse.json(polls)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { question, options, matchId, status } = await req.json()
  const opts = options.split('\n').map((o: string) => o.trim()).filter(Boolean)
  const poll = await prisma.poll.create({
    data: { question, options: JSON.stringify(opts), matchId: matchId ?? null, status },
  })
  return NextResponse.json(poll)
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { id, status } = await req.json()
  const poll = await prisma.poll.update({ where: { id }, data: { status } })
  return NextResponse.json(poll)
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { id } = await req.json()
  await prisma.poll.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
