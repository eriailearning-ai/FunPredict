import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, hashPassword, verifyPassword, generateToken } from '@/lib/auth'
import { sendEmail, verifyEmailHtml, emailEnabled } from '@/lib/email'

export async function GET() {
  const user = await getSession().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  return NextResponse.json({
    name:         user.name,
    email:        user.email,
    username:     user.username ?? '',
    phone:        (user as any).phone ?? '',
    nickname:     user.nickname,
    league:       user.league,
    cheeringFrom: user.cheeringFrom,
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getSession().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, any> = {}
  const messages: string[] = []

  // Nickname
  if (body.nickname !== undefined) {
    const nick = body.nickname.trim()
    if (nick.length < 2 || nick.length > 40) return NextResponse.json({ error: 'Nickname must be 2-40 characters' }, { status: 400 })
    updates.nickname = nick
    messages.push('Nickname updated')
  }

  // Phone
  if (body.phone !== undefined) {
    const phone = body.phone.trim() || null
    if (phone) {
      const existing = await prisma.user.findFirst({ where: { phone, NOT: { id: user.id } } })
      if (existing) return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 })
    }
    updates.phone = phone
    messages.push('Phone updated')
  }

  // Email change — triggers re-verification
  if (body.email !== undefined && body.email.trim().toLowerCase() !== user.email) {
    const newEmail = body.email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: newEmail } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const token = generateToken()
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    updates.email = newEmail
    updates.status = 'pending'
    updates.verifyToken = token
    updates.verifyExpiry = expiry

    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:4001'
    const verifyUrl = `${base}/auth/verify?token=${token}`

    if (emailEnabled()) {
      await sendEmail(newEmail, 'Verify your new FIFAFun email', verifyEmailHtml(user.name, verifyUrl))
    } else {
      console.log('[profile] verify URL:', verifyUrl)
    }
    messages.push('Email updated — please verify your new address')
  }

  // Password change
  if (body.currentPassword && body.newPassword) {
    if (body.newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    const ok = await verifyPassword(body.currentPassword, user.password)
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    updates.password = await hashPassword(body.newPassword)
    messages.push('Password updated')
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: user.id }, data: updates })

  const emailChanged = !!updates.email
  return NextResponse.json({ ok: true, messages, emailChanged })
}
