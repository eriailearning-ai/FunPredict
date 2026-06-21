'use client'
import { useEffect, useState } from 'react'

type Q = { id: number; question: string; type: string; stage: string; options: string; correctAnswer: string | null; points: number; status: string; createdAt: string }

const STAGES = ['group', 'knockout', 'final', 'all']
const TYPES = ['single', 'multiple']
const STATUSES = ['open', 'closed', 'answered']
const DEFAULT_OPTIONS = ['Option 1', 'Option 2', 'Option 3']

export default function AdminBonusPage() {
  const [questions, setQuestions] = useState<Q[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ question: '', type: 'single', stage: 'group', options: DEFAULT_OPTIONS.join('\n'), points: 5, status: 'open' })
  const [editing, setEditing] = useState<Q | null>(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [answerInput, setAnswerInput] = useState<Record<number, string>>({})
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/admin/bonus')
    setQuestions(await res.json())
    setLoading(false)
  }

  async function seedBonus() {
    setSeeding(true)
    const res = await fetch('/api/admin/seed-bonus', { method: 'POST' })
    const data = await res.json()
    setMsg(`Seeded ${data.created} question${data.created !== 1 ? 's' : ''} (${data.skipped} already existed)`)
    setTimeout(() => setMsg(''), 4000)
    setSeeding(false)
    load()
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, id: editing?.id }
    await fetch('/api/admin/bonus', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setEditing(null)
    setForm({ question: '', type: 'single', stage: 'group', options: DEFAULT_OPTIONS.join('\n'), points: 5, status: 'open' })
    setMsg(editing ? 'Question updated!' : 'Question created!')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  async function setAnswer(id: number, answer: string) {
    await fetch('/api/admin/bonus', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'set_answer', answer }),
    })
    setMsg('Answer set and points awarded!')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  async function del(id: number) {
    if (!confirm('Delete this question?')) return
    await fetch('/api/admin/bonus', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  function startEdit(q: Q) {
    setEditing(q)
    const opts = JSON.parse(q.options ?? '[]')
    setForm({ question: q.question, type: q.type, stage: q.stage, options: opts.join('\n'), points: q.points, status: q.status })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonus Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Players answer on the prediction form. Set the correct answer to auto-award points.</p>
        </div>
        <button
          onClick={seedBonus}
          disabled={seeding}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: '#8b1c2c' }}
        >
          {seeding ? '⏳ Seeding…' : '⚽ Seed 6 Official Questions'}
        </button>
      </div>

      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

      {/* Create / Edit form */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">{editing ? 'Edit Question' : 'New Bonus Question'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Question *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Who will win the Golden Boot?" value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t === 'single' ? 'Single answer' : 'Multiple choice'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Points</label>
              <input type="number" min="1" max="20"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                value={form.points} onChange={e => setForm(f => ({ ...f, points: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Options (one per line)</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-24 resize-none"
              placeholder="Option 1&#10;Option 2&#10;Option 3" value={form.options}
              onChange={e => setForm(f => ({ ...f, options: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.question}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: '#1e3a5f' }}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Create Question'}
            </button>
            {editing && (
              <button onClick={() => { setEditing(null); setForm({ question: '', type: 'single', stage: 'group', options: DEFAULT_OPTIONS.join('\n'), points: 5, status: 'open' }) }}
                className="px-4 py-2 rounded-lg text-gray-600 text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
            )}
          </div>
        </div>
      </div>

      {/* Questions list */}
      {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
        <div className="space-y-3">
          {questions.length === 0 && <div className="text-center py-12 text-gray-400 bg-white rounded-xl">No bonus questions yet</div>}
          {questions.map(q => {
            const opts = JSON.parse(q.options ?? '[]') as string[]
            return (
              <div key={q.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.status === 'answered' ? 'bg-green-100 text-green-700' : q.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{q.status}</span>
                      <span className="text-xs text-gray-400">{q.stage}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{q.points} pts</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-800">{q.question}</p>
                    {opts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {opts.map((o, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${q.correctAnswer === o ? 'bg-green-100 border-green-300 text-green-700 font-semibold' : 'border-gray-200 text-gray-500'}`}>{o}</span>
                        ))}
                      </div>
                    )}
                    {q.correctAnswer && (
                      <p className="text-xs text-green-700 mt-2 font-medium">✅ Correct answer: {q.correctAnswer}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(q)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => del(q.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>

                {/* Set answer */}
                {q.status !== 'answered' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <select className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
                      value={answerInput[q.id] ?? ''} onChange={e => setAnswerInput(s => ({ ...s, [q.id]: e.target.value }))}>
                      <option value="">— Set correct answer to award points —</option>
                      {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
                    </select>
                    <button onClick={() => setAnswer(q.id, answerInput[q.id])}
                      disabled={!answerInput[q.id]}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-40" style={{ background: '#166534' }}>
                      Set &amp; Award
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
