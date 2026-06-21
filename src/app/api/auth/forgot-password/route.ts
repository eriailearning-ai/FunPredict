import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { sendEmail, emailEnabled } from '@/lib/email'

const RESET_PREFIX = 'reset:'

/** Races a promise against a timeout — throws if timeout wins */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

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
    // 1. Parse body
    let email = ''
    try {
      const body = await req.json()
      email = (body.email ?? '').trim().toLowerCase()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // 2. Find user — 4s timeout on DB
    let user: { id: string; name: string; email: string } | null = null
    try {
      user = await withTimeout(
        prisma.user.findUnique({ where: { email } }),
        4_000, 'DB findUnique'
      )
    } catch (e) {
      console.error('[forgot-password] DB lookup failed/timed out:', e)
      return NextResponse.json({ error: 'Service unavailable, please try again.' }, { status: 503 })
    }

    if (!user) return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

    // 3. Save reset token — try resetToken cols, fall back to verifyToken
    const token = generateToken()
    const expiry = new Date(Date.now() + 60 * 60 * 1000)
    let saved = false

    try {
      await withTimeout(
        prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetExpiry: expiry } }),
        3_000, 'DB update resetToken'
      )
      saved = true
    } catch (e) {
      console.error('[forgot-password] resetToken save failed, trying verifyToken fallback:', e)
    }

    if (!saved) {
      try {
        await withTimeout(
          prisma.user.update({ where: { id: user.id }, data: { verifyToken: RESET_PREFIX + token, verifyExpiry: expiry } }),
          3_000, 'DB update verifyToken fallback'
        )
        saved = true
      } catch (e) {
        console.error('[forgot-password] verifyToken fallback also failed:', e)
        return NextResponse.json({ error: 'Reset unavailable right now — please try again later' }, { status: 500 })
      }
    }

    // 4. Build reset URL
    const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin
    const resetUrl = `${base}/auth/reset-password?token=${token}`

    // 5. Send email — await with 7s budget (DB ops above take ~0.5s when warm,
    //    leaving plenty of headroom under Vercel's 10s limit)
    if (emailEnabled()) {
      try {
        await withTimeout(
          sendEmail(user.email, 'Reset your FIFAFun password', resetEmailHtml(user.name, resetUrl)),
          7_000, 'sendEmail'
        )
        console.log('[forgot-password] Reset email sent to', user!.email)
      } catch (e) {
        console.error('[forgot-password] Email send failed (non-fatal):', e)
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
