'use client'
import { useEffect, useState } from 'react'

type League = { id: number; name: string; slug: string; color: string; _count?: { users: number } }

export default function AdminLeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', slug: '', color: '#1e3a5f' })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<League | null>(null)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/admin/leagues')
    setLeagues(await res.json())
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const payload = editing ? { ...form, id: editing.id } : form
    await fetch('/api/admin/leagues', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setForm({ name: '', slug: '', color: '#1e3a5f' })
    setEditing(null)
    setMsg(editing ? 'League updated!' : 'League created!')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  async function del(id: number) {
    if (!confirm('Delete this league? Users will lose their league assignment.')) return
    await fetch('/api/admin/leagues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  function startEdit(l: League) {
    setEditing(l)
    setForm({ name: l.name, slug: l.slug, color: l.color })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Leagues</h1>
      <p className="text-sm text-gray-500">Leagues group players into competing teams. The three default leagues are Aila Attackers, Sukuti Strikers, and Gorkhali Gooners.</p>

      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">{editing ? 'Edit League' : 'Create New League'}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">League Name *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Aila Attackers" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Slug *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="aila-attackers" value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              <input type="color" className="h-9 w-12 rounded border border-gray-200 cursor-pointer"
                value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={saving || !form.name}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: '#1e3a5f' }}>
            {saving ? 'Saving…' : editing ? 'Update League' : 'Create League'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', color: '#1e3a5f' }) }}
              className="px-4 py-2 rounded-lg text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Leagues list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: '#1e2d40' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">League</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white">Slug</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white">Color</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white">Players</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leagues.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                      {l.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{l.slug}</td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">{l.color}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{l._count?.users ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(l)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => del(l.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {leagues.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No leagues yet — create the first one above</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
