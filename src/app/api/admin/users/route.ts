import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { generateToken } from '@/lib/auth'
import { sendEmail, emailEnabled, verifyEmailHtml, approvedEmailHtml, deniedEmailHtml } from '@/lib/email'

const BASE       = process.env.NEXTAUTH_URL ?? 'http://localhost:4001'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export async function GET() {
  await requireAdmin()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, username: true,
      nickname: true, league: true, cheeringFrom: true,
      status: true, role: true, createdAt: true,
    },
  })
  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()
  const { userId, action } = body

  /* ── resend_verify: regenerate token, send or return URL ── */
  if (action === 'resend_verify') {
    const token  = generateToken()
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 h
    const user   = await prisma.user.update({
      where: { id: userId },
      data:  { verifyToken: token, verifyExpiry: expiry, status: 'pending' },
    })
    const verifyUrl = BASE + '/auth/verify?token=' + token
    if (emailEnabled()) {
      await sendEmail(
        user.email,
        '⚽ Verify your FIFAFun 2026 email',
        verifyEmailHtml(user.name, verifyUrl),
      ).catch(() => {})
      return NextResponse.json({ ok: true, sent: true, verifyUrl })
    }
    // SMTP not configured — return URL so admin can share it manually
    return NextResponse.json({ ok: true, sent: false, verifyUrl })
  }

  /* ── force_approve: skip email verify, approve directly ── */
  if (action === 'force_approve') {
    const user = await prisma.user.update({
      where: { id: userId },
      data:  { status: 'approved', verifyToken: null, verifyExpiry: null },
    })
    await sendEmail(
      user.email,
      '🎉 You\'re approved — FIFAFun 2026!',
      approvedEmailHtml(user.name, BASE + '/auth/login'),
    ).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  /* ── standard actions ───────────────────────────────────── */
  let data: Record<string, unknown> = {}
  switch (action) {
    case 'approve':    data = { status: 'approved' };             break
    case 'deny':       data = { status: 'denied' };               break
    case 'make_admin': data = { role: 'admin' };                  break
    case 'make_player':data = { role: 'player' };                 break
    case 'set_league': data = { league: body.league ?? '' };      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id: userId }, data })

  if (action === 'approve') {
    await sendEmail(
      user.email,
      '🎉 You\'re approved — FIFAFun 2026!',
      approvedEmailHtml(user.name, BASE + '/auth/login'),
    ).catch(() => {})
  }

  if (action === 'deny') {
    await sendEmail(
      user.email,
      'FIFAFun account update',
      deniedEmailHtml(user.name, ADMIN_EMAIL),
    ).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
