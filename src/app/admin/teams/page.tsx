'use client'
import { useEffect, useState } from 'react'
import FlagImg from '@/components/ui/FlagImg'
import { NAME_TO_ISO2 } from '@/lib/flags'

type Team = { id: number; name: string; code: string; flagCode: string; group: string }

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', code: '', flagCode: '', group: 'A' })
  const [editing, setEditing] = useState<Team | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const res = await fetch('/api/admin/teams')
    setTeams(await res.json())
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/teams', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editing?.id }),
    })
    setSaving(false)
    setEditing(null)
    setForm({ name: '', code: '', flagCode: '', group: 'A' })
    setMsg(editing ? 'Team updated!' : 'Team created!')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  function startEdit(t: Team) {
    setEditing(t)
    setForm({ name: t.name, code: t.code, flagCode: t.flagCode, group: t.group })
  }

  function autoFlag(name: string) {
    const iso2 = (NAME_TO_ISO2 as any)[name.toLowerCase()] ?? ''
    setForm(f => ({ ...f, flagCode: iso2, name }))
  }

  useEffect(() => { load() }, [])

  const filtered = teams.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Teams</h1>

      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">{editing ? 'Edit Team' : 'Add Team'}</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Team Name *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Mexico" value={form.name}
              onChange={e => autoFlag(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Code (3-letter)</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="MEX" maxLength={5} value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Flag Code (ISO2)</label>
            <div className="flex gap-2">
              {form.flagCode && <FlagImg iso2={form.flagCode} size="sm" className="mt-2" />}
              <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="mx" maxLength={10} value={form.flagCode}
                onChange={e => setForm(f => ({ ...f, flagCode: e.target.value.toLowerCase() }))} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Group</label>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))}>
              {GROUPS.map(g => <option key={g} value={g}>Group {g}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={saving || !form.name}
            className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: '#1e3a5f' }}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Add Team'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', code: '', flagCode: '', group: 'A' }) }}
              className="mt-4 px-4 py-2 rounded-lg text-gray-600 text-sm border border-gray-200">Cancel</button>
          )}
        </div>
      </div>

      {/* Teams table */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">{teams.length} teams</p>
          <input className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none w-48"
            placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div className="text-center py-8 text-gray-400">Loading…</div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                <FlagImg iso2={t.flagCode || t.code.toLowerCase().slice(0,2)} name={t.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.code} · Grp {t.group}</p>
                </div>
                <button onClick={() => startEdit(t)} className="text-xs text-blue-500 hover:underline flex-shrink-0">Edit</button>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-4 text-center py-8 text-gray-400">No teams found</div>}
          </div>
        )}
      </div>
    </div>
  )
}
