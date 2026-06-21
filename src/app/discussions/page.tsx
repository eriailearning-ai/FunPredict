import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import DiscussionsPollsClient from '@/components/ui/DiscussionsPollsClient'
import ShoutboxClient from '@/components/ui/ShoutboxClient'

export const dynamic = 'force-dynamic'

export default async function DiscussionsPage() {
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
          <span className="text-gray-700">Discussions</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0 space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
            <p className="text-sm text-gray-500">Vote on upcoming matches, chat in the shoutbox, and compare picks.</p>

            {/* Quick links */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex flex-wrap gap-2">
                <Link href="/discussions#crowd-pick"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: '#1e3a5f' }}>🗳 Audience Poll</Link>
                <Link href="/discussions#shoutbox"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: '#8b1c2c' }}>💬 Shoutbox</Link>
                <Link href="/leaderboard"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold border border-gray-300"
                  style={{ color: '#1e3a5f', background: '#fff' }}>🏆 Top Performers</Link>
              </div>
            </div>

            {/* ── Audience Polls ── */}
            <div id="crowd-pick" className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg,#1e3a5f,#8b1c2c)' }}>
                <h2 className="text-white font-bold text-base">🗳 Family Voting — Next 3 Matches</h2>
                <p className="text-blue-200 text-xs mt-0.5">Poll votes don't count for points — just for fun!</p>
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-400 mb-5">
                  Want official points?{' '}
                  <Link href="/predictions" className="text-blue-600 hover:underline">
                    Enter your prediction on GO Predict Scores →
                  </Link>
                </p>
                <DiscussionsPollsClient isLoggedIn={!!session} />
              </div>
            </div>

            {/* ── Shoutbox ── */}
            <div id="shoutbox">
              <ShoutboxClient isLoggedIn={!!session} />
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
