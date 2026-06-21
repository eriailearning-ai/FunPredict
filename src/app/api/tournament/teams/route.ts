import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** Public endpoint — no auth required. Returns all teams. */
export async function GET() {
  try {
    const teams = await prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] })
    return NextResponse.json(teams)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
