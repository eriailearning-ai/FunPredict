'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import FlagImg from '@/components/ui/FlagImg'
import Link from 'next/link'

// ─── Static data ──────────────────────────────────────────────────────────────

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoFlag(code: string) {
  const MAP: Record<string,string> = {
    MEX:'mx',ZAF:'za',KOR:'kr',CZE:'cz',CAN:'ca',BIH:'ba',QAT:'qa',SUI:'ch',
    HTI:'ht',SCO:'gb-sct',BRA:'br',MAR:'ma',USA:'us',PRY:'py',AUS:'au',TUR:'tr',
    GER:'de',CUW:'cw',CIV:'ci',ECU:'ec',NED:'nl',JPN:'jp',SWE:'se',TUN:'tn',
    IRN:'ir',NZL:'nz',BEL:'be',EGY:'eg',KSA:'sa',URY:'uy',ESP:'es',CPV:'cv',
    FRA:'fr',SEN:'sn',IRQ:'iq',NOR:'no',ARG:'ar',ALG:'dz',AUT:'at',JOR:'jo',
    POR:'pt',COD:'cd',UZB:'uz',COL:'co',GHA:'gh',PAN:'pa',ENG:'gb-eng',CRO:'hr',
  }
  return MAP[code?.toUpperCase()] ?? code?.toLowerCase()?.slice(0,2) ?? ''
}

