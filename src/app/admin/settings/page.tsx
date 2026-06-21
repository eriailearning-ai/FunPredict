'use client'
import { useEffect, useState } from 'react'

// ─── Change Password Card ─────────────────────────────────────
function ChangePasswordCard() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [err, setErr]             = useState('')

  const fieldClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"

  async function save() {
    setMsg(''); setErr('')
    if (newPw !== confirmPw) { setErr('New passwords do not match'); return }
    if (newPw.length < 8)    { setErr('New password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to update password'); return }
      setMsg('Password updated successfully!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch {
      setErr('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-4">🔐 Change Password</h2>
      {msg && <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}
      {err && <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>}
      <div className="space-y-3 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
          <input type="password" className={fieldClass} value={currentPw}
            onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" className={fieldClass} value={newPw}
            onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" className={fieldClass} value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
          className="px-5 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
          style={{ background: '#8b1c2c' }}>
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

type Settings = {
  site_name: string
  scoring_exact: string
  scoring_outcome: string
  scoring_goal: string
  joker_multiplier: string
  admin_email: string
  lock_minutes: string
  allow_registration: string
}

const DEFAULTS: Settings = {
  site_name: 'FIFAFun WorldCup 2026',
  scoring_exact: '5',
  scoring_outcome: '3',
  scoring_goal: '1',
  joker_multiplier: '2',
  admin_email: '',
  lock_minutes: '15',
  allow_registration: 'true',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const data = await res.json()
      setSettings({ ...DEFAULTS, ...data })
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setMsg('Settings saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  function set(key: keyof Settings, val: string) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

      {/* Site */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Site</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site Name</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={settings.site_name} onChange={e => set('site_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Admin Email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={settings.admin_email} onChange={e => set('admin_email', e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700">Allow new registrations</label>
            <button onClick={() => set('allow_registration', settings.allow_registration === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.allow_registration === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allow_registration === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs text-gray-500">{settings.allow_registration === 'true' ? 'Open' : 'Closed'}</span>
          </div>
        </div>
      </div>

      {/* Scoring */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Scoring Rules</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'scoring_exact' as keyof Settings, label: 'Exact score', hint: 'pts for exact scoreline' },
            { key: 'scoring_outcome' as keyof Settings, label: 'Correct outcome only', hint: 'pts for right result, wrong score' },
            { key: 'scoring_goal' as keyof Settings, label: 'Per correct team goal', hint: 'pts per team\'s correct goal count' },
            { key: 'joker_multiplier' as keyof Settings, label: 'Joker multiplier', hint: '× applied to joker match' },
            { key: 'lock_minutes' as keyof Settings, label: 'Lock before kickoff (min)', hint: 'minutes before match to lock predictions' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input type="number" min="0" max="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={settings[key]} onChange={e => set(key, e.target.value)} />
              <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
            </div>
          ))}
        </div>

        {/* Scoring preview */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Exact score', val: settings.scoring_exact },
            { label: 'Correct outcome', val: settings.scoring_outcome },
            { label: 'Per team goal', val: settings.scoring_goal },
            { label: 'Joker ×', val: settings.joker_multiplier },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl p-3 text-center text-white" style={{ background: '#1e3a5f' }}>
              <div className="text-2xl font-black text-yellow-400">{val}</div>
              <div className="text-xs text-gray-300 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="px-8 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
        style={{ background: '#1e3a5f' }}>
        {saving ? 'Saving…' : 'Save Settings'}
      </button>

      <ChangePasswordCard />

      <DbMigrateCard />
    </div>
  )
}

// ─── DB Migration Card ────────────────────────────────────────
function DbMigrateCard() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [err, setErr]         = useState('')

  async function run() {
    setRunning(true); setResults([]); setErr('')
    try {
      const res = await fetch('/api/admin/db-migrate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed'); return }
      setResults(data.results ?? [])
    } catch {
      setErr('Request failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-1">🛠 Database Migration</h2>
      <p className="text-xs text-gray-500 mb-4">
        Run this once on a new deployment to add missing columns (resetToken, phone, etc.). Safe to run multiple times.
      </p>
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      {results.length > 0 && (
        <div className="mb-3 bg-gray-50 rounded-lg p-3 text-xs font-mono space-y-1">
          {results.map((r, i) => <div key={i}>{r}</div>)}
        </div>
      )}
      <button onClick={run} disabled={running}
        className="px-5 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
        style={{ background: '#374151' }}>
        {running ? 'Running…' : 'Run Migration'}
      </button>
    </div>
  )
}
