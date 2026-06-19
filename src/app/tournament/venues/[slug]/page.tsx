import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import { fmtTime, fmtDate, stageName } from '@/lib/fmt'
import { VENUES } from '@/lib/venues'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

function localTime(tz: string) {
  return new Date().toLocaleString('en-US', {
    timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

interface Props { params: { slug: string } }

export default async function VenueDetailPage({ params }: Props) {
  const venue = VENUES.find(v => v.img === params.slug)
  if (!venue) notFound()

  const [sidebarData, session, allMatches] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  const venueMatches = allMatches.filter((m: any) => {
    const v = (m.venue ?? '').toLowerCase()
    const n = venue.name.toLowerCase()
    return v.includes(n.split(' ')[0].toLowerCase()) || v.includes(venue.img.replace(/-/g, ' '))
  })

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
          <Link href="/tournament/venues" className="hover:underline">Venues</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">{venue.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-5">

            {/* Dark header with photo */}
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="h-52 relative" style={{ background: 'linear-gradient(135deg,#0d1b3e,#1e3a5f)' }}>
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">🏟️</div>
                <img
                  src={`/images/venues/${venue.img}.jpg`}
                  alt={venue.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                <div className="absolute bottom-4 left-6 text-white">
                  <h1 className="text-2xl font-black">{venue.name}</h1>
                  <p className="text-sm text-gray-300">{venue.city} · {venue.country}</p>
                </div>
              </div>
              <div className="bg-white p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border border-gray-100 rounded-b-2xl">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Capacity</p>
                  <p className="font-bold text-gray-800">{venue.capacity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Country</p>
                  <p className="font-bold text-gray-800">{venue.country}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Local time</p>
                  <p className="font-medium text-gray-700">{localTime(venue.tz)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Matches hosted</p>
                  <p className="font-bold text-gray-800">{venueMatches.length}</p>
                </div>
              </div>
            </div>

            {/* Matches at this venue */}
            <h2 className="text-lg font-bold text-gray-900">Matches at {venue.name}</h2>

            {venueMatches.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>No matches scheduled at this venue yet.</p>
                <p className="text-xs mt-1">Seed the database via Admin → Seed DB.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {venueMatches.map((m: any) => (
                  <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImg iso2={toIso2(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="md" />
                        <span className="text-sm font-semibold text-gray-800 truncate">{m.homeTeam?.name}</span>
                      </div>
                      <div className="text-center flex-shrink-0 w-20">
                        {m.status === 'finished' ? (
                          <span className="text-lg font-black text-gray-900">{m.homeScore}–{m.awayScore}</span>
                        ) : (
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{fmtTime(m.matchDate)}</p>
                            <p className="text-[10px] text-gray-400">{fmtDate(m.matchDate)}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-semibold text-gray-800 truncate text-right">{m.awayTeam?.name}</span>
                        <FlagImg iso2={toIso2(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="md" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{stageName(m.stage, m.group)}</p>
                  </div>
                ))}
              </div>
            )}
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
