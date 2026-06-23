/**
 * POST /api/admin/reset-points
 * Zeros all Prediction.points — use before knockout phase to start fresh leaderboard.
 * Admin only. Irreversible.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "Prediction" SET points = 0`
    )
    return NextResponse.json({ ok: true, updated: Number(result) })
  } catch (err: any) {
    console.error('[reset-points]', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
