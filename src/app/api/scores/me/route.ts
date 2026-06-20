/**
 * GET /api/scores/me
 * Returns the current user's total points + visible top-performers list.
 *
 * Visibility rule:
 *   Admin  → all leagues
 *   Player → their own league only
 *   Guest  → all leagues (public preview)
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSession().catch(() => null)
  const isAdmin     = user?.role === 'admin'
  const userLeague  = (user as any)?.league ?? ''
  const isPlayer    = !!user && !isAdmin

  const allUsers = await prisma.user.findMany({
    where: { status: 'approved' },
    include: { predictions: { select: { points: true } } },
  }).catch(() => [])

  // Build full board, then filter visibility
  const fullBoard = allUsers.map(u => ({
    id:           u.id,
    display:      (u as any).nickname || (u as any).username || u.name,
    league:       (u as any).league   ?? '',
    cheeringFrom: (u as any).cheeringFrom ?? '',
    total:        u.predictions.reduce((s: number, p: any) => s + (p.points ?? 0), 0),
  })).sort((a, b) => b.total - a.total)

  // Players see only their own league; guests + admins see all
  const topPerformers = isPlayer
    ? fullBoard.filter(p => p.league === userLeague)
    : fullBoard

  // User-specific stats
  let userTotalPoints = 0
  let userRank        = 0
  let matchPts: Array<{ matchId: number; points: number | null }> = []

  if (user?.status === 'approved') {
    const myPreds = await prisma.prediction.findMany({ where: { userId: user.id } }).catch(() => [])
    userTotalPoints = myPreds.reduce((s, p) => s + (p.points ?? 0), 0)
    matchPts        = myPreds.map(p => ({ matchId: p.matchId, points: p.points }))
    // Rank within visible board
    const myDisplay = (user as any).nickname || (user as any).username || user.name
    userRank = topPerformers.findIndex(p => p.display === myDisplay) + 1
  }

  return NextResponse.json({ userTotalPoints, userRank, topPerformers, matchPts })
}
