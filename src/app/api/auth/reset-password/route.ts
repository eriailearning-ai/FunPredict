import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const RESET_PREFIX = 'reset:'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const now = new Date()

    // Try resetToken column first
    let user: { id: string } | null = null
    try {
      user = await prisma.user.findFirst({
        where: { resetToken: token, resetExpiry: { gt: now } },
      })
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: await hashPassword(password), resetToken: null, resetExpiry: null },
        })
        return NextResponse.json({ ok: true })
      }
    } catch {
      // resetToken column missing — fall through to verifyToken fallback
    }

    // Fallback: verifyToken with reset: prefix
    try {
      const fallback = await prisma.user.findFirst({
        where: { verifyToken: RESET_PREFIX + token },
      })
      if (!fallback || !fallback.verifyExpiry || (fallback.verifyExpiry as Date) < now) {
        return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 })
      }
      await prisma.user.update({
        where: { id: fallback.id },
        data: { password: await hashPassword(password), verifyToken: null, verifyExpiry: null },
      })
      return NextResponse.json({ ok: true })
    } catch (e) {
      console.error('[reset-password] Fallback lookup failed:', e)
      return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 })
    }

  } catch (err) {
    console.error('[reset-password] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 })
  }
}
