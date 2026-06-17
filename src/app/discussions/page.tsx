import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { CODE3_TO_ISO2 } from '@/lib/flags'

export const revalidate = 30

export default async function DiscussionsPage() {
  const [sidebarData, session] = await Promise.all([getSidebarData(), getSession().catch(() => null)])

  // Next 3 upcoming matches for polls
  const nextMatches = await prisma.match.findMany({
    where: { status: 'upcoming' },
    orderBy: { matchDate: 'asc' },
    take: 3,
    include: { homeTeam: true, awayTeam: true },
  }).catch(() => [])

  function isoFlag(code: string) { return CODE3_TO_ISO2[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2) }
  function fmtDate(d: Date) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }
  function fmtTime(d: Date) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Discussions</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
            <p className="text-sm text-gray-500">Fun chat — share reactions and friendly banter after every matchday.</p>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-2">Fun Discussions</h2>
              <p className="text-sm text-gray-600 mb-3">Vote in the Audience Poll, chat with family members, and compare picks.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/discussions#crowd-pick" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#1e3a5f' }}>Audience Poll</Link>
                <Link href="/leaderboard" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#8b1c2c' }}>Top Performers</Link>
              </div>
            </div>

            {/* Audience Poll section */}
            <div id="crowd-pick" className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #1e3a5f, #8b1c2c)' }}>
                <h2 className="text-white font-bold text-base">Family voting</h2>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-gray-800 mb-1">Next 3 matches</h3>
                <p className="text-sm text-gray-500 mb-4">Three polls are open at a time for the next upcoming games. Vote for fun, then enter your official scores on GO Predict Scores.</p>
                <p className="text-xs text-gray-400 mb-5">Poll votes do not count for points.{' '}
                  <Link href="/predictions" className="text-blue-600 hover:underline">Enter your official prediction →</Link>
                </p>

                {nextMatches.length === 0 ? (
                  <p className="text-sm text-gray-400">No upcoming matches.</p>
                ) : (
                  <div className="space-y-6">
                    {nextMatches.map((m, i) => (
                      <div key={m.id} className="border border-gray-100 rounded-xl p-5">
                        <p className="text-xs text-gray-400 mb-3">Voting open until kickoff · {fmtDate(m.matchDate)} {fmtTime(m.matchDate)}</p>
                        <h4 className="font-bold text-sm text-gray-800 mb-4">
                          Audience Poll — {m.homeTeam.name} vs {m.awayTeam.name}
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {[
                            { iso2: isoFlag(m.homeTeam.code), name: m.homeTeam.name, label: `${m.homeTeam.name} wins` },
                            { iso2: '', name: 'Draw', label: 'Draw' },
                            { iso2: isoFlag(m.awayTeam.code), name: m.awayTeam.name, label: `${m.awayTeam.name} wins` },
                          ].map(opt => (
                            <button key={opt.label}
                              disabled={!session}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                              {opt.iso2 && <FlagImg iso2={opt.iso2} name={opt.name} size="sm" />}
                              <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                        {!session && (
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            <Link href="/auth/login" className="text-blue-600 hover:underline">Log in</Link> to vote.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
