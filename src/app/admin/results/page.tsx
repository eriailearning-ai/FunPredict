'use client'
import { useEffect, useState } from 'react'

type Team = { name: string; code: string }
type Match = {
  id: number; homeTeam: Team; awayTeam: Team
  matchDate: string; group: string; stage: string
  status: string; homeScore: number | null; awayScore: number | null; locked: boolean
  scorers: string[]
}

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [scores, setScores] = useState<Record<number, { h: string; a: string }>>({})
  const [scorers, setScorers] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved]   = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('all')
  const [search, setSearch] = useState('')

  async function load() {
    const res = await fetch('/api/admin/matches')
    if (!res.ok) { setLoading(false); return }
    const data: Match[] = await res.json()
    setMatches(data)
    setScores(Object.fromEntries(
      data.map(m => [m.id, { h: m.homeScore?.toString() ?? '', a: m.awayScore?.toString() ?? '' }])
    ))
    // Pre-fill scorer names from DB so re-saving doesn't wipe them
    setScorers(Object.fromEntries(
      data.map(m => [m.id, (m.scorers ?? []).join(', ')])
    ))
    setLoading(false)
  }

  async function save(matchId: number) {
    const s = scores[matchId]
    if (!s || s.h === '' || s.a === '') return
    setSaving(matchId)

    // Parse comma-separated scorer names into an array
    const scorerList = (scorers[matchId] ?? '')
      .split(',')
      .map(n => n.trim())
      .filter(Boolean)

    await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, homeScore: +s.h, awayScore: +s.a, scorers: scorerList }),
    })
    setSaving(null)
    setSaved(x => ({ ...x, [matchId]: true }))
    setTimeout(() => setSaved(x => ({ ...x, [matchId]: false })), 2500)
    load()
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-gray-400 py-12 text-center">Loading...</div>

  const filtered = matches.filter(m => {
    const inFilter =
      filter === 'all' ? true :
      filter === 'finished' ? m.status === 'finished' :
      m.status !== 'finished'
    const q = search.toLowerCase()
    const inSearch = !q || m.homeTeam.name.toLowerCase().includes(q) || m.awayTeam.name.toLowerCase().includes(q) || m.group.toLowerCase().includes(q)
    return inFilter && inSearch
  })

  const finishedCount = matches.filter(m => m.status === 'finished').length
  const pendingCount  = matches.filter(m => m.status !== 'finished').length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Enter Match Results</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Enter final score + who scored. Points auto-calculate: 5 exact / 3 outcome / +2 scorer.
        You can correct any match at any time.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-black text-gray-900">{matches.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total matches</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-black text-green-600">{finishedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Results entered</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-black text-orange-500">{pendingCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Pending</div>
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'upcoming', 'finished'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300')}>
            {f === 'all' ? 'All (' + matches.length + ')' : f === 'finished' ? 'Finished (' + finishedCount + ')' : 'Pending (' + pendingCount + ')'}
          </button>
        ))}
        <input
          type="text" placeholder="Search team or group..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-400 w-44"
        />
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">No matches found.</div>
        )}
        {filtered.map(m => {
          const s = scores[m.id] ?? { h: '', a: '' }
          const isFinished = m.status === 'finished'
          const isSaving = saving === m.id
          const isSaved = saved[m.id]
          const date = new Date(m.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const time = new Date(m.matchDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={m.id} className={'bg-white rounded-xl px-4 py-3 border shadow-sm ' + (isFinished ? 'border-green-100' : 'border-gray-100')}>
              {/* Row 1: status + group + date + teams + score + save */}
              <div className="flex items-center gap-3">
                <span className={'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ' + (isFinished ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600')}>
                  {isFinished ? 'FT' : m.status === 'live' ? 'LIVE' : 'TBD'}
                </span>
                <span className="text-xs font-bold text-blue-700 w-6 flex-shrink-0">{m.group}</span>
                <span className="text-xs text-gray-400 w-20 flex-shrink-0">{date} {time}</span>
                <span className="flex-1 text-right text-sm font-semibold text-gray-800 truncate min-w-0">{m.homeTeam.name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number" min="0" max="30"
                    value={s.h}
                    onChange={e => setScores(sc => ({ ...sc, [m.id]: { ...sc[m.id], h: e.target.value } }))}
                    className="w-10 text-center font-bold border-2 border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                  <span className="text-gray-400 text-xs font-bold">-</span>
                  <input
                    type="number" min="0" max="30"
                    value={s.a}
                    onChange={e => setScores(sc => ({ ...sc, [m.id]: { ...sc[m.id], a: e.target.value } }))}
                    className="w-10 text-center font-bold border-2 border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-800 truncate min-w-0">{m.awayTeam.name}</span>
                <button
                  onClick={() => save(m.id)}
                  disabled={isSaving || s.h === '' || s.a === ''}
                  className={'text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 transition-colors disabled:opacity-40 ' + (isSaved ? 'bg-green-600 text-white' : isFinished ? 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white border border-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                  {isSaving ? 'Saving...' : isSaved ? 'Saved! ✓' : isFinished ? 'Update' : 'Save'}
                </button>
              </div>

              {/* Row 2: scorer input */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">⚽ Scorers:</span>
                <input
                  type="text"
                  placeholder="e.g. Messi, Ronaldo, Mbappé  (comma-separated — +2 pts each correct pick)"
                  value={scorers[m.id] ?? ''}
                  onChange={e => setScorers(sc => ({ ...sc, [m.id]: e.target.value }))}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 min-w-0"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
