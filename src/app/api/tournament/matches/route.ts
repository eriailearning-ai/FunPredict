import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/** Public endpoint — no auth required. Returns all matches with team info. */
export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    })
    return NextResponse.json(matches)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
