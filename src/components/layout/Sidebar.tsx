import Link from 'next/link'
import FlagImg from '@/components/ui/FlagImg'
import type { SidebarData } from '@/lib/sidebar'

interface Props extends SidebarData {
  isLoggedIn?: boolean
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function fmtDayFull(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
}
function countdown(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return 'Live now!'
  const days = Math.floor(diff / 86400000)
  const hrs = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `Just ${days} days · ${hrs} hr · ${mins} min until`
  if (hrs > 0) return `Just ${hrs} hr · ${mins} min until`
  return `Just ${mins} min until`
}

export default function Sidebar({ topPerformers, nextMatch, comingUp, groupAStandings, isLoggedIn }: Props) {
  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-3">

      {/* TOP PERFORMERS */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a5f' }}>
          <span className="text-white text-xs font-bold tracking-widest uppercase">Top Performers</span>
          <Link href="/leaderboard" className="text-yellow-400 text-xs hover:underline">View all top performers</Link>
        </div>
        <div className="p-3 space-y-1">
          {topPerformers.length === 0 ? (
            <p className="text-xs text-gray-400 p-2">No players registered yet.</p>
          ) : topPerformers.slice(0, 3).map((p, i) => {
            const medal = p.medal ?? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉')
            return (
              <Link key={i} href="/leaderboard"
                className="flex items-start gap-2 py-2 px-1 rounded hover:bg-gray-50 transition-colors block">
                <span className="text-base flex-shrink-0">{medal}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 text-xs">{p.display}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {p.cheeringFrom ? `${p.cheeringFrom} · ` : ''}{p.league} · {p.total} pts
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* COUNT ME IN (guests) */}
      {!isLoggedIn && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <p className="text-xs text-gray-600 text-center font-semibold">Count Me In!</p>
          <Link href="/auth/register"
            className="block text-center py-2.5 rounded-lg text-white text-sm font-semibold transition-colors"
            style={{ background: '#8b1c2c' }}>Register</Link>
          <Link href="/auth/login"
            className="block text-center py-2.5 rounded-lg text-white text-sm font-semibold transition-colors"
            style={{ background: '#1e3a5f' }}>Log in</Link>
        </div>
      )}

      {/* NEXT MATCH (countdown) */}
      {nextMatch && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Next match</p>
            <p className="text-xs text-gray-400 mt-0.5">{countdown(nextMatch.matchDate)}</p>
          </div>
          <Link href="/predictions" className="flex items-center justify-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <FlagImg iso2={nextMatch.homeTeam.flag} name={nextMatch.homeTeam.name} size="md" />
            <span className="text-xs text-gray-500 font-bold">vs</span>
            <FlagImg iso2={nextMatch.awayTeam.flag} name={nextMatch.awayTeam.name} size="md" />
          </Link>
          <div className="px-4 pb-3 text-center text-xs text-gray-500">
            {nextMatch.homeTeam.name} vs {nextMatch.awayTeam.name}
          </div>
        </div>
      )}

      {/* TODAY'S MATCH */}
      {comingUp && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1e3a5f' }}>
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="text-white text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#2563eb' }}>TODAY</span>
            <span className="text-white text-xs font-bold tracking-widest uppercase">Football Match</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-4 bg-white rounded-xl px-4 py-3 mb-2">
              <FlagImg iso2={comingUp.homeTeam.flag} name={comingUp.homeTeam.name} size="lg" />
              <span className="text-xs font-black text-gray-600 px-2">VS</span>
              <FlagImg iso2={comingUp.awayTeam.flag} name={comingUp.awayTeam.name} size="lg" />
            </div>
            <div className="text-center py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: '#0f2040' }}>
              {fmtDayFull(comingUp.matchDate)}
            </div>
            <p className="text-center text-yellow-400 text-xl font-black mt-1.5">{fmtTime(comingUp.matchDate)}</p>
          </div>
        </div>
      )}

      {/* COMING UP */}
      {nextMatch && nextMatch.id !== comingUp?.id && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1e3a5f' }}>
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="text-white text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#f97316' }}>NEXT</span>
            <span className="text-white text-xs font-bold tracking-widest uppercase">Football Match</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-4 bg-white rounded-xl px-4 py-3 mb-2">
              <FlagImg iso2={nextMatch.homeTeam.flag} name={nextMatch.homeTeam.name} size="lg" />
              <span className="text-xs font-black text-gray-600 px-2">VS</span>
              <FlagImg iso2={nextMatch.awayTeam.flag} name={nextMatch.awayTeam.name} size="lg" />
            </div>
            <div className="text-center py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: '#0f2040' }}>
              {fmtDayFull(nextMatch.matchDate)}
            </div>
            <p className="text-center text-yellow-400 text-xl font-black mt-1.5">{fmtTime(nextMatch.matchDate)}</p>
          </div>
        </div>
      )}

      {/* GROUP A STANDINGS */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a5f' }}>
          <span className="text-white text-xs font-bold tracking-widest uppercase">Group A Standings</span>
          <Link href="/standings" className="text-yellow-400 text-xs hover:underline">All groups</Link>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-3 py-2 text-left text-gray-400 font-normal"></th>
              <th className="px-2 py-2 text-center text-gray-400 font-normal">P</th>
              <th className="px-2 py-2 text-center font-normal" style={{ color: '#dc2626' }}>Pts</th>
              <th className="px-2 py-2 text-center text-gray-400 font-normal">GD</th>
            </tr>
          </thead>
          <tbody>
            {groupAStandings.length > 0 ? groupAStandings.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <FlagImg iso2={t.flag} name={t.name} size="sm" />
                </td>
                <td className="px-2 py-2 text-center text-gray-600">{t.p}</td>
                <td className="px-2 py-2 text-center font-bold" style={{ color: '#dc2626' }}>{t.pts}</td>
                <td className="px-2 py-2 text-center text-gray-500">{t.gd}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="px-3 py-3 text-xs text-gray-400 text-center">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TOP GOALSCORERS */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Top Goalscorers</p>
          <p className="text-xs text-gray-400 mt-0.5">Tournament goalscorers</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400">No goal data yet — check back after matches are played.</p>
        </div>
      </div>
    </aside>
  )
}
