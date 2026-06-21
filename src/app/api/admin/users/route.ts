import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, generateToken, hashPassword } from '@/lib/auth'
import { sendEmail, emailEnabled, verifyEmailHtml, approvedEmailHtml, deniedEmailHtml } from '@/lib/email'

export const dynamic = 'force-dynamic'

const BASE        = process.env.NEXTAUTH_URL ?? 'http://localhost:4001'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

/** Hard timeout wrapper — throws if promise doesn't resolve in time */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DB timeout after ${ms}ms`)), ms)
    ),
  ])
}

/** Fire-and-forget email — never blocks the response */
function sendBg(to: string, subject: string, html: string) {
  sendEmail(to, subject, html).catch(e =>
    console.error('[admin/users] Background email failed:', e)
  )
}

export async function GET() {
  try {
    await withTimeout(requireAdmin(), 6_000)
    const users = await withTimeout(
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, username: true,
          nickname: true, league: true, cheeringFrom: true,
          status: true, role: true, createdAt: true,
        },
      }),
      6_000
    )
    return NextResponse.json(users)
  } catch (e) {
    console.error('[admin/users GET]', e)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await withTimeout(requireAdmin(), 6_000)
    const body = await req.json()
    const { userId, action } = body

    /* ── resend_verify ── */
    if (action === 'resend_verify') {
      const token  = generateToken()
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const user   = await withTimeout(
        prisma.user.update({
          where: { id: userId },
          data:  { verifyToken: token, verifyExpiry: expiry, status: 'pending' },
        }),
        5_000
      )
      const verifyUrl = BASE + '/api/auth/verify?token=' + token
      if (emailEnabled()) {
        sendBg(user.email, '⚽ Verify your FIFAFun 2026 email', verifyEmailHtml(user.name, verifyUrl))
        return NextResponse.json({ ok: true, sent: true, verifyUrl })
      }
      return NextResponse.json({ ok: true, sent: false, verifyUrl })
    }

    /* ── force_approve ── */
    if (action === 'force_approve') {
      const user = await withTimeout(
        prisma.user.update({
          where: { id: userId },
          data:  { status: 'approved', verifyToken: null, verifyExpiry: null },
        }),
        5_000
      )
      sendBg(user.email, "🎉 You're approved — FIFAFun 2026!", approvedEmailHtml(user.name, BASE + '/auth/login'))
      return NextResponse.json({ ok: true })
    }

    /* ── reset_password ── */
    if (action === 'reset_password') {
      const { newPassword } = body
      if (!newPassword || newPassword.length < 8)
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      await withTimeout(
        prisma.user.update({
          where: { id: userId },
          data:  { password: await hashPassword(newPassword) },
        }),
        5_000
      )
      return NextResponse.json({ ok: true })
    }

    /* ── standard actions ── */
    let data: Record<string, unknown> = {}
    switch (action) {
      case 'approve':          data = { status: 'approved' };        break
      case 'deny':             data = { status: 'denied' };          break
      case 'make_admin':       data = { role: 'admin' };             break
      case 'make_player':      data = { role: 'player' };            break
      case 'make_superplayer': data = { role: 'superplayer' };       break
      case 'set_league':       data = { league: body.league ?? '' }; break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const user = await withTimeout(prisma.user.update({ where: { id: userId }, data }), 5_000)

    if (action === 'approve')
      sendBg(user.email, "🎉 You're approved — FIFAFun 2026!", approvedEmailHtml(user.name, BASE + '/auth/login'))
    if (action === 'deny')
      sendBg(user.email, 'FIFAFun account update', deniedEmailHtml(user.name, ADMIN_EMAIL))

    return NextResponse.json({ ok: true })

  } catch (e: any) {
    console.error('[admin/users PATCH]', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await withTimeout(requireAdmin(), 6_000)
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === admin.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    const user = await withTimeout(prisma.user.findUnique({ where: { id: userId } }), 5_000)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.role === 'admin') return NextResponse.json({ error: 'Cannot delete an admin account' }, { status: 400 })

    await withTimeout(prisma.user.delete({ where: { id: userId } }), 5_000)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[admin/users DELETE]', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Something went wrong' }, { status: 500 })
  }
}
