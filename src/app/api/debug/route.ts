import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public debug endpoint — remove after fixing
export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value ?? null

  const session = token
    ? await prisma.session.findUnique({ where: { token }, include: { user: true } }).catch(e => ({ error: String(e) }))
    : null

  const users = await prisma.user.findMany({ select: { email: true, role: true, status: true } }).catch(e => [{ error: String(e) }])

  return NextResponse.json({ token: token ? token.slice(0, 8) + '...' : null, session, users })
}
