/**
 * GET /api/admin/all-teams
 * Returns all teams sorted by name, for knockout bracket dropdowns.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ teams: teams.map(t => ({ id: t.id, code: t.code, name: t.name })) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
