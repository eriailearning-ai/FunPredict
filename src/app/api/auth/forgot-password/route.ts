import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { sendEmail, emailEnabled } from '@/lib/email'

const RESET_PREFIX = 'reset:'

function resetEmailHtml(name: string, resetUrl: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0d1b3e,#1e3a5f);padding:28px 32px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:20px">⚽ FIFAFun 2026</h1>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1e3a5f;margin:0 0 12px">Reset your password</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">Hi <strong>${name}</strong>,<br><br>
        Click the button below to reset your password. This link expires in <strong>1 hour</strong>.
      </p>
      <p style="text-align:center;margin:28px 0">
        <a href="${resetUrl}" style="background:#8b1c2c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          Reset My Password
        </a>
      </p>
      <p style="color:#9ca3af;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    let email = ''
    try {
      const body = await req.json()
      email = (body.email ?? '').trim().toLowerCase()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Find user
    let user: { id: string; name: string; email: string } | null = null
    try {
      user = await prisma.user.findUnique({ where: { email } })
    } catch (e) {
      console.error('[forgot-password] DB lookup failed:', e)
      return NextResponse.json({ ok: true }) // fail silently — don't reveal whether email exists
    }

    if (!user) return NextResponse.json({ ok: true })

    const token = generateToken()
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Try resetToken first; fall back to verifyToken with a reset: prefix
    let saved = false
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpiry: expiry },
      })
      saved = true
    } catch {
      // resetToken column likely not migrated — use verifyToken as fallback
    }

    if (!saved) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { verifyToken: RESET_PREFIX + token, verifyExpiry: expiry },
        })
        saved = true
      } catch (e) {
        console.error('[forgot-password] Could not save reset token:', e)
        return NextResponse.json({ error: 'Reset unavailable — please contact admin' }, { status: 500 })
      }
    }

    const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin
    const resetUrl = `${base}/auth/reset-password?token=${token}`

    if (emailEnabled()) {
      try {
        await sendEmail(user.email, 'Reset your FIFAFun password', resetEmailHtml(user.name, resetUrl))
        console.log('[forgot-password] Reset email sent to', user.email)
      } catch (e) {
        console.error('[forgot-password] Email send failed:', e)
        // Token saved — still return ok
      }
    } else {
      console.log('[forgot-password] SMTP disabled — reset URL:', resetUrl)
    }

    return NextResponse.json({ ok: true, ...(emailEnabled() ? {} : { resetUrl }) })

  } catch (err) {
    console.error('[forgot-password] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 })
  }
}
