'use client'
import { useState } from 'react'
import Link from 'next/link'

const HOST_CODES = ['MEX', 'CAN', 'USA']
const CONFED_ORDER = ['ALL', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA']
const CONFED_LABEL: Record<string, string> = {
  ALL: 'All', AFC: 'AFC', CAF: 'CAF', CONCACAF: 'CONCACAF',
  CONMEBOL: 'CONMEBOL', OFC: 'OFC', UEFA: 'UEFA',
}

// Static FIFA world rankings & WC participations
const TEAM_STATS: Record<string, { rank: number; participations: number }> = {
  ARG: { rank: 1,  participations: 18 },
  FRA: { rank: 2,  participations: 16 },
  BRA: { rank: 3,  participations: 22 },
  ENG: { rank: 4,  participations: 16 },
  BEL: { rank: 5,  participations: 14 },
  CRO: { rank: 6,  participations: 6  },
  NED: { rank: 7,  participations: 11 },
  POR: { rank: 8,  participations: 8  },
  ESP: { rank: 9,  participations: 16 },
  MAR: { rank: 11, participations: 6  },
  COL: { rank: 12, participations: 6  },
  GER: { rank: 13, participations: 20 },
  URU: { rank: 14, participations: 14 },
  MEX: { rank: 15, participations: 17 },
  USA: { rank: 16, participations: 11 },
  ECU: { rank: 17, participations: 4  },
  SUI: { rank: 18, participations: 12 },
  JPN: { rank: 19, participations: 8  },
  IRN: { rank: 20, participations: 6  },
  SEN: { rank: 21, participations: 3  },
  AUT: { rank: 22, participations: 3  },
  CZE: { rank: 23, participations: 1  },
  KOR: { rank: 24, participations: 11 },
  AUS: { rank: 25, participations: 6  },
  SWE: { rank: 26, participations: 12 },
  TUR: { rank: 27, participations: 2  },
  CIV: { rank: 38, participations: 3  },
  CAN: { rank: 30, participations: 2  },
  QAT: { rank: 35, participations: 2  },
  EGY: { rank: 36, participations: 3  },
  DEN: { rank: 21, participations: 5  },
  NOR: { rank: 45, participations: 3  },
  IRQ: { rank: 56, participations: 1  },
  ALG: { rank: 32, participations: 4  },
  GHA: { rank: 68, participations: 4  },
  SAU: { rank: 58, participations: 6  },
  NZL: { rank: 93, participations: 2  },
  SEN2: { rank: 21, participations: 3 },
  SCO: { rank: 39, participations: 8  },
  RSA: { rank: 59, participations: 3  },
  BOI: { rank: 75, participations: 1  },
  BIH: { rank: 75, participations: 1  },
  CPV: { rank: 65, participations: 1  },
  COD: { rank: 61, participations: 1  },
  CUW: { rank: 88, participations: 1  },
  HTI: { rank: 87, participations: 1  },
  JOR: { rank: 70, participations: 1  },
  PAN: { rank: 41, participations: 1  },
  PAR: { rank: 52, participations: 8  },
  TUN: { rank: 40, participations: 6  },
  UZB: { rank: 64, participations: 1  },
}

export interface TeamRow {
  id: number
  code: string
  name: string
  group: string
  flag: string          // ISO2
  confederation: string
}

const FLAG_BASE = 'https://flagcdn.com'

export default function TeamsGrid({ teams }: { teams: TeamRow[] }) {
  const [confed, setConfed] = useState('ALL')
  const [search, setSearch] = useState('')

  const confedCounts: Record<string, number> = { ALL: teams.length }
  for (const t of teams) confedCounts[t.confederation] = (confedCounts[t.confederation] ?? 0) + 1

  let visible = confed === 'ALL' ? teams : teams.filter(t => t.confederation === confed)
  if (search.trim()) {
    const q = search.toLowerCase()
    visible = visible.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
  }

  const hosts = visible.filter(t => HOST_CODES.includes(t.code))
    .sort((a, b) => a.name.localeCompare(b.name))
  const qualified = visible.filter(t => !HOST_CODES.includes(t.code))
    .sort((a, b) => a.name.localeCompare(b.name))

  function TeamCard({ t }: { t: TeamRow }) {
    const stats = TEAM_STATS[t.code] ?? null
    const isHost = HOST_CODES.includes(t.code)
    return (
      <Link href={`/tournament/teams/${t.code}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
          {/* Flag */}
          <div className="relative overflow-hidden bg-gray-100" style={{ height: 110 }}>
            <img
              src={`${FLAG_BASE}/w320/${t.flag}.png`}
              alt={t.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.currentTarget as HTMLImageElement).src = `${FLAG_BASE}/w320/un.png` }}
            />
            {isHost && (
              <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold text-white rounded"
                style={{ background: '#8b1c2c' }}>HOST</span>
            )}
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold text-white rounded"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              {t.confederation}
            </span>
          </div>

          {/* Info */}
          <div className="px-3 py-3">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate group-hover:text-blue-800 transition-colors mb-2">
              {t.name}
            </p>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-semibold px-2 py-0.5 rounded" style={{ background: '#f0f4ff', color: '#1e3a5f' }}>
                Group {t.group}
              </span>
              {stats && (
                <span className="font-medium">🏆 #{stats.rank}</span>
              )}
            </div>
            {stats && (
              <p className="text-[10px] text-gray-400 mt-1.5">
                {stats.participations} World Cup{stats.participations !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      {/* Hero header */}
      <div className="px-6 py-6 rounded-t-xl" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 60%,#8b1c2c 100%)' }}>
        <p className="text-xs font-bold tracking-widest text-yellow-400 uppercase mb-1">FIFA World Cup 2026™</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Teams</h1>
        <p className="text-sm text-gray-300 mt-1">All {teams.length} qualified nations for the 2026 World Cup</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CONFED_ORDER.filter(c => c === 'ALL' || (confedCounts[c] ?? 0) > 0).map(c => (
            <button key={c} onClick={() => setConfed(c)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
              style={{
                background: confed === c ? '#1e3a5f' : '#f3f4f6',
                color: confed === c ? '#fff' : '#374151',
                borderColor: confed === c ? '#1e3a5f' : '#e5e7eb',
              }}>
              {CONFED_LABEL[c]}{c !== 'ALL' ? ` (${confedCounts[c] ?? 0})` : ''}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search teams…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400 w-full sm:w-44"
        />
      </div>

      {/* Content */}
      <div className="bg-gray-50 px-4 py-6 rounded-b-xl space-y-8">
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">⚽</p>
            <p className="font-semibold">Team data loading…</p>
            <p className="text-xs mt-1">Please try refreshing in a moment.</p>
          </div>
        ) : (
          <>
            {/* Host countries */}
            {hosts.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#8b1c2c' }}>
                  🏟 Host Countries
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {hosts.map(t => <TeamCard key={t.id} t={t} />)}
                </div>
              </div>
            )}

            {/* Qualified teams */}
            {qualified.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#1e3a5f' }}>
                  ⚽ Qualified Teams
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {qualified.map(t => <TeamCard key={t.id} t={t} />)}
                </div>
              </div>
            )}

            {qualified.length === 0 && hosts.length === 0 && (
              <div className="bg-white rounded-xl p-10 text-center text-gray-400">No teams match your search.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
