'use client'
import { useEffect, useState } from 'react'

type Poll = { id: number; question: string; options: string; status: string; createdAt: string; matchId: number | null; _count?: { votes: number } }
type Match = { id: number; homeTeam: { name: string }; awayTeam: { name: string }; matchDate: string; status: string }

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ question: '', options: 'Home wins\nDraw\nAway wins', matchId: '', status: 'open' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const [pRes, mRes] = await Promise.all([fetch('/api/admin/polls'), fetch('/api/admin/matches')])
    setPolls(await pRes.json())
    setMatches(await mRes.json())
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, matchId: form.matchId ? +form.matchId : null }),
    })
    setSaving(false)
    setForm({ question: '', options: 'Home wins\nDraw\nAway wins', matchId: '', status: 'open' })
    setMsg('Poll created!')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  async function toggle(id: number, status: string) {
    await fetch('/api/admin/polls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: status === 'open' ? 'closed' : 'open' }),
    })
    load()
  }

  async function del(id: number) {
    if (!confirm('Delete this poll and all votes?')) return
    await fetch('/api/admin/polls', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  useEffect(() => { load() }, [])

  const upcomingMatches = matches.filter(m => m.status === 'upcoming')

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Audience Polls</h1>
      <p className="text-sm text-gray-500">Fun voting polls for upcoming matches. Poll votes don't count for points — they're just for fun and conversation.</p>

      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

      {/* Create form */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Create Poll</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link to Match (optional)</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              value={form.matchId} onChange={e => {
                const m = upcomingMatches.find(x => x.id === +e.target.value)
                setForm(f => ({
                  ...f, matchId: e.target.value,
                  question: m ? `Who wins: ${m.homeTeam.name} vs ${m.awayTeam.name}?` : f.question,
                  options: m ? `${m.homeTeam.name} wins\nDraw\n${m.awayTeam.name} wins` : f.options,
                }))
              }}>
              <option value="">— No match (standalone poll) —</option>
              {upcomingMatches.slice(0, 20).map(m => (
                <option key={m.id} value={m.id}>{m.homeTeam.name} vs {m.awayTeam.name} · {new Date(m.matchDate).toLocaleDateString()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Question *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Who wins this match?" value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Options (one per line)</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-20 resize-none"
              value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} />
          </div>
          <button onClick={save} disabled={saving || !form.question}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: '#1e3a5f' }}>
            {saving ? 'Creating…' : 'Create Poll'}
          </button>
        </div>
      </div>

      {/* Polls list */}
      {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
        <div className="space-y-3">
          {polls.length === 0 && <div className="text-center py-12 text-gray-400 bg-white rounded-xl">No polls yet</div>}
          {polls.map(p => {
            const opts = JSON.parse(p.options ?? '[]') as string[]
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                      <span className="text-xs text-gray-400">{p._count?.votes ?? 0} votes</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-800">{p.question}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {opts.map((o, i) => <span key={i} className="text-xs px-2 py-0.5 border border-gray-200 rounded-full text-gray-500">{o}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggle(p.id, p.status)}
                      className={`text-xs px-2 py-1 rounded hover:opacity-80 ${p.status === 'open' ? 'text-yellow-700 bg-yellow-50' : 'text-green-700 bg-green-50'}`}>
                      {p.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                    <button onClick={() => del(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
