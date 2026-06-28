'use client'
import { useEffect, useState } from 'react'

type Team = { id: number; code: string; name: string }
type KnockoutMatch = {
  id: number
  group: string       // match label e.g. R32-M01
  stage: string
  matchDate: string
  venue: string
  homeTeam: { id: number; code: string; name: string }
  awayTeam: { id: number; code: string; name: string }
}

const STAGE_LABEL: Record<string, string> = {
  r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-Finals', sf: 'Semi-Finals',
  '3rd': 'Third-Place Play-off', final: 'Final',
}
const STAGE_ORDER = ['r32','r16','qf','sf','3rd','final']

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
  }) + ' ET'
}

export default function KnockoutAdminPage() {
  const [teams, setTeams]     = useState<Team[]>([])
  const [matches, setMatches] = useState<KnockoutMatch[]>([])
  const [saving, setSaving]   = useState<number | null>(null)
  const [saved, setSaved]     = useState<Record<number, boolean>>({})
  const [error, setError]     = useState<Record<number, string>>({})
  const [selections, setSelections] = useState<Record<number, { home: string; away: string }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/knockout-matches').then(r => r.json()),
      fetch('/api/admin/all-teams').then(r => r.json()),
    ]).then(([m, t]) => {
      setMatches(m.matches ?? [])
      setTeams(t.teams ?? [])
      const init: Record<number, { home: string; away: string }> = {}
      for (const match of (m.matches ?? [])) {
        init[match.id] = { home: match.homeTeam.code, away: match.awayTeam.code }
      }
      setSelections(init)
      setLoading(false)
    })
  }, [])

  async function save(matchId: number) {
    const sel = selections[matchId]
    if (!sel) return
    setSaving(matchId)
    setSaved(s => ({ ...s, [matchId]: false }))
    setError(s => ({ ...s, [matchId]: '' }))
    try {
      const res = await fetch('/api/admin/update-match-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeCode: sel.home, awayCode: sel.away }),
      })
      const data = await res.json()
      if (data.ok) {
        setSaved(s => ({ ...s, [matchId]: true }))
        // Update local match list
        setMatches(ms => ms.map(m => m.id === matchId
          ? { ...m, homeTeam: teams.find(t => t.code === sel.home)!, awayTeam: teams.find(t => t.code === sel.away)! }
          : m
        ))
      } else {
        setError(s => ({ ...s, [matchId]: data.error ?? 'Failed' }))
      }
    } catch (e: any) {
      setError(s => ({ ...s, [matchId]: e.message }))
    } finally {
      setSaving(null)
    }
  }

  const byStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = matches.filter(m => m.stage === stage)
    return acc
  }, {} as Record<string, KnockoutMatch[]>)

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading knockout bracket…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Knockout Bracket</h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign real teams to each match as the bracket unfolds. Changes take effect immediately — players will see the updated teams on their predictions page.
        </p>
      </div>

      {STAGE_ORDER.filter(s => byStage[s]?.length > 0).map(stage => (
        <div key={stage} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 text-white text-xs font-bold tracking-widest uppercase" style={{ background: '#1e3a5f' }}>
            {STAGE_LABEL[stage]}
          </div>
          <div className="divide-y divide-gray-100">
            {byStage[stage].map(match => {
              const isTbd = match.homeTeam.code === 'TBD' || match.awayTeam.code === 'TBD'
              const sel = selections[match.id] ?? { home: match.homeTeam.code, away: match.awayTeam.code }
              const isDirty = sel.home !== match.homeTeam.code || sel.away !== match.awayTeam.code
              return (
                <div key={match.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">{match.group} · {fmtDate(match.matchDate)}</span>
                    <span className="text-xs text-gray-400 truncate max-w-[200px]">{match.venue}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Home team */}
                    <select
                      value={sel.home}
                      onChange={e => setSelections(s => ({ ...s, [match.id]: { ...sel, home: e.target.value } }))}
                      className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {teams.filter(t => t.code !== 'TBD').map(t => (
                        <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
                      ))}
                    </select>

                    <span className="text-gray-400 font-bold text-sm flex-shrink-0">vs</span>

                    {/* Away team */}
                    <select
                      value={sel.away}
                      onChange={e => setSelections(s => ({ ...s, [match.id]: { ...sel, away: e.target.value } }))}
                      className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {teams.filter(t => t.code !== 'TBD').map(t => (
                        <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
                      ))}
                    </select>

                    <button
                      onClick={() => save(match.id)}
                      disabled={saving === match.id || (!isDirty && !isTbd)}
                      className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 transition-colors flex-shrink-0"
                      style={{ background: saved[match.id] ? '#166534' : '#1e3a5f' }}
                    >
                      {saving === match.id ? 'Saving…' : saved[match.id] ? '✅ Saved' : 'Save'}
                    </button>
                  </div>

                  {/* Status badge */}
                  <div className="mt-2 flex items-center gap-2">
                    {isTbd && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">⏳ TBD — assign teams when known</span>
                    )}
                    {!isTbd && !isDirty && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">✅ {match.homeTeam.name} vs {match.awayTeam.name}</span>
                    )}
                    {error[match.id] && (
                      <span className="text-xs text-red-600">{error[match.id]}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
