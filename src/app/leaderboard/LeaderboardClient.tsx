'use client'
import { useState } from 'react'

type Row = { id: string; display: string; league: string; cheeringFrom: string; total: number; played: number; exact: number }
type BreakdownRow = {
  match: string; matchDate: string; myPick: string; result: string
  scoreType: string; scorerPred: string | null; scorerCorrect: boolean; joker: boolean; points: number
}
type Breakdown = { name: string; grandTotal: number; breakdown: BreakdownRow[] } | null

const SCORE_COLOR: Record<string, string> = {
  exact:   '#16a34a',
  outcome: '#2563eb',
  partial: '#f59e0b',
  wrong:   '#9ca3af',
  pending: '#d1d5db',
}
const SCORE_LABEL: Record<string, string> = {
  exact:   'Exact',
  outcome: 'Outcome',
  partial: 'Partial',
  wrong:   'Wrong',
  pending: '—',
}

export default function LeaderboardClient({
  board,
  currentUserId,
  seeAll,
}: {
  board: Row[]
  currentUserId: string | null
  seeAll: boolean
}) {
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [data, setData]         = useState<Breakdown>(null)
  const [error, setError]       = useState('')

  async function openBreakdown(userId: string) {
    setOpen(true)
    setLoading(true)
    setData(null)
    setError('')
    try {
      const res = await fetch(`/api/players/breakdown?userId=${userId}`)
      const text = await res.text()
      if (!res.ok) {
        let msg = 'Could not load breakdown'
        try { msg = JSON.parse(text).error ?? msg } catch {}
        setError(msg); setLoading(false); return
      }
      try {
        setData(JSON.parse(text))
      } catch {
        setError('Invalid response — check server logs'); setLoading(false); return
      }
    } catch (e: any) {
      setError('Network error: ' + (e?.message ?? 'unknown'))
    }
    setLoading(false)
  }

  return (
    <>
      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: '#1e3a5f' }}>
            <tr>
              <th className="px-4 py-3 text-left text-white text-xs font-bold">#</th>
              <th className="px-4 py-3 text-left text-white text-xs font-bold">Player</th>
              {seeAll && <th className="px-4 py-3 text-left text-white text-xs font-bold hidden sm:table-cell">League</th>}
              <th className="px-4 py-3 text-center text-white text-xs font-bold">Matches</th>
              <th className="px-4 py-3 text-center text-white text-xs font-bold">Exact</th>
              <th className="px-4 py-3 text-center text-yellow-300 text-xs font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {board.map((p, i) => (
              <tr key={p.id}
                onClick={() => openBreakdown(p.id)}
                className={`border-t border-gray-50 transition-colors cursor-pointer hover:bg-blue-50 ${
                  p.id === currentUserId ? 'bg-blue-50 font-semibold'
                  : i === 0 ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    {p.display}
                    {p.id === currentUserId && <span className="text-blue-600">(you)</span>}
                    <span className="text-gray-300 text-[10px]">↗ breakdown</span>
                  </div>
                  {p.cheeringFrom && <div className="text-xs text-gray-400">{p.cheeringFrom}</div>}
                </td>
                {seeAll && (
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{p.league}</td>
                )}
                <td className="px-4 py-3 text-center text-xs text-gray-500">{p.played}</td>
                <td className="px-4 py-3 text-center text-xs text-green-600 font-medium">{p.exact}</td>
                <td className="px-4 py-3 text-center text-sm font-black" style={{ color: '#1e3a5f' }}>{p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Breakdown Modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: '#1e3a5f' }}>
              <div>
                <h2 className="text-white font-bold text-base">
                  {loading ? 'Loading…' : data ? `${data.name}'s Points Breakdown` : 'Breakdown'}
                </h2>
                {data && (
                  <p className="text-yellow-300 text-xs mt-0.5">
                    {data.breakdown.length} matches graded · <strong>{data.grandTotal} pts</strong> total
                  </p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-white opacity-70 hover:opacity-100 text-xl leading-none">✕</button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading breakdown…</div>
              )}
              {error && (
                <div className="p-6 text-red-600 text-sm text-center">{error}</div>
              )}
              {data && data.breakdown.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No finished matches with predictions yet.</div>
              )}
              {data && data.breakdown.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Match</th>
                      <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">Result</th>
                      <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">Pick</th>
                      <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">Score</th>
                      <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">⚽</th>
                      <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">×2</th>
                      <th className="px-3 py-2.5 text-center font-bold" style={{ color: '#1e3a5f' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.breakdown.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-800 leading-tight">{r.match}</div>
                          <div className="text-gray-400 text-[10px]">
                            {new Date(r.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-gray-700">{r.result}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{r.myPick}</td>
                        {/* Score type */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-bold" style={{ color: SCORE_COLOR[r.scoreType] }}>
                            {SCORE_LABEL[r.scoreType]}
                          </span>
                        </td>
                        {/* Scorer */}
                        <td className="px-3 py-2.5 text-center">
                          {r.scorerPred ? (
                            <span title={r.scorerPred}
                              className={`font-semibold ${r.scorerCorrect ? 'text-green-600' : 'text-gray-400'}`}>
                              {r.scorerCorrect ? '✓' : '✗'}
                              <span className="ml-0.5 text-[10px] font-normal hidden sm:inline">
                                {r.scorerPred.split(' ').pop()}
                              </span>
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Joker */}
                        <td className="px-3 py-2.5 text-center">
                          {r.joker
                            ? <span className="font-bold text-yellow-600">×2</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Points */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-base font-black" style={{ color: r.points > 0 ? '#1e3a5f' : '#9ca3af' }}>
                            {r.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f0f4ff' }}>
                      <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-gray-600">Total</td>
                      <td className="px-3 py-2.5 text-center text-lg font-black" style={{ color: '#1e3a5f' }}>
                        {data.grandTotal}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <p className="text-xs text-gray-400">Click outside or ✕ to close</p>
              <button onClick={() => setOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: '#1e3a5f' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
