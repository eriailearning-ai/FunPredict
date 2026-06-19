'use client'
import { useState } from 'react'
import Link from 'next/link'

const HOST_CODES = ['MEX', 'CAN', 'USA']
const CONFED_ORDER = ['ALL', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA']
const CONFED_LABEL: Record<string, string> = {
  ALL: 'All Teams',
  AFC: 'AFC',
  CAF: 'CAF',
  CONCACAF: 'CONCACAF',
  CONMEBOL: 'CONMEBOL',
  OFC: 'OFC',
  UEFA: 'UEFA',
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

function FlagCard({ iso2, name }: { iso2: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${FLAG_BASE}/w320/${iso2}.png`}
      alt={name}
      className="w-full h-full object-cover"
      onError={e => { (e.currentTarget as HTMLImageElement).src = `${FLAG_BASE}/w320/un.png` }}
    />
  )
}

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

  // Sort: hosts first, then alphabetical
  const sorted = [...visible].sort((a, b) => {
    const aHost = HOST_CODES.includes(a.code) ? 0 : 1
    const bHost = HOST_CODES.includes(b.code) ? 0 : 1
    if (aHost !== bHost) return aHost - bHost
    return a.name.localeCompare(b.name)
  })

  return (
    <div>
      {/* Hero header */}
      <div className="px-6 py-6 rounded-t-xl mb-0" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 60%,#8b1c2c 100%)' }}>
        <p className="text-xs font-bold tracking-widest text-yellow-400 uppercase mb-1">FIFA World Cup 2026™</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Teams</h1>
        <p className="text-sm text-gray-300 mt-1">All {teams.length} qualified nations for the 2026 World Cup</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Confederation tabs */}
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

        {/* Search */}
        <input
          type="text"
          placeholder="Search teams…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400 w-full sm:w-44"
        />
      </div>

      {/* Grid */}
      <div className="bg-gray-50 px-4 py-6 rounded-b-xl">
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">⚽</p>
            <p className="font-semibold">Team data loading…</p>
            <p className="text-xs mt-1">Please try refreshing in a moment.</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">No teams match your search.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map(t => {
              const isHost = HOST_CODES.includes(t.code)
              return (
                <Link key={t.id} href={`/tournament/teams/${t.code}`}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                    {/* Flag image */}
                    <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
                      <FlagCard iso2={t.flag} name={t.name} />
                      {/* Host badge overlay */}
                      {isHost && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold text-white rounded"
                          style={{ background: '#1e3a5f' }}>
                          HOST
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 py-3">
                      <p className="text-sm font-bold text-gray-900 leading-tight truncate group-hover:text-blue-800 transition-colors">
                        {t.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded"
                          style={{ background: '#f3f4f6', color: '#374151' }}>
                          Group {t.group}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{t.confederation}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
