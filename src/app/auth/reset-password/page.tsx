'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token  = params.get('token') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  const bg = 'linear-gradient(160deg, #0d1b3e 0%, #1e3a5f 50%, #8b1c2c 100%)'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setDone(true)
    setTimeout(() => router.push('/auth/login'), 2500)
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
      <div className="text-center text-white">
        <p className="text-lg mb-4">Invalid reset link.</p>
        <Link href="/auth/forgot-password" className="text-yellow-400 underline">Request a new one →</Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-black text-white mb-2">Password reset!</h1>
        <p className="text-blue-200 text-sm">Redirecting you to login…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-3xl font-black text-white mb-1">New Password</h1>
          <p className="text-sm text-blue-200">Choose a strong password (min 8 characters)</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">New Password</label>
              <input
                type="password" required minLength={8}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Min 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Confirm Password</label>
              <input
                type="password" required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="••••••••"
                value={confirm} onChange={e => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-red-300 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b1c2c, #c0392b)' }}
            >
              {loading ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
