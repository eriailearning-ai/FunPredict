'use client'
import { useEffect, useState } from 'react'

type User = {
  id: string; name: string; email: string; username: string | null
  nickname: string; league: string; cheeringFrom: string
  status: string; role: string; createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-gray-100 text-gray-600',
  verified: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  denied:   'bg-red-100 text-red-700',
}

const LEAGUES = ['', 'Aila Attackers', 'Sukuti Strikers', 'Gorkhali Gooners']

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState<string | null>(null)
  const [filter,  setFilter]  = useState<'all' | 'pending' | 'verified' | 'approved' | 'denied'>('all')
  const [search,  setSearch]  = useState('')

  // Verify-link modal state
  const [verifyLink, setVerifyLink] = useState<{ name: string; url: string; sent: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    setUsers(await res.json())
    setLoading(false)
  }

  async function act(userId: string, action: string, extra?: Record<string, string>) {
    setActing(userId + action)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, ...extra }),
    })
    const data = await res.json()

    // Show verify link in modal when SMTP not configured
    if (action === 'resend_verify' && data.verifyUrl) {
      const user = users.find(u => u.id === userId)
      setVerifyLink({ name: user?.name ?? '', url: data.verifyUrl, sent: !!data.sent })
    }

    setActing(null)
    load()
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => { load() }, [])

  const pending  = users.filter(u => u.status === 'pending')
  const verified = users.filter(u => u.status === 'verified')
  const needsAction = [...pending, ...verified]

  const filtered = users.filter(u => {
    if (filter === 'pending'  && u.status !== 'pending')  return false
    if (filter === 'verified' && u.status !== 'verified') return false
    if (filter === 'approved' && u.status !== 'approved') return false
    if (filter === 'denied'   && u.status !== 'denied')   return false
    if (search) {
      const s = search.toLowerCase()
      return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) ||
        (u.nickname ?? '').toLowerCase().includes(s) || (u.username ?? '').toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">{users.length} total</span>
      </div>

      {/* ── Needs action banner ── */}
      {needsAction.length > 0 && (
        <div className="rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-4">
          <p className="text-sm font-bold text-yellow-800 mb-3">
            ⏳ {needsAction.length} player{needsAction.length !== 1 ? 's' : ''} need attention
          </p>
          <div className="space-y-2">
            {needsAction.map(u => (
              <div key={u.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{u.name}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.status]}`}>
                      {u.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {u.email} · {u.username} · <em>{u.nickname}</em> · {u.league || 'no league'}
                  </p>
                </div>

                {/* PENDING: email not verified yet */}
                {u.status === 'pending' && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Email not verified</span>
                    <button
                      onClick={() => act(u.id, 'resend_verify')}
                      disabled={!!acting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: '#1e3a5f' }}>
                      {acting === u.id + 'resend_verify' ? '…' : '📧 Resend / Get Link'}
                    </button>
                    <button
                      onClick={() => act(u.id, 'force_approve')}
                      disabled={!!acting}
                      title="Skip email verification and approve directly"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: '#166534' }}>
                      {acting === u.id + 'force_approve' ? '…' : '⚡ Skip & Approve'}
                    </button>
                    <button
                      onClick={() => act(u.id, 'deny')}
                      disabled={!!acting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 disabled:opacity-50">
                      ✗ Deny
                    </button>
                  </div>
                )}

                {/* VERIFIED: email verified, waiting for admin */}
                {u.status === 'verified' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => act(u.id, 'approve')}
                      disabled={!!acting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: '#166534' }}>
                      {acting === u.id + 'approve' ? '…' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => act(u.id, 'deny')}
                      disabled={!!acting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 disabled:opacity-50">
                      ✗ Deny
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Verify link modal ── */}
      {verifyLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {verifyLink.sent ? '✅ Email sent!' : '📋 Copy verify link'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {verifyLink.sent
                ? `Verification email sent to ${verifyLink.name}. They must click the link to verify.`
                : `SMTP not configured — copy this link and send it to ${verifyLink.name} manually (WhatsApp, Messenger, etc.).`}
            </p>

            <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
              <code className="flex-1 text-xs text-blue-700 break-all">{verifyLink.url}</code>
              <button
                onClick={() => copyLink(verifyLink.url)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: '#1e3a5f' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 text-xs text-yellow-800">
              ⏰ This link expires in 24 hours. The player must click it to verify their email before you can approve them.
              Or use <strong>⚡ Skip &amp; Approve</strong> to bypass email verification for trusted players.
            </div>

            <button
              onClick={() => { setVerifyLink(null); setCopied(false) }}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Filters + search ── */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {(['all', 'pending', 'verified', 'approved', 'denied'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={filter === f ? { background: '#1e3a5f' } : {}}>
              {f}
              {f === 'pending'  && pending.length  > 0 ? ` (${pending.length})`  : ''}
              {f === 'verified' && verified.length > 0 ? ` (${verified.length})` : ''}
            </button>
          ))}
        </div>
        <input
          className="flex-1 min-w-40 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search name, email, username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={load} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
          ↺ Refresh
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#1e2d40' }}>
                <tr>
                  {['Player', 'Username / Email', 'League', 'Status', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.status === 'pending' || u.status === 'verified' ? 'bg-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 text-xs">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.nickname || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{u.username || '—'}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none bg-white"
                        defaultValue={u.league}
                        onChange={e => act(u.id, 'set_league', { league: e.target.value })}>
                        {LEAGUES.map(l => <option key={l} value={l}>{l || '— no league —'}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {u.status === 'pending' && (
                          <>
                            <button onClick={() => act(u.id, 'resend_verify')} disabled={!!acting}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">
                              📧 Resend
                            </button>
                            <button onClick={() => act(u.id, 'force_approve')} disabled={!!acting}
                              className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50"
                              title="Skip email verify and approve directly">
                              ⚡ Approve
                            </button>
                            <button onClick={() => act(u.id, 'deny')} disabled={!!acting}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                              ✗ Deny
                            </button>
                          </>
                        )}
                        {u.status === 'verified' && (
                          <>
                            <button onClick={() => act(u.id, 'approve')} disabled={!!acting}
                              className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50">✓ Approve</button>
                            <button onClick={() => act(u.id, 'deny')} disabled={!!acting}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">✗ Deny</button>
                          </>
                        )}
                        {u.status === 'approved' && u.role !== 'admin' && (
                          <button onClick={() => act(u.id, 'deny')} disabled={!!acting}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Revoke</button>
                        )}
                        {u.status === 'denied' && (
                          <button onClick={() => act(u.id, 'approve')} disabled={!!acting}
                            className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50">Re-approve</button>
                        )}
                        {u.role === 'player' && u.status === 'approved' && (
                          <button onClick={() => act(u.id, 'make_admin')} disabled={!!acting}
                            className="text-xs text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded hover:bg-yellow-50">Make admin</button>
                        )}
                        {u.role === 'admin' && (
                          <button onClick={() => act(u.id, 'make_player')} disabled={!!acting}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">Demote</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No users match this filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
