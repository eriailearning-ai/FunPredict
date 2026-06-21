import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { VENUES } from '@/lib/venues'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function localTime(tz: string) {
  return new Date().toLocaleString('en-US', {
    timeZone: tz,
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default async function VenuesPage() {
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
          <Link href="/tournament" className="hover:underline">Matches</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Venues</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-5">
            {/* Dark header card — matches other tournament pages */}
            <div className="rounded-xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 50%,#8b1c2c 100%)' }}>
              <h1 className="text-2xl font-black text-yellow-400 mb-1">Venues</h1>
              <p className="text-sm text-gray-300">16 host stadiums across USA, Mexico &amp; Canada. Click a venue to see its matches.</p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-2">
              {VENUES.map(v => (
                <Link key={v.name} href={`/tournament/venues/${v.img}`} className="block group">
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden group-hover:shadow-md transition-shadow border border-gray-100">
                    {/* Venue photo — gradient+emoji fallback sits behind the image */}
                    <div className="h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0d1b3e,#1e3a5f)' }}>
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">🏟️</div>
                      <img
                        src={`/images/venues/${v.img}.jpg`}
                        alt={v.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm text-gray-900 mb-0.5 group-hover:text-blue-700 transition-colors">{v.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{v.city}</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Capacity</span>
                          <span className="font-semibold text-gray-700">{v.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Local time</span>
                          <span className="font-medium text-gray-600">{localTime(v.tz)}</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold mt-3" style={{ color: '#8b1c2c' }}>View matches →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
