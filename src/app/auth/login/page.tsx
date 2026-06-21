'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const params = useSearchParams()
  const verified = params.get('verified') === '1'
  const errorMsg: Record<string, { text: string; hint?: string }> = {
    notfound: { text: 'No account found with that email or username.', hint: 'Double-check your details or register a new account.' },
    wrongpw:  { text: 'Incorrect password.', hint: 'forgot-password' },
    invalid:  { text: 'Invalid username/email or password.' },
    pending:  { text: 'Please verify your email before logging in.', hint: 'Check your inbox (and spam folder) for the verification link.' },
    awaiting: { text: "Your account hasn't been approved yet.", hint: 'The admin has been notified — please try again later.' },
    denied:   { text: 'Your account was not approved.', hint: 'Contact the admin if you think this is a mistake.' },
    expired:   { text: 'Verification link expired.', hint: 'Please register again.' },
    servererr: { text: 'Something went wrong on our end.', hint: 'Please try again in a moment.' },
  }
  const err = params.get('error')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0d1b3e 0%, #1e3a5f 50%, #8b1c2c 100%)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="rounded-2xl overflow-hidden bg-white shadow-lg flex-shrink-0"
            style={{ width: 72, height: 72, padding: 4 }}>
            <img src="/images/logo/cropped-worldcup-eagle-logo-1.png" alt="FIFAFun"
              className="w-full h-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <span className="text-white font-black text-base tracking-tight leading-tight">
            FIFA<span className="text-yellow-400">Fun</span><br />
            <span className="text-xs font-semibold text-blue-200 tracking-wide">World Cup 2026</span>
          </span>
        </Link>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚽</div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">
              Welcome Back!
            </h1>
            <p className="text-sm text-blue-200">Log in to FIFAFun and join the fun</p>
          </div>

          {/* Alerts */}
          {verified && (
            <div className="mb-4 bg-green-500/20 border border-green-400/40 text-green-200 p-3 rounded-xl text-sm font-medium">
              ✅ Email verified! Waiting for admin approval before you can log in.
            </div>
          )}
          {err && (() => {
            const e = errorMsg[err] ?? { text: 'Something went wrong. Please try again.' }
            return (
              <div className="mb-4 bg-red-500/20 border border-red-400/40 text-red-200 p-3 rounded-xl text-sm">
                <p className="font-semibold">⚠ {e.text}</p>
                {e.hint && e.hint !== 'forgot-password' && (
                  <p className="mt-1 text-red-300 text-xs">{e.hint}</p>
                )}
                {e.hint === 'forgot-password' && (
                  <p className="mt-1 text-xs text-red-300">
                    Forgot it?{' '}
                    <Link href="/auth/forgot-password" className="text-yellow-300 font-semibold hover:underline">
                      Reset your password →
                    </Link>
                  </p>
                )}
              </div>
            )
          })()}

          {/* Form card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-7 shadow-2xl">
            <form action="/api/auth/login" method="POST" className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-1.5">
                  Username or Email
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  type="text"
                  name="identifier"
                  required
                  autoComplete="username"
                  placeholder="Enter username or email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-1.5">
                  Password
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-blue-200 cursor-pointer select-none">
                  <input type="checkbox" name="remember"
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-yellow-400 focus:ring-yellow-400" />
                  Remember Me
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-yellow-400 hover:text-yellow-300 font-semibold">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] mt-2"
                style={{ background: 'linear-gradient(135deg, #8b1c2c, #c0392b)' }}
              >
                Log In to FIFAFun
              </button>
            </form>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-blue-200 mt-5">
            Not registered yet?{' '}
            <Link href="/auth/register" className="font-bold text-yellow-400 hover:text-yellow-300">
              Create a free account →
            </Link>
          </p>

          {/* Note */}
          <div className="mt-5 bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-3 text-xs text-yellow-200 text-center">
            After registering, verify your email and wait for admin approval before logging in.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-blue-400 pb-5">
        <Link href="/disclaimer" className="hover:text-blue-300">Disclaimer</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-blue-300">Privacy Policy</Link>
        <span className="mx-2">·</span>
        <span>© 2026 WorldCup FIFAFun</span>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
