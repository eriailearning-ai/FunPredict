import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// FIFA World Cup 2026 Power Rankings — updated June 19, 2026
// Points = FIFA World Ranking points (pre-tournament adjusted for results)
// change = rank movement since tournament started
const RANKINGS = [
  { rank:  1, prev:  1, flag: 'fr',     name: 'France',           conf: 'UEFA',     pts: 1862 },
  { rank:  2, prev:  2, flag: 'es',     name: 'Spain',            conf: 'UEFA',     pts: 1855 },
  { rank:  3, prev:  3, flag: 'ar',     name: 'Argentina',        conf: 'CONMEBOL', pts: 1853 },
  { rank:  4, prev:  4, flag: 'gb-eng', name: 'England',          conf: 'UEFA',     pts: 1819 },
  { rank:  5, prev:  5, flag: 'br',     name: 'Brazil',           conf: 'CONMEBOL', pts: 1788 },
  { rank:  6, prev:  6, flag: 'pt',     name: 'Portugal',         conf: 'UEFA',     pts: 1778 },
  { rank:  7, prev:  9, flag: 'de',     name: 'Germany',          conf: 'UEFA',     pts: 1758 },
  { rank:  8, prev:  7, flag: 'nl',     name: 'Netherlands',      conf: 'UEFA',     pts: 1752 },
  { rank:  9, prev:  8, flag: 'be',     name: 'Belgium',          conf: 'UEFA',     pts: 1748 },
  { rank: 10, prev: 10, flag: 'uy',     name: 'Uruguay',          conf: 'CONMEBOL', pts: 1736 },
  { rank: 11, prev: 11, flag: 'hr',     name: 'Croatia',          conf: 'UEFA',     pts: 1729 },
  { rank: 12, prev: 12, flag: 'ma',     name: 'Morocco',          conf: 'CAF',      pts: 1726 },
  { rank: 13, prev: 13, flag: 'co',     name: 'Colombia',         conf: 'CONMEBOL', pts: 1692 },
  { rank: 14, prev: 16, flag: 'mx',     name: 'Mexico',           conf: 'CONCACAF', pts: 1689 },
  { rank: 15, prev: 17, flag: 'us',     name: 'United States',    conf: 'CONCACAF', pts: 1685 },
  { rank: 16, prev: 14, flag: 'sn',     name: 'Senegal',          conf: 'CAF',      pts: 1672 },
  { rank: 17, prev: 15, flag: 'ch',     name: 'Switzerland',      conf: 'UEFA',     pts: 1665 },
  { rank: 18, prev: 20, flag: 'kr',     name: 'South Korea',      conf: 'AFC',      pts: 1658 },
  { rank: 19, prev: 18, flag: 'jp',     name: 'Japan',            conf: 'AFC',      pts: 1655 },
  { rank: 20, prev: 19, flag: 'at',     name: 'Austria',          conf: 'UEFA',     pts: 1648 },
  { rank: 21, prev: 23, flag: 'no',     name: 'Norway',           conf: 'UEFA',     pts: 1638 },
  { rank: 22, prev: 21, flag: 'ec',     name: 'Ecuador',          conf: 'CONMEBOL', pts: 1625 },
  { rank: 23, prev: 25, flag: 'se',     name: 'Sweden',           conf: 'UEFA',     pts: 1620 },
  { rank: 24, prev: 24, flag: 'ca',     name: 'Canada',           conf: 'CONCACAF', pts: 1615 },
  { rank: 25, prev: 27, flag: 'gb-sct', name: 'Scotland',         conf: 'UEFA',     pts: 1612 },
  { rank: 26, prev: 26, flag: 'cz',     name: 'Czechia',          conf: 'UEFA',     pts: 1595 },
  { rank: 27, prev: 22, flag: 'eg',     name: 'Egypt',            conf: 'CAF',      pts: 1585 },
  { rank: 28, prev: 28, flag: 'dz',     name: 'Algeria',          conf: 'CAF',      pts: 1582 },
  { rank: 29, prev: 29, flag: 'tr',     name: 'Türkiye',          conf: 'UEFA',     pts: 1574 },
  { rank: 30, prev: 32, flag: 'au',     name: 'Australia',        conf: 'AFC',      pts: 1570 },
  { rank: 31, prev: 30, flag: 'ci',     name: 'Ivory Coast',      conf: 'CAF',      pts: 1567 },
  { rank: 32, prev: 31, flag: 'sa',     name: 'Saudi Arabia',     conf: 'AFC',      pts: 1555 },
  { rank: 33, prev: 33, flag: 'ir',     name: 'Iran',             conf: 'AFC',      pts: 1548 },
  { rank: 34, prev: 34, flag: 'ba',     name: 'Bosnia & Herz.',   conf: 'UEFA',     pts: 1536 },
  { rank: 35, prev: 35, flag: 'py',     name: 'Paraguay',         conf: 'CONMEBOL', pts: 1530 },
  { rank: 36, prev: 36, flag: 'za',     name: 'South Africa',     conf: 'CAF',      pts: 1522 },
  { rank: 37, prev: 37, flag: 'gh',     name: 'Ghana',            conf: 'CAF',      pts: 1518 },
  { rank: 38, prev: 38, flag: 'jo',     name: 'Jordan',           conf: 'AFC',      pts: 1510 },
  { rank: 39, prev: 39, flag: 'nz',     name: 'New Zealand',      conf: 'OFC',      pts: 1505 },
  { rank: 40, prev: 40, flag: 'qa',     name: 'Qatar',            conf: 'AFC',      pts: 1485 },
  { rank: 41, prev: 41, flag: 'cv',     name: 'Cabo Verde',       conf: 'CAF',      pts: 1478 },
  { rank: 42, prev: 42, flag: 'tn',     name: 'Tunisia',          conf: 'CAF',      pts: 1466 },
  { rank: 43, prev: 43, flag: 'pa',     name: 'Panama',           conf: 'CONCACAF', pts: 1455 },
  { rank: 44, prev: 44, flag: 'cd',     name: 'DR Congo',         conf: 'CAF',      pts: 1445 },
  { rank: 45, prev: 45, flag: 'iq',     name: 'Iraq',             conf: 'AFC',      pts: 1432 },
  { rank: 46, prev: 46, flag: 'uz',     name: 'Uzbekistan',       conf: 'AFC',      pts: 1395 },
  { rank: 47, prev: 47, flag: 'ht',     name: 'Haiti',            conf: 'CONCACAF', pts: 1367 },
  { rank: 48, prev: 48, flag: 'cw',     name: 'Curaçao',          conf: 'CONCACAF', pts: 1330 },
]

