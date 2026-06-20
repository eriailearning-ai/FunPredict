import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { sendEmail, verifyEmailHtml, emailEnabled } from '@/lib/email'
import { z } from 'zod'

const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']

const schema = z.object({
  username:     z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
  name:         z.string().min(2).max(60),
  email:        z.string().email(),
  phone:        z.string().max(20).optional().default(''),
  password:     z.string().min(8),
  nickname:     z.string().min(2).max(40),
  league:       z.string().refine(v => LEAGUES.includes(v), { message: 'Invalid league' }),
  cheeringFrom: z.string().max(60).optional().default(''),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())

    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } })
    if (existingEmail) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const existingUsername = await prisma.user.findUnique({ where: { username: body.username } })
    if (existingUsername) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })

    if (body.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: body.phone } })
      if (existingPhone) return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 })
    }

    const token = generateToken()
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.create({
      data: {
        name:         body.name,
        email:        body.email,
        username:     body.username,
        phone:        body.phone || null,
        nickname:     body.nickname,
        league:       body.league,
        cheeringFrom: body.cheeringFrom ?? '',
        password:     await hashPassword(body.password),
        verifyToken:  token,
        verifyExpiry: expiry,
        status:       'pending',
      },
    })

    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:4001'
    const verifyUrl = base + '/auth/verify?token=' + token

    if (emailEnabled()) {
      await sendEmail(
        body.email,
        'Verify your FIFAFun 2026 email',
        verifyEmailHtml(body.name, verifyUrl),
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true, local: true, verifyUrl })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      const msg = e.errors?.[0]?.message ?? 'Validation error'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: 400 })
  }
}
