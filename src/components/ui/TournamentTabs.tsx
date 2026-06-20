'use client'
import { useState, useMemo } from 'react'
import FlagImg from '@/components/ui/FlagImg'
import Link from 'next/link'
import { fmtTime, stageName } from '@/lib/fmt'
import FullBracketView from '@/components/ui/FullBracketView'

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

/** "Thursday 11 June 2026" */
function fmtDayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function TournamentTabs({ matches }: { matches: MatchRow[] }) {
  const [tab, setTab] = useState<'byday' | 'bracket'>('byday')

  /* ── Group by calendar day ── */
  const { byDay, dayKeys } = useMemo(() => {
    const acc: Record<string, MatchRow[]> = {}
    for (const m of matches) {
      // Use LOCAL date so matches don't slip into the wrong day due to UTC offset
      const d = new Date(m.matchDate)
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!acc[day]) acc[day] = []
      acc[day].push(m)
    }
    const keys = Object.keys(acc).sort()
    return { byDay: acc, dayKeys: keys }
  }, [matches])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
        <p className="text-xs font-bold tracking-widest text-yellow-400 uppercase mb-1">FIFA World Cup 2026™</p>
        <h1 className="text-2xl font-black text-white">Match Fixtures</h1>
        <p className="text-sm text-gray-300 mt-1">Match times shown in your local timezone.</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <button onClick={() => setTab('byday')}
          className="flex-1 py-3 text-sm font-bold tracking-wide transition-colors"
          style={{ background: tab === 'byday' ? '#1e3a5f' : '#fff', color: tab === 'byday' ? '#fff' : '#374151' }}>
          BY DATE
        </button>
        <button onClick={() => setTab('bracket')}
          className="flex-1 py-3 text-sm font-bold tracking-wide border-l border-gray-200 transition-colors"
          style={{ background: tab === 'bracket' ? '#1e3a5f' : '#fff', color: tab === 'bracket' ? '#fff' : '#374151' }}>
          FULL BRACKET
        </button>
      </div>

      {/* ── BY DATE ── */}
      {tab === 'byday' && (
        <div>
          {dayKeys.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">⚽</p>
              <p className="font-semibold">Match schedule loading…</p>
              <p className="text-xs mt-1">Please try refreshing in a moment.</p>
            </div>
          )}

          {dayKeys.map(day => {
            const dayMatches = byDay[day]
            const heading = fmtDayHeading(day)

            return (
              <div key={day} className="mb-1">
                {/* Date strip — light gray, FIFA style */}
                <div className="flex items-center justify-between px-5 py-3" style={{ background: '#f5f5f5' }}>
                  <span className="text-base font-semibold text-gray-900">{heading}</span>
                  <Link href="/tournament/groups"
                    className="text-sm font-medium hover:underline" style={{ color: '#1e3a5f' }}>
                    View groups
                  </Link>
                </div>

                {/* Match cards */}
                <div className="divide-y divide-gray-100 bg-white">
                  {dayMatches.map(m => {
                    const isFinished = m.status === 'finished'
                    const isLive     = m.status === 'live'
                    const homeWin = isFinished && (m.homeScore ?? 0) > (m.awayScore ?? 0)
                    const awayWin = isFinished && (m.awayScore ?? 0) > (m.homeScore ?? 0)

                    return (
                      <div key={m.id} className="px-6 py-5">
                        {/* Teams + score row — centered */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6">

                          {/* Home team: name → flag → score */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
                            <span className="text-sm sm:text-base font-medium text-gray-900 text-right truncate">
                              {m.homeTeam.name}
                            </span>
                            <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="md" />
                            {(isFinished || isLive) && (
                              <div className="flex flex-col items-center flex-shrink-0">
                                <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">
                                  {m.homeScore}
                                </span>
                                {homeWin && (
                                  <div className="mt-1 h-0.5 w-full rounded-full" style={{ background: '#16a34a' }} />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Center: FT / time / LIVE */}
                          <div className="flex-shrink-0 text-center w-16 sm:w-20">
                            {isFinished ? (
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">FT</span>
                            ) : isLive ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#dc2626' }} />
                                <span className="text-xs font-bold tracking-wide" style={{ color: '#dc2626' }}>LIVE</span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold" style={{ color: '#1e3a5f' }}>
                                {fmtTime(m.matchDate)}
                              </span>
                            )}
                          </div>

                          {/* Away team: score → flag → name */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start min-w-0">
                            {(isFinished || isLive) && (
                              <div className="flex flex-col items-center flex-shrink-0">
                                <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">
                                  {m.awayScore}
                                </span>
                                {awayWin && (
                                  <div className="mt-1 h-0.5 w-full rounded-full" style={{ background: '#16a34a' }} />
                                )}
                              </div>
                            )}
                            <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="md" />
                            <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {m.awayTeam.name}
                            </span>
                          </div>
                        </div>

                        {/* Meta: stage · group · venue */}
                        <p className="text-center text-xs text-gray-400 mt-2">
                          {stageName(m.stage, m.group)}
                          {m.venue ? ` · ${m.venue}` : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FULL BRACKET ── */}
      {tab === 'bracket' && <FullBracketView matches={matches} />}
    </div>
  )
}
