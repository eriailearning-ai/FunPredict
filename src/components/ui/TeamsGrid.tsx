'use client'
import { useState } from 'react'
import Link from 'next/link'
import FlagImg from '@/components/ui/FlagImg'

const HOST_CODES = ['MEX', 'CAN', 'USA']
const HOST_COLORS: Record<string, string> = {
  MEX: '#166534',
  CAN: '#991b1b',
  USA: '#1e3a5f',
}
const CONFEDS = ['ALL', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA']

export interface TeamRow {
  id: number
  code: string
  name: string
  group: string
  flag: string          // ISO2
  confederation: string
}

export default function TeamsGrid({ teams }: { teams: TeamRow[] }) {
  const [confed, setConfed] = useState('ALL')

  const visible = confed === 'ALL' ? teams : teams.filter(t => t.confederation === confed)
  const hosts     = visible.filter(t => HOST_CODES.includes(t.code))
  const qualified = visible.filter(t => !HOST_CODES.includes(t.code)).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
        <h1 className="text-2xl font-black text-yellow-400 mb-1">Teams</h1>
        <p className="text-sm text-gray-300">All {teams.length} qualified nations. Click a team to see their squad and fixtures.</p>
      </div>

      {/* Confederation filter */}
      <div className="flex flex-wrap gap-2">
        {CONFEDS.map(c => (
          <button
            key={c}
            onClick={() => setConfed(c)}
            className="px-3 py-1 rounded text-xs font-bold border transition-colors"
            style={{
              background: confed === c ? '#1e3a5f' : '#fff',
              color: confed === c ? '#fff' : '#374151',
              borderColor: confed === c ? '#1e3a5f' : '#d1d5db',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          <p>Teams not yet loaded. Use Admin → Seed DB to import.</p>
        </div>
      ) : (
        <>
          {/* Host countries */}
          {hosts.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Host country</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hosts.map(t => (
                  <Link key={t.id} href={`/tournament/teams/${t.code}`}>
                    <div className="rounded-xl p-5 text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background: HOST_COLORS[t.code] ?? '#1e3a5f' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <FlagImg iso2={t.flag} name={t.name} size="md" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Host country</span>
                      </div>
                      <p className="text-xl font-black">{t.name}</p>
                      <div className="mt-3 text-xs text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Stage</span>
                          <span className="font-semibold text-white">Group {t.group}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confederation</span>
                          <span className="font-semibold text-white">{t.confederation}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Qualified teams */}
          {qualified.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Qualified teams</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {qualified.map(t => (
                  <Link key={t.id} href={`/tournament/teams/${t.code}`}>
                    <div className="rounded-xl p-4 text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ background: '#111827' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <FlagImg iso2={t.flag} name={t.name} size="sm" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{t.confederation}</span>
                      </div>
                      <p className="text-sm font-bold leading-tight">{t.name}</p>
                      <div className="mt-2 text-[10px] text-gray-400">
                        <div className="flex justify-between">
                          <span>Stage</span>
                          <span className="text-gray-200 font-semibold">Group {t.group}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