const CONFED_COLORS: Record<string, string> = {
  UEFA:     '#003087',
  CONMEBOL: '#006b3c',
  CONCACAF: '#c8102e',
  AFC:      '#e4002b',
  CAF:      '#f8a501',
  OFC:      '#0057a8',
}

export default async function PowerRankingsPage() {
  const [sidebarData, session] = await Promise.all([
    getSidebarData().catch(() => ({ topPerformers: [], nextMatch: null, comingUp: null, groupAStandings: [], topScorers: [] })),
    getSession().catch(() => null),
  ])

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Power Rankings</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            {/* Hero */}
            <div className="px-6 py-6 rounded-t-xl" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 60%,#8b1c2c 100%)' }}>
              <p className="text-xs font-bold tracking-widest text-yellow-400 uppercase mb-1">FIFA World Cup 2026™</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Power Rankings</h1>
              <p className="text-sm text-gray-300 mt-1">
                All 48 qualified nations ranked by FIFA World Ranking points · Updated June 19, 2026
              </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
              {/* Column header */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b-2 border-gray-100" style={{ background: '#f9fafb' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">Rank</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-gray-400 uppercase w-10">±</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Team</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Conf.</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase" style={{ color: '#1e3a5f' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RANKINGS.map((r, i) => {
                      const diff = r.prev - r.rank  // positive = moved up
                      return (
                        <tr key={r.rank}
                          className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${i < 3 ? 'bg-yellow-50/40' : ''}`}>
                          {/* Rank */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-black w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-700'}`}>
                                {r.rank}
                              </span>
                              {i < 3 && (
                                <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                              )}
                            </div>
                          </td>

                          {/* Movement */}
                          <td className="px-2 py-3.5 text-center">
                            {diff > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#16a34a' }}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                                </svg>
                                {diff}
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#dc2626' }}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                                {Math.abs(diff)}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs font-semibold">—</span>
                            )}
                          </td>

                          {/* Team */}
                          <td className="px-4 py-3.5">
                            <Link href={`/tournament/teams/${r.name.replace(/\s+/g, '-').toLowerCase()}`}
                              className="flex items-center gap-3 group">
                              <FlagImg iso2={r.flag} name={r.name} size="md" />
                              <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {r.name}
                              </span>
                            </Link>
                          </td>

                          {/* Confederation */}
                          <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded text-white"
                              style={{ background: CONFED_COLORS[r.conf] ?? '#6b7280' }}>
                              {r.conf}
                            </span>
                          </td>

                          {/* Points */}
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-black" style={{ color: '#1e3a5f' }}>{r.pts.toLocaleString()}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer note */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Points based on FIFA World Rankings formula. ± movement reflects rank changes since tournament began June 11, 2026.
                  <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/power-rankings"
                    target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-blue-600">Official FIFA source →</a>
                </p>
              </div>
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
