'use client'
import { useState } from 'react'
import FlagImg from '@/components/ui/FlagImg'
import Link from 'next/link'
import { GROUPS, fmtTime, fmtDayHeader, stageName } from '@/lib/fmt'

export interface MatchRow {
  id: number
  homeTeam: { name: string; code: string; flag: string }
  awayTeam: { name: string; code: string; flag: string }
  matchDate: string   // ISO string
  group: string
  stage: string
  venue: string
  status: string
  homeScore: number | null
  awayScore: number | null
}


export default function TournamentTabs({ matches }: { matches: MatchRow[] }) {
  const [tab, setTab] = useState<'byday' | 'bracket'>('byday')

  // Group by day
  const byDate: Record<string, MatchRow[]> = {}
  for (const m of matches) {
    const key = fmtDayHeader(m.matchDate)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(m)
  }

  return (
    <div className="space-y-4">
      {/* Dark header */}
      <div className="rounded-xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
        <h1 className="text-2xl font-black text-yellow-400 mb-1">Matches</h1>
        <p className="text-sm text-gray-300">Full World Cup 2026 schedule grouped by day. Tap match to predict or view stats.</p>
      </div>

      {/* Tab bar label */}
      <div className="rounded-lg overflow-hidden flex" style={{ background: '#111827' }}>
        <span className="px-4 py-2.5 text-xs font-bold text-white tracking-widest uppercase border-b-2 border-yellow-400">MATCHES</span>
      </div>

      {/* BY DAY / FULL BRACKET toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button onClick={() => setTab('byday')} className="flex-1 py-3 text-sm font-bold tracking-wide transition-colors"
          style={{ background: tab === 'byday' ? '#1e3a5f' : '#f3f4f6', color: tab === 'byday' ? '#fff' : '#374151' }}>
          BY DAY
        </button>
        <button onClick={() => setTab('bracket')} className="flex-1 py-3 text-sm font-bold tracking-wide border-l border-gray-200 transition-colors"
          style={{ background: tab === 'bracket' ? '#1e3a5f' : '#f3f4f6', color: tab === 'bracket' ? '#fff' : '#374151' }}>
          FULL BRACKET
        </button>
      </div>

      {/* ── BY DAY ── */}
      {tab === 'byday' && (
        <div className="space-y-6">
          {Object.keys(byDate).length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              <p>No matches loaded yet.</p>
              <p className="text-xs mt-2">Use Admin → Seed DB to import the schedule.</p>
            </div>
          )}
          {Object.entries(byDate).map(([dateStr, dayMatches]) => (
            <div key={dateStr}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-gray-900">{dateStr}</h2>
                <Link href="/tournament/groups" className="text-xs font-semibold hover:underline" style={{ color: '#8b1c2c' }}>View groups</Link>
              </div>
              <div className="space-y-2">
                {dayMatches.map(m => (
                  <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="md" />
                        <span className="text-sm font-semibold text-gray-800 truncate">{m.homeTeam.name}</span>
                      </div>
                      <div className="text-center flex-shrink-0 w-20">
                        {m.status === 'finished'
                          ? <span className="text-base font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                          : <span className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{fmtTime(m.matchDate)}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-semibold text-gray-800 truncate text-right">{m.awayTeam.name}</span>
                        <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="md" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{stageName(m.stage, m.group)}{m.venue ? ` · ${m.venue}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FULL BRACKET ── */}
      {tab === 'bracket' && (
        <div className="space-y-6">
          <div className="rounded-xl p-5 text-center text-white" style={{ background: 'linear-gradient(135deg,#0d1b3e,#8b1c2c)' }}>
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-xs font-bold tracking-widest text-gray-300 mb-0.5">FIFA</p>
            <h2 className="text-lg font-black">2026 WORLD CUP MATCH SCHEDULE</h2>
            <p className="text-xs text-gray-400 mt-1">Group stage · Knockout rounds · All times in your local timezone</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Groups A–F */}
            <div className="space-y-3">
              {GROUPS.slice(0, 6).map(g => {
                const gm = matches.filter(m => m.stage === 'group' && m.group === g)
                return (
                  <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide" style={{ background: '#111827' }}>Group {g}</div>
                    <div className="p-3 space-y-1.5">
                      {gm.length === 0 ? <p className="text-xs text-gray-400">–</p> : gm.map(m => (
                        <div key={m.id} className="flex items-center gap-1.5 text-xs">
                          <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="sm" />
                          <span className="flex-1 text-gray-700 truncate">{m.homeTeam.name}</span>
                          <span className="font-bold w-10 text-center text-gray-600">
                            {m.status === 'finished' ? `${m.homeScore}–${m.awayScore}` : fmtTime(m.matchDate)}
                          </span>
                          <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam.name}</span>
                          <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Centre: Knockout */}
            <div className="space-y-3">
              <div className="rounded-xl p-4 text-white text-center" style={{ background: 'linear-gradient(180deg,#1e3a5f,#0d1b3e)' }}>
                <p className="text-xs tracking-widest text-gray-300">USA · MEX · CAN 2026</p>
                <p className="text-sm font-bold mt-0.5">KNOCKOUT TIE-SHEET</p>
              </div>
              {['R32','R16','QF','SF','3rd','F'].map(round => {
                const rm = matches.filter(m => m.stage === 'knockout' && m.group === round)
                const labels: Record<string,string> = { R32:'Round of 32', R16:'Round of 16', QF:'Quarter-finals', SF:'Semi-finals', '3rd':'3rd Place', F:'Final' }
                return (
                  <div key={round} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-3 py-1.5 text-xs font-bold text-white" style={{ background: '#8b1c2c' }}>{labels[round]}</div>
                    <div className="p-3 space-y-2">
                      {rm.length === 0 ? <p className="text-xs text-gray-400">Bracket seeding pending</p> : rm.map(m => (
                        <div key={m.id} className="flex items-center gap-1.5 text-xs">
                          <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name || 'TBD'} size="sm" />
                          <span className="flex-1 text-gray-700 truncate">{m.homeTeam.name || 'TBD'}</span>
                          <span className="font-bold w-10 text-center text-gray-600">
                            {m.status === 'finished' ? `${m.homeScore}–${m.awayScore}` : fmtTime(m.matchDate)}
                          </span>
                          <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam.name || 'TBD'}</span>
                          <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name || 'TBD'} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: Groups G–L */}
            <div className="space-y-3">
              {GROUPS.slice(6).map(g => {
                const gm = matches.filter(m => m.stage === 'group' && m.group === g)
                return (
                  <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide" style={{ background: '#111827' }}>Group {g}</div>
                    <div className="p-3 space-y-1.5">
                      {gm.length === 0 ? <p className="text-xs text-gray-400">–</p> : gm.map(m => (
                        <div key={m.id} className="flex items-center gap-1.5 text-xs">
                          <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="sm" />
                          <span className="flex-1 text-gray-700 truncate">{m.homeTeam.name}</span>
                          <span className="font-bold w-10 text-center text-gray-600">
                            {m.status === 'finished' ? `${m.homeScore}–${m.awayScore}` : fmtTime(m.matchDate)}
                          </span>
                          <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam.name}</span>
                          <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
