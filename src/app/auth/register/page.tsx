'use client'
import { useState } from 'react'
import Link from 'next/link'

const LEAGUES = ['Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    name: '', nickname: '', league: '', cheeringFrom: '',
  })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [verifyUrl, setVerifyUrl] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        name: form.name,
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        league: form.league,
        cheeringFrom: form.cheeringFrom,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    if (data.verifyUrl) setVerifyUrl(data.verifyUrl)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #0d1b3e 0%, #1e3a5f 50%, #8b1c2c 100%)' }}>
      <div className="w-full max-w-lg text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-black text-white mb-3">You're in!</h1>
        <p className="text-blue-200 text-sm mb-6">
          We sent a verification email to your inbox. Open the link to verify your address,
          then wait for admin approval before you can log in and play.
        </p>
        <div className="bg-yellow-500/15 border border-yellow-400/40 text-yellow-200 p-4 rounded-xl text-sm font-medium mb-4">
          📧 Check your spam or junk folder if you don't see the verification email within a few minutes.
        </div>
        {verifyUrl && (
          <div className="bg-green-500/15 border border-green-400/40 rounded-xl p-4 text-sm text-green-200 mb-4">
            ✅ Local site detected.{' '}
            <a href={verifyUrl} className="underline font-bold text-green-300">Click here to verify your email</a>
            , then wait for admin approval before logging in.
          </div>
        )}
        <Link href="/auth/login" className="inline-block mt-2 text-sm text-yellow-400 font-semibold hover:text-yellow-300">
          ← Back to login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0d1b3e 0%, #1e3a5f 60%, #8b1c2c 100%)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 max-w-5xl mx-auto">
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
        <Link href="/auth/login" className="text-sm text-yellow-400 font-semibold hover:text-yellow-300">
          Already have an account? Log in →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10 pt-2">

        {/* Hero */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="text-2xl font-black text-white mb-1">Join FIFAFun 2026</h1>
          <p className="text-sm text-blue-200">Create an account and predict every World Cup match</p>
        </div>

        {/* Notice */}
        <div className="bg-yellow-500/15 border border-yellow-400/40 rounded-xl p-3 text-sm text-yellow-200 mb-5 font-medium text-center">
          After registering, verify your email, then wait for admin approval before you can log in and play.
        </div>

        {/* Form card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={submit} className="space-y-4">

            {/* Row 1: Username + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. GoalKing99"
                  required
                  value={form.username}
                  onChange={set('username')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
            </div>

            {/* Row 2: Password + Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  type="password"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                />
              </div>
            </div>

            {/* Row 3: Full name + Nickname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. Maria Lopez"
                  required
                  value={form.name}
                  onChange={set('name')}
                />
                <p className="text-xs text-blue-400 mt-1">Admin review only — not shown publicly</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                  Funny Nickname <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. GoalKing, PenaltyQueen"
                  required
                  value={form.nickname}
                  onChange={set('nickname')}
                />
                <p className="text-xs text-blue-400 mt-1">Your public alias on leaderboards</p>
              </div>
            </div>

            {/* League selector */}
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                League <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
                value={form.league}
                onChange={set('league')}
                style={{ colorScheme: 'dark' }}
              >
                <option value="" style={{ background: '#1e3a5f' }}>— Select your league group —</option>
                {LEAGUES.map(l => <option key={l} value={l} style={{ background: '#1e3a5f' }}>{l}</option>)}
              </select>
              <p className="text-xs text-blue-400 mt-1">Pick the league standings group you belong to</p>
            </div>

            {/* Cheering from */}
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wide mb-1.5">
                Cheering From <span className="text-blue-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. USA, Mexico, Canada"
                value={form.cheeringFrom}
                onChange={set('cheeringFrom')}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 text-sm text-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #8b1c2c, #c0392b)' }}
            >
              {loading ? 'Submitting…' : '⚽ Create My Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-blue-200 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-yellow-400 hover:text-yellow-300">Log in →</Link>
        </p>

        {/* Footer */}
        <div className="text-center text-xs text-blue-500 mt-6">
          <Link href="/disclaimer" className="hover:text-blue-300">Disclaimer</Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:text-blue-300">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <span>© 2026 WorldCup FIFAFun</span>
        </div>
      </div>
    </div>
  )
}
