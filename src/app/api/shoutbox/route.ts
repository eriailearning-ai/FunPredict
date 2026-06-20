/**
 * GET  /api/shoutbox  – last 60 messages (newest first)
 * POST /api/shoutbox  – post a message (logged-in or guest)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Simple in-memory rate limit: 1 post per 20s per IP
const rateLimitMap = new Map<string, number>()

export async function GET() {
  try {
    const messages = await (prisma as any).shoutboxMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        user: { select: { nickname: true, username: true, name: true, role: true } },
      },
    })
    return NextResponse.json(messages.reverse())
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate limit
  const last = rateLimitMap.get(ip) ?? 0
  if (Date.now() - last < 20_000) {
    return NextResponse.json({ error: 'Please wait before posting again.' }, { status: 429 })
  }

  const { message, guestName } = await req.json()
  const trimmed = (message ?? '').trim()
  if (!trimmed || trimmed.length > 300) {
    return NextResponse.json({ error: 'Message must be 1–300 characters.' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)

  try {
    const created = await (prisma as any).shoutboxMessage.create({
      data: {
        userId: session?.id ?? null,
        guestName: session
          ? ((session as any).nickname || (session as any).username || session.name)
          : (guestName?.trim() || 'Guest'),
        message: trimmed,
        ip,
      },
      include: {
        user: { select: { nickname: true, username: true, name: true, role: true } },
      },
    })
    rateLimitMap.set(ip, Date.now())
    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
