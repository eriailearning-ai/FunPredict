'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')
  const [devUrl, setDevUrl] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (!res.ok) { setError(data.error ?? 'Something went wrong. Please try again.'); return }
      if (data.resetUrl) setDevUrl(data.resetUrl)
      setDone(true)
    } catch {
      setLoading(false)
      setError('Could not reach the server. Please try again.')
    }
  }

  const bg = 'linear-gradient(160deg, #0d1b3e 0%, #1e3a5f 50%, #8b1c2c 100%)'

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-black text-white mb-3">Check your email</h1>
        <p className="text-blue-200 text-sm mb-6">
          If an account exists for <strong className="text-white">{email}</strong>, we sent a password reset link. Check your inbox (and spam folder).
        </p>
        {devUrl && (
          <div className="bg-green-500/15 border border-green-400/40 rounded-xl p-4 text-sm text-green-200 mb-4">
            Local dev: <a href={devUrl} className="underline font-bold text-green-300">Click to reset password</a>
          </div>
        )}
        <Link href="/auth/login" className="text-yellow-400 font-semibold hover:text-yellow-300 text-sm">← Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-3xl font-black text-white mb-1">Forgot Password?</h1>
          <p className="text-sm text-blue-200">Enter your email and we'll send a reset link</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Email address</label>
              <input
                type="email" required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-red-300 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b1c2c, #c0392b)' }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-blue-200 mt-5">
          Remember it?{' '}
          <Link href="/auth/login" className="font-bold text-yellow-400 hover:text-yellow-300">Log in →</Link>
        </p>
      </div>
    </div>
  )
}
