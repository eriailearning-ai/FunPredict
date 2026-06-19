import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const revalidate = 60

const HIGHLIGHTS = [
  { title: 'Germany 7–1 Curaçao', date: 'Jun 14', group: 'Group E', home: 'de', away: 'cw', result: '7–1', story: 'A stunning opener for Germany, who put seven past Curaçao in their World Cup debut match.' },
  { title: 'USA 4–1 Paraguay', date: 'Jun 12', group: 'Group D', home: 'us', away: 'py', result: '4–1', story: 'The USMNT announced themselves at the home World Cup with a commanding four-goal victory.' },
  { title: 'Sweden 5–1 Tunisia', date: 'Jun 14', group: 'Group F', home: 'se', away: 'tn', result: '5–1', story: 'Sweden cruised into an early lead in Group F with a five-goal show.' },
  { title: 'Scotland 1–0 Haiti', date: 'Jun 13', group: 'Group C', home: 'gb-sct', away: 'ht', result: '1–0', story: "Scotland's first World Cup appearance in decades ended in victory." },
  { title: 'Australia 2–0 Türkiye', date: 'Jun 13', group: 'Group D', home: 'au', away: 'tr', result: '2–0', story: 'The Socceroos surprised many with a clean-sheet win against Türkiye.' },
  { title: 'South Korea 2–1 Czechia', date: 'Jun 11', group: 'Group A', home: 'kr', away: 'cz', result: '2–1', story: 'South Korea came from behind to beat Czechia in a tense Group A opener.' },
]

export default async function HighlightsPage() {
  const [sidebarData, session] = await Promise.all([getSidebarData(), getSession().catch(() => null)])

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        {/* Breadcrumb + title */}
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Highlights</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main */}
          <main className="flex-1 min-w-0 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Highlights</h1>
            <p className="text-sm text-gray-500">Storylines, host nations, and must-watch moments from World Cup 2026.</p>

            {/* Tournament overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-3">FIFA World Cup 2026</h2>
              <p className="text-sm text-gray-600 mb-4">Live tournament hub — fixtures, groups, venues, and standings stay in sync with the official 2026 schedule loaded into the pool.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Teams', val: '48' },
                  { label: 'Groups', val: '12' },
                  { label: 'Matches', val: '104' },
                  { label: 'Venues', val: '16' },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl p-4 text-center text-white" style={{ background: '#1e3a5f' }}>
                    <div className="text-2xl font-black text-yellow-400">{val}</div>
                    <div className="text-xs mt-1 text-gray-300">{label}</div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <Link href="/standings" className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="text-sm font-bold text-blue-900 mb-1">Groups & Standings</div>
                  <p className="text-xs text-gray-500">Tables update when match results are entered in the pool.</p>
                </Link>
                <Link href="/tournament/teams" className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="text-sm font-bold text-blue-900 mb-1">Teams & Venues</div>
                  <p className="text-xs text-gray-500">All 48 nations with flags and stadium information.</p>
                </Link>
                <Link href="/schedule" className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="text-sm font-bold text-blue-900 mb-1">Full Schedule</div>
                  <p className="text-xs text-gray-500">Every match, date, time, and venue.</p>
                </Link>
              </div>
            </div>

            {/* Host nations */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-2">Host trio</h2>
              <p className="text-sm text-gray-600 mb-4">USA, Mexico, and Canada across 16 host cities. Track every host-nation match on Matches or open the full tie-sheet.</p>
              <div className="flex gap-4 flex-wrap">
                {[{ iso2: 'us', name: 'United States' }, { iso2: 'mx', name: 'Mexico' }, { iso2: 'ca', name: 'Canada' }].map(h => (
                  <div key={h.iso2} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <FlagImg iso2={h.iso2} name={h.name} size="md" />
                    <span className="text-sm font-medium text-gray-700">{h.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <Link href="/tournament" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#1e3a5f' }}>Matches</Link>
                <Link href="/schedule" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#8b1c2c' }}>Full Schedule</Link>
              </div>
            </div>

            {/* Match highlights grid */}
            <h2 className="text-lg font-bold text-gray-900">Match Highlights</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {HIGHLIGHTS.map((h, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FlagImg iso2={h.home} size="md" />
                      <span className="text-lg font-black text-gray-800">{h.result}</span>
                      <FlagImg iso2={h.away} size="md" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">{h.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">{h.date} · {h.group}</p>
                    <p className="text-xs text-gray-600">{h.story}</p>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Sidebar */}
          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
