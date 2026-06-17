/**
 * GET  /api/polls          – list open polls with vote counts + user's vote
 * POST /api/polls          – cast a vote (logged-in or anonymous)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Fetch the next 3 upcoming matches to show relevant polls
  let polls: any[] = []

  try {
    // First try: polls that are explicitly open
    polls = await (prisma as any).poll.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        votes: true,
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    })
  } catch {
    // Table not yet migrated
    return NextResponse.json([])
  }

  // If no polls exist yet, auto-generate from next 3 upcoming matches
  if (polls.length === 0) {
    const upcoming = await prisma.match.findMany({
      where: { status: 'upcoming' },
      orderBy: { matchDate: 'asc' },
      take: 3,
      include: { homeTeam: true, awayTeam: true },
    }).catch(() => [])

    for (const m of upcoming) {
      try {
        const existing = await (prisma as any).poll.findFirst({ where: { matchId: m.id } })
        if (!existing) {
          const opts = [`${m.homeTeam.name} win`, 'Draw', `${m.awayTeam.name} win`]
          await (prisma as any).poll.create({
            data: {
              matchId: m.id,
              question: `Who wins ${m.homeTeam.name} vs ${m.awayTeam.name}?`,
              options: JSON.stringify(opts),
              status: 'open',
            },
          })
        }
      } catch {}
    }

    // Re-fetch
    polls = await (prisma as any).poll.findMany({
      where: { status: 'open' },
      take: 3,
      include: { votes: true, match: { include: { homeTeam: true, awayTeam: true } } },
    }).catch(() => [])
  }

  // Get current user's votes
  const session = await getSession().catch(() => null)
  const userId = session?.id ?? null

  const userVotes: Record<number, string> = {}
  if (userId) {
    try {
      const myVotes = await (prisma as any).pollVote.findMany({
        where: { userId, pollId: { in: polls.map((p: any) => p.id) } },
      })
      for (const v of myVotes) userVotes[v.pollId] = v.option
    } catch {}
  }

  // Shape response
  const result = polls.map((p: any) => {
    const opts = JSON.parse(p.options ?? '[]') as string[]
    const total = p.votes.length
    const results = opts.map((opt: string) => {
      const count = p.votes.filter((v: any) => v.option === opt).length
      return { option: opt, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }
    })
    return {
      id: p.id,
      question: p.question,
      options: opts,
      status: p.status,
      matchId: p.matchId,
      match: p.match,
      totalVotes: total,
      results,
      myVote: userVotes[p.id] ?? null,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { pollId, option } = await req.json()
  if (!pollId || !option) {
    return NextResponse.json({ error: 'Missing pollId or option' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)

  try {
    // Check poll is still open
    const poll = await (prisma as any).poll.findUnique({ where: { id: pollId } })
    if (!poll || poll.status !== 'open') {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 })
    }

    if (session?.id) {
      // Logged-in vote — upsert (allow changing vote)
      await (prisma as any).pollVote.upsert({
        where: { pollId_userId: { pollId, userId: session.id } },
        create: { pollId, userId: session.id, option },
        update: { option },
      })
    } else {
      // Anonymous — just count it, use IP as pseudo-id
      const ip = req.headers.get('x-forwarded-for') ?? 'anon'
      const anonId = `anon_${ip}_${pollId}`
      await (prisma as any).pollVote.upsert({
        where: { pollId_userId: { pollId, userId: anonId } },
        create: { pollId, userId: anonId, option },
        update: { option },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
