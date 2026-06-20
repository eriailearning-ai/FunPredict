import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import StandingsTabs from '@/components/ui/StandingsTabs'
import type { StandingGroup } from '@/components/ui/StandingsTabs'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// FIFA World Cup 2026 — standings as of June 19, 2026
const GROUPS: StandingGroup[] = [
  { group: 'A', teams: [
    { flag: 'mx', name: 'Mexico',       mp:1, w:1, d:0, l:0, gf:2, ga:0, gd: 2, pts:3 },
    { flag: 'kr', name: 'South Korea',  mp:1, w:1, d:0, l:0, gf:2, ga:1, gd: 1, pts:3 },
    { flag: 'cz', name: 'Czechia',      mp:1, w:0, d:0, l:1, gf:1, ga:2, gd:-1, pts:0 },
    { flag: 'za', name: 'South Africa', mp:1, w:0, d:0, l:1, gf:0, ga:2, gd:-2, pts:0 },
  ]},
  { group: 'B', teams: [
    { flag: 'ca', name: 'Canada',             mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
    { flag: 'ba', name: 'Bosnia-Herzegovina', mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
    { flag: 'qa', name: 'Qatar',              mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
    { flag: 'ch', name: 'Switzerland',        mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
  ]},
  { group: 'C', teams: [
    { flag: 'gb-sct', name: 'Scotland', mp:1, w:1, d:0, l:0, gf:1, ga:0, gd: 1, pts:3 },
    { flag: 'ma',     name: 'Morocco',  mp:1, w:0, d:1, l:0, gf:1, ga:1, gd: 0, pts:1 },
    { flag: 'br',     name: 'Brazil',   mp:1, w:0, d:1, l:0, gf:1, ga:1, gd: 0, pts:1 },
    { flag: 'ht',     name: 'Haiti',    mp:1, w:0, d:0, l:1, gf:0, ga:1, gd:-1, pts:0 },
  ]},
  { group: 'D', teams: [
    { flag: 'us', name: 'United States', mp:1, w:1, d:0, l:0, gf:4, ga:1, gd: 3, pts:3 },
    { flag: 'au', name: 'Australia',     mp:1, w:1, d:0, l:0, gf:2, ga:0, gd: 2, pts:3 },
    { flag: 'tr', name: 'Türkiye',       mp:1, w:0, d:0, l:1, gf:0, ga:2, gd:-2, pts:0 },
    { flag: 'py', name: 'Paraguay',      mp:1, w:0, d:0, l:1, gf:1, ga:4, gd:-3, pts:0 },
  ]},
  { group: 'E', teams: [
    { flag: 'de', name: 'Germany',     mp:1, w:1, d:0, l:0, gf:7, ga:1, gd: 6, pts:3 },
    { flag: 'ci', name: 'Ivory Coast', mp:1, w:1, d:0, l:0, gf:1, ga:0, gd: 1, pts:3 },
    { flag: 'ec', name: 'Ecuador',     mp:1, w:0, d:0, l:1, gf:0, ga:1, gd:-1, pts:0 },
    { flag: 'cw', name: 'Curaçao',     mp:1, w:0, d:0, l:1, gf:1, ga:7, gd:-6, pts:0 },
  ]},
  { group: 'F', teams: [
    { flag: 'se', name: 'Sweden',      mp:1, w:1, d:0, l:0, gf:5, ga:1, gd: 4, pts:3 },
    { flag: 'jp', name: 'Japan',       mp:1, w:0, d:1, l:0, gf:2, ga:2, gd: 0, pts:1 },
    { flag: 'nl', name: 'Netherlands', mp:1, w:0, d:1, l:0, gf:2, ga:2, gd: 0, pts:1 },
    { flag: 'tn', name: 'Tunisia',     mp:1, w:0, d:0, l:1, gf:1, ga:5, gd:-4, pts:0 },
  ]},
  { group: 'G', teams: [
    { flag: 'nz', name: 'New Zealand', mp:1, w:0, d:1, l:0, gf:2, ga:2, gd:0, pts:1 },
    { flag: 'ir', name: 'Iran',        mp:1, w:0, d:1, l:0, gf:2, ga:2, gd:0, pts:1 },
    { flag: 'eg', name: 'Egypt',       mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
    { flag: 'be', name: 'Belgium',     mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
  ]},
  { group: 'H', teams: [
    { flag: 'sa', name: 'Saudi Arabia', mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
    { flag: 'uy', name: 'Uruguay',      mp:1, w:0, d:1, l:0, gf:1, ga:1, gd:0, pts:1 },
    { flag: 'es', name: 'Spain',        mp:1, w:0, d:1, l:0, gf:0, ga:0, gd:0, pts:1 },
    { flag: 'cv', name: 'Cabo Verde',   mp:1, w:0, d:1, l:0, gf:0, ga:0, gd:0, pts:1 },
  ]},
  { group: 'I', teams: [
    { flag: 'no', name: 'Norway',  mp:1, w:1, d:0, l:0, gf:4, ga:1, gd: 3, pts:3 },
    { flag: 'fr', name: 'France',  mp:1, w:1, d:0, l:0, gf:3, ga:1, gd: 2, pts:3 },
    { flag: 'sn', name: 'Senegal', mp:1, w:0, d:0, l:1, gf:1, ga:3, gd:-2, pts:0 },
    { flag: 'iq', name: 'Iraq',    mp:1, w:0, d:0, l:1, gf:1, ga:4, gd:-3, pts:0 },
  ]},
  { group: 'J', teams: [
    { flag: 'ar', name: 'Argentina', mp:1, w:1, d:0, l:0, gf:3, ga:0, gd: 3, pts:3 },
    { flag: 'at', name: 'Austria',   mp:1, w:1, d:0, l:0, gf:3, ga:1, gd: 2, pts:3 },
    { flag: 'jo', name: 'Jordan',    mp:1, w:0, d:0, l:1, gf:1, ga:3, gd:-2, pts:0 },
    { flag: 'dz', name: 'Algeria',   mp:1, w:0, d:0, l:1, gf:0, ga:3, gd:-3, pts:0 },
  ]},
  { group: 'K', teams: [
    { flag: 'pt', name: 'Portugal',   mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
    { flag: 'cd', name: 'DR Congo',   mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
    { flag: 'uz', name: 'Uzbekistan', mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
    { flag: 'co', name: 'Colombia',   mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
  ]},
  { group: 'L', teams: [
    { flag: 'gb-eng', name: 'England', mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
    { flag: 'hr',     name: 'Croatia', mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
    { flag: 'gh',     name: 'Ghana',   mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
    { flag: 'pa',     name: 'Panama',  mp:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 },
  ]},
]

export default async function StandingsPage() {
  const session = await getSession().catch(() => null)
  const isAdmin    = session?.role === 'admin' || session?.role === 'superplayer'
  const userLeague = (session as any)?.league ?? ''
  const sidebarData = await getSidebarData({ userLeague: session ? userLeague : '', isAdmin })
    .catch(() => ({ topPerformers: [], nextMatch: null, comingUp: null, groupAStandings: [], topScorers: [] }))

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Standings</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <StandingsTabs groups={GROUPS} />
            <p className="text-xs text-gray-400 mt-4 text-center">
              Updated June 19, 2026 ·{' '}
              <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Source: FIFA.com</a>
            </p>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
