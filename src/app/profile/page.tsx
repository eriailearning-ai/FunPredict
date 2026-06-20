'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

type Profile = {
  name: string; email: string; username: string
  phone: string; nickname: string; league: string; cheeringFrom: string
}

type Section = 'nickname' | 'phone' | 'email' | 'password' | null

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [open, setOpen]       = useState<Section>(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [err, setErr]         = useState('')

  // form fields
  const [nickname, setNickname]         = useState('')
  const [phone, setPhone]               = useState('')
  const [email, setEmail]               = useState('')
  const [currentPw, setCurrentPw]       = useState('')
  const [newPw, setNewPw]               = useState('')
  const [confirmPw, setConfirmPw]       = useState('')

  useEffect(() => {
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { window.location.href = '/auth/login'; return }
      setProfile(d)
      setNickname(d.nickname)
      setPhone(d.phone ?? '')
      setEmail(d.email)
    })
  }, [])

  function toggle(s: Section) {
    setOpen(o => o === s ? null : s)
    setMsg(''); setErr('')
  }

  async function save(body: Record<string, string>) {
    setSaving(true); setMsg(''); setErr('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error); return }
    setMsg(data.messages?.join(' · ') ?? 'Saved!')
    if (data.emailChanged) {
      setMsg('Email updated — please check your inbox to verify the new address. You will be logged out.')
      setTimeout(() => window.location.href = '/auth/login', 3500)
      return
    }
    // Refresh profile
    fetch('/api/profile').then(r => r.json()).then(d => { setProfile(d); setOpen(null) })
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  if (!profile) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
    </div>
  )

  const fieldClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
  const btnPrimary = "px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
  const btnGhost   = "px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-1" style={{ color: '#1e3a5f' }}>My Profile</h1>
        <p className="text-sm text-gray-500 mb-6">Update your details below</p>

        {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">{msg}</div>}
        {err && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{err}</div>}

        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">

          {/* Read-only info */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Full Name</p>
              <p className="text-sm font-semibold text-gray-800">{profile.name}</p>
            </div>
            <span className="text-xs text-gray-400">Contact admin to change</span>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Username</p>
              <p className="text-sm font-semibold text-gray-800">@{profile.username || '—'}</p>
            </div>
            <span className="text-xs text-gray-400">Fixed</span>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">League</p>
              <p className="text-sm font-semibold text-gray-800">{profile.league || '—'}</p>
            </div>
            <span className="text-xs text-gray-400">Assigned by admin</span>
          </div>

          {/* Nickname */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('nickname')}>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Nickname</p>
                <p className="text-sm font-semibold text-gray-800">{profile.nickname || '—'}</p>
              </div>
              <button className="text-sm font-semibold" style={{ color: '#8b1c2c' }}>
                {open === 'nickname' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {open === 'nickname' && (
              <div className="mt-3 flex gap-2">
                <input className={fieldClass} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Your nickname" />
                <button className={btnPrimary} disabled={saving} style={{ background: '#1e3a5f' }}
                  onClick={() => save({ nickname })}>
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('phone')}>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Mobile Number</p>
                <p className="text-sm font-semibold text-gray-800">{profile.phone || '—'}</p>
              </div>
              <button className="text-sm font-semibold" style={{ color: '#8b1c2c' }}>
                {open === 'phone' ? 'Cancel' : profile.phone ? 'Edit' : 'Add'}
              </button>
            </div>
            {open === 'phone' && (
              <div className="mt-3 flex gap-2">
                <input className={fieldClass} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
                <button className={btnPrimary} disabled={saving} style={{ background: '#1e3a5f' }}
                  onClick={() => save({ phone })}>
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('email')}>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-sm font-semibold text-gray-800">{profile.email}</p>
              </div>
              <button className="text-sm font-semibold" style={{ color: '#8b1c2c' }}>
                {open === 'email' ? 'Cancel' : 'Change'}
              </button>
            </div>
            {open === 'email' && (
              <div className="mt-3 space-y-2">
                <input className={fieldClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="new@example.com" />
                <p className="text-xs text-amber-600">⚠ Changing your email will require re-verification and log you out.</p>
                <div className="flex gap-2">
                  <button className={btnGhost} onClick={() => toggle(null)}>Cancel</button>
                  <button className={btnPrimary} disabled={saving || email === profile.email} style={{ background: '#8b1c2c' }}
                    onClick={() => save({ email })}>
                    {saving ? '…' : 'Update Email'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('password')}>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Password</p>
                <p className="text-sm font-semibold text-gray-800">••••••••</p>
              </div>
              <button className="text-sm font-semibold" style={{ color: '#8b1c2c' }}>
                {open === 'password' ? 'Cancel' : 'Change'}
              </button>
            </div>
            {open === 'password' && (
              <div className="mt-3 space-y-2">
                <input className={fieldClass} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
                <input className={fieldClass} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} />
                <input className={fieldClass} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" />
                <div className="flex gap-2 pt-1">
                  <button className={btnGhost} onClick={() => toggle(null)}>Cancel</button>
                  <button className={btnPrimary} disabled={saving || !currentPw || !newPw || newPw !== confirmPw} style={{ background: '#8b1c2c' }}
                    onClick={() => save({ currentPassword: currentPw, newPassword: newPw })}>
                    {saving ? '…' : 'Update Password'}
                  </button>
                </div>
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 text-center">
          <Link href="/predictions" className="text-sm text-blue-600 hover:underline">← Back to predictions</Link>
        </div>
      </div>
    </div>
  )
}
