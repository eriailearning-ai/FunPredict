import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const leagues = await prisma.league.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true } } },
  })
  return NextResponse.json(leagues)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { name, slug, color } = await req.json()
  const league = await prisma.league.create({ data: { name, slug, color } })
  return NextResponse.json(league)
}

export async function PUT(req: NextRequest) {
  await requireAdmin()
  const { id, name, slug, color } = await req.json()
  const league = await prisma.league.update({ where: { id }, data: { name, slug, color } })
  return NextResponse.json(league)
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { id } = await req.json()
  await prisma.league.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
