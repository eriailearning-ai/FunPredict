import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/auth/login?error=invalid', req.url))

  const user = await prisma.user.findFirst({ where: { verifyToken: token } })
  if (!user || (user.verifyExpiry && user.verifyExpiry < new Date())) {
    return NextResponse.redirect(new URL('/auth/login?error=expired', req.url))
  }

  // Mark email as verified — admin already received approval email at registration
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'verified', verifyToken: null, verifyExpiry: null },
  })

  return NextResponse.redirect(new URL('/auth/login?verified=1', req.url))
}