function fmtDayHeader(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false })
}
function stageName(stage: string, group: string) {
  if (stage === 'group') return `First stage · Group ${group}`
  const map: Record<string,string> = { R32:'Round of 32', R16:'Round of 16', QF:'Quarter-finals', SF:'Semi-final', '3rd':'Third place', F:'Final' }
  return map[group] ?? group
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TournamentPage() {
  const [tab, setTab] = useState<'byday' | 'bracket'>('byday')
  const [matches, setMatches] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    fetch('/api/tournament/matches').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setMatches(data.sort((a:any,b:any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()))
    }).catch(() => {})
  }, [])

  // Group by day
  const byDate: Record<string, any[]> = {}
  for (const m of matches) {
    const key = fmtDayHeader(m.matchDate)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(m)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 pb-2">
        <div className="text-xs text-gray-400">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Matches</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-4">

            {/* Dark gradient header card — matches eagledrop.net style */}
            <div
              className="rounded-xl px-6 py-5"
              style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}
            >
              <h1 className="text-2xl font-black text-yellow-400 mb-1">Matches</h1>
              <p className="text-sm text-gray-300">Full World Cup 2026 schedule grouped by day. Tap Match to predict or view stats.</p>
            </div>

            {/* Tab bar */}
            <div className="rounded-lg overflow-hidden flex" style={{ background: '#111827' }}>
              <span className="px-4 py-2.5 text-xs font-bold text-white tracking-widest uppercase border-b-2 border-yellow-400">
                MATCHES
              </span>
            </div>

            {/* BY DAY / FULL BRACKET toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setTab('byday')}
                className="flex-1 py-3 text-sm font-bold tracking-wide transition-colors"
                style={{
                  background: tab === 'byday' ? '#1e3a5f' : '#f3f4f6',
                  color: tab === 'byday' ? '#fff' : '#374151',
                }}
              >
                BY DAY
              </button>
              <button
                onClick={() => setTab('bracket')}
                className="flex-1 py-3 text-sm font-bold tracking-wide transition-colors border-l border-gray-200"
                style={{
                  background: tab === 'bracket' ? '#1e3a5f' : '#f3f4f6',
                  color: tab === 'bracket' ? '#fff' : '#374151',
                }}
              >
                FULL BRACKET
              </button>
            </div>

            {/* ── BY DAY tab ── */}
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
                      {dayMatches.map((m: any) => (
                        <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* Home team */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FlagImg iso2={isoFlag(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="md" />
                              <span className="text-sm font-semibold text-gray-800 truncate">{m.homeTeam?.name}</span>
                            </div>
                            {/* Score or time */}
                            <div className="text-center flex-shrink-0 w-20">
                              {m.status === 'finished' ? (
                                <span className="text-base font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                              ) : (
                                <span className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{fmtTime(m.matchDate)}</span>
                              )}
                            </div>
                            {/* Away team */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="text-sm font-semibold text-gray-800 truncate text-right">{m.awayTeam?.name}</span>
                              <FlagImg iso2={isoFlag(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="md" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {stageName(m.stage, m.group)}{m.venue ? ` · ${m.venue}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── FULL BRACKET tab ── */}
            {tab === 'bracket' && (
              <div className="space-y-6">
                {/* Hero bracket banner */}
                <div
                  className="rounded-xl p-5 text-center text-white"
                  style={{ background: 'linear-gradient(135deg,#0d1b3e,#8b1c2c)' }}
                >
                  <div className="text-2xl mb-1">🏆</div>
                  <p className="text-xs font-bold tracking-widest text-gray-300 mb-0.5">FIFA</p>
                  <h2 className="text-lg font-black">2026 WORLD CUP MATCH SCHEDULE</h2>
                  <p className="text-xs text-gray-400 mt-1">Group stage · Knockout rounds · All times in your local timezone</p>
                </div>

                {/* Group stage grid — A-F left, G-L right with knockout TIE-SHEET in centre */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left column: Groups A–F */}
                  <div className="space-y-3">
                    {GROUPS.slice(0, 6).map(g => {
                      const gm = matches.filter((m:any) => m.stage === 'group' && m.group === g)
                      return (
                        <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                          <div className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide" style={{ background: '#111827' }}>
                            Group {g}
                          </div>
                          <div className="p-3 space-y-1.5">
                            {gm.length === 0
                              ? <p className="text-xs text-gray-400">–</p>
                              : gm.map((m:any) => (
                                <div key={m.id} className="flex items-center gap-1.5 text-xs">
                                  <FlagImg iso2={isoFlag(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="sm" />
                                  <span className="flex-1 text-gray-700 truncate">{m.homeTeam?.name}</span>
                                  {m.status === 'finished'
                                    ? <span className="font-black text-gray-900 w-10 text-center">{m.homeScore}–{m.awayScore}</span>
                                    : <span className="text-gray-400 w-10 text-center">{fmtTime(m.matchDate)}</span>}
                                  <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam?.name}</span>
                                  <FlagImg iso2={isoFlag(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="sm" />
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Centre: Knockout bracket */}
                  <div className="space-y-3">
                    <div
                      className="rounded-xl p-4 text-white text-center"
                      style={{ background: 'linear-gradient(180deg,#1e3a5f,#0d1b3e)' }}
                    >
                      <p className="text-xs tracking-widest text-gray-300">USA · MEX · CAN 2026</p>
                      <p className="text-sm font-bold mt-0.5">KNOCKOUT TIE-SHEET</p>
                    </div>

                    {['R32','R16','QF','SF','3rd','F'].map(round => {
                      const roundMatches = matches.filter((m:any) => m.stage === 'knockout' && m.group === round)
                      const labels: Record<string,string> = { R32:'Round of 32', R16:'Round of 16', QF:'Quarter-finals', SF:'Semi-finals', '3rd':'3rd Place', F:'Final' }
                      if (roundMatches.length === 0) {
                        return (
                          <div key={round} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                            <p className="text-xs font-bold text-white rounded px-2 py-0.5 mb-2 inline-block" style={{ background: '#8b1c2c' }}>{labels[round]}</p>
                            <p className="text-xs text-gray-400">Bracket seeding pending</p>
                          </div>
                        )
                      }
                      return (
                        <div key={round} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                          <div className="px-3 py-1.5 text-xs font-bold text-white" style={{ background: '#8b1c2c' }}>{labels[round]}</div>
                          <div className="p-3 space-y-2">
                            {roundMatches.map((m:any) => (
                              <div key={m.id} className="flex items-center gap-1.5 text-xs">
                                <FlagImg iso2={isoFlag(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? 'TBD'} size="sm" />
                                <span className="flex-1 text-gray-700 truncate">{m.homeTeam?.name ?? 'TBD'}</span>
                                {m.status === 'finished'
                                  ? <span className="font-black text-gray-900 w-10 text-center">{m.homeScore}–{m.awayScore}</span>
                                  : <span className="text-gray-400 w-10 text-center">{fmtTime(m.matchDate)}</span>}
                                <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam?.name ?? 'TBD'}</span>
                                <FlagImg iso2={isoFlag(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? 'TBD'} size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Right column: Groups G–L */}
                  <div className="space-y-3">
                    {GROUPS.slice(6).map(g => {
                      const gm = matches.filter((m:any) => m.stage === 'group' && m.group === g)
                      return (
                        <div key={g} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                          <div className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide" style={{ background: '#111827' }}>
                            Group {g}
                          </div>
                          <div className="p-3 space-y-1.5">
                            {gm.length === 0
                              ? <p className="text-xs text-gray-400">–</p>
                              : gm.map((m:any) => (
                                <div key={m.id} className="flex items-center gap-1.5 text-xs">
                                  <FlagImg iso2={isoFlag(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="sm" />
                                  <span className="flex-1 text-gray-700 truncate">{m.homeTeam?.name}</span>
                                  {m.status === 'finished'
                                    ? <span className="font-black text-gray-900 w-10 text-center">{m.homeScore}–{m.awayScore}</span>
                                    : <span className="text-gray-400 w-10 text-center">{fmtTime(m.matchDate)}</span>}
                                  <span className="flex-1 text-gray-700 truncate text-right">{m.awayTeam?.name}</span>
                                  <FlagImg iso2={isoFlag(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="sm" />
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Sidebar placeholder (static for client component) */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-sm text-gray-500 mb-3">Join the fun — predict every match!</p>
              <div className="flex flex-col gap-2">
                <Link href="/auth/register" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#8b1c2c' }}>Register free</Link>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700">Log in</Link>
                <Link href="/predictions" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#1e3a5f', color: '#fff' }}>Go Predict →</Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Tournament</h3>
              <div className="space-y-1.5 text-sm">
                <Link href="/tournament" className="block text-blue-600 hover:underline">Matches</Link>
                <Link href="/tournament/groups" className="block text-gray-600 hover:underline">Groups</Link>
                <Link href="/tournament/teams" className="block text-gray-600 hover:underline">Teams</Link>
                <Link href="/tournament/venues" className="block text-gray-600 hover:underline">Venues</Link>
                <Link href="/schedule" className="block text-gray-600 hover:underline">Full Schedule</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
