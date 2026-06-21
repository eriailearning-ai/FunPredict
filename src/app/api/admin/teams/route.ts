import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  const teams = await prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] })
  return NextResponse.json(teams)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { name, code, flagCode, group } = await req.json()
  const team = await prisma.team.create({ data: { name, code, flagCode, group, flag: flagCode } })
  return NextResponse.json(team)
}

export async function PUT(req: NextRequest) {
  await requireAdmin()
  const { id, name, code, flagCode, group } = await req.json()
  const team = await prisma.team.update({ where: { id }, data: { name, code, flagCode, group, flag: flagCode } })
  return NextResponse.json(team)
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { id } = await req.json()
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
