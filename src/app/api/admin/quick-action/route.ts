/**
 * GET /api/admin/quick-action?token=xxx
 *
 * One-click approve / deny from admin email.
 * No login required — security comes from the HMAC-signed token.
 * Returns an HTML page with the result.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyActionToken } from '@/lib/action-token'
import { sendEmail, approvedEmailHtml, deniedEmailHtml } from '@/lib/email'

export const dynamic = 'force-dynamic'

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:4001'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''

  const payload = verifyActionToken(token)
  if (!payload) {
    return html('❌ Invalid or expired link', 'This approve/deny link has expired or is invalid. Please use the admin panel.', '#991b1b', BASE + '/admin/users')
  }

  const { userId, action } = payload

  // Fetch user
  const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null)
  if (!user) {
    return html('❌ User not found', 'The player account no longer exists.', '#991b1b', BASE + '/admin/users')
  }

  // Only act if still in 'verified' state (idempotency guard)
  if (user.status === 'approved' && action === 'approve') {
    return html('✅ Already approved', `${user.name} was already approved. No change made.`, '#166534', BASE + '/admin/users')
  }
  if (user.status === 'denied' && action === 'deny') {
    return html('Already denied', `${user.name} was already denied. No change made.`, '#374151', BASE + '/admin/users')
  }

  // Apply action
  await prisma.user.update({ where: { id: userId }, data: { status: action === 'approve' ? 'approved' : 'denied' } })

  // Notify player
  const loginUrl = BASE + '/auth/login'
  if (action === 'approve') {
    await sendEmail(user.email, '🎉 You\'re approved — FIFAFun 2026!', approvedEmailHtml(user.name, loginUrl)).catch(() => {})
    return html('✅ Approved!', `${user.name} (${user.email}) has been approved and notified by email.`, '#166534', BASE + '/admin/users')
  } else {
    await sendEmail(user.email, 'FIFAFun account update', deniedEmailHtml(user.name, ADMIN_EMAIL)).catch(() => {})
    return html('Denied', `${user.name} (${user.email}) has been denied and notified by email.`, '#374151', BASE + '/admin/users')
  }
}

/* ─── HTML response helper ─────────────────────────────────── */
function html(title: string, message: string, color: string, backUrl: string) {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title} — FIFAFun</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f4f6fb; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .icon { font-size: 52px; margin-bottom: 16px; }
  h1 { font-size: 22px; font-weight: 900; color: ${color}; margin-bottom: 12px; }
  p { color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
  a.btn { display: inline-block; background: #1e3a5f; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  a.btn:hover { background: #0d1b3e; }
  .brand { margin-top: 32px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">⚽</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${backUrl}" class="btn">Open admin panel</a>
    <p class="brand">FIFA<strong style="color:#f59e0b">Fun</strong> 2026 · Admin Panel</p>
  </div>
</body>
</html>`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/html' } })
}
