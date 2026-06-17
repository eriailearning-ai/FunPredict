import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, adminApprovalEmailHtml } from '@/lib/email'
import { createActionToken } from '@/lib/action-token'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/auth/login?error=invalid', req.url))

  const user = await prisma.user.findFirst({ where: { verifyToken: token } })
  if (!user || (user.verifyExpiry && user.verifyExpiry < new Date())) {
    return NextResponse.redirect(new URL('/auth/login?error=expired', req.url))
  }

  // Mark as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'verified', verifyToken: null, verifyExpiry: null },
  })

  // Build one-click approve/deny URLs for admin email
  const base       = process.env.NEXTAUTH_URL ?? ''
  const approveUrl = base + '/api/admin/quick-action?token=' + createActionToken(user.id, 'approve')
  const denyUrl    = base + '/api/admin/quick-action?token=' + createActionToken(user.id, 'deny')
  const adminPanel = base + '/admin/users'

  // Notify all admins
  const admins = await prisma.user.findMany({ where: { role: 'admin' } })
  const subject = `[FIFAFun] New player: ${user.name} needs approval`
  for (const admin of admins) {
    await sendEmail(
      admin.email,
      subject,
      adminApprovalEmailHtml(
        user.name,
        user.email,
        (user as any).username ?? '',
        (user as any).nickname ?? '',
        (user as any).league ?? '',
        (user as any).cheeringFrom ?? '',
        approveUrl,
        denyUrl,
        adminPanel,
      ),
    ).catch(() => {})
  }

  return NextResponse.redirect(new URL('/auth/login?verified=1', req.url))
}
