'use client'
import FlagImg from '@/components/ui/FlagImg'
import Link from 'next/link'

type Team = { name: string; flag: string }
export type LiveMatch = {
  id: number
  homeTeam: Team
  awayTeam: Team
  matchDate: string
  stage: string
  group: string
  venue: string
  status: string
  homeScore: number | null
  awayScore: number | null
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function stageMeta(stage: string, group: string, venue: string) {
  const s = stage === 'group' ? `First Stage · Group ${group}` : group
  return venue ? `${s} · ${venue}` : s
}

function MatchCard({ m }: { m: LiveMatch }) {
  const isLive     = m.status === 'live'
  const isFinished = m.status === 'finished'
  const hasScore   = isLive || isFinished

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const matchDay = new Date(m.matchDate).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const dayLabel = matchDay === today ? 'Today' : new Date(m.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })

  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="px-4 pt-3.5 pb-2 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-gray-500">FIFA World Cup 2026™</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[190px]">{stageMeta(m.stage, m.group, m.venue)}</p>
          </div>
          <span className={`text-xs font-semibold flex-shrink-0 ${isLive ? 'text-red-600' : 'text-gray-500'}`}>
            {isLive ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
              </span>
            ) : dayLabel}
          </span>
        </div>
      </div>

      {/* Teams + score */}
      <div className="px-4 py-4 flex-1">
        {hasScore ? (
          /* Finished or live — stack teams with scores on right */
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="md" />
                <span className="text-sm font-medium text-gray-900 truncate">{m.homeTeam.name}</span>
              </div>
              <span className="text-2xl font-black text-gray-900 flex-shrink-0">{m.homeScore}</span>
            </div>

            {/* Center label */}
            <div className="flex justify-end pr-0.5">
              {isLive
                ? <span className="text-xs font-bold text-red-500">● LIVE</span>
                : <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">FT</span>
              }
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="md" />
                <span className="text-sm font-medium text-gray-900 truncate">{m.awayTeam.name}</span>
              </div>
              <span className="text-2xl font-black text-gray-900 flex-shrink-0">{m.awayScore}</span>
            </div>
          </div>
        ) : (
          /* Upcoming — teams stacked, time centered */
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="md" />
                <span className="text-sm font-medium text-gray-900 truncate">{m.homeTeam.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="md" />
                <span className="text-sm font-medium text-gray-900 truncate">{m.awayTeam.name}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="text-2xl font-black" style={{ color: '#1e3a5f' }}>{fmtTime(m.matchDate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <Link href={`/predictions`} className="text-xs font-semibold hover:underline" style={{ color: '#1e3a5f' }}>
          Predict →
        </Link>
      </div>
    </div>
  )
}

export default function LiveMatchCards({ matches }: { matches: LiveMatch[] }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Follow the World Cup action</h2>
        <Link href="/tournament" className="text-sm font-medium hover:underline" style={{ color: '#1e3a5f' }}>
          All fixtures →
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center text-gray-400">
          <p className="text-3xl mb-2">⚽</p>
          <p className="text-sm font-medium">Schedule coming soon</p>
          <p className="text-xs mt-1">
            <Link href="/schedule" className="hover:underline" style={{ color: '#1e3a5f' }}>View full schedule →</Link>
          </p>
        </div>
      ) : (
        /* Horizontal scroll row */
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
          {matches.map(m => <MatchCard key={m.id} m={m} />)}
        </div>
      )}
    </section>
  )
}
