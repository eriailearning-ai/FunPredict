import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

// GET: handle browser navigating directly to /api/auth/login
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login', req.url))
}

export async function POST(req: NextRequest) {
  const loginUrl = new URL('/auth/login', req.url)
  const contentType = req.headers.get('content-type') ?? ''
  const isForm = !contentType.includes('application/json')

  function errRedirect(code: string) {
    loginUrl.searchParams.set('error', code)
    return NextResponse.redirect(loginUrl, 303)
  }

  try {
    let identifier = '', password = ''

    try {
      if (contentType.includes('application/json')) {
        const body = await req.json()
        identifier = body.identifier ?? body.email ?? body.username ?? ''
        password = body.password ?? ''
      } else {
        const text = await req.text()
        const params = new URLSearchParams(text)
        identifier = params.get('identifier') ?? params.get('email') ?? params.get('username') ?? ''
        password = params.get('password') ?? ''
      }
    } catch {
      if (isForm) return errRedirect('invalid')
      return NextResponse.json({ error: 'Could not parse request body' }, { status: 400 })
    }

    if (!identifier) {
      if (isForm) return errRedirect('invalid')
      return NextResponse.json({ error: 'Username, email or phone required' }, { status: 400 })
    }

    // Normalize: if identifier looks like a phone (all digits), strip non-digits for lookup
    const phoneVariant = identifier.replace(/\D/g, '')

    // Try email + username + phone; fall back if phone column not yet migrated
    let user = null
    try {
      user = await prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }, { phone: phoneVariant }] },
      })
    } catch {
      user = await prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] },
      })
    }

    if (!user) {
      if (isForm) return errRedirect('notfound')
      return NextResponse.json({ error: 'No account found with those details' }, { status: 401 })
    }

    const passwordOk = await verifyPassword(password, user.password)
    if (!passwordOk) {
      if (isForm) return errRedirect('wrongpw')
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    if (user.status === 'pending') {
      if (isForm) return errRedirect('pending')
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 403 })
    }
    if (user.status === 'verified') {
      if (isForm) return errRedirect('awaiting')
      return NextResponse.json({ error: 'Your account is awaiting admin approval' }, { status: 403 })
    }
    if (user.status === 'denied') {
      if (isForm) return errRedirect('denied')
      return NextResponse.json({ error: 'Your account was not approved' }, { status: 403 })
    }

    const token = await createSession(user.id)
    const dest = user.role === 'admin' ? '/admin' : '/predictions'
    const maxAge = 30 * 24 * 60 * 60
    const cookie = `session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`

    if (isForm) {
      const res = NextResponse.redirect(new URL(dest, req.url), 303)
      res.headers.set('Set-Cookie', cookie)
      return res
    }

    const res = NextResponse.json({ ok: true, role: user.role })
    res.headers.set('Set-Cookie', cookie)
    return res

  } catch (e: any) {
    console.error('[login] Unexpected error:', e?.message)
    if (isForm) return errRedirect('servererr')
    return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 })
  }
}
