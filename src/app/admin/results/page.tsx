'use client'
import { useEffect, useState } from 'react'

type Team = { name: string; code: string }
type Match = { id: number; homeTeam: Team; awayTeam: Team; matchDate: string; group: string; status: string; homeScore: number | null; awayScore: number | null; locked: boolean }

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [scores, setScores] = useState<Record<number, { h: string; a: string }>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/admin/matches')
    const data: Match[] = await res.json()
    setMatches(data)
    setScores(Object.fromEntries(data.map(m => [m.id, { h: m.homeScore?.toString() ?? '', a: m.awayScore?.toString() ?? '' }])))
    setLoading(false)
  }

  async function save(matchId: number) {
    const s = scores[matchId]
    if (s.h === '' || s.a === '') return
    setSaving(matchId)
    await fetch('/api/admin/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, homeScore: +s.h, awayScore: +s.a }) })
    setSaving(null)
    setSaved(x => ({ ...x, [matchId]: true }))
    setTimeout(() => setSaved(x => ({ ...x, [matchId]: false })), 2000)
    load()
  }

  useEffect(() => { load() }, [])
  if (loading) return <div className="text-gray-400 py-12 text-center">Loading…</div>

  const upcoming = matches.filter(m => m.status !== 'finished')
  const finished = matches.filter(m => m.status === 'finished')

  return (
    <div>
      <h1 className="mb-2">⚽ Enter Match Results</h1>
      <p className="text-sm text-gray-500 mb-6">Points are calculated automatically when you save a result.</p>

      <h2 className="mb-3 text-gray-600">Upcoming / Pending ({upcoming.length})</h2>
      <div className="space-y-2 mb-8">
        {upcoming.map(m => (
          <div key={m.id} className="card flex items-center gap-3 py-3">
            <span className="badge badge-blue text-xs">{m.group}</span>
            <span className="flex-1 text-right font-medium text-sm">{m.homeTeam.name}</span>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="20" value={scores[m.id]?.h ?? ''} onChange={e => setScores(s => ({...s, [m.id]: {...s[m.id], h: e.target.value}}))} className="w-12 text-center input" />
              <span className="text-gray-400">–</span>
              <input type="number" min="0" max="20" value={scores[m.id]?.a ?? ''} onChange={e => setScores(s => ({...s, [m.id]: {...s[m.id], a: e.target.value}}))} className="w-12 text-center input" />
            </div>
            <span className="flex-1 font-medium text-sm">{m.awayTeam.name}</span>
            <span className="text-xs text-gray-400 w-28 text-right">{new Date(m.matchDate).toLocaleDateString()}</span>
            <button onClick={() => save(m.id)} disabled={saving === m.id} className={`text-sm px-4 py-1.5 ${saved[m.id] ? 'btn-success' : 'btn-primary'}`}>
              {saving === m.id ? '…' : saved[m.id] ? '✓ Saved' : 'Save Result'}
            </button>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-gray-400 text-sm">All results entered!</p>}
      </div>

      {finished.length > 0 && (
        <>
          <h2 className="mb-3 text-gray-600">Finished ({finished.length})</h2>
          <div className="space-y-2">
            {finished.map(m => (
              <div key={m.id} className="card flex items-center gap-3 py-2 opacity-70">
                <span className="badge badge-green text-xs">FT</span>
                <span className="flex-1 text-right text-sm">{m.homeTeam.name}</span>
                <span className="font-bold px-4">{m.homeScore} – {m.awayScore}</span>
                <span className="flex-1 text-sm">{m.awayTeam.name}</span>
                <button onClick={() => save(m.id)} className="text-xs text-gray-400 hover:text-gray-600 underline">Edit</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
